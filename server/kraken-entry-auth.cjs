'use strict';
const crypto=require('node:crypto');
function sessionFromRequest(req,env=process.env){
 const secret=env.AUTH_SECRET;
 const item=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('avengers_session='));
 const token=item?.slice('avengers_session='.length);
 if(!secret||!token)return null;
 const [body,sig,extra]=token.split('.');
 if(!body||!sig||extra||body.length>3000)return null;
 const expected=crypto.createHmac('sha256',secret).update(body).digest('base64url');
 if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
 try{
  const p=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
  if(p.guest===true||p.permanentGuest===true||!p.exp||p.exp<=Date.now()/1000||
    !/^\d{17,22}$/.test(String(p.sub||'')))return null;
  return {id:String(p.sub),username:String(p.username||'Discord member').slice(0,100)};
 }catch{return null;}
}
async function authenticate(req,env=process.env,httpFetch=fetch){
 const member=sessionFromRequest(req,env);
 if(!member)return null;
 if(!/^\d{17,22}$/.test(env.DISCORD_GUILD_ID||'')||!env.DISCORD_BOT_TOKEN)return null;
 const r=await httpFetch('https://discord.com/api/v10/guilds/'+env.DISCORD_GUILD_ID+
    '/members/'+member.id,{headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN},
      signal:AbortSignal.timeout(8000)});
 if(r.status!==200)return null;
 const roleIds=String(env.AVENGERS_KRAKEN_REVIEWER_IDS||'').split(',').map(s=>s.trim());
 return {...member,admin:roleIds.includes(member.id)};
}
function guardPost(req,env=process.env){
 const origin=String(req.headers.origin||'');
 const expected=String(env.AVENGERS_KRAKEN_ORIGIN||'');
 return Boolean(expected&&/^https:\/\/[a-z0-9.-]+(?::\d+)?$/.test(expected)&&origin===expected &&
  req.headers['content-type']?.split(';')[0]?.trim()==='application/json');
}
function headers(res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('Pragma','no-cache');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('X-Frame-Options','DENY');
}
function json(res,status,data){headers(res);res.status(status).json(data);}
module.exports={sessionFromRequest,authenticate,guardPost,headers,json};
