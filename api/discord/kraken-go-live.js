'use strict';
// One-use private Discord label transition AFTER live November Kraken event and
// official private route checks pass. Never returns private maps/strategy.
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const JOB='2026-11-14-official-kraken-go-live';
const EVENT='2026-11-14';
const EXPECTED_COMMAND_ID='1571168740228206673';
const DESCRIPTION='Submit your private Kraken battle results for leader review';
function send(res,status,data){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 return res.status(status).json(data);
}
async function discord(env,path,init={}){
 const response=await fetch('https://discord.com/api/v10'+path,{
  ...init,headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN,...init.headers},
  signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('Discord API HTTP '+response.status);
 return response.json();
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'GET required'});
 const env=process.env,nonce=String(req.query?.nonce||''),mode=String(req.query?.mode||'status');
 if(!/^[a-f0-9]{64}$/.test(nonce)||!['status','activate'].includes(mode))
  return send(res,403,{error:'Unauthorized'});
 if(env.AVENGERS_KRAKEN_TEST_MODE!=='false'||
   env.AVENGERS_KRAKEN_ACTIVE_EVENT!==EVENT||
   !env.AVENGERS_KRAKEN_DATABASE_URL||!env.DISCORD_BOT_TOKEN||
   !/^\d{17,22}$/.test(env.DISCORD_CLIENT_ID||'')||
   !/^\d{17,22}$/.test(env.DISCORD_GUILD_ID||''))
  return send(res,503,{error:'Official Kraken event has not been opened'});
 try{
  const q=neon(env.AVENGERS_KRAKEN_DATABASE_URL);
  const [authorization,setup]=await Promise.all([
   q.query('SELECT nonce,used_at,expires_at FROM avengers_kraken_private.launch_control WHERE name=$1',[JOB]),
   q.query('SELECT (SELECT count(*)::int FROM avengers_kraken_private.map_sequence) AS maps,'+
    '(SELECT count(*)::int FROM avengers_kraken_private.routes WHERE active=true) AS routes,'+
    '(SELECT count(*)::int FROM avengers_kraken_private.runs WHERE event_key=$1) AS runs',[EVENT])
  ]);
  const record=authorization[0],stored=String(record?.nonce||'');
  if(!record||record.used_at||Date.parse(record.expires_at)<=Date.now()||
     stored.length!==nonce.length||!crypto.timingSafeEqual(Buffer.from(stored),Buffer.from(nonce)))
   return send(res,403,{error:'One-time authorization expired or consumed'});
  if(Number(setup[0]?.maps)!==55||Number(setup[0]?.routes)!==3)
   return send(res,409,{error:'Live map and route configuration failed validation'});
  const routeRows=await q.query('SELECT route_id,title,jsonb_array_length(steps)::int AS battles,'+
   "(SELECT sum((s->>'ticketsUsed')::int)::int FROM jsonb_array_elements(steps) s) AS tickets "+
   'FROM avengers_kraken_private.routes WHERE active=true ORDER BY route_id');
  const expected=['nov14-2026-combo','nov14-2026-no10','nov14-2026-sirion'];
  if(routeRows.length!==3||routeRows.some((r,i)=>r.route_id!==expected[i]||
      r.tickets!==56||r.battles<10||/^TEST/i.test(r.title)))
   return send(res,409,{error:'Approved private routes are not the expected live presets'});
  const app=await discord(env,'/applications/@me');
  if(String(app.id)!==env.DISCORD_CLIENT_ID||
    app.interactions_endpoint_url!==env.AVENGERS_KRAKEN_ORIGIN+'/api/discord/kraken-interactions')
   throw Error('Discord application or signed endpoint mismatch');
  const base='/applications/'+env.DISCORD_CLIENT_ID;
  const [globals,guildCommands]=await Promise.all([
   discord(env,base+'/commands'),
   discord(env,base+'/guilds/'+env.DISCORD_GUILD_ID+'/commands')]);
  const cmd=globals.find(c=>c.name==='kraken');
  if(!cmd||cmd.id!==EXPECTED_COMMAND_ID||guildCommands.some(c=>c.name==='kraken'))
   throw Error('Unexpected Discord Kraken command or stale guild version');
  if(mode==='status')return send(res,200,{
   ready:true,event:EVENT,testMode:false,
   officialRoutes:routeRows.map(r=>({id:r.route_id,battles:r.battles})),
   confirmedMapPositions:Number(setup[0].maps),
   unknownFinalMap:true,liveSubmissions:Number(setup[0].runs),
   discordCommandReady:true,
   descriptionNeedsUpdate:cmd.description!==DESCRIPTION
  });
  const updated=await discord(env,base+'/commands/'+EXPECTED_COMMAND_ID,{
   method:'PATCH',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({description:DESCRIPTION})});
  if(updated.name!=='kraken'||updated.description!==DESCRIPTION)
   throw Error('Discord did not accept the official command description');
  const checked=await discord(env,base+'/commands');
  if(!checked.some(c=>c.id===EXPECTED_COMMAND_ID&&c.description===DESCRIPTION))
   throw Error('Discord global Kraken command readback failed');
  const consumed=await q.query('UPDATE avengers_kraken_private.launch_control '+
   'SET used_at=now(),outcome=$2::jsonb WHERE name=$1 AND used_at IS NULL RETURNING name',
   [JOB,JSON.stringify({official:true,event:EVENT,command:EXPECTED_COMMAND_ID,
     routeCount:3,confirmedMapPositions:55,unknownLastMap:true})]);
  if(consumed.length!==1)throw Error('Official Kraken launch capability consumed concurrently');
  return send(res,200,{live:true,event:EVENT,routeCount:3,
   confirmedMaps:55,unknownLastMap:true,discordCommandUpdated:true});
 }catch(e){
  console.error('Official Kraken launch verification:',e.message);
  return send(res,503,{error:'Official Kraken launch verification failed'});
 }
};
