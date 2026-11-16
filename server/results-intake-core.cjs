'use strict';
// Read-only, resumable Discord source discovery. No event parsing or publication.
const {retrieveOriginal}=require('../scripts/fetch-original-discord-image.cjs');
const TYPES={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
const ID=/^\d{15,22}$/;
const PROGRESS=/(preliminary|still\s+ongoing|in\s+progress|progress\s+results|current\s+standings|not\s+final)/i;
function imageKind(a){
  const ext=String(a.filename||'').split('.').pop().toLowerCase();
  const mime=String(a.content_type||'').split(';')[0].toLowerCase();
  if(!TYPES[ext]&&!mime.startsWith('image/'))return {status:'not_image',mime:mime||null};
  if(!TYPES[ext]||(mime&&TYPES[ext]!==mime))return {status:'unsupported',mime:mime||null};
  return {status:'pending',mime:TYPES[ext]};
}
function sourceMessage(channelKey,m) {
  if(!ID.test(String(m?.id||''))||!Array.isArray(m.attachments)||
     !Number.isFinite(Date.parse(String(m.timestamp||''))))throw Error('invalid_source_message');
  const unique=new Set();
  const attachments=m.attachments.map(a=>{
    if(!ID.test(String(a?.id||''))||unique.has(a.id))throw Error('invalid_source_attachment');
    unique.add(a.id);
    const t=imageKind(a);
    return {channelKey,messageId:String(m.id),attachmentId:String(a.id),
      filename:String(a.filename||'').slice(0,255),contentType:t.mime,
      expectedSize:Number.isSafeInteger(a.size)&&a.size>=0?a.size:null,status:t.status};
  });
  return {channelKey,messageId:String(m.id),timestamp:String(m.timestamp),
    attachmentCountTotal:attachments.length,
    imageCount:attachments.filter(a=>a.status!=='not_image').length,
    progressHint:PROGRESS.test(String(m.content||'')),attachments};
}
async function scanChannel({channelKey,channelId,store,discord,nowMs=Date.now(),maxPages=3,pageSize=100}){
  if(!ID.test(String(channelId))||!channelKey||maxPages<1||pageSize<1||pageSize>100)
    throw Error('invalid_scan_options');
  const state=await store.getCheckpoint(channelKey)||{};
  const last=state.lastCompletedId||null;
  let before=state.resumeBeforeId||null,upper=state.resumeUpperId||null;
  let pages=0,messages=0,attachments=0,complete=false;
  const cutoff=nowMs-8*86400000;
  for(;pages<maxPages;pages++){
    const page=await discord.listMessages(channelId,{before,limit:pageSize});
    if(!Array.isArray(page))throw Error('invalid_source_page');
    if(!upper&&page.length)upper=String(page[0].id);
    const chosen=[];
    let boundary=false;
    for(const m of page) {
      if(last&&BigInt(m.id)<=BigInt(last)){boundary=true;break;}
      if(!last&&Date.parse(m.timestamp)<cutoff){boundary=true;break;}
      chosen.push(sourceMessage(channelKey,m));
    }
    if(chosen.length){
      // Persist ALL attached rows, including non-images and unsupported images.
      await store.savePage(channelKey,chosen);
      before=chosen.at(-1).messageId;
      messages+=chosen.length;
      attachments+=chosen.reduce((n,m)=>n+m.attachmentCountTotal,0);
    }
    if(boundary||page.length<pageSize||!chosen.length){complete=true;pages++;break;}
  }
  await store.putCheckpoint(channelKey,{
    lastCompletedId:complete?(upper||last):last,
    resumeBeforeId:complete?null:before,
    resumeUpperId:complete?null:upper,lastScanComplete:complete});
  return {channelKey,pages,messages,attachments,complete,continuationNeeded:!complete};
}
function errorCode(error){
  const s=String(error?.message||'');
  if(/discord_http_429/.test(s))return 'discord_rate_limited';
  if(/discord_http_40[13]/.test(s))return 'discord_access_denied';
  if(/discord_http_404/.test(s))return 'discord_source_missing';
  if(/attachment|original|image|content.?type|mime/i.test(s))return 'source_proof_failed';
  if(/timeout|abort/i.test(s))return 'source_timeout';
  if(/invalid_/.test(s))return 'invalid_source';
  return 'internal_error';
}
function discordClient(token,http=fetch) {
  if(!token)throw Error('missing_bot_token');
  async function get(url) {
    const r=await http(url,{headers:{Authorization:'Bot '+token},signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw Error('discord_http_'+r.status);
    return r.json();
  }
  return {
    listMessages(channelId,{before,limit=100}){
      const p=new URLSearchParams({limit:String(limit)});
      if(before)p.set('before',before);
      return get('https://discord.com/api/v10/channels/'+channelId+'/messages?'+p);
    },
    getMessage(channelId,messageId){
      return get('https://discord.com/api/v10/channels/'+channelId+'/messages/'+messageId);
    }
  };
}
async function verifyPending({store,discord,limit=8,http=fetch}) {
  const queue=await store.listPending(limit);
  const tally={attempted:0,verified:0,failed:0};
  const byMessage=new Map();
  let cursor=0;
  async function worker(){
    while(cursor<queue.length){
      const item=queue[cursor++];
      tally.attempted++;
      try{
        const key=item.channelId+':'+item.messageId;
        if(!byMessage.has(key))
          byMessage.set(key,discord.getMessage(item.channelId,item.messageId));
        const message=await byMessage.get(key);
        const a=message?.attachments?.find(x=>String(x.id)===item.attachmentId);
        if(!a?.url)throw Error('original_attachment_missing');
        const proof=await retrieveOriginal({url:a.url,channelId:item.channelId,
          attachmentId:item.attachmentId,expectedContentType:item.contentType,
          fetchImpl:http,timeoutMs:12000});
        await store.markVerified(item,proof);
        tally.verified++;
      }catch(error){
        await store.markRetry(item,errorCode(error));
        tally.failed++;
      }
    }
  }
  await Promise.all(Array.from({length:Math.min(4,queue.length)},worker));
  return tally;
}

module.exports={imageKind,sourceMessage,scanChannel,errorCode,discordClient,verifyPending};
