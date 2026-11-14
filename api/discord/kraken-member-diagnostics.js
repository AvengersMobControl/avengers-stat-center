'use strict';
// One-time private read-only diagnostic. No credentials, member lists,
// private identities, scores or routes are returned or published.
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const JOB='2026-11-14-post-role-member-diagnostics';
const USE_APP=1n<<31n,VIEW_CHANNEL=1n<<10n,ADMIN=1n<<3n;
function json(res,status,data){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 return res.status(status).json(data);
}
async function api(env,path){
 const res=await fetch('https://discord.com/api/v10'+path,{
  headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN},
  signal:AbortSignal.timeout(14000)});
 if(!res.ok)throw Error('Discord API '+path.split('/').slice(0,3).join('/')+' status '+res.status);
 return res.json();
}
function bit(v){try{return BigInt(String(v||'0'));}catch{return 0n;}}
function applyOverwrite(base,o){
 if(!o)return base;
 return (base&~bit(o.deny))|bit(o.allow);
}
function compute(member,channel,roleMap,guild){
 let base=bit(roleMap.get(guild)?.permissions);
 for(const roleId of member.roles||[])base|=bit(roleMap.get(String(roleId))?.permissions);
 if((base&ADMIN)!==0n)return {useApp:true,view:true,admin:true};
 const ovs=Array.isArray(channel.permission_overwrites)?channel.permission_overwrites:[];
 base=applyOverwrite(base,ovs.find(o=>String(o.id)===guild));
 let deny=0n,allow=0n;
 for(const o of ovs)if(o.type===0&&(member.roles||[]).includes(String(o.id))){
  deny|=bit(o.deny);allow|=bit(o.allow);
 }
 base=(base&~deny)|allow;
 base=applyOverwrite(base,ovs.find(o=>o.type===1&&String(o.id)===String(member.user?.id)));
 return {useApp:Boolean(base&USE_APP),view:Boolean(base&VIEW_CHANNEL),admin:false};
}
async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'GET required'});
 const nonce=String(req.query?.nonce||''),env=process.env;
 if(!/^[a-f0-9]{64}$/.test(nonce)||!env.DISCORD_BOT_TOKEN||
  !env.AVENGERS_KRAKEN_DATABASE_URL||!/^\d{17,22}$/.test(env.DISCORD_GUILD_ID||'')||
  !/^\d{17,22}$/.test(env.DISCORD_CLIENT_ID||''))
  return json(res,403,{error:'Unauthorized'});
 try{
  const db=neon(env.AVENGERS_KRAKEN_DATABASE_URL);
  const rows=await db.query('SELECT nonce,used_at,expires_at FROM avengers_kraken_private.launch_control WHERE name=$1',[JOB]);
  const record=rows[0],expected=String(record?.nonce||'');
  if(!record||record.used_at||Date.parse(record.expires_at)<=Date.now()||
   expected.length!==nonce.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(nonce)))
   return json(res,403,{error:'Authorization expired or used'});
  const guild=env.DISCORD_GUILD_ID;
  if(!env.AVENGERS_IDENTITY_DATABASE_URL)return json(res,503,{error:'Private identity context missing'});
  const identityDb=neon(env.AVENGERS_IDENTITY_DATABASE_URL);
  const [roles,channels,members,globals,guildCommands,app,leader]=await Promise.all([
   api(env,'/guilds/'+guild+'/roles'),
   api(env,'/guilds/'+guild+'/channels'),
   api(env,'/guilds/'+guild+'/members?limit=1000'),
   api(env,'/applications/'+env.DISCORD_CLIENT_ID+'/commands'),
   api(env,'/applications/'+env.DISCORD_CLIENT_ID+'/guilds/'+guild+'/commands'),
   api(env,'/applications/@me'),
   identityDb.query('SELECT discord_user_id FROM avengers_identity_private.discord_bindings '+
    "WHERE canonical_name='AV-HarryBallsagna' AND verified_at IS NOT NULL LIMIT 2")
  ]);
  const roleMap=new Map(roles.map(r=>[String(r.id),r]));
  const everyone=roleMap.get(guild);
  const everyoneUseApp=Boolean(bit(everyone?.permissions)&USE_APP);
  const command=globals.find(c=>c.name==='kraken');
  const stale=guildCommands.filter(c=>c.name==='kraken');
  const leaderId=leader.length===1?String(leader[0].discord_user_id):null;
  const leaderMember=leaderId?members.find(m=>String(m.user?.id)===leaderId):null;
  const selected=channels.filter(c=>c.type===0&&
   (/kraken|general|clan-chat|bot-command|bot-test/i).test(String(c.name||''))).slice(0,15);
  const scenarios=selected.map(ch=>{
   const statuses=members.filter(m=>!m.user?.bot).map(m=>compute(m,ch,roleMap,guild));
   const leaderPermission=leaderMember?compute(leaderMember,ch,roleMap,guild):null;
   const overwrites=ch.permission_overwrites||[];
   const everyoneOvr=overwrites.find(o=>String(o.id)===guild);
   return {
    channelName:ch.name,
    channelEveryoneExplicitDeniesAppCommands:Boolean(everyoneOvr&&(bit(everyoneOvr.deny)&USE_APP)),
    nonBotMembersWithChannelViewAndSlash:statuses.filter(x=>x.view&&x.useApp).length,
    nonBotMembersWithChannelViewButNoSlash:statuses.filter(x=>x.view&&!x.useApp).length,
    leader:{inRoster:!!leaderMember,
     canView:leaderPermission?.view??null,
     canUseAppCommands:leaderPermission?.useApp??null,
     guildAdmin:leaderPermission?.admin??null}
   };
  });
  const summary={
   everyoneUseApplicationCommandsNow:everyoneUseApp,
   roleCount:roles.length,
   sampledGuildMembers:members.length,
   memberListComplete:members.length<1000,
   leaderVerifiedInGuild:!!leaderMember,
   globalKrakenExists:!!command,
   globalKraken:{idMatchesExpected:command?.id==='1571168740228206673',
    context:command?.contexts||null,installTypes:command?.integration_types||null,
    defaultMemberPermissions:command?.default_member_permissions??null,
    type:command?.type??null,name:command?.name||null},
   staleGuildKrakenCount:stale.length,
   appGuildInstallAvailable:Object.prototype.hasOwnProperty.call(app.integration_types_config||{},'0'),
   appConfiguredScopes:app.integration_types_config?.['0']?.oauth2_install_params?.scopes||[],
   applicationEndpointValid:app.interactions_endpoint_url===
     env.AVENGERS_KRAKEN_ORIGIN+'/api/discord/kraken-interactions',
   channels:scenarios
  };
  const consumed=await db.query('UPDATE avengers_kraken_private.launch_control '+
   'SET used_at=now(),outcome=$2::jsonb WHERE name=$1 AND used_at IS NULL RETURNING name',
   [JOB,JSON.stringify(summary)]);
  if(consumed.length!==1)throw Error('Diagnostic was used concurrently');
  return json(res,200,summary);
 }catch(e){
  console.error('Kraken member permission diagnostic:',e.message);
  return json(res,503,{error:'Live Discord member permission diagnostic failed'});
 }
}
module.exports=handler;
module.exports.compute=compute;
