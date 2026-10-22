'use strict';
// Expiring preview-only Discord thread inventory, no message bodies.
// Remove before merge.
const {researchScope,discordGet,id}=require('../../server/discord-guide-research.cjs');
module.exports=async function handler(req,res){
 const send=(status,body)=>{res.setHeader('Content-Type','application/json; charset=utf-8');
   res.setHeader('Cache-Control','private, no-store, max-age=0');
   res.setHeader('X-Robots-Tag','noindex');
   return res.status(status).send(JSON.stringify(body));};
 if(req.method!=='GET')return send(405,{error:'GET only'});
 if(process.env.VERCEL_ENV!=='preview'||process.env.VERCEL_GIT_COMMIT_REF!=='feature/discord-strategy-research-20261021')
   return send(404,{error:'not available'});
 if(Date.now()>Date.parse('2026-10-23T06:00:00Z'))return send(410,{error:'expired'});
 const scope=researchScope(process.env),guild=process.env.DISCORD_GUILD_ID,token=process.env.DISCORD_BOT_TOKEN;
 if(!scope||!guild||!token)return send(503,{error:'missing configuration'});
 const mode=String(req.query?.mode||'active');
 if(mode==='active'){
   const r=await discordGet('/guilds/'+guild+'/threads/active',token);
   if(r.rateLimited)return send(429,r);
   if(!Array.isArray(r.data?.threads))return send(502,{error:'active thread retrieval unavailable',code:r.status||null});
   const threads=r.data.threads.filter(t=>String(t.guild_id)===guild&&id(t.id)&&scope.has(String(t.parent_id)))
     .map(t=>({id:String(t.id),parentId:String(t.parent_id),type:t.type,archived:false}));
   return send(200,{mode,threads});
 }
 if(mode==='archived'){
   const channelId=String(req.query?.channelId||'');
   if(!id(channelId)||!scope.has(channelId))return send(403,{error:'unapproved channel'});
   const before=String(req.query?.before||'');
   if(before && !Number.isFinite(Date.parse(before)))return send(400,{error:'invalid cursor'});
   const params=new URLSearchParams({limit:'100'});
   if(before)params.set('before',before);
   const r=await discordGet('/channels/'+channelId+'/threads/archived/public?'+params,token);
   if(r.rateLimited)return send(429,r);
   if(!Array.isArray(r.data?.threads))return send(502,{error:'archived thread retrieval unavailable',code:r.status||null});
   const threads=r.data.threads.filter(t=>!t.guild_id||String(t.guild_id)===guild)
     .filter(t=>String(t.parent_id)===channelId&&id(t.id))
     .map(t=>({id:String(t.id),parentId:channelId,archivedAt:t.thread_metadata?.archive_timestamp||null}));
   return send(200,{mode,channelId,threads,hasMore:!!r.data.has_more,
     nextBefore:threads.at(-1)?.archivedAt||null});
 }
 return send(400,{error:'unknown mode'});
};
