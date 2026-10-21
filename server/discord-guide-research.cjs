'use strict';

// Generic Discord source discovery and evidence normalization. Do not add
// strategy text or private channel contents to this PUBLIC repository.
const crypto = require('node:crypto');

const SNOWFLAKE = /^\d{17,22}$/;
const CATEGORIES = Object.freeze({
  loadouts: /\b(loadouts?|builds?|setup|setups|champions?|mobs?|cannons?|ultimate|boosters?|skills?|cards?|combos?)\b/i,
  returnAttacks: /\b(return(?:ing)?\s+(?:attacks?|hits?)|counter(?:attacks?)?|defen[cs]e|revenge|shield|raid)\b/i,
  events: /\b(piggy|flash(?:es)?|space\s*race|kraken|clan\s*league|boss|lobby)\b/i,
  technique: /\b(tips?|tricks?|guides?|how\s+to|strategy|strategies|tactics?|optim(?:al|iz\w*)|recommend\w*|advi[cs]\w*|best\s+way|avoid|instead|works?\s+better|tickets?|routes?)\b/i,
  economy: /\b(stars?|sparks?|coins?|rewards?|chests?|upgrad(?:e|ing)|resources?|efficien(?:cy|t))\b/i
});

function id(value) {
  const v=String(value||'');
  return SNOWFLAKE.test(v) ? v : null;
}

function parseBody(req) {
  let body=req.body;
  if(typeof body==='string') body=JSON.parse(body);
  if(!body||typeof body!=='object'||Array.isArray(body)) throw new Error('Invalid JSON object');
  return body;
}

function cookie(req,name) {
  for(const part of String(req.headers.cookie||'').split(';')) {
    const i=part.indexOf('=');
    if(i>0 && part.slice(0,i).trim()===name) {
      try{return decodeURIComponent(part.slice(i+1).trim());}catch{return '';}
    }
  }
  return '';
}

function signedMember(req,secret,nowSeconds=Math.floor(Date.now()/1000)) {
  if(typeof secret!=='string'||secret.length<16) return null;
  const value=cookie(req,'avengers_session');
  const pieces=value.split('.');
  if(pieces.length!==2||!/^[\w-]+$/.test(pieces[0])||!/^[\w-]+$/.test(pieces[1])) return null;
  const sig=crypto.createHmac('sha256',secret).update(pieces[0]).digest();
  const given=Buffer.from(pieces[1],'base64url');
  if(sig.length!==given.length||!crypto.timingSafeEqual(sig,given)) return null;
  try {
    const payload=JSON.parse(Buffer.from(pieces[0],'base64url').toString('utf8'));
    if(!id(payload.sub)||payload.guest!==undefined&&payload.guest!==false ||
       payload.permanentGuest===true || !Number.isFinite(Number(payload.exp)) ||
       Number(payload.exp)<=nowSeconds) return null;
    return payload;
  }catch{return null;}
}

function bearerAuthorized(req,expected) {
  if(!expected||expected.length<32) return false;
  const got=String(req.headers.authorization||'');
  const wanted=`Bearer ${expected}`;
  const a=Buffer.from(got),b=Buffer.from(wanted);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}

function reviewerAuthorized(userId,roles,env) {
  const allowedIds=String(env.AVENGERS_GUIDE_REVIEWER_IDS||'').split(',').map(s=>s.trim()).filter(id);
  const allowedRoles=String(env.AVENGERS_GUIDE_COUNCIL_ROLE_IDS||'').split(',').map(s=>s.trim()).filter(id);
  return allowedIds.includes(userId)||allowedRoles.some(role=>roles.includes(role));
}

function researchScope(env) {
  let parsed;
  try {parsed=JSON.parse(String(env.AVENGERS_GUIDE_CHANNELS_JSON||''));}catch{return null;}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return null;
  const entries=Object.entries(parsed);
  if(entries.length<1||entries.length>25)return null;
  const allowed=new Map();
  for(const [channelId,config] of entries) {
    if(!id(channelId)||!config||typeof config!=='object'||Array.isArray(config))return null;
    if(config.since!==null && (typeof config.since!=='string'||!Number.isFinite(Date.parse(config.since))))return null;
    allowed.set(channelId,{since:config.since,priority:config.priority==='primary'?'primary':'normal'});
  }
  return allowed;
}

function permittedChannel(channel,scope) {
  if(!channel)return null;
  return scope.get(String(channel.id)) || (channel.parent_id ? scope.get(String(channel.parent_id)) : null) || null;
}

function tags(content) {
  return Object.entries(CATEGORIES).filter(([,re])=>re.test(content)).map(([name])=>name);
}

function normalizeMessage(m,guildId,channelId) {
  const content=String(m.content||'').slice(0,20000);
  const embedding=(m.embeds||[]).map(e=>[e.title,e.description].filter(Boolean).join(' ')).join(' ').slice(0,5000);
  const classifications=tags(content+' '+embedding);
  return {
    id:String(m.id),channelId,guildId,
    url:`https://discord.com/channels/${guildId}/${channelId}/${m.id}`,
    author:{id:String(m.author?.id||''),name:String(m.member?.nick||m.author?.global_name||m.author?.username||'Unknown')},
    timestamp:m.timestamp||null,editedTimestamp:m.edited_timestamp||null,
    content,embedText:embedding,
    replyToId:m.message_reference?.message_id||null,
    threadId:m.thread?.id||null,
    pinned:Boolean(m.pinned),
    tags:classifications,
    attachments:(m.attachments||[]).map(a=>({id:String(a.id),name:String(a.filename||''),contentType:a.content_type||null,
      size:Number(a.size)||0,description:a.description||null,
      url:a.url||null,proxyUrl:a.proxy_url||null})),
    relevant:classifications.length>=2 || Boolean(m.pinned&&classifications.length)
  };
}

async function discordGet(path,token,fetchImpl=fetch) {
  const r=await fetchImpl(`https://discord.com/api/v10${path}`,{
    headers:{Authorization:`Bot ${token}`,'User-Agent':'AVENGERS-Guide-Research/1.0'},
    signal:AbortSignal.timeout(12000)
  });
  if(r.status===429) {
    let data={};try{data=await r.json();}catch{}
    const raw=Number(data.retry_after??r.headers.get('retry-after')??1);
    return {rateLimited:true,retryAfterMs:Math.max(300,Math.min(60000,Math.ceil((Number.isFinite(raw)?raw:1)*1000)))};
  }
  if(!r.ok) return {error:true,status:r.status};
  return {data:await r.json()};
}

function makeResponse(res,status,data) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('Pragma','no-cache');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.status(status).send(JSON.stringify(data));
}

function permittedOrigin(req) {
  const origin=req.headers.origin;
  if(!origin) return true; // server-to-server bearer clients have no Origin.
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  try {const url=new URL(origin);return url.protocol==='https:'&&url.host===host;}catch{return false;}
}

async function researchHandler(req,res,env=process.env,fetchImpl=fetch) {
  if(req.method!=='POST') return makeResponse(res,405,{error:'POST required'});
  if(!permittedOrigin(req)) return makeResponse(res,403,{error:'Origin denied'});
  if(!id(env.DISCORD_GUILD_ID)||!env.DISCORD_BOT_TOKEN) return makeResponse(res,503,{error:'Guide research unavailable'});
  const scope=researchScope(env);
  if(!scope) return makeResponse(res,503,{error:'Guide channel scope not configured'});
  let body;
  try{body=parseBody(req);}catch{return makeResponse(res,400,{error:'Invalid JSON'});}

  const service=bearerAuthorized(req,env.AVENGERS_GUIDE_RESEARCH_SECRET);
  if(!service) {
    const member=signedMember(req,env.AUTH_SECRET);
    if(!member) return makeResponse(res,401,{error:'Member session required'});
    const check=await discordGet(`/guilds/${env.DISCORD_GUILD_ID}/members/${member.sub}`,env.DISCORD_BOT_TOKEN,fetchImpl);
    if(check.rateLimited) return makeResponse(res,429,check);
    if(!check.data||!Array.isArray(check.data.roles)) return makeResponse(res,403,{error:'Current Discord membership not verified'});
    if(!reviewerAuthorized(member.sub,check.data.roles,env)) return makeResponse(res,403,{error:'Council/reviewer access required'});
  }

  const action=String(body.action||'');
  const guildId=env.DISCORD_GUILD_ID,token=env.DISCORD_BOT_TOKEN;
  if(action==='channels') {
    const response=await discordGet(`/guilds/${guildId}/channels`,token,fetchImpl);
    if(response.rateLimited) return makeResponse(res,429,response);
    if(!Array.isArray(response.data)) return makeResponse(res,502,{error:'Discord channel inventory unavailable'});
    const channels=response.data.filter(c=>[0,5,15].includes(c.type)&&scope.has(String(c.id))).map(c=>({
      id:String(c.id),name:String(c.name||''),type:c.type,parentId:c.parent_id||null,
      categoryName:response.data.find(p=>p.id===c.parent_id)?.name||null,
      since:scope.get(String(c.id)).since,priority:scope.get(String(c.id)).priority
    }));
    return makeResponse(res,200,{mode:'read-only',guildId,channels,
      missingScopedChannelIds:[...scope.keys()].filter(channelId=>!channels.some(c=>c.id===channelId)),
      hasMessageContents:false});
  }
  if(action==='activeThreads') {
    const r=await discordGet(`/guilds/${guildId}/threads/active`,token,fetchImpl);
    if(r.rateLimited) return makeResponse(res,429,r);
    if(!r.data||!Array.isArray(r.data.threads)) return makeResponse(res,502,{error:'Active threads unavailable'});
    return makeResponse(res,200,{mode:'read-only',threads:r.data.threads
      .filter(t=>String(t.guild_id)===guildId&&id(t.id)&&scope.has(String(t.parent_id)))
      .map(t=>({id:String(t.id),name:String(t.name||''),parentId:t.parent_id||null,archived:false}))});
  }
  if(action==='threads') {
    const parent=id(body.channelId);
    if(!parent) return makeResponse(res,400,{error:'channelId required'});
    const c=await discordGet(`/channels/${parent}`,token,fetchImpl);
    if(c.rateLimited) return makeResponse(res,429,c);
    if(!c.data||String(c.data.guild_id)!==guildId||![0,5,15].includes(c.data.type)||!scope.has(parent))
      return makeResponse(res,403,{error:'Channel not in approved guild'});
    const before=body.before?String(body.before):null;
    if(before && !/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(before)) return makeResponse(res,400,{error:'Invalid thread timestamp cursor'});
    const params=new URLSearchParams({limit:'100'});
    if(before) params.set('before',before);
    const r=await discordGet(`/channels/${parent}/threads/archived/public?${params}`,token,fetchImpl);
    if(r.rateLimited) return makeResponse(res,429,r);
    if(!r.data||!Array.isArray(r.data.threads)) return makeResponse(res,502,{error:'Archived threads unavailable'});
    const threads=r.data.threads.filter(t=>String(t.guild_id)===guildId).map(t=>({
      id:String(t.id),name:String(t.name||''),parentId:parent,archivedAt:t.thread_metadata?.archive_timestamp||null
    }));
    return makeResponse(res,200,{mode:'read-only',threads,hasMore:Boolean(r.data.has_more)});
  }
  if(action==='history') {
    const channelId=id(body.channelId),before=body.beforeMessageId==null?null:id(body.beforeMessageId);
    if(!channelId||body.beforeMessageId!=null&&!before) return makeResponse(res,400,{error:'Invalid channel or cursor'});
    const c=await discordGet(`/channels/${channelId}`,token,fetchImpl);
    if(c.rateLimited) return makeResponse(res,429,c);
    if(!c.data||String(c.data.guild_id)!==guildId||![0,5,10,11,12,15].includes(c.data.type)||!permittedChannel(c.data,scope))
      return makeResponse(res,403,{error:'Channel not in approved guild'});
    const policy=permittedChannel(c.data,scope);
    const limit=Math.max(1,Math.min(100,Math.floor(Number(body.limit)||100)));
    const params=new URLSearchParams({limit:String(limit)});
    if(before)params.set('before',before);
    const result=await discordGet(`/channels/${channelId}/messages?${params}`,token,fetchImpl);
    if(result.rateLimited) return makeResponse(res,429,result);
    if(!Array.isArray(result.data)) return makeResponse(res,502,{error:'Message history unavailable'});
    const sinceMs=policy.since ? Date.parse(policy.since) : null;
    const cutoffReached=sinceMs!=null && result.data.some(m=>Date.parse(String(m.timestamp||''))<sinceMs);
    const messages=result.data
      .filter(m=>sinceMs==null||Date.parse(String(m.timestamp||''))>=sinceMs)
      .map(m=>normalizeMessage(m,guildId,channelId));
    return makeResponse(res,200,{
      mode:'read-only',channelId,guildId,scanned:result.data.length,returned:messages.length,
      since:policy.since,cutoffReached,messages,
      nextBeforeMessageId:cutoffReached?null:(result.data.at(-1)?.id||null),hasMore:!cutoffReached&&result.data.length===limit,
      reminder:'Candidate tags are search hints only; advice must be reviewed against original messages and dates.'
    });
  }
  return makeResponse(res,400,{error:'Invalid action'});
}

module.exports={id,signedMember,bearerAuthorized,reviewerAuthorized,researchScope,permittedChannel,tags,normalizeMessage,discordGet,researchHandler};
