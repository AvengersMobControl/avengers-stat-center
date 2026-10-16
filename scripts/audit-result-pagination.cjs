#!/usr/bin/env node
'use strict';
// Read-only audit of metadata from authorized, manually retrieved Discord
// screenshot pages. Never fetches Discord, hashes image previews, interprets
// game results, publishes scores, or exposes signed attachment URLs.
const fs=require('node:fs');
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const ID=/^\d{12,22}$/;
function demand(ok,message){if(!ok)throw Error(message);}
function date(s){return typeof s==='string'&&DAY.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
function earlier(a,b){return BigInt(a)<BigInt(b);}
function audit(input){
  demand(input?.schemaVersion===1,'Expected schemaVersion 1');
  demand(['space','piggy','kraken','av2','piggyFlash1','piggyFlash2','piggyFlash3','piggyFlash4'].includes(input.channelKey),'Unsupported configured results channel');
  demand(date(input.windowStart)&&date(input.windowEnd)&&input.windowStart<=input.windowEnd,'Invalid audited event date range');
  demand(Array.isArray(input.pages)&&input.pages.length>0,'At least one fetched metadata page required');
  const knownAttachments=new Map(),knownMessages=new Map();
  const imageCounts=[],pageReports=[];
  let nextCursor=null,overlapId=null,completed=false,olderBoundary=false;
  for(let i=0;i<input.pages.length;i++){
    const page=input.pages[i],q=page?.request;
    demand(!completed,'Unexpected page after window already covered');
    demand(q&&Number.isInteger(q.maxImages)&&q.maxImages>=1&&q.maxImages<=8,
      'Invalid maxImages (Discord connector maximum is 8)');
    demand(Number.isInteger(q.maxMessages)&&q.maxMessages>=1&&q.maxMessages<=100,
      'Invalid maxMessages (connector maximum is 100)');
    demand(!q.afterMessageId,'Do not mix newest-to-oldest pagination with afterMessageId');
    demand((q.beforeMessageId||null)===nextCursor,'Missing/incorrect paging cursor at page '+(i+1));
    demand(Number.isInteger(page.scannedMessages)&&page.scannedMessages>=0&&page.scannedMessages<=q.maxMessages,
      'Unverified scanned message count');
    demand(Array.isArray(page.candidates),'Missing screenshot candidate metadata');
    const messages=page.candidates,ids=new Set();
    let lastId=null,lastTime=null,attachments=0,uniqueThisPage=0,reposts=0;
    for(const msg of messages){
      demand(msg&&typeof msg==='object'&&typeof msg.messageId==='string'&&ID.test(msg.messageId),
        'Malformed message ID');
      demand(!ids.has(msg.messageId),'Repeated message in one page');
      ids.add(msg.messageId);
      const time=Date.parse(msg.timestamp);
      demand(Number.isFinite(time),'Malformed capture timestamp');
      if(lastId!==null)demand(earlier(msg.messageId,lastId)&&time<=lastTime,
        'Result posts are not in descending Discord order');
      lastId=msg.messageId;lastTime=time;
      demand(Array.isArray(msg.attachments)&&msg.attachments.length>0,'Message has no images');
      const attachmentsInMessage=new Set();
      for(const att of msg.attachments){
        demand(att&&typeof att.id==='string'&&ID.test(att.id),'Missing stable source attachment ID');
        demand(!attachmentsInMessage.has(att.id),'Repeated attachment inside same message');
        attachmentsInMessage.add(att.id);
        const old=knownAttachments.get(att.id);
        if(old){
          demand(old.messageId===msg.messageId,'One attachment ID reused under a different message');
          demand(old.timestamp===msg.timestamp,'One attachment has conflicting timestamps');
          reposts++;
        }else{
          knownAttachments.set(att.id,{messageId:msg.messageId,timestamp:msg.timestamp});
          uniqueThisPage++;
        }
        attachments++;
      }
      const prev=knownMessages.get(msg.messageId);
      if(prev)demand(prev.timestamp===msg.timestamp,'Message timestamp changed between pages');
      else knownMessages.set(msg.messageId,{timestamp:msg.timestamp});
    }
    demand(attachments<=q.maxImages,'Reported images exceed image cap');
    demand(Number.isInteger(page.imagePostsReturned)&&page.imagePostsReturned===messages.length,
      'Incorrect image-post count; do not trust incomplete connector summary');
    demand(attachments===page.imageAttachmentsReturned,'Image count and post attachment totals differ');
    if(overlapId!==null)demand(ids.has(overlapId),
      'Page after eight-image cap did not repeat the boundary post; possible loss');
    const atCap=attachments===q.maxImages;
    const oldEnough=messages.some(m=>m.timestamp.slice(0,10)<input.windowStart);
    const earliest=messages.at(-1);
    const eligible=messages.reduce((n,m)=>n+(m.timestamp.slice(0,10)>=input.windowStart&&
      m.timestamp.slice(0,10)<=input.windowEnd?m.attachments.filter(a=>!a.excluded).length:0),0);
    // At cap, the final message might have had images silently omitted.
    // Repeat that whole message by paging BEFORE the second-oldest message.
    // Without a second-oldest message, no safe cursor can be derived.
    const next=oldEnough?null:atCap
      ?messages.length>=2?messages.at(-2).messageId:null
      :earliest?.messageId||null;
    pageReports.push({page:i+1,scannedMessages:page.scannedMessages,
      returnedPosts:messages.length,returnedImages:attachments,
      newAttachments:uniqueThisPage,overlapAttachments:reposts,
      atImageCap:atCap,oldestPostDate:earliest?.timestamp.slice(0,10)||null,
      dateBoundaryReached:oldEnough});
    imageCounts.push(eligible);
    if(oldEnough){completed=true;olderBoundary=true;nextCursor=null;overlapId=null;}
    else{nextCursor=next;overlapId=atCap&&next!==null?earliest.messageId:null;}
  }
  const eligible=[...knownAttachments.values()].filter(x=>{
    const d=x.timestamp.slice(0,10);return d>=input.windowStart&&d<=input.windowEnd;
  }).length;
  const status=completed?'window-covered':nextCursor?'needs-more-pages':'blocked';
  return {channelKey:input.channelKey,eventWindow:{start:input.windowStart,end:input.windowEnd},
    status,pagesFetched:pageReports.length,uniqueImagesInWindow:eligible,
    uniqueImageAttachments:knownAttachments.size,duplicateImageReturns:pageReports.reduce((n,p)=>n+p.overlapAttachments,0),
    boundaryReached:olderBoundary,pages:pageReports,
    // Cursor is only for the private operator. Do not commit provider IDs.
    nextBeforeMessageId:nextCursor,
    reviewAllowed:status==='window-covered',
    provenanceVerified:false,
    finalScreensReviewed:false,
    newResultsApproved:false,
    limitation:'Pagination proof only. Original image-byte digests and final-vs-progress classification remain separate mandatory gates.'};
}
module.exports={audit};
if(require.main===module){
  try{
    const args=process.argv.slice(2);
    demand(args.length===1,'Usage: node scripts/audit-result-pagination.cjs local-private-metadata.json');
    const res=audit(JSON.parse(fs.readFileSync(args[0],'utf8')));
    console.log(JSON.stringify(res,null,2));
    if(res.status==='blocked')process.exitCode=2;
  }catch(err){console.error(err.message);process.exitCode=1;}
}
