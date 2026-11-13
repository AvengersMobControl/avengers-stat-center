'use strict';
// Temporary 2026-11-12 TEST-only command registration, protected by a private
// expiring 256-bit one-time token kept exclusively in private AVENGERS Neon.
// No general Discord API proxy; no route strategy or member data exposed.
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const GUILD_COMMAND={name:'kraken',description:'TEST: Enter private Kraken battles (dummy maps until Saturday)',
 type:1,dm_permission:false};
const LAUNCH='2026-11-12-test-launch';
function respond(res,status,body){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('Pragma','no-cache');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 return res.status(status).json(body);
}
async function discord(url,env,init={}){
 const r=await fetch(url,{...init,headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN,
  ...init.headers},signal:AbortSignal.timeout(13000)});
 if(!r.ok){
  const message=(await r.text()).slice(0,350);
  const error=new Error('Discord API returned '+r.status+': '+message);
  error.status=502;throw error;
 }
 return r.json();
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return respond(res,405,{error:'GET required'});
 const token=String(req.query?.nonce||''),mode=String(req.query?.mode||'status');
 if(!/^[a-f0-9]{64}$/.test(token)||!['status','register'].includes(mode))
  return respond(res,403,{error:'Unauthorized'});
 const env=process.env;
 if(env.AVENGERS_KRAKEN_TEST_MODE!=='true'||env.AVENGERS_KRAKEN_ACTIVE_EVENT!=='2026-11-12'||
  !env.AVENGERS_KRAKEN_DATABASE_URL||!env.DISCORD_BOT_TOKEN||
  !/^\d{17,22}$/.test(env.DISCORD_CLIENT_ID||'')||
  !/^\d{17,22}$/.test(env.DISCORD_GUILD_ID||''))
  return respond(res,503,{error:'Kraken test launch is not configured'});
 try{
  const q=neon(env.AVENGERS_KRAKEN_DATABASE_URL);
  const rows=await q.query('SELECT nonce,expires_at,used_at FROM avengers_kraken_private.launch_control WHERE name=$1',
   [LAUNCH]);
  const row=rows[0],stored=String(row?.nonce||'');
  if(!row||Date.parse(row.expires_at)<Date.now()||stored.length!==token.length||
   !crypto.timingSafeEqual(Buffer.from(token),Buffer.from(stored)))
   return respond(res,403,{error:'Expired launch authorization'});
  if(mode==='register'&&row.used_at)return respond(res,409,{error:'Already registered in this one-time launch'});
  const settings=await q.query(
   'SELECT (SELECT count(*) FROM avengers_kraken_private.map_sequence) AS maps,'+
   '(SELECT count(*) FROM avengers_kraken_private.routes WHERE active=true) AS routes,'+
   '(SELECT count(*) FROM avengers_kraken_private.runs) AS runs');
  const ready=settings[0];
  if(Number(ready.maps)!==56||Number(ready.routes)<1)
   return respond(res,503,{error:'Test map sequence or test route not populated'});
  const api='https://discord.com/api/v10';
  const app=await discord(api+'/applications/@me',env);
  if(String(app.id)!==env.DISCORD_CLIENT_ID||!/^[a-f0-9]{64}$/i.test(String(app.verify_key||'')))
   throw Error('Discord application does not match configured bot');
  const endpoint=env.AVENGERS_KRAKEN_ORIGIN+'/api/discord/kraken-interactions';
  const previous=app.interactions_endpoint_url||null;
  const commands=await discord(api+'/applications/'+env.DISCORD_CLIENT_ID+
   '/guilds/'+env.DISCORD_GUILD_ID+'/commands',env);
  const otherCommands=commands.filter(c=>c.name!=='kraken').map(c=>c.name);
  if(mode==='status')return respond(res,200,{
   status:'preflight',testMode:true,activeEvent:env.AVENGERS_KRAKEN_ACTIVE_EVENT,
   maps:Number(ready.maps),activeTestRoutes:Number(ready.routes),
   currentEndpoint:previous,desiredEndpoint:endpoint,
   guildCommands:commands.map(c=>c.name),
   otherCommands,
   verifyKey:app.verify_key,
   alreadyRegistered:!!row.used_at
  });
  if(otherCommands.length&&previous!==endpoint)
   return respond(res,409,{error:'Other Discord application commands already use this bot; refusing to redirect their interactions',otherCommands});
  if(previous&&previous!==endpoint)
   return respond(res,409,{error:'Existing Discord interaction endpoint differs; refusing overwrite',currentEndpoint:previous});
  if(!previous){
   const updated=await discord(api+'/applications/@me',env,{
    method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({interactions_endpoint_url:endpoint})});
   if(updated.interactions_endpoint_url!==endpoint)
    throw Error('Discord did not validate the signed interaction endpoint');
  }
  const registered=await discord(api+'/applications/'+env.DISCORD_CLIENT_ID+
   '/guilds/'+env.DISCORD_GUILD_ID+'/commands',env,{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(GUILD_COMMAND)});
  if(registered.name!=='kraken'||!/^\d{17,22}$/.test(String(registered.id||'')))
   throw Error('Discord did not return a registered /kraken command');
  const found=await discord(api+'/applications/'+env.DISCORD_CLIENT_ID+
   '/guilds/'+env.DISCORD_GUILD_ID+'/commands',env);
  if(!found.some(c=>c.id===registered.id&&c.name==='kraken'))
   throw Error('Guild /kraken command readback failed');
  await q.query('UPDATE avengers_kraken_private.launch_control SET used_at=now(),'+
   'outcome=$2::jsonb WHERE name=$1 AND used_at IS NULL',
   [LAUNCH,JSON.stringify({commandId:registered.id,guildId:env.DISCORD_GUILD_ID,
    endpointVerified:true,testMode:true})]);
  return respond(res,200,{registered:true,command:'kraken',
   commandId:registered.id,guildId:env.DISCORD_GUILD_ID,
   endpointVerified:true,testMode:true,
   routeCount:Number(ready.routes),mapPositions:Number(ready.maps)});
 }catch(e){
  console.error('Private Kraken test Discord setup failed:',e.message);
  return respond(res,e.status||503,{error:'Discord command setup failed',detail:e.message.slice(0,230)});
 }
};
