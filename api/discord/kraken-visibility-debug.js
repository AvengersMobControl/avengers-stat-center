'use strict';
// One-time private launch diagnostic for the already-live AVENGERS /kraken slash
// command. No member PII, strategies, server token or route data returned.
// Restricted to a 256-bit expiring capability kept only in AVENGERS private Neon.
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const JOB='2026-11-13-slash-member-visibility';
const COMMAND='1570681165852053565';
const redact=r=>({status:r.status,ok:r.ok});
function send(res,status,payload){res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');return res.status(status).json(payload);}
async function api(url,env,init={}){
 const r=await fetch('https://discord.com/api/v10'+url,{
  ...init,headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN,...init.headers},
  signal:AbortSignal.timeout(12000)
 });
 const body=await r.json().catch(()=>({}));
 return {status:r.status,ok:r.ok,body};
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'GET only'});
 const token=String(req.query?.nonce||''),mode=String(req.query?.mode||'status'),env=process.env;
 if(!/^[a-f0-9]{64}$/.test(token)||!['status','repair'].includes(mode))
  return send(res,403,{error:'Not authorized'});
 if(!env.AVENGERS_KRAKEN_DATABASE_URL||!env.DISCORD_BOT_TOKEN||
   !/^\d{17,22}$/.test(String(env.DISCORD_GUILD_ID||''))||
   !/^\d{17,22}$/.test(String(env.DISCORD_CLIENT_ID||'')))
  return send(res,503,{error:'Private Discord launch environment missing'});
 try{
  const db=neon(env.AVENGERS_KRAKEN_DATABASE_URL);
  const access=await db.query('SELECT nonce,expires_at,used_at FROM avengers_kraken_private.launch_control WHERE name=$1',[JOB]);
  const row=access[0],stored=String(row?.nonce||'');
  if(!row||stored.length!==token.length||row.used_at||
    Date.parse(row.expires_at)<=Date.now()||
    !crypto.timingSafeEqual(Buffer.from(stored),Buffer.from(token)))
   return send(res,403,{error:'Capability expired or consumed'});
  const guild=String(env.DISCORD_GUILD_ID),client=String(env.DISCORD_CLIENT_ID);
  const path='/applications/'+client+'/guilds/'+guild+'/commands';
  const [app,commands,guildResponse,botMember,guildIntegrations]=await Promise.all([
   api('/applications/@me',env),
   api(path,env),
   api('/guilds/'+guild,env),
   api('/guilds/'+guild+'/members/'+client,env),
   api('/guilds/'+guild+'/integrations',env)
  ]);
  if(!app.ok||String(app.body.id)!==client||!commands.ok)
   throw Error('Discord application identity or guild command list could not be verified');
  const kraken=commands.body.find(c=>c.id===COMMAND&&c.name==='kraken');
  if(!kraken)throw Error('Expected Kraken guild command is missing');
  const info={
   command:{id:kraken.id,name:kraken.name,type:kraken.type,
    default_member_permissions:kraken.default_member_permissions,
    default_permission:kraken.default_permission,
    integration_types:kraken.integration_types,
    contexts:kraken.contexts,
    nsfw:kraken.nsfw,
    version:kraken.version,
    guild_id:kraken.guild_id,
    description:kraken.description},
   application:{
    guildInstallEnabled:Object.prototype.hasOwnProperty.call(app.body.integration_types_config||{},'0'),
    integrationTypes:Object.keys(app.body.integration_types_config||{}),
    defaultInstallScopes:app.body.integration_types_config?.['0']?.oauth2_install_params?.scopes||[],
    botId:app.body.bot?.id||null,
    interactionEndpointMatches:app.body.interactions_endpoint_url===
      env.AVENGERS_KRAKEN_ORIGIN+'/api/discord/kraken-interactions'
   },
   guild:{ok:guildResponse.ok,owner_id_present:!!guildResponse.body.owner_id,
    botIsMember:botMember.ok,botMemberHttpStatus:botMember.status,
    installedAppsHttpStatus:guildIntegrations.status,
    matchingIntegration:guildIntegrations.ok&&Array.isArray(guildIntegrations.body)?
     guildIntegrations.body.filter(i=>i.application_id===client).map(i=>({
      id:i.id,type:i.type,enabled:i.enabled,scopes:i.scopes||[],roleIdPresent:!!i.role_id,
      expire_behavior:i.expire_behavior})):null},
   commandCount:commands.body.length
  };
  if(mode==='status')return send(res,200,{status:'diagnostics',...info});
  // Resolve command default visibility only, preserving the existing app,
  // interaction endpoint, command ID and all other guild commands.
  const patchBody={default_member_permissions:null,default_permission:true,
   integration_types:[0],contexts:[0],nsfw:false};
  if(!info.application.interactionEndpointMatches)
   return send(res,409,{error:'Discord interaction endpoint mismatch; refusing command edit',...info});
  const patched=await api(path+'/'+COMMAND,env,{method:'PATCH',
   headers:{'Content-Type':'application/json'},body:JSON.stringify(patchBody)});
  if(!patched.ok)return send(res,502,{error:'Discord rejected member visibility update',
   discordHttp:patched.status,discordCode:patched.body.code||null,
   discordMessage:typeof patched.body.message==='string'?patched.body.message.slice(0,240):null,
   ...info});
  const readback=await api(path,env);
  const updated=readback.ok&&readback.body.find(c=>c.id===COMMAND);
  if(!updated||updated.name!=='kraken'||updated.default_member_permissions!==null)
   return send(res,502,{error:'Member visibility readback failed',...info});
  const done=await db.query('UPDATE avengers_kraken_private.launch_control SET used_at=now(),outcome=$2::jsonb WHERE name=$1 AND used_at IS NULL RETURNING name',[JOB,JSON.stringify({
    commandId:COMMAND,memberPermissionsCleared:true,
    serverGuildInstallEnabled:info.application.guildInstallEnabled,
    botIsGuildMember:info.guild.botIsMember,
    updatedDescription:updated.description
  })]);
  if(done.length!==1)throw Error('One-use capability changed unexpectedly');
  return send(res,200,{updated:true,
   command:{id:updated.id,name:updated.name,
    default_member_permissions:updated.default_member_permissions,
    integration_types:updated.integration_types,contexts:updated.contexts,
    description:updated.description},application:info.application,guild:info.guild});
 }catch(e){console.error('Private slash visibility diagnostic:',e.message);
  return send(res,503,{error:'Discord member visibility diagnosis failed'});}
};
