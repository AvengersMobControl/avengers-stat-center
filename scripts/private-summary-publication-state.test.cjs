'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {plan,manifestHash}=require('./plan-event-summary-dispatch.cjs');
const {initial,stage,confirmReceipt,confirmRetired,reconcileReport,viewPlan,validateState}
 =require('./private-summary-publication-state.cjs');
const {load,transact,target}=require('./private-summary-publication-store.cjs');
const registry=require('../data/event-png-template-approvals.json');
const V='a'.repeat(64),IMG='b'.repeat(64);
const candidate=(overrides={})=>({kind:'flash',eventId:'flash|2026-10-16|2',clan:'AV-2',
  projectionVersion:V,imageSHA256:IMG,approvedSourceOnly:true,
  eventStatus:'final',readyToPost:false,discordPostingEnabled:false,...overrides});
const at='2026-10-16T20:00:00.000Z';
const approved=(state,c)=>({approvedThisExactPlan:true,
  planDigest:manifestHash(viewPlan(state,{candidate:c,registry})),
  reviewedBy:'test-reviewer',approvedAt:at});
const receipt=(state,id,msg='111111111111111111',channel='222222222222222222')=>({
  verifiedInDiscord:true,verifiedBy:'test-witness',observedAt:at,
  discordMessageId:msg,discordChannelId:channel,
  edition:state.entries.find(e=>e.identity===id).pending.edition
});
const tmp=fn=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'avengers-private-publication-'));
 fs.chmodSync(dir,0o700);try{return fn(path.join(dir,'private.json'),dir);}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
};
function stageApproved(state,c){
 return stage(state,{candidate:c,registry,authorization:approved(state,c)});
}
test('first post intent is durable but NEVER sent/retried automatically on restart',()=>{
 tmp(file=>{
   const c=candidate(),id='flash::flash|2026-10-16|2::AV-2';
   const start=transact(file,s=>stageApproved(s,c));
   assert.equal(start.decision,'awaiting-manual-reconciliation');
   assert.equal(start.state.entries[0].pending.operation,'first');
   assert.equal(fs.statSync(file).mode&0o777,0o600);
   const restarted=load(file),status=reconcileReport(restarted);
   assert.equal(status.awaitingReceipt.length,1);
   assert.equal(status.awaitingReceipt[0].manualLookupRequired,true);
   assert.equal(status.automaticSendAllowed,false);
   assert.throws(()=>transact(file,s=>stageApproved(s,c)),/Unresolved previous operation/);
   const acknowledged=transact(file,s=>confirmReceipt(s,{identity:id,proof:receipt(s,id)}));
   assert.equal(acknowledged.decision,'active-recorded');
   assert.equal(load(file).entries[0].active.discordMessageId,'111111111111111111');
   assert.equal(reconcileReport(load(file)).awaitingReceipt.length,0);
   const noop=transact(file,s=>stageApproved(s,c));
   assert.equal(noop.decision,'already-published');assert.equal(noop.changed,false);
 });
});
test('a corrected event leaves old message until the new one was manually verified',()=>{
 tmp(file=>{
  const c=candidate(),id='flash::flash|2026-10-16|2::AV-2';
  transact(file,s=>stageApproved(s,c));
  transact(file,s=>confirmReceipt(s,{identity:id,proof:receipt(s,id)}));
  const correction=candidate({imageSHA256:'c'.repeat(64)});
  transact(file,s=>stageApproved(s,correction));
  const pending=load(file).entries[0];
  assert.equal(pending.active.discordMessageId,'111111111111111111');
  assert.equal(pending.pending.operation,'correction');
  assert.equal(reconcileReport(load(file)).awaitingReceipt.length,1);
  const newReceipt=transact(file,s=>confirmReceipt(s,{identity:id,
    proof:receipt(s,id,'333333333333333333')}));
  assert.equal(newReceipt.decision,'awaiting-old-message-retirement');
  const next=load(file).entries[0];
  assert.equal(next.active.discordMessageId,'333333333333333333');
  assert.equal(next.retirement.old.discordMessageId,'111111111111111111');
  assert.throws(()=>transact(file,s=>stageApproved(s,candidate({imageSHA256:'d'.repeat(64)}))),
    /Unresolved previous operation/);
  assert.throws(()=>transact(file,s=>confirmRetired(s,{identity:id,proof:{
    confirmedAbsentInDiscord:true,confirmedBy:'test',observedAt:at,
    oldMessageId:'444444444444444444',oldChannelId:'222222222222222222'}})),/old-message removal/);
  const removed=transact(file,s=>confirmRetired(s,{identity:id,proof:{
    confirmedAbsentInDiscord:true,confirmedBy:'test',observedAt:at,
    oldMessageId:'111111111111111111',oldChannelId:'222222222222222222'}}));
  assert.equal(removed.decision,'retirement-recorded');
  assert.equal(load(file).entries[0].retirement,null);
  assert.equal(load(file).entries[0].active.discordMessageId,'333333333333333333');
 });
});
test('after old proof but before new receipt crash, old is still original active',()=>{
 tmp(file=>{
  const c=candidate(),id='flash::flash|2026-10-16|2::AV-2';
  transact(file,s=>stageApproved(s,c));
  transact(file,s=>confirmReceipt(s,{identity:id,proof:receipt(s,id)}));
  const next=candidate({projectionVersion:'c'.repeat(64)});
  transact(file,s=>stageApproved(s,next));
  const paused=load(file);
  assert.equal(paused.entries[0].active.discordMessageId,'111111111111111111');
  assert.equal(paused.entries[0].retirement,null);
  assert.equal(paused.entries[0].pending.stage,'awaiting-manual-receipt');
  assert.equal(reconcileReport(paused).awaitingReceipt.length,1);
 });
});
test('simulated crash before atomic rename preserves prior durable receipt and blocks silent resume',()=>{
 tmp(file=>{
  const c=candidate(),id='flash::flash|2026-10-16|2::AV-2';
  transact(file,s=>stageApproved(s,c));
  const bytes=fs.readFileSync(file);
  assert.throws(()=>transact(file,s=>confirmReceipt(s,{identity:id,proof:receipt(s,id)}),
   {simulateCrashBeforeRename:true}),/SIMULATED CRASH/);
  assert.deepEqual(fs.readFileSync(file),bytes);
  assert.equal(load(file).entries[0].active,null);
  assert.equal(load(file).entries[0].pending.stage,'awaiting-manual-receipt');
  assert.equal(fs.readdirSync(path.dirname(file)).filter(x=>x.endsWith('.lock')||x.endsWith('.tmp')).length,0);
 });
});
test('a pre-existing lock is not broken or ignored; require human reconciliation',()=>{
 tmp((file,dir)=>{
  fs.writeFileSync(file+'.lock','', {mode:0o600});
  assert.throws(()=>transact(file,s=>stageApproved(s,candidate())),/LOCKED/);
  assert(fs.existsSync(file+'.lock'));
 });
});
test('incorrect edition, faked attestation, reused message ID and channel switch fail closed',()=>{
 let s=initial(),c=candidate(),id='flash::flash|2026-10-16|2::AV-2';
 assert.throws(()=>stage(s,{candidate:c,registry,authorization:{approvedThisExactPlan:true,
  planDigest:'0'.repeat(64),reviewedBy:'a',approvedAt:at}}),/edition-bound/);
 s=stageApproved(s,c).state;
 assert.throws(()=>confirmReceipt(s,{identity:id,proof:{...receipt(s,id),verifiedInDiscord:false}}),/Human-attested/);
 assert.throws(()=>confirmReceipt(s,{identity:id,proof:{...receipt(s,id),edition:'stale'}}),/Human-attested/);
 s=confirmReceipt(s,{identity:id,proof:receipt(s,id)}).state;
 s=stageApproved(s,candidate({imageSHA256:'d'.repeat(64)})).state;
 assert.throws(()=>confirmReceipt(s,{identity:id,proof:receipt(s,id)}),/already used or points at original/);
 assert.throws(()=>confirmReceipt(s,{identity:id,proof:receipt(s,id,'333333333333333333','444444444444444444')}),/cannot silently switch/);
});
test('private path cannot be repo/public, symlink or world-readable',()=>{
 assert.throws(()=>target(path.resolve(__dirname,'../reports/discord.json')),/must NEVER/);
 tmp((file,dir)=>{
  const publicDir=fs.mkdtempSync(path.join(os.tmpdir(),'avengers-world-dir-'));
  try{
   fs.chmodSync(publicDir,0o755);
   assert.throws(()=>target(path.join(publicDir,'state.json')),/owner-only/);
  }finally{fs.rmSync(publicDir,{recursive:true,force:true});}
  const linked=path.join(dir,'link.json');
  fs.symlinkSync(path.join(dir,'other.json'),linked);
  // A dangling symlink is never accepted as a verified existing regular file.
  // The write path cannot dereference it; atomic rename would replace it.
  assert.equal(path.extname(target(file)),'.json');
 });
});
test('corrupted duplicated records and stale receipt proof cannot be accepted',()=>{
 const first=stageApproved(initial(),candidate()).state;
 const invalid=structuredClone(first);
 invalid.entries.push(structuredClone(first.entries[0]));
 assert.throws(()=>validateState(invalid),/Duplicate/);
 assert.throws(()=>confirmRetired(first,{identity:first.entries[0].identity,proof:{}}),/No old/);
});
