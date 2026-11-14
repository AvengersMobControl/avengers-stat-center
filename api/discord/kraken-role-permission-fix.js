'use strict';
// One-use private permission diagnostic for the AVENGERS guild. The guild
// denies Use Application Commands to @everyone, which can hide /kraken from
// ordinary members even when the bot integration shows green checks.
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const JOB='2026-11-14-kraken-role-permission';
const USE_APP=1n<<31n,MANAGE_ROLES=1n<<28n,ADMIN=1n<<3n;
function json(res,status,obj){res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');return res.status(status).json(obj);}
async function discord(env,path,init={}){
 const r=await fetch('https://discord.com/api/v10'+path,{...init,headers:{
  Authorization:'Bot '+env.DISCORD_BOT_TOKEN,...init.headers},signal:AbortSignal.timeout(12000)});
 const raw=await r.text(),data=(()=>{try{return JSON.parse(raw)}catch{return {}}})();
 if(!r.ok){const e=new Error('Discord API HTTP '+r.status);e.status=r.status;throw e;}
 return data;
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'GET required'});
 const env=process.env,nonce=String(req.query?.nonce||''),mode=String(req.query?.mode||'status');
 if(!/^[a-f0-9]{64}$/.test(nonce)||!['status','enable'].includes(mode))
  return json(res,403,{error:'Unauthorized'});
 if(!env.AVENGERS_KRAKEN_DATABASE_URL||!env.DISCORD_BOT_TOKEN||
   !/^\d{17,22}$/.test(env.DISCORD_GUILD_ID||'')||
   !/^\d{17,22}$/.test(env.DISCORD_CLIENT_ID||''))
  return json(res,503,{error:'Kraken private environment missing'});
 try{
  const q=neon(env.AVENGERS_KRAKEN_DATABASE_URL);
  const permit=await q.query('SELECT nonce,used_at,expires_at FROM avengers_kraken_private.launch_control WHERE name=$1',[JOB]);
  const row=permit[0],stored=String(row?.nonce||'');
  if(!row||row.used_at||Date.parse(row.expires_at)<=Date.now()||
    stored.length!==nonce.length||!crypto.timingSafeEqual(Buffer.from(stored),Buffer.from(nonce)))
   return json(res,403,{error:'Capability expired or consumed'});
  const g=env.DISCORD_GUILD_ID;
  const [roles,member]=await Promise.all([
   discord(env,'/guilds/'+g+'/roles'),
   discord(env,'/guilds/'+g+'/members/'+env.DISCORD_CLIENT_ID)
  ]);
  const roleMap=new Map(roles.map(r=>[String(r.id),r]));
  const everyone=roleMap.get(g);
  if(!everyone)throw Error('Discord @everyone guild role missing');
  const bits=BigInt(everyone.permissions||'0');
  let botPermissions=bits;
  for(const id of member.roles||[]){
   const role=roleMap.get(String(id));
   if(role)botPermissions|=BigInt(role.permissions||'0');
  }
  const botCanManageRoles=Boolean(botPermissions & (MANAGE_ROLES|ADMIN));
  const allMemberAppCommandEnabled=Boolean(bits&USE_APP);
  const useAppRoles=roles.filter(r=>r.id!==g&&(BigInt(r.permissions||'0')&USE_APP)!==0n)
   .map(r=>({name:r.name,managed:!!r.managed,position:r.position}));
  const information={everyoneUseApplicationCommands:allMemberAppCommandEnabled,
   roleCount:roles.length,otherRolesGrantingUseApplicationCommands:useAppRoles,
   botCanManageRoles};
  if(mode==='status')return json(res,200,{diagnosed:true,...information});
  if(allMemberAppCommandEnabled)return json(res,200,{alreadyEnabled:true,...information});
  if(!botCanManageRoles)
   return json(res,403,{error:'Bot cannot change guild roles (Manage Roles missing)',...information});
  // Only adds the single Use Application Commands bit to @everyone. This
  // changes the guild-wide baseline for all apps, not only Kraken, so record
  // the prior bitmask to make the change auditable/reversible.
  const edited=await discord(env,'/guilds/'+g+'/roles/'+g,{
   method:'PATCH',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({permissions:String(bits|USE_APP)})
  });
  if(String(edited.id)!==g||!(BigInt(edited.permissions||'0')&USE_APP))
   throw Error('Discord did not confirm Use Application Commands role change');
  const reread=await discord(env,'/guilds/'+g+'/roles');
  const after=reread.find(r=>String(r.id)===g);
  if(!after||!(BigInt(after.permissions||'0')&USE_APP))
   throw Error('Permission update failed Discord readback');
  const logged=await q.query('UPDATE avengers_kraken_private.launch_control SET used_at=now(),'+
   'outcome=$2::jsonb WHERE name=$1 AND used_at IS NULL RETURNING name',
   [JOB,JSON.stringify({beforePermissions:String(bits),
    afterPermissions:String(bits|USE_APP),onlyChangedPermission:'USE_APPLICATION_COMMANDS',
    role:'@everyone',guildId:g})]);
  if(logged.length!==1)throw Error('One-use capability already consumed');
  return json(res,200,{updated:true,
   allMembersMayUseAppCommands:true,onlyChangedPermission:'USE_APPLICATION_COMMANDS',
   affectsAllGuildApps:true});
 }catch(e){
  console.error('Kraken use application commands permission correction:',e.message);
  return json(res,e.status===403?403:503,{error:'Could not update Discord guild command permission',
   detail:e.message.slice(0,160)});
 }
};
