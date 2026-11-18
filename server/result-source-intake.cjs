'use strict';
// Private, resumable source intake ONLY. A verified image hash is NOT a verified
// player row or permission to publish. Never writes the public event ledger.
const config=require('../discord-ingest-config.json');
const {retrieveOriginal}=require('../scripts/fetch-original-discord-image.cjs');
const IMAGE=/\.(png|jpe?g|webp|gif)$/i;
const SNO=/^\d{15,22}$/;
const CONTENT_TYPES=new Set(['image/png','image/jpeg','image/webp','image/gif']);
const MAX_MESSAGES=50; // Discord allows up to 100 per page
const DAYS=9;
function assert(value,message){if(!value)throw Error(message);}
function isImage(a){return CONTENT_TYPES.has(a.content_type) || IMAGE.test(String(a.filename||''));}
function safeError(err){
  // Never return URLs, tokens, IDs, filenames or Discord API payloads from errors.
  if(err?.code==='RATE_LIMIT')return 'discord-rate-limit';
  const message=String(err?.message||'');
  if(/timeout|aborted/i.test(message))return 'source-timeout';
  if(/permission denied|42501/i.test(message))return 'source-database-permission-denied';
  if(/relation .*does not exist|42P01/i.test(message))return 'source-database-schema-missing';
  if(/Cannot find module.*neondatabase/i.test(message))return 'source-runtime-module-missing';
  if(/Discord API HTTP 401|HTTP 401|unauthorized/i.test(message))return 'source-auth-invalid';
  if(/Discord API HTTP 403/i.test(message))return 'source-channel-forbidden';
  if(/HTTP 403|forbidden|expired/i.test(message))return 'source-forbidden';
  if(/NeonDbError|postgres|database|query/i.test(message))return 'source-database-query-failed';
  if(/HTTP 404|not found/i.test(message))return 'source-not-found';
  if(/content type|signature|filename|image|bytes/i.test(message))return 'invalid-image-proof';
  return 'source-retrieval-failed';
}
function sourceType(a){
  const s=String(a.content_type||'');
  if(CONTENT_TYPES.has(s))return s;
  const ext=String(a.filename||'').split('.').at(-1).toLowerCase();
  return {jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif'}[ext]||null;
}
async function scanChannel({channelKey,store,token,fetchImpl=fetch,downloadOriginal=retrieveOriginal,
  nowMs=Date.now(),maxMessages=MAX_MESSAGES}){
  assert(Object.hasOwn(config.channels,channelKey),'Unknown configured channel');
  assert(typeof token==='string'&&token.length>0,'Discord bot token unavailable');
  assert(Number.isInteger(maxMessages)&&maxMessages>=1&&maxMessages<=MAX_MESSAGES,'Unsafe scan page size');
  const channel=config.channels[channelKey],nonce=require('node:crypto').randomUUID();
  const current=await store.claim(channelKey,nonce);
  if(!current)return {status:'busy',channel:channelKey};
  const cutoff=nowMs-DAYS*86400000;
  let attempted=0,saved=0,previous=0,completed=false,nextBefore=current.next_before||null;
  try{
    const params=new URLSearchParams({limit:String(maxMessages)});
    if(nextBefore)params.set('before',nextBefore);
    const response=await fetchImpl('https://discord.com/api/v10/channels/'+channel.id+'/messages?'+params,
      {headers:{Authorization:'Bot '+token},signal:AbortSignal.timeout(15000)});
    if(response.status===429){const err=Error('Discord rate limited');err.code='RATE_LIMIT';throw err;}
    if(!response.ok)throw Error('Discord API HTTP '+response.status);
    const messages=await response.json();
    assert(Array.isArray(messages),'Malformed Discord page');
    for(const msg of messages){
      assert(SNO.test(String(msg.id))&&Number.isFinite(Date.parse(msg.timestamp)),'Malformed Discord message');
      if(nextBefore)assert(BigInt(msg.id)<BigInt(nextBefore),'Discord returned non-decreasing cursor');
    }
    const inside=messages.filter(m=>Date.parse(m.timestamp)>=cutoff);
    for(const message of inside){
      const attachments=(message.attachments||[]).filter(isImage);
      await store.recordMessage({channelKey,messageId:String(message.id),sourceTime:message.timestamp,
        attachmentCountTotal:(message.attachments||[]).length,imageCount:attachments.length,
        progressHint:/preliminary|still ongoing|in progress|current standings|not final/i.test(String(message.content||''))});
      const ids=new Set(attachments.map(a=>String(a.id)));
      assert(ids.size===attachments.length,'Discord post contains duplicate attachment IDs');
      for(const attachment of attachments){
        attempted++;
        assert(SNO.test(String(attachment.id)),'Malformed original attachment identifier');
        const type=sourceType(attachment);
        assert(type&&attachment.url,'Missing original attachment metadata');
        const old=await store.find(channelKey,String(message.id),String(attachment.id));
        if(old?.original_sha256&&old?.byte_length>0){previous++;continue;}
        let proof;
        try{
          proof=await downloadOriginal({
            url:attachment.url,channelId:channel.id,
            attachmentId:String(attachment.id),expectedContentType:type,fetchImpl
          });
        }catch(e){
          const code=safeError(e);
          await store.failure({channelKey,messageId:String(message.id),attachmentId:String(attachment.id),
            sourceTime:message.timestamp,expectedCount:attachments.length,filename:attachment.filename,contentType:type,errorCode:code});
          throw Error('Original-byte proof failed: '+code);
        }
        assert(proof.provenance==='authorized-original-discord-cdn-response'&&
          /^[a-f0-9]{64}$/.test(proof.imageSha256)&&Number.isInteger(proof.byteLength)&&proof.byteLength>0,
          'Original-byte proof is not authentic');
        await store.receipt({
          channelKey,messageId:String(message.id),attachmentId:String(attachment.id),
          sourceTime:message.timestamp,expectedCount:attachments.length,filename:attachment.filename,
          originalSha256:proof.imageSha256,byteLength:proof.byteLength,
          contentType:proof.contentType,progressHint:/preliminary|still ongoing|in progress|current standings|not final/i.test(String(message.content||''))
        });
        saved++;
      }
    }
    // Advance ONLY after every original image in this page was proved and durably stored.
    // Revisit today's newest page after a full historical cycle, catching late posts.
    const exhausted=messages.length<maxMessages || messages.some(m=>Date.parse(m.timestamp)<cutoff);
    completed=exhausted;
    nextBefore=exhausted?null:String(messages.at(-1).id);
    await store.complete(channelKey,nonce,{
      nextBefore,upperId:current.resume_upper_id||messages[0]?.id||null,cycleComplete:completed,pageMessages:inside.length,
      sourceAttachments:attempted,newProofs:saved,priorProofs:previous
    });
    return {status:'source-captured',channel:channelKey,cycleComplete:completed,
      sourceMessages:inside.length,attachmentsAccounted:attempted,newOriginalProofs:saved,
      existingOriginalProofs:previous,nextPagePending:!completed,publication:'not-attempted'};
  }catch(err){
    await store.release(channelKey,nonce,safeError(err));
    throw err;
  }
}
module.exports={scanChannel,isImage,sourceType,safeError};
