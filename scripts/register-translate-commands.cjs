#!/usr/bin/env node
'use strict';
// Registers the "Translate" and "Translate to…" message commands in the AVENGERS
// guild only. Dry run unless --apply. Never touches /kraken or the endpoint URL.
const {COMMANDS}=require('../server/discord-translate.cjs');
async function register(env=process.env,httpFetch=fetch){
 const client=env.DISCORD_CLIENT_ID,guild=env.DISCORD_GUILD_ID,bot=env.DISCORD_BOT_TOKEN;
 if(!/^\d{17,22}$/.test(client||'')||!/^\d{17,22}$/.test(guild||'')||!bot)throw Error('Guild, client or bot not configured');
 const out=[];
 for(const c of COMMANDS){
  const r=await httpFetch('https://discord.com/api/v10/applications/'+client+'/guilds/'+guild+'/commands',{method:'POST',
   headers:{Authorization:'Bot '+bot,'Content-Type':'application/json'},body:JSON.stringify(c),signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error('Discord rejected '+c.name+': HTTP '+r.status);
  const j=await r.json();out.push({name:j.name,id:j.id,type:j.type});
 }
 return out;
}
module.exports={register};
if(require.main===module){
 if(!process.argv.includes('--apply')){console.log(JSON.stringify({mode:'dry-run',commands:COMMANDS},null,1));process.exit(0);}
 register().then(r=>console.log(JSON.stringify({registered:r}))).catch(e=>{console.error(e.message);process.exitCode=1;});
}
