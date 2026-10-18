'use strict';
// AVENGERS #8: authenticated, READ-ONLY Discord PNG readback.
// This is a private backend dependency, not a Vercel route. It NEVER posts,
// edits, deletes, or retries Discord messages. Do not include in a client bundle.
// The operator/injected private backend must supply the bot credential and
// approved destination/bot IDs from protected configuration.
const SNOW=/^\d{15,22}$/;
const MAX_PNG=25*1024*1024, MAX_JSON=64*1024;
const MAGIC=Buffer.from([137,80,78,71,13,10,26,10]);
function blocked(){throw Error('Authenticated Discord readback blocked; inspect sources privately');}
function isId(x){return typeof x==='string'&&SNOW.test(x)}
async function boundedBytes(response,maxBytes){
 const declared=response.headers?.get('content-length');
 if(declared!==null&&declared!==undefined&&
  (!/^\d+$/.test(declared)||Number(declared)>maxBytes))blocked();
 if(!response.body||typeof response.body.getReader!=='function')blocked();
 const chunks=[];let sum=0;const reader=response.body.getReader();
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   if(!(value instanceof Uint8Array))blocked();
   sum+=value.byteLength;
   if(sum>maxBytes)blocked();
   chunks.push(Buffer.from(value));
  }
 }finally{
  if(typeof reader.cancel==='function')await reader.cancel().catch(()=>{});
 }
 return Buffer.concat(chunks,sum);
}
function validateCdn(uri){
 let parsed;
 try{parsed=new URL(uri)}catch{blocked()}
 if(parsed.protocol!=='https:'||parsed.hostname!=='cdn.discordapp.com'||
  parsed.port||parsed.username||parsed.password||parsed.hash||
  !/^\/(?:attachments|ephemeral-attachments)\/\d{15,22}\/\d{15,22}\//.test(parsed.pathname))blocked();
 return parsed.href; // immutable original CDN URL; do not rewrite signed query
}
function makeAuthenticatedReadback({botToken,expectedBotId,allowedChannelIds,fetchImpl=globalThis.fetch}){
 if(typeof botToken!=='string'||!botToken.trim()||botToken.startsWith('Bot ')||
   !isId(expectedBotId)||!Array.isArray(allowedChannelIds)||
   allowedChannelIds.length===0||allowedChannelIds.some(x=>!isId(x))||
   typeof fetchImpl!=='function')blocked();
 const allowed=new Set(allowedChannelIds);
 return async ({channelId,messageId})=>{
  if(!isId(channelId)||!isId(messageId)||!allowed.has(channelId))blocked();
  try{
   const msgResponse=await fetchImpl(
    'https://discord.com/api/v10/channels/'+channelId+'/messages/'+messageId,
    {method:'GET',redirect:'error',
     headers:{Authorization:'Bot '+botToken,Accept:'application/json'}});
   if(msgResponse.status!==200||!/^application\/json\b/i.test(msgResponse.headers.get('content-type')||''))blocked();
   const metadata=JSON.parse((await boundedBytes(msgResponse,MAX_JSON)).toString('utf8'));
   if(!metadata||metadata.id!==messageId||metadata.channel_id!==channelId||
      metadata.author?.id!==expectedBotId||!Array.isArray(metadata.attachments))blocked();
   const pngs=metadata.attachments.filter(a=>a&&a.content_type==='image/png'&&
     typeof a.filename==='string'&&/\.png$/i.test(a.filename));
   if(pngs.length!==1)blocked();
   const a=pngs[0];
   if(!Number.isSafeInteger(a.size)||a.size<MAGIC.length||a.size>MAX_PNG||
     typeof a.url!=='string')blocked();
   const cdnUrl=validateCdn(a.url);
   const imageResponse=await fetchImpl(cdnUrl,{method:'GET',redirect:'error',
      headers:{Accept:'image/png'}});
   if(imageResponse.status!==200||!/^image\/png\b/i.test(imageResponse.headers.get('content-type')||''))blocked();
   const bytes=await boundedBytes(imageResponse,MAX_PNG);
   if(bytes.length!==a.size||!bytes.subarray(0,MAGIC.length).equals(MAGIC))blocked();
   return {channelId,messageId,contentType:'image/png',attachmentBytes:bytes};
  }catch{
   blocked(); // never expose bot token, signed attachment URL, or response payload
  }
 };
}
module.exports={makeAuthenticatedReadback};
