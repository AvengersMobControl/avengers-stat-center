'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {activeWindow,local,channelCutoff,scopedKey,chooseNext,
 publicationCoverage}=require('../server/result-intake-window.cjs');
const {scanChannel}=require('../server/result-source-intake.cjs');
const H=3600000;
function ts(x){return Date.parse(x);}
function stamp(t){return new Date(t).toISOString();}
const winterFriday=ts('2026-11-20T12:00:00.000Z');
const summerFriday=ts('2027-07-02T11:00:00.000Z');
const winterSunday=ts('2026-11-22T22:00:00.000Z');
const summerSunday=ts('2027-07-04T21:00:00.000Z');
test('Friday 06:00–07:30 Chicago correctly tracks winter, summer and precise boundaries',()=>{
 const a=activeWindow(winterFriday),b=activeWindow(summerFriday);
 assert.equal(a.id,'friday-2026-11-20');assert.equal(b.id,'friday-2027-07-02');
 assert.equal(a.startMs,winterFriday);assert.equal(b.startMs,summerFriday);
 assert.equal(a.endMs,ts('2026-11-20T13:30:00Z'));
 assert.equal(b.endMs,ts('2027-07-02T12:30:00Z'));
 assert(activeWindow(a.endMs));assert(!activeWindow(a.endMs+60000));
 assert(!activeWindow(a.startMs-60000));
 assert.equal(stamp(a.cutoffs.flash),'2026-11-16T12:00:00.000Z');
 assert.equal(stamp(a.cutoffs.space),'2026-11-18T12:00:00.000Z');
 assert.equal(stamp(a.cutoffs.piggy),'2026-11-18T12:00:00.000Z');
 assert.equal(stamp(b.cutoffs.flash),'2027-06-28T11:00:00.000Z');
 assert.equal(a.channels.slice(0,4).join(','),'piggyFlash1,piggyFlash2,piggyFlash3,piggyFlash4');
 assert.equal(a.primary,'space');assert.equal(a.fallback,'piggy');
});
test('Sunday 16:00–18:30 Chicago tracks winter, summer and Monday UTC spill',()=>{
 const a=activeWindow(winterSunday),b=activeWindow(summerSunday);
 assert.equal(a.id,'sunday-2026-11-22');assert.equal(b.id,'sunday-2027-07-04');
 assert.equal(a.endMs,ts('2026-11-23T00:30:00Z'));
 assert.equal(b.endMs,ts('2027-07-04T23:30:00Z'));
 assert(activeWindow(a.endMs));assert(!activeWindow(a.endMs+60000));
 assert.equal(stamp(a.cutoffs.piggy),'2026-11-20T12:00:00.000Z');
 assert.equal(stamp(a.cutoffs.space),'2026-11-18T12:00:00.000Z');
 assert.deepEqual(a.channels.slice(0,2),['piggy','space']);
});
test('outside the two scheduled windows cannot start a source scan',()=>{
 for(const s of ['2026-11-18T16:00:00Z','2026-11-20T10:55:00Z','2026-11-20T14:00:00Z',
  '2026-11-22T19:00:00Z','2026-11-23T01:00:00Z','2027-07-02T10:55:00Z']){
  assert.equal(activeWindow(ts(s)),null,s);
 }
 const v=JSON.parse(fs.readFileSync('vercel.json','utf8'));
 assert.equal(v.crons.length,3);
 assert(!v.crons.some(x=>x.schedule==='*/5 * * * *'),'no always-on every-5-minute cron');
 assert(v.crons.every(x=>/result-intake-(friday|sunday|monday)/.test(x.path)));
 assert.equal(new Set(v.crons.map(x=>x.path)).size,3,'each UTC cron path distinct');
});
test('complete all four Flash channels before Space fallback and late AV-2 source',()=>{
 const w=activeWindow(winterFriday);
 assert.deepEqual(chooseNext(w,{},2),['piggyFlash1','piggyFlash2']);
 let checkpoints={piggyFlash1:{last_scan_complete:true,updated_at:'2026-11-20T12:01:00Z'},
  piggyFlash2:{last_scan_complete:true,updated_at:'2026-11-20T12:01:00Z'}};
 assert.deepEqual(chooseNext(w,checkpoints,2),['piggyFlash3','piggyFlash4']);
 assert(channelCutoff(w,'av2')<channelCutoff(w,'space'),'late AV-2 posts not truncated at Wednesday');
 assert(scopedKey(w,'piggyFlash1').includes('2026-11-20'));
 const failed={piggyFlash1:{last_scan_complete:false,updated_at:'2026-11-20T12:01:00Z'},piggyFlash2:{last_scan_complete:false,updated_at:'2026-11-20T12:01:00Z'}};
 assert.deepEqual(chooseNext(w,failed,2),['piggyFlash3','piggyFlash4'],
   'source failures must not starve the other Flash channels');
});
function rows(w,list){
 return list.map(([channel,when,hash,index])=>({
  channel_key:channel,message_id:String(1570000000000000000n+BigInt(index)),
  attachment_id:String(1580000000000000000n+BigInt(index)),message_timestamp:when,
  image_count:1,progress_hint:false,status:'verified_bytes',image_sha256:hash
 }));
}
function allDone(w){
 return Object.fromEntries(w.channels.map(k=>[k,{last_scan_complete:true,updated_at:new Date(w.startMs).toISOString()}]));
}
test('publication gate requires all four Flash images and final Space source in live ledger',()=>{
 const w=activeWindow(winterFriday);
 const hashes=['a','b','c','d','e','f'].map(x=>x.repeat(64));
 const source=rows(w,[
  ['piggyFlash1','2026-11-17T17:00:00Z',hashes[0],1],
  ['piggyFlash2','2026-11-18T17:00:00Z',hashes[1],2],
  ['piggyFlash3','2026-11-19T17:00:00Z',hashes[2],3],
  ['piggyFlash4','2026-11-19T18:00:00Z',hashes[3],4],
  ['space','2026-11-20T11:00:00Z',hashes[4],5],
  ['av2','2026-11-19T18:00:00Z',hashes[5],6]
 ]);
 const events=[1,2,3,4].map((i)=>({kind:'flash',id:'flash|2026-11-19|'+i,date:'2026-11-19',
  sources:['reviewed-image-sha256:'+hashes[i-1]]}));
 events.push({kind:'space',id:'space|2026-11-20',date:'2026-11-20',
  sources:['reviewed-image-sha256:'+hashes[4]]});
 const good=publicationCoverage(w,allDone(w),source,events);
 assert.equal(good.websitePublished,true,'partial AV-2 may not block verified AVENGERS');
 assert.equal(good.av2.partial,true);
 assert.equal(good.mainKind,'space');
 assert.equal(good.flashes.filter(x=>x.confirmed).length,4);
 const missed=publicationCoverage(w,allDone(w),source,events.slice(0,3).concat(events.slice(4)));
 assert.equal(missed.websitePublished,false,'missing fourth Flash blocks stop');
 const noScan=allDone(w);delete noScan.piggyFlash2;
 assert.equal(publicationCoverage(w,noScan,source,events).websitePublished,false);
});
test('Sunday can fall back to Space when Piggy final is missing',()=>{
 const w=activeWindow(winterSunday),hash='9'.repeat(64);
 const source=rows(w,[['space','2026-11-22T21:00:00Z',hash,8]]);
 const events=[{id:'space|2026-11-22',kind:'space',date:'2026-11-22',
   sources:['reviewed-image-sha256:'+hash]}];
 const r=publicationCoverage(w,allDone(w),source,events);
 assert.equal(r.websitePublished,true);assert.equal(r.mainKind,'space');
});
test('failed original proof blocks publication even when the final ledger matches other images',()=>{
 const w=activeWindow(winterSunday),hash='8'.repeat(64),s=rows(w,[['piggy','2026-11-22T22:05:00Z',hash,9]]);
 s.push({channel_key:'piggy',message_id:'1570000000000000100',attachment_id:'1580000000000000100',
   message_timestamp:'2026-11-22T22:05:00Z',image_count:1,progress_hint:false,status:'retry',image_sha256:null});
 const e=[{id:'piggy|2026-11-22',kind:'piggy',date:'2026-11-22',sources:['reviewed-image-sha256:'+hash]}];
 const r=publicationCoverage(w,allDone(w),s,e);
 assert.equal(r.websitePublished,false);assert.equal(r.missingOriginals,1);
});
test('cron handler does not connect to Neon or Discord outside the approved local windows',async()=>{
 const handler=require('../api/discord/result-intake.js');
 const savedNow=Date.now, oldSecret=process.env.CRON_SECRET;
 const oldDb=process.env.AVENGERS_RESULTS_DATABASE_URL,oldBot=process.env.DISCORD_BOT_TOKEN;
 try{
  Date.now=()=>ts('2026-11-18T17:10:00Z');
  process.env.CRON_SECRET='test-local-window-secret';
  delete process.env.AVENGERS_RESULTS_DATABASE_URL;
  delete process.env.DISCORD_BOT_TOKEN;
  const res={code:null,data:null,status(n){this.code=n;return this;},
   setHeader(){return this;},json(data){this.data=data;return this;}};
  await handler({method:'GET',headers:{authorization:'Bearer test-local-window-secret'}},res);
  assert.equal(res.code,200);
  assert.equal(res.data.status,'outside-approved-windows');
  assert.equal(res.data.networkActivity,false);
  Date.now=()=>winterFriday;
  const inWindow={...res,code:null,data:null};
  await handler({method:'GET',headers:{authorization:'Bearer test-local-window-secret'}},inWindow);
  assert.equal(inWindow.code,503,'in-window execution checks for properly configured source credentials');
  assert.equal(inWindow.data.error,'private-intake-not-configured');
 }finally{
  Date.now=savedNow;
  if(oldSecret===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=oldSecret;
  if(oldDb===undefined)delete process.env.AVENGERS_RESULTS_DATABASE_URL;else process.env.AVENGERS_RESULTS_DATABASE_URL=oldDb;
  if(oldBot===undefined)delete process.env.DISCORD_BOT_TOKEN;else process.env.DISCORD_BOT_TOKEN=oldBot;
 }
});
test('public publication verification requires immutable versioned ledger and manifest SHA',async()=>{
 const {publicLedger}=require('../api/discord/result-intake.js');
 const sha='a'.repeat(40),version='b'.repeat(64),path='exports/ledger.'+'b'.repeat(16)+'.json';
 const fetchImpl=async u=>({ok:true,json:async()=>
  String(u).includes('release-manifest.json')?{sourceCommit:sha,version,exports:{ledger:path}}:
   {version,data:{events:[]}}});
 const r=await publicLedger(fetchImpl);
 assert.deepEqual({sourceCommit:r.publicCommit,version:r.version,events:r.events.length},
  {sourceCommit:sha,version,events:0});
 const bad=async u=>({ok:true,json:async()=>
  String(u).includes('release-manifest.json')?{sourceCommit:sha,version,exports:{ledger:path}}:
   {version:'f'.repeat(64),data:{events:[]}}});
 await assert.rejects(publicLedger(bad),/version-mismatch/);
});
