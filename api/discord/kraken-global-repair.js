'use strict';
// One-use guild-only global slash command repair; no private data or strategies.
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const JOB='2026-11-14-global-kraken-repair';
const OLD='1570681165852053565';
const FORM='https://avengers-stat-center.vercel.app/api/kraken/form';
const DESCRIPTION='TEST: Practice Kraken using October maps and routes';
function reply(res,status,payload){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 return res.status(status).json(payload);
}
async function api(env,path,init={}){
 const r=await fetch('https://discord.com/api/v10'+path,{
  ...init,headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN,...init.headers},
  signal:AbortSignal.timeout(12000)});
 const raw=await r.text(),result=(()=>{try{return JSON.parse(raw)}catch{return {}}})();
 if(!r.ok){const e=new Error('Discord API HTTP '+r.status);e.httpStatus=r.status;throw e;}
 return result;
}
const globalCommand={type:1,name:'kraken',description:DESCRIPTION,
 integration_types:[0],contexts:[0],default_member_permissions:null,nsfw:false};
function chooseChannel(channels){
 const rank=s=>{s=String(s||'').toLowerCase();return s==='kraken'?0:
  s.includes('kraken')?1:s==='bot-commands'?2:s==='general'?3:99;};
 const matches=(Array.isArray(channels)?channels:[])
  .filter(c=>c.type===0&&!c.nsfw&&rank(c.name)<99);
 matches.sort((a,b)=>rank(a.name)-rank(b.name));
 return matches[0]||null;
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return reply(res,405,{error:'GET required'});
 const nonce=String(req.query?.nonce||''),mode=String(req.query?.mode||'status'),env=process.env;
 if(!/^[a-f0-9]{64}$/.test(nonce)||!['status','repair'].includes(mode))
  return reply(res,403,{error:'Unauthorized'});
 if(!env.DISCORD_BOT_TOKEN||!env.AVENGERS_KRAKEN_DATABASE_URL||
  !/^\d{17,22}$/.test(env.DISCORD_CLIENT_ID||'')||
  !/^\d{17,22}$/.test(env.DISCORD_GUILD_ID||'')||
  env.AVENGERS_KRAKEN_TEST_MODE!=='true')
  return reply(res,503,{error:'Test mode or private API environment unavailable'});
 try{
  const db=neon(env.AVENGERS_KRAKEN_DATABASE_URL);
  const rows=await db.query('SELECT nonce,used_at,expires_at FROM avengers_kraken_private.launch_control WHERE name=$1',[JOB]);
  const access=rows[0],stored=String(access?.nonce||'');
  if(!access||access.used_at||Date.parse(access.expires_at)<=Date.now()||
    stored.length!==nonce.length||!crypto.timingSafeEqual(Buffer.from(stored),Buffer.from(nonce)))
   return reply(res,403,{error:'Repair capability expired or consumed'});
  const client=env.DISCORD_CLIENT_ID,guild=env.DISCORD_GUILD_ID;
  const base='/applications/'+client,guildBase=base+'/guilds/'+guild+'/commands';
  const [app,globals,guildCommands,roles,channels]=await Promise.all([
   api(env,'/applications/@me'),api(env,base+'/commands'),api(env,guildBase),
   api(env,'/guilds/'+guild+'/roles').catch(()=>[]),
   api(env,'/guilds/'+guild+'/channels').catch(()=>[])
  ]);
  const installedScopes=app.integration_types_config?.['0']?.oauth2_install_params?.scopes||[];
  if(String(app.id)!==client||
   app.interactions_endpoint_url!==env.AVENGERS_KRAKEN_ORIGIN+'/api/discord/kraken-interactions'||
   !installedScopes.includes('applications.commands'))
   throw Error('Discord bot application, endpoint or guild-install scopes mismatch');
  const existingGuild=guildCommands.filter(c=>c.name==='kraken');
  const existingGlobal=globals.filter(c=>c.name==='kraken');
  if(existingGuild.length>1||existingGlobal.length>1||
   (existingGuild.length===1&&existingGuild[0].id!==OLD))
   throw Error('Unexpected existing command identity, refusing to overwrite');
  const everyone=Array.isArray(roles)?roles.find(r=>String(r.id)===guild):null;
  const canUseAppCommands=everyone?((BigInt(everyone.permissions)&(1n<<31n))!==0n):null;
  const choice=chooseChannel(channels);
  const info={guildCommandExists:!!existingGuild.length,
   globalCommandExists:!!existingGlobal.length,
   everyoneUseApplicationCommands:canUseAppCommands,
   fallbackChannelAvailable:!!choice,
   otherGlobalCommands:globals.filter(c=>c.name!=='kraken').length,
   otherGuildCommands:guildCommands.filter(c=>c.name!=='kraken').length};
  if(mode==='status')return reply(res,200,{preflight:true,...info});
  const init={headers:{'Content-Type':'application/json'},body:JSON.stringify(globalCommand)};
  let saved;
  if(existingGlobal.length)
   saved=await api(env,base+'/commands/'+existingGlobal[0].id,{...init,method:'PATCH'});
  else saved=await api(env,base+'/commands',{...init,method:'POST'});
  if(saved.name!=='kraken'||!/^\d{17,22}$/.test(String(saved.id||'')))
   throw Error('Global command registration response invalid');
  const newGlobal=await api(env,base+'/commands');
  if(!newGlobal.some(c=>c.id===saved.id&&c.name==='kraken'))
   throw Error('New global command did not appear on Discord readback');
  // A guild command with the same name shadows a global command.
  if(existingGuild.length)await api(env,guildBase+'/'+OLD,{method:'DELETE'});
  const newGuild=await api(env,guildBase);
  if(newGuild.some(c=>c.name==='kraken'))throw Error('Old guild command still shadows global /kraken');
  let fallback={posted:false};
  if(choice){
   try{
    const message=await api(env,'/channels/'+choice.id+'/messages',{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({
      content:'**Kraken practice is available!** 🐙\nWe are testing with October’s historical routes. Use the button to log battles privately while the Discord slash command refreshes. Test results do not enter the master spreadsheet.',
      allowed_mentions:{parse:[]},
      components:[{type:1,components:[{type:2,style:5,label:'Open Kraken Test Form',url:FORM}]}]
     })
    });
    fallback={posted:!!message.id,channelName:choice.name};
   }catch(e){fallback={posted:false,httpStatus:e.httpStatus||null};}
  }
  const write=await db.query('UPDATE avengers_kraken_private.launch_control '+
   'SET used_at=now(),outcome=$2::jsonb WHERE name=$1 AND used_at IS NULL RETURNING name',
   [JOB,JSON.stringify({newGlobalId:saved.id,oldGuildRemoved:true,fallback,
    everyoneUseApplicationCommands:canUseAppCommands})]);
  if(write.length!==1)throw Error('Repair capability was already consumed');
  return reply(res,200,{success:true,globalCommandId:saved.id,
   removedOldGuildVersion:true,globalReadbackVerified:true,
   newCommandContext:saved.contexts,newCommandInstallTypes:saved.integration_types,
   defaultPermissions:saved.default_member_permissions,
   fallback,everyoneUseApplicationCommands:canUseAppCommands,
   note:'Discord global command rollout and client cache can delay visibility'});
 }catch(e){
  console.error('Global Kraken command recovery:',e.message);
  return reply(res,503,{error:'Discord global command repair incomplete',
   reason:e.message.slice(0,140)});
 }
};
