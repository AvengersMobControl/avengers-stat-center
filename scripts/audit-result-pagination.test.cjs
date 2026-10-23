'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {audit}=require('./audit-result-pagination.cjs');
const id=n=>String(1560000000000000000n+BigInt(n));
const time=day=>day+'T23:00:00.000Z';
const m=(n,day,images)=>({messageId:id(n),timestamp:time(day,n%10),
  attachments:Array.from({length:images},(_,i)=>({id:id(n*20+i+100)}))});
const page=(before,candidates,maxImages=8,maxMessages=100,scannedMessages=100)=>({
 request:{maxImages,maxMessages,...(before?{beforeMessageId:before}:{})},
 scannedMessages,imagePostsReturned:candidates.length,
 imageAttachmentsReturned:candidates.reduce((n,p)=>n+p.attachments.length,0),candidates
});
const input=pages=>({schemaVersion:1,channelKey:'space',windowStart:'2026-10-16',windowEnd:'2026-10-16',pages});
function fixtures(){
  // Mirrors connector's observed 8-image, 8-image, 8-image overlap shape
  // using completely fictitious IDs. Real Discord IDs are not committed.
  const a=[m(900,'2026-10-16',1),m(800,'2026-10-16',2),
    m(700,'2026-10-16',2),m(600,'2026-10-16',1),m(500,'2026-10-16',2)];
  const b=[a[4],m(400,'2026-10-16',1),m(300,'2026-10-16',2),
    m(200,'2026-10-16',2),m(100,'2026-10-16',1)];
  const c=[b[4],m(95,'2026-10-15',1),m(90,'2026-10-15',1),
    m(80,'2026-10-09',2),m(70,'2026-10-09',2),m(60,'2026-10-09',1)];
  return [page(null,a),page(a[3].messageId,b),page(b[3].messageId,c)];
}
test('three capped pulls prove the Oct 16 date window with overlapping post, not eight-image truncation',()=>{
  const pages=fixtures(),r=audit(input(pages));
  assert.equal(r.status,'window-covered');
  assert.equal(r.pagesFetched,3);
  assert.equal(r.boundaryReached,true);
  assert.equal(r.reviewAllowed,true);
  assert.equal(r.uniqueImagesInWindow,14);
  assert.equal(r.uniqueImageAttachments,21);
  assert.equal(r.duplicateImageReturns,3);
  assert.deepEqual(r.pages.map(x=>x.newAttachments),[8,6,7]);
  assert(r.pages.every(x=>x.atImageCap));
  assert.equal(r.nextBeforeMessageId,null);
  assert.equal(r.provenanceVerified,false);
  assert.equal(r.finalScreensReviewed,false);
  assert.equal(r.newResultsApproved,false);
  assert(!JSON.stringify(r).includes('discord.com'));
});
test('one or two capped pages must say needs-more-pages, never complete',()=>{
  const pages=fixtures();
  const first=audit(input(pages.slice(0,1)));
  assert.equal(first.status,'needs-more-pages');
  assert.equal(first.nextBeforeMessageId,pages[0].candidates[3].messageId);
  assert.equal(first.reviewAllowed,false);
  assert.equal(audit(input(pages.slice(0,2))).status,'needs-more-pages');
});
test('invalid cursor, missing overlap and silently omitted page must fail closed',()=>{
  const pages=fixtures();
  const wrong=structuredClone(pages);
  wrong[1].request.beforeMessageId=id(500);
  assert.throws(()=>audit(input(wrong)),/paging cursor/);
  const missing=structuredClone(pages);
  missing[1].candidates.shift();missing[1].imagePostsReturned--;missing[1].imageAttachmentsReturned-=2;
  assert.throws(()=>audit(input(missing)),/did not repeat the boundary post/);
  const skipped=[pages[0],pages[2]];
  assert.throws(()=>audit(input(skipped)),/paging cursor/);
});
test('no source posts at message scan limit cannot prove event-window coverage',()=>{
 const r=audit(input([page(null,[],8,100,100)]));
 assert.equal(r.status,'blocked');assert.equal(r.reviewAllowed,false);
 assert.equal(r.nextBeforeMessageId,null);
});
test('one capped post cannot safely page within the post',()=>{
 const p=page(null,[m(500,'2026-10-16',8)]);
 const r=audit(input([p]));
 assert.equal(r.status,'blocked');assert.equal(r.nextBeforeMessageId,null);
});
test('repeated image IDs preserve distinct total and reject conflicting message ownership',()=>{
 const pages=fixtures(),bad=structuredClone(pages);
 bad[1].candidates[1].attachments[0].id=bad[0].candidates[0].attachments[0].id;
 assert.throws(()=>audit(input(bad)),/reused under a different message/);
});
test('wrong image counts, missing candidate metadata, bad channel and invalid date fail',()=>{
 const p=fixtures();
 const mismatch=structuredClone(p);mismatch[0].imageAttachmentsReturned--;
 assert.throws(()=>audit(input(mismatch)),/Image count/);
 const missing=structuredClone(p);delete missing[0].candidates;
 assert.throws(()=>audit(input(missing)),/candidate metadata/);
 assert.throws(()=>audit({...input(p),channelKey:'guild-roster'}),/Unsupported/);
 assert.throws(()=>audit({...input(p),windowStart:'2026-10-32'}),/date range/);
});
test('do not treat progress images as final or imply original-byte SHA verification',()=>{
 const pages=fixtures(),first=pages.slice(0,1);
 first[0].candidates[0].classification='progress';
 const r=audit(input(first));
 assert.equal(r.status,'needs-more-pages');
 assert.equal(r.finalScreensReviewed,false);
 assert.equal(r.provenanceVerified,false);
 assert.equal(r.newResultsApproved,false);
});
test('no page allowed after oldest relevant boundary has already been observed',()=>{
 const pages=fixtures(),fourth=page(pages[2].candidates.at(-1).messageId,[]);
 assert.throws(()=>audit(input([...pages,fourth])),/Unexpected page after window/);
});

test('MCP image pagination returns the ninth attachment without lifting the eight-image cap',async()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const source=fs.readFileSync(path.join(__dirname,'../api/mcp.js'),'utf8');
 const images=Array.from({length:9},(_,i)=>({id:'fixture-image-'+i,filename:'image-'+i+'.png',content_type:'image/png',url:'https://example.invalid/fixture-'+i}));
 const context={module:{exports:{}},require:n=>n==='../discord-ingest-config.json'?{channels:{piggy:{id:'fixture-channel',eventType:'piggy',rosterScope:'AVENGERS'}}}:require(n),
   process:{env:{DISCORD_BOT_TOKEN:'fixture-only'}},URLSearchParams,Buffer,
   fetch:async()=>({ok:true,json:async()=>[{id:'1560000000000000900',timestamp:'2026-10-23T00:00:00Z',attachments:images}]})};
 vm.runInNewContext(source+'\nimageBlock=async()=>null;module.exports.testPull=pullDiscord;',context);
 const pull=context.module.exports.testPull;
 const first=(await pull({channel_key:'piggy',max_messages:1,max_images:100})).structuredContent;
 assert.equal(first.candidates[0].attachments.length,8);
 assert.equal(first.candidates[0].attachmentCountTotal,9);
 assert.equal(first.pagination.nextImageOffset,8);
 assert.equal(first.pagination.repeatBeforeMessageId,'1560000000000000901');
 const last=(await pull({channel_key:'piggy',max_messages:1,max_images:8,image_offset:8,before_message_id:first.pagination.repeatBeforeMessageId})).structuredContent;
 assert.equal(last.candidates[0].attachments.length,1);
 assert.equal(last.candidates[0].attachments[0].id,'fixture-image-8');
 assert.equal(last.candidates[0].attachmentOffset,8);
 assert.equal(last.pagination.hasMoreImages,false);
 assert.equal(last.pagination.nextImageOffset,null);
 await assert.rejects(()=>pull({channel_key:'piggy',image_offset:-1}),/image_offset/);
 await assert.rejects(()=>pull({channel_key:'piggy',image_offset:0.5}),/image_offset/);
});
