'use strict';
// Leader-directed one-shot setup for message translation (2026-11-23), run server-side
// so the bot token never leaves Vercel. Guarded by a single-use token whose SHA-256 is in
// AVENGERS_TRANSLATE_SETUP_SHA256 plus an expiry in AVENGERS_TRANSLATE_SETUP_EXPIRES_UTC.
//   ?action=register  -> register the message command(s) (guild only)
//   ?action=unregister -> delete this app's guild message commands that are no longer in COMMANDS
//   ?action=edit-announcement -> update the bot's own posted how-to to the committed text
//   ?action=selftest  -> translate a fixed sentence (proves AI Gateway auth)
//   ?action=channels  -> list text channel names/ids
//   ?action=announce&channel=<id> -> post the committed how-to to its pinned channel, readback-checked
const crypto=require('node:crypto');
const {register}=require('../../scripts/register-translate-commands.cjs');
const {translate,COMMANDS}=require('../../server/discord-translate.cjs');
const howto=require('../../data/announcements/translate-howto.json');
const API='https://discord.com/api/v10';
async function discord(env,path,init={}){
 const r=await fetch(API+path,{...init,headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN,'Content-Type':'application/json',...init.headers},signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('Discord HTTP '+r.status);
 return r.json();
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const env=process.env,q=req.query||{},token=String(q.token||''),action=String(q.action||'');
 const want=String(env.AVENGERS_TRANSLATE_SETUP_SHA256||''),exp=Date.parse(env.AVENGERS_TRANSLATE_SETUP_EXPIRES_UTC||'');
 const got=crypto.createHash('sha256').update(token).digest('hex');
 if(req.method!=='GET'||!/^[a-f0-9]{64}$/.test(token)||!/^[a-f0-9]{64}$/.test(want)||!Number.isFinite(exp)||Date.now()>exp||
  !crypto.timingSafeEqual(Buffer.from(got),Buffer.from(want)))return res.status(404).json({ok:false});
 try{
  if(action==='register')return res.status(200).json({ok:true,registered:await register(env)});
  if(action==='unregister'){
   const base='/applications/'+env.DISCORD_CLIENT_ID+'/guilds/'+env.DISCORD_GUILD_ID+'/commands';
   const keep=new Set(COMMANDS.map(c=>c.name));
   const stale=(await discord(env,base)).filter(c=>c.type===3&&/^Translate/.test(c.name)&&!keep.has(c.name));
   for(const c of stale){
    const r=await fetch(API+base+'/'+c.id,{method:'DELETE',headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN},signal:AbortSignal.timeout(12000)});
    if(r.status!==204)throw Error('Discord delete HTTP '+r.status);
   }
   return res.status(200).json({ok:true,removed:stale.map(c=>c.name)});
  }
  if(action==='edit-announcement'){
   const path='/channels/'+howto.channelId+'/messages/'+howto.messageId;
   const m=await discord(env,path,{method:'PATCH',body:JSON.stringify({content:howto.body,allowed_mentions:{parse:[]}})});
   return res.status(200).json({ok:true,messageId:m.id,readbackMatches:m.content===howto.body});
  }
  if(action==='selftest')return res.status(200).json({ok:true,translation:await translate('Great job in Big Pig this week, team!','es',{env,oidc:req.headers['x-vercel-oidc-token']})});
  if(action==='channels'){
   const ch=await discord(env,'/guilds/'+env.DISCORD_GUILD_ID+'/channels');
   return res.status(200).json({ok:true,channels:ch.filter(c=>c.type===0).map(c=>({id:c.id,name:c.name}))});
  }
  if(action==='announce'){
   // Only the committed destination (#general-chat) can receive the how-to.
   const channel=String(q.channel||'');
   if(channel!==howto.channelId)return res.status(400).json({ok:false,reason:'announcement is pinned to channel '+howto.channelId});
   const c=await discord(env,'/channels/'+channel);
   if(String(c.guild_id)!==env.DISCORD_GUILD_ID)return res.status(400).json({ok:false,reason:'channel is not in the AVENGERS server'});
   const m=await discord(env,'/channels/'+channel+'/messages',{method:'POST',body:JSON.stringify({content:howto.body,allowed_mentions:{parse:howto.allowedMentions}})});
   const back=await discord(env,'/channels/'+channel+'/messages/'+m.id);
   return res.status(200).json({ok:true,messageId:m.id,channelId:channel,readbackMatches:back.content===howto.body});
  }
  return res.status(400).json({ok:false,reason:'unknown action'});
 }catch(e){return res.status(502).json({ok:false,reason:String(e.message).slice(0,160)});}
};
