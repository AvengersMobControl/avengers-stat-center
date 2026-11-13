'use strict';
// Member-only Discord identity matching. Public-source code, private runtime data.
// Never writes unapproved identity links or exposes the bot token.
const crypto=require('node:crypto');
function signedSession(req,env){
 const cookies=String(req.headers.cookie||'').split(';').map(s=>s.trim());
 const raw=cookies.find(s=>s.startsWith('avengers_session='));
 if(!raw||!env.AUTH_SECRET)return null;
 let token;try{token=decodeURIComponent(raw.slice(17));}catch{return null;}
 const parts=token.split('.');
 if(parts.length!==2||!parts[0]||!parts[1]||parts[0].length>4096)return null;
 const mac=crypto.createHmac('sha256',env.AUTH_SECRET).update(parts[0]).digest('base64url');
 if(mac.length!==parts[1].length||!crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(parts[1])))return null;
 try{
  const p=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
  if(!Number.isFinite(p.exp)||p.exp<=Date.now()/1000||p.guest===true||p.permanentGuest===true||
   !/^\d{17,22}$/.test(String(p.sub||'')))return null;
  return {id:String(p.sub),username:String(p.username||'Member')};
 }catch{return null;}
}
function canReview(member,guild,roles,env){
 if(!member||!guild||!guild.id)return false;
 if(String(guild.owner_id)===String(member.user?.id))return true;
 const explicit=String(env.AVENGERS_DISCORD_REVIEWER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(explicit.includes(String(member.user?.id)))return true;
 const roleIds=new Set([String(guild.id),...(member.roles||[]).map(String)]);
 let bits=0n;
 for(const r of roles||[])if(roleIds.has(String(r.id))){
  try{bits|=BigInt(r.permissions);}catch{return false;}
 }
 return (bits&8n)!==0n||(bits&32n)!==0n; // Discord Administrator or Manage Guild.
}
async function discordRequest(url,env,doFetch=fetch){
 const r=await doFetch(url,{headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN,
  'User-Agent':'AVENGERS-Stat-Center-Identity-Review/1.0'},signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('Discord API HTTP '+r.status);
 return r.json();
}
async function memberRoster(env,doFetch=fetch){
 const guild=env.DISCORD_GUILD_ID,memberList=[];let after='';
 for(let page=0;page<20;page++){
  const url='https://discord.com/api/v10/guilds/'+guild+'/members?limit=1000'+
   (after?'&after='+encodeURIComponent(after):'');
  const data=await discordRequest(url,env,doFetch);
  if(!Array.isArray(data))throw Error('Unexpected member list');
  memberList.push(...data.filter(m=>m?.user&&!m.user.bot));
  if(data.length<1000)return memberList;
  const next=String(data.at(-1)?.user?.id||'');
  if(!/^\d{17,22}$/.test(next)||next===after)throw Error('Bad member cursor');
  after=next;
 }
 throw Error('Discord member pagination exceeded safety limit; no partial roster exported');
}
const matcher=require('./discord-identity-matcher.cjs');
function normalizeName(s){return matcher.normalized(s);}
function variants(s){return matcher.forms(s).map(f=>f.value);}
function suggest(member,canonicals,aliases){return matcher.rank(member,canonicals,aliases);}
function csvValue(v){
 let s=String(v??'');
 if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function csv(rows){return '\uFEFF'+rows.map(r=>r.map(csvValue).join(',')).join('\r\n')+'\r\n';}
module.exports={signedSession,canReview,discordRequest,memberRoster,normalizeName,variants,suggest,csv};
