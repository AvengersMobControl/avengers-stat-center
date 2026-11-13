#!/usr/bin/env node
'use strict';
// Server-side guild-only registration. No local installation, no side effects
// without --apply and the validated private Kraken event configuration.
const command={name:'kraken',description:'Submit private Kraken battle results for leader review',
 type:1,dm_permission:false};
if(!process.argv.includes('--apply')){
 console.log(JSON.stringify({mode:'dry-run',registered:false,scope:'AVENGERS guild only',command},null,2));
 process.exit(0);
}
(async()=>{
 const env=process.env;
 const client=env.DISCORD_CLIENT_ID,guild=env.DISCORD_GUILD_ID,bot=env.DISCORD_BOT_TOKEN;
 const origin=env.AVENGERS_KRAKEN_ORIGIN,event=env.AVENGERS_KRAKEN_ACTIVE_EVENT;
 if(!/^\d{17,22}$/.test(client||'')||!/^\d{17,22}$/.test(guild||'')||!bot||
    !/^https:\/\/[a-z0-9.-]+$/.test(origin||''))
  throw Error('Guild, client, bot or private origin is not configured');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(event||''))
  throw Error('Kraken event is not opened; slash command registration remains disabled');
 const headers={Authorization:'Bot '+bot};
 async function request(url,init={}){
  const r=await fetch(url,{...init,headers:{...headers,...init.headers},
   signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error('Discord API rejected command setup: HTTP '+r.status);
  return r.json();
 }
 const api='https://discord.com/api/v10';
 const app=await request(api+'/applications/@me');
 if(String(app.id)!==client||!/^[a-f0-9]{64}$/i.test(app.verify_key||''))
  throw Error('Discord application verification failed');
 const endpoint=origin+'/api/discord/kraken-interactions';
 if(app.interactions_endpoint_url&&app.interactions_endpoint_url!==endpoint)
  throw Error('Discord app already has a different Interactions Endpoint; refusing to overwrite it');
 if(!app.interactions_endpoint_url){
  const updated=await request(api+'/applications/@me',{method:'PATCH',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({interactions_endpoint_url:endpoint})});
  if(updated.interactions_endpoint_url!==endpoint)
   throw Error('Discord did not confirm the new signed Interactions Endpoint');
 }
 const registered=await request(api+'/applications/'+client+'/guilds/'+guild+'/commands',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(command)});
 if(registered.name!=='kraken'||!/^\d{17,22}$/.test(String(registered.id||'')))
  throw Error('Discord returned unexpected command');
 console.log(JSON.stringify({registered:true,name:registered.name,id:registered.id,
  guild,endpointValidated:true}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
