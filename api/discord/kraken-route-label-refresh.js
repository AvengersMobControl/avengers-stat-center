'use strict';
// One-use guild command description refresh. It contains NO strategy data.
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const JOB='2026-11-13-october-test-label-refresh';
const DESCRIPTION='TEST: Practice Kraken with October routes and map order';
function json(res,status,value){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 return res.status(status).json(value);
}
async function discord(url,env,init={}){
 const response=await fetch(url,{
  ...init,headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN,...init.headers},
  signal:AbortSignal.timeout(12000)
 });
 if(!response.ok)throw Error('Discord command request returned HTTP '+response.status);
 return response.json();
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'GET required'});
 const token=String(req.query?.nonce||''),env=process.env;
 if(!/^[a-f0-9]{64}$/.test(token))return json(res,403,{error:'Invalid authorization'});
 if(env.AVENGERS_KRAKEN_ACTIVE_EVENT!=='2026-11-13'||
    env.AVENGERS_KRAKEN_TEST_MODE!=='true'||
    !/^\d{17,22}$/.test(env.DISCORD_GUILD_ID||'')||
    !/^\d{17,22}$/.test(env.DISCORD_CLIENT_ID||'')||
    !env.AVENGERS_KRAKEN_DATABASE_URL||!env.DISCORD_BOT_TOKEN)
  return json(res,503,{error:'Test-event transition not configured'});
 try{
  const q=neon(env.AVENGERS_KRAKEN_DATABASE_URL);
  const rows=await q.query(
   'SELECT nonce,expires_at,used_at FROM avengers_kraken_private.launch_control WHERE name=$1',[JOB]);
  const row=rows[0],stored=String(row?.nonce||'');
  if(!row||row.used_at||Date.parse(row.expires_at)<=Date.now()||
     stored.length!==token.length||
     !crypto.timingSafeEqual(Buffer.from(token),Buffer.from(stored)))
   return json(res,403,{error:'One-time authorization expired or consumed'});
  const base='https://discord.com/api/v10/applications/'+env.DISCORD_CLIENT_ID+
   '/guilds/'+env.DISCORD_GUILD_ID+'/commands';
  const app=await discord('https://discord.com/api/v10/applications/@me',env);
  if(String(app.id)!==env.DISCORD_CLIENT_ID||
   app.interactions_endpoint_url!==env.AVENGERS_KRAKEN_ORIGIN+'/api/discord/kraken-interactions')
    throw Error('Bot identity or existing Kraken interactions endpoint mismatch');
  const existing=await discord(base,env);
  const target=existing.filter(c=>c.name==='kraken');
  if(target.length!==1||String(target[0].id)!=='1570681165852053565')
    throw Error('Expected guild Kraken command was not found');
  const edited=await discord(base+'/'+target[0].id,env,{
   method:'PATCH',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({description:DESCRIPTION})
  });
  if(edited.description!==DESCRIPTION)throw Error('Discord did not confirm the command description');
  const readback=await discord(base,env);
  if(!readback.some(c=>c.id===target[0].id&&c.description===DESCRIPTION))
   throw Error('Discord command readback disagrees with requested description');
  const used=await q.query('UPDATE avengers_kraken_private.launch_control '+
   'SET used_at=now(),outcome=$2::jsonb WHERE name=$1 AND used_at IS NULL RETURNING name',
   [JOB,JSON.stringify({descriptionUpdated:true,commandId:target[0].id,testEvent:'2026-11-13'})]);
  if(used.length!==1)throw Error('One-time launch record changed concurrently');
  return json(res,200,{updated:true,command:'kraken',description:DESCRIPTION,testEvent:'2026-11-13'});
 }catch(e){
  console.error('Private Kraken guild-command label refresh failed:',e.message);
  return json(res,503,{error:'Unable to verify and update the test command'});
 }
};
