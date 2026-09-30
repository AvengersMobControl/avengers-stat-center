const crypto = require('crypto');
const config = require('../../discord-ingest-config.json');

const IMAGE_EXT=/\.(png|jpe?g|webp|gif)$/i;
const PROGRESS_RE=/(preliminary|still\s+ongoing|in\s+progress|progress\s+results|current\s+standings|not\s+final)/i;

function json(res,status,body){
  res.status(status).setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.send(JSON.stringify(body));
}
function cookies(req){
  const out={};
  String(req.headers.cookie||'').split(';').forEach(part=>{
    const i=part.indexOf('=');
    if(i>0){
      try{out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());}
      catch{out[part.slice(0,i).trim()]=part.slice(i+1).trim();}
    }
  });
  return out;
}
function validSession(req){
  const secret=process.env.AUTH_SECRET;
  const token=cookies(req).avengers_session;
  if(!secret||!token)return null;
  const [body,sig]=String(token).split('.');
  if(!body||!sig)return null;
  const expected=crypto.createHmac('sha256',secret).update(body).digest('base64url');
  const a=Buffer.from(sig),b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
  try{
    const payload=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
    return Number(payload.exp||0)>Math.floor(Date.now()/1000) ? payload : null;
  }catch{return null;}
}
function authorized(req){
  const session=validSession(req);
  if(session && !session.guest)return true;
  const expected=process.env.DISCORD_PULL_SECRET;
  const auth=String(req.headers.authorization||'');
  return Boolean(expected && auth===`Bearer ${expected}`);
}
function isImage(a){
  return String(a.content_type||'').startsWith('image/') || IMAGE_EXT.test(String(a.filename||''));
}
function progressHint(m){
  return PROGRESS_RE.test(String(m.content||''));
}
function msFromRetry(value){
  const n=Number(value);
  if(!Number.isFinite(n)||n<0)return 1000;
  return Math.max(250,Math.ceil(n*1000));
}

module.exports = async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'POST required'});
  if(!authorized(req)) return json(res,401,{error:'Unauthorized'});
  if(!process.env.DISCORD_BOT_TOKEN) return json(res,500,{error:'DISCORD_BOT_TOKEN is not configured'});

  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  const channelKey=String(body.channelKey||'');
  const channel=config.channels[channelKey];
  if(!channel) return json(res,400,{error:'Unknown channelKey',allowed:Object.keys(config.channels)});

  // One Discord page per serverless request. The browser handles deep history
  // pagination so a 5,000-message pull cannot time out one Vercel function.
  const limit=Math.max(1,Math.min(Number(body.maxMessages)||100,100));
  const stopAfterId=body.afterMessageId?BigInt(String(body.afterMessageId)):null;
  const before=body.beforeMessageId?String(body.beforeMessageId):null;
  const params=new URLSearchParams({limit:String(limit)});
  if(before)params.set('before',before);

  const r=await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages?${params}`,{
    headers:{Authorization:`Bot ${process.env.DISCORD_BOT_TOKEN}`}
  });

  if(r.status===429){
    let payload={};
    try{payload=await r.json();}catch{}
    const retryAfterMs=msFromRetry(payload.retry_after ?? r.headers.get('retry-after') ?? r.headers.get('x-ratelimit-reset-after'));
    return json(res,429,{
      error:'Discord rate limit',
      retryAfterMs,
      global:Boolean(payload.global),
      detail:'The review page will wait and continue automatically.'
    });
  }
  if(!r.ok){
    const detail=await r.text();
    return json(res,r.status,{error:'Discord API request failed',detail:detail.slice(0,1000)});
  }

  const messages=await r.json();
  if(!Array.isArray(messages)) return json(res,502,{error:'Unexpected Discord response'});

  const candidates=[];
  let scanned=0;
  let done=false;
  let newestScannedMessageId=null;
  let oldestScannedMessageId=null;

  for(const m of messages){
    const mid=BigInt(String(m.id));
    if(stopAfterId && mid<=stopAfterId){done=true;break;}

    if(!newestScannedMessageId)newestScannedMessageId=m.id;
    oldestScannedMessageId=m.id;
    scanned++;

    const images=(m.attachments||[]).filter(isImage).map(a=>({
      id:a.id,
      filename:a.filename,
      contentType:a.content_type||null,
      width:a.width||null,
      height:a.height||null,
      size:a.size||null,
      url:a.url,
      proxyUrl:a.proxy_url||null
    }));

    if(images.length){
      candidates.push({
        messageId:m.id,
        channelId:channel.id,
        channelKey,
        eventType:channel.eventType,
        rosterScope:channel.rosterScope,
        author:{
          id:m.author?.id||null,
          username:m.author?.username||null,
          globalName:m.author?.global_name||null
        },
        timestamp:m.timestamp,
        content:m.content||'',
        messageTextProgressHint:progressHint(m),
        attachments:images
      });
    }
  }

  const remaining=Number(r.headers.get('x-ratelimit-remaining'));
  const resetAfter=Number(r.headers.get('x-ratelimit-reset-after'));
  const recommendedDelayMs=
    Number.isFinite(remaining) && remaining<=1
      ? Math.max(300,Number.isFinite(resetAfter)?Math.ceil(resetAfter*1000):1000)
      : 180;

  const fetchedOldestId=messages[messages.length-1]?.id||null;
  return json(res,200,{
    mode:'manual_review_only',
    autoImport:false,
    reviewRequired:true,
    channelKey,
    channelId:channel.id,
    eventType:channel.eventType,
    rosterScope:channel.rosterScope,
    scanned,
    newestScannedMessageId,
    oldestScannedMessageId,
    nextBeforeMessageId:fetchedOldestId,
    hasMore:!done && messages.length===limit,
    reachedCheckpoint:done,
    recommendedDelayMs,
    candidates,
    rules:config.rules
  });
};
