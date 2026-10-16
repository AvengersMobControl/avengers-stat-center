#!/usr/bin/env node
'use strict';
// Offline/reviewer-initiated only. Fetches exactly one original Discord CDN
// attachment from a URL supplied through private stdin, validates the bytes,
// and prints public-safe SHA-256 evidence. Does not store the URL, image,
// message/account IDs, or modify approved result data.
const fs=require('node:fs');
const {hashOriginalImage}=require('./hash-original-image.cjs');
const SNOWFLAKE=/^\d{15,22}$/;
const TYPES=new Map([['jpg','image/jpeg'],['jpeg','image/jpeg'],['png','image/png'],
  ['webp','image/webp'],['gif','image/gif']]);
const MAX_BYTES=25*1024*1024;
function ensure(ok,message){if(!ok)throw Error(message);}
function verifyDiscordUrl(raw,{channelId,attachmentId,expectedContentType}){
  ensure(typeof raw==='string'&&raw.length>0&&raw.length<4096,'Invalid attachment URL input');
  ensure(SNOWFLAKE.test(String(channelId))&&SNOWFLAKE.test(String(attachmentId)),
    'Provide valid authorized Discord channel and attachment IDs');
  let u;
  try{u=new URL(raw.trim());}catch{throw Error('Invalid attachment URL');}
  ensure(u.protocol==='https:'&&u.hostname==='cdn.discordapp.com'&&
    !u.username&&!u.password&&!u.port&&!u.hash,
    'Only direct HTTPS Discord CDN attachments are permitted');
  const parts=u.pathname.split('/');
  ensure(parts.length===5&&parts[1]==='attachments'&&parts[2]===String(channelId)&&
    parts[3]===String(attachmentId),'Discord CDN attachment IDs do not match reviewer metadata');
  let filename;
  try{filename=decodeURIComponent(parts[4]);}catch{throw Error('Invalid attachment filename encoding');}
  ensure(filename&&filename.length<=255&&!/[/\\\x00-\x1f]/.test(filename)&&
    !filename.includes('..'),'Invalid attachment filename');
  const ext=filename.split('.').at(-1).toLowerCase();
  ensure(TYPES.has(ext)&&TYPES.get(ext)===expectedContentType,
    'Source filename extension does not match expected image type');
  const keys=[...u.searchParams.keys()];
  ensure(keys.every(k=>['ex','is','hm'].includes(k))&&keys.length===new Set(keys).size,
    'Unexpected Discord CDN query parameters (possible image transformation)');
  ensure(keys.length===0||(keys.length===3&&['ex','is','hm'].every(k=>u.searchParams.has(k))),
    'Incomplete CDN URL signature');
  if(keys.length){
    ensure(/^[0-9a-f]{6,16}$/i.test(u.searchParams.get('ex'))&&
      /^[0-9a-f]{6,16}$/i.test(u.searchParams.get('is'))&&
      /^[0-9a-f]{32,128}$/i.test(u.searchParams.get('hm')),
      'Invalid CDN URL signature format');
  }
  return u;
}
async function retrieveOriginal({url,channelId,attachmentId,expectedContentType,
  fetchImpl=globalThis.fetch,timeoutMs=15000}){
  const parsed=verifyDiscordUrl(url,{channelId,attachmentId,expectedContentType});
  ensure(typeof fetchImpl==='function','HTTP fetch unavailable');
  ensure(Number.isInteger(timeoutMs)&&timeoutMs>=100&&timeoutMs<=120000,'Invalid timeout');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  let response;
  try{
    try{
      response=await fetchImpl(parsed.toString(),{
        method:'GET',redirect:'manual',signal:controller.signal,
        headers:{Accept:expectedContentType,'Accept-Encoding':'identity'}
      });
    }catch{throw Error('Original Discord CDN attachment could not be retrieved');}
    ensure(response&&response.status===200,
      'Original attachment unavailable, redirected, or HTTP response not 200');
    const actualType=(response.headers?.get('content-type')||'').split(';')[0].trim().toLowerCase();
    ensure(actualType===expectedContentType,'Discord CDN served a different image content type');
    const encoding=(response.headers?.get('content-encoding')||'identity').toLowerCase();
    ensure(encoding==='identity','Compressed/transformed response cannot prove original bytes');
    const length=response.headers?.get('content-length');
    if(length!==null&&length!==undefined){
      ensure(/^\d+$/.test(length),'Invalid source Content-Length');
      ensure(Number(length)<=MAX_BYTES,'Image exceeds source-size limit');
    }
    ensure(response.body&&typeof response.body.getReader==='function',
      'Original response body must be readable as a byte stream');
    const reader=response.body.getReader(),buffers=[];
    let size=0;
    try{
      while(true){
        const packet=await reader.read();
        if(packet.done)break;
        const value=packet.value;
        ensure(value instanceof Uint8Array,'Invalid source image bytes');
        size+=value.byteLength;
        ensure(size<=MAX_BYTES,'Image exceeds source-size limit');
        buffers.push(Buffer.from(value));
      }
    }catch(error){
      try{await reader.cancel();}catch{}
      throw error;
    }finally{try{reader.releaseLock();}catch{}}
    if(length!==null&&length!==undefined)
      ensure(size===Number(length),'Incomplete original attachment transfer');
    const result=hashOriginalImage(Buffer.concat(buffers,size),{
      originalBytesAttested:true,expectedContentType});
    return {imageSha256:result.sha256,byteLength:result.byteLength,
      contentType:result.contentType,provenance:'authorized-original-discord-cdn-response',
      verifiedFinal:false,approved:false,
      warning:'Byte integrity is verified for the fetched authorized CDN response; human final-claim and result review remain mandatory.'};
  }finally{clearTimeout(timer);}
}
module.exports={verifyDiscordUrl,retrieveOriginal};
if(require.main===module){
 (async()=>{
   const args=process.argv.slice(2);
   function flag(key){const x=args.find(a=>a.startsWith(key+'='));return x?.slice(key.length+1);}
   if(args.length!==3||!flag('--channel-id')||!flag('--attachment-id')||!flag('--content-type'))
     throw Error('Usage: signed CDN URL on stdin | node scripts/fetch-original-discord-image.cjs --channel-id=ID --attachment-id=ID --content-type=image/jpeg');
   // Private signed URL must arrive through stdin, NEVER through CLI args,
   // commits, logs, persisted review documents, or output.
   const signedURL=fs.readFileSync(0,'utf8').trim();
   const proof=await retrieveOriginal({url:signedURL,channelId:flag('--channel-id'),
      attachmentId:flag('--attachment-id'),expectedContentType:flag('--content-type')});
   console.log(JSON.stringify(proof,null,2));
 })().catch(e=>{console.error('Original attachment verification blocked: '+e.message);process.exitCode=1;});
}
