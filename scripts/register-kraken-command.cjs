#!/usr/bin/env node
'use strict';
// No command is registered without an explicit --apply and complete server config.
// This script runs in a controlled server environment, never on a member's device.
const command={name:'kraken',description:'Submit private Kraken battle results for leader review',type:1,dm_permission:false};
if(!process.argv.includes('--apply')){
 console.log(JSON.stringify({mode:'dry-run',registered:false,scope:'AVENGERS guild only',command},null,2));
 process.exit(0);
}
(async()=>{
 const env=process.env;
 const id=env.DISCORD_CLIENT_ID,guild=env.DISCORD_GUILD_ID,bot=env.DISCORD_BOT_TOKEN;
 if(!/^\d{17,22}$/.test(id||'')||!/^\d{17,22}$/.test(guild||'')||!bot||
    !/^[a-f0-9]{64}$/i.test(env.DISCORD_PUBLIC_KEY||'')||
    !/^https:\/\/[a-z0-9.-]+$/.test(env.AVENGERS_KRAKEN_ORIGIN||''))
  throw Error('Guild, client, bot, public key or deployed private origin is not configured');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(env.AVENGERS_KRAKEN_ACTIVE_EVENT||''))
  throw Error('Kraken event has not been opened yet; registration deliberately blocked');
 const url='https://discord.com/api/v10/applications/'+id+'/guilds/'+guild+'/commands';
 const response=await fetch(url,{method:'POST',headers:{Authorization:'Bot '+bot,'content-type':'application/json'},
  body:JSON.stringify(command),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('Discord application command rejected: HTTP '+response.status);
 const registered=await response.json();
 if(registered.name!=='kraken'||!registered.id)throw Error('Discord returned unexpected command response');
 console.log(JSON.stringify({registered:true,name:registered.name,id:registered.id,guild}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
