'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {plan,manifestHash}=require('./plan-event-summary-dispatch.cjs');
const {stageAuthorizedIntent,recordAuthenticatedReceipt}=require('./private-dispatch-ledger-adapter.cjs');
const registry=require('../data/event-png-template-approvals.json');
const digest='a'.repeat(64);
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from('synthetic png bytes')]);
const imgHash=crypto.createHash('sha256').update(png).digest('hex');
const channel='111111111111111111',posted='222222222222222222';
const now='2026-10-17T21:00:00Z';
function candidate(){return {kind:'space',clan:'AVENGERS',eventId:'space|2026-10-18|mocked',
 projectionVersion:digest,imageSHA256:imgHash,eventStatus:'final',
 approvedSourceOnly:true,readyToPost:false,discordPostingEnabled:false};}
function review(){return plan({candidate:candidate(),registry,published:[]});}
function approval(p){return {approvedThisExactPlan:true,planDigest:manifestHash(p),
 reviewedBy:'council-reviewer',approvedAt:now,authorizedForAutomaticDispatch:false,
 destinationChannelId:channel};}
function preflight(){return {
 connectedRole:'avengers_dispatch_runtime',authenticatedRole:'avengers_dispatch_runtime',
 databaseName:'avengers_private',canLogin:true,isSuperuser:false,canCreateRole:false,
 canCreateDatabase:false,bypassesRls:false,hasInheritedMembership:false,
 canCreateObjects:false,canUsePrivateSchema:true,canCreatePrivateSchemaObjects:false,
 slotRead:true,slotInsert:true,slotUpdate:true,slotDelete:false,
 intentRead:true,intentInsert:true,intentUpdate:true,intentDelete:false,
 receiptRead:true,receiptInsert:true,receiptUpdate:true,receiptDelete:false,
 auditRead:true,auditInsert:true,auditUpdate:false,auditDelete:false,
 safetyRead:true,safetyInsert:false,safetyUpdate:false,safetyDelete:false,
 exactlyOneSafetyRow:true,automaticSendEnabled:false,automaticDeleteEnabled:false,
 publicationEndpointEnabled:false
};}
function mockDb({blocked=false,oldMessage=null,receipt=false,dbError=false}={}){
 const queries=[];let released=0;
 const client={
  async query(sql,params=[]){
   queries.push({sql,params});
   if(dbError&&sql.includes('publication_slots')&&sql.includes('VALUES'))throw Error('postgresql://secret/should-never-escape');
   if(sql.startsWith('SELECT')&&sql.includes('current_user::text'))return {rows:[{...preflight(),...(blocked?{slotDelete:true}:{})}]};
   if(sql.includes('SELECT slot_id FROM'))return {rows:[{slot_id:'7'}]};
   if(sql.includes('SELECT id,row_version')&&sql.includes('publication_slots'))return {rows:[{id:'7',row_version:0,status:'awaiting_manual_receipt'}]};
   if(sql.includes('SELECT id,intent_kind'))return {rows:[{id:'15',intent_kind:oldMessage?'correction':'first',
     intent_status:'awaiting_manual_receipt',destination_channel_id:channel,projection_sha256:digest,
     image_sha256:imgHash,template_version:'space-approved-existing'}]};
   if(sql.includes('AS pending'))return {rows:[{pending:'0',retiring:'0'}]};
   if(sql.includes('AS count'))return {rows:[{count:'0'}]};
   if(sql.includes('message_receipts')&&sql.includes('FROM')&&sql.includes('FOR UPDATE'))
    return {rows:oldMessage?[{id:'2',discord_channel_id:channel,discord_message_id:oldMessage}]:[]};
   if(sql.includes('RETURNING id'))return {rows:[{id:sql.includes('send_intents')?'15':'19'}],rowCount:1};
   if(sql.startsWith('UPDATE'))return {rowCount:1};
   return {rows:[],rowCount:1};
  },release(){released++;}
 };
 return {pool:{connect:async()=>client},queries,get released(){return released}};
}
test('offline schema binds approvals to one reviewed edition and one allowlisted channel',async()=>{
 const p=review(),db=mockDb();
 const result=await stageAuthorizedIntent({pool:db.pool,plan:p,authorization:approval(p),
  destinationChannelId:channel,allowedChannelIds:[channel]});
 assert.equal(result.decision,'awaiting_manual_receipt');
 assert.equal(result.automaticSendAllowed,false);
 assert(db.queries.some(q=>q.sql.includes('FOR UPDATE')));
 assert(db.queries.some(q=>q.sql.includes('BEGIN ISOLATION LEVEL SERIALIZABLE')));
 assert(db.queries.some(q=>q.sql==='COMMIT'));
 assert(!db.queries.some(q=>/DISCORD_BOT_TOKEN|https:\/\/discord/i.test(q.sql)));
 assert.equal(db.released,1);
});
test('missing authorization, digest mismatch, and unallowlisted channel stop before DB connection',async()=>{
 const p=review();
 for(const change of [
  {planDigest:'0'.repeat(64)},
  {approvedThisExactPlan:false},
  {destinationChannelId:posted},
  {authorizedForAutomaticDispatch:true},
  {reviewedBy:''}
 ]){
  const db=mockDb();
  await assert.rejects(stageAuthorizedIntent({pool:db.pool,plan:p,
   authorization:{...approval(p),...change},destinationChannelId:channel,
   allowedChannelIds:[channel]}),/blocked/);
  assert.equal(db.queries.length,0);
 }
 const db=mockDb();
 await assert.rejects(stageAuthorizedIntent({pool:db.pool,plan:p,
  authorization:approval(p),destinationChannelId:channel,allowedChannelIds:[posted]}),/blocked/);
});
test('role escalation blocks the transaction and rolls back without exposing secrets',async()=>{
 const p=review(),db=mockDb({blocked:true});
 await assert.rejects(stageAuthorizedIntent({pool:db.pool,plan:p,authorization:approval(p),
  destinationChannelId:channel,allowedChannelIds:[channel]}),/blocked/);
 assert(db.queries.some(q=>q.sql==='ROLLBACK'));
 assert(!db.queries.some(q=>q.sql.includes('INSERT INTO avengers_dispatch_private.send_intents')));
});
test('database faults rollback and redact raw connection secrets',async()=>{
 const p=review(),db=mockDb({dbError:true});
 let error;
 try{await stageAuthorizedIntent({pool:db.pool,plan:p,authorization:approval(p),
  destinationChannelId:channel,allowedChannelIds:[channel]});}catch(e){error=e;}
 assert(error);
 assert(!error.message.includes('should-never-escape'));
 assert(db.queries.some(q=>q.sql==='ROLLBACK'));
});
test('receipt cannot be recorded from a guessed channel, message or mismatched PNG',async()=>{
 const db=mockDb(),wrong=Buffer.concat([png,Buffer.from('wrong')]);
 await assert.rejects(recordAuthenticatedReceipt({pool:db.pool,intentId:'15',channelId:channel,
  messageId:posted,observedAt:now,verifiedBy:'council',readback:async()=>({
   channelId:channel,messageId:posted,contentType:'image/png',attachmentBytes:wrong
  })}),/blocked/);
 assert(db.queries.some(q=>q.sql==='ROLLBACK'));
 assert(!db.queries.some(q=>q.sql.includes('INSERT INTO avengers_dispatch_private.message_receipts')));
});
test('approved intent only records receipt after original PNG-byte hash matches authenticated readback',async()=>{
 const db=mockDb(),r=await recordAuthenticatedReceipt({pool:db.pool,intentId:'15',
 channelId:channel,messageId:posted,observedAt:now,verifiedBy:'council',
 readback:async()=>({channelId:channel,messageId:posted,contentType:'image/png',attachmentBytes:png})});
 assert.equal(r.decision,'active');
 assert.equal(r.oldMessageRetirementRequired,false);
 assert(db.queries.some(q=>q.sql.includes('authenticated_discord_png_sha256')));
 assert(db.queries.some(q=>q.sql==='COMMIT'));
 assert.equal(db.released,1);
});
test('correction keeps old message pending manual retirement, never deleting',async()=>{
 const db=mockDb({oldMessage:'333333333333333333'});
 const r=await recordAuthenticatedReceipt({pool:db.pool,intentId:'15',channelId:channel,
 messageId:posted,observedAt:now,verifiedBy:'council',
 readback:async()=>({channelId:channel,messageId:posted,contentType:'image/png',attachmentBytes:png})});
 assert.equal(r.decision,'awaiting_old_retirement');
 assert.equal(r.oldMessageRetirementRequired,true);
 assert(db.queries.some(q=>q.sql.includes("receipt_status='awaiting_manual_retirement'")));
 assert(!db.queries.some(q=>/DELETE FROM/i.test(q.sql)));
});
test('module has no outbound transport, environment secrets or HTTP endpoint',()=>{
 const code=fs.readFileSync(__dirname+'/private-dispatch-ledger-adapter.cjs','utf8');
 assert.doesNotMatch(code,/fetch\(|https?:\/\/|require\(['"](?:https?|node:https?|axios|undici)['"]\)|process\.env|createServer|DISCORD_BOT_TOKEN/);
 assert.doesNotMatch(code,/DELETE\s+FROM\s+avengers_dispatch_private/i);
 assert.match(code,/SERIALIZABLE/);
 assert.match(code,/FOR UPDATE/);
});
