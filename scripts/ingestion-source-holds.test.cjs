'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {apply}=require('./event-projection-core.cjs');
const {create}=require('./create-site-release.cjs');
const {preview,proposedReviewDigest}=require('./stage-event-update.cjs');
const {verifyPolicy}=require('./ingestion-source-holds.cjs');
const accepted=require('../data/approved-event-updates.json').updates;
function currentEvent(){const live=create();const e=live.ledger.events.find(e=>e.id==='piggy|2026-10-18');assert(e,'Oct18 accepted event');return {ledger:live.ledger,event:e};}
const heldRow={player:'AV-Frenchie2',clan:'AV-2',score:10000,sparks:1700,stars:17000,metadata:{rank:2,lobby:'A'}};
test('leader-held AV-2 Oct18 Piggy cannot be inserted even with approved:true or bypassing CLI',()=>{
 const {ledger,event}=currentEvent();
 assert(verifyPolicy().some(x=>x.eventId===event.id&&x.clan==='AV-2'));
 const attempted={...event,rows:[...event.rows,heldRow]};
 assert.throws(()=>apply(ledger,attempted,{approved:true,expectedRevision:event.revision}),
  /Leader-held results must not be inserted/);
 assert.throws(()=>preview(accepted,{approved:false,expectedRevision:0,event:attempted}),
  /Leader-held results|Revision conflict/);
});
test('holding AV-2 result does not silently block AVENGERS Oct18 source corrections',()=>{
 const {ledger,event}=currentEvent();
 assert.equal(event.rows.some(r=>r.clan==='AV-2'),false,'held AV2 data should be absent');
 const amended={...event,rows:event.rows.map((r,i)=>i? r:{...r,score:r.score+1})};
 const result=apply(ledger,amended,{approved:true,expectedRevision:event.revision});
 assert.equal(result.action,'corrected');
 assert.equal(result.ledger.events.find(e=>e.id===event.id).rows.length,event.rows.length);
 assert.equal(result.ledger.events.find(e=>e.id===event.id).rows.filter(r=>r.clan==='AV-2').length,0);
});
test('approval SHA binds exact approved candidate to current projection state and is never permission alone',()=>{
 const entry={approved:false,expectedRevision:0,event:{
  id:'space|2026-10-10',kind:'space',date:'2026-10-10',status:'partial',
  unit:'billion-lightyears',metadata:{coverageNote:'Synthetic fixture only'},sources:['fixture:reviewed-final'],
  rows:[{player:'AV-HarryBallsagna',clan:'AVENGERS',score:123,sparks:10,stars:100}]
 }};
 const digest=proposedReviewDigest(accepted,entry);
 assert.match(digest,/^[a-f0-9]{64}$/);
 assert.equal(digest,proposedReviewDigest(accepted,{...entry,approved:true}));
 assert.notEqual(digest,proposedReviewDigest(accepted,{
  ...entry,event:{...entry.event,rows:entry.event.rows.map(r=>({...r,score:124}))}}));
 const before=fs.readFileSync(path.join(__dirname,'../data/approved-event-updates.json'),'utf8');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'avengers-held-test-'));
 try{
  const file=path.join(dir,'candidate.json');fs.writeFileSync(file,JSON.stringify({...entry,approved:true}));
  for(const args of [[file,'--apply'],[file,'--apply','--approved-review-digest='+'0'.repeat(64)]]){
   const p=spawnSync(process.execPath,[path.join(__dirname,'stage-event-update.cjs'),...args],{encoding:'utf8',timeout:45000});
   assert.notEqual(p.status,0);
   assert.match(p.stderr,/approval-packet digest/);
  }
  assert.equal(fs.readFileSync(path.join(__dirname,'../data/approved-event-updates.json'),'utf8'),before);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
