'use strict';
// Private, human-attested publication bookkeeper. It NEVER sends, deletes,
// retries, looks up Discord or authorizes itself. Do not bundle this into dist/.
const {plan: reviewPlan,manifestHash,key}=require('./plan-event-summary-dispatch.cjs');
const HEX=/^[a-f0-9]{64}$/i, SNOW=/^\d{15,22}$/;
const nope=(reason)=>{throw Error(reason)};
const initial=()=>({schemaVersion:1,entries:[],history:[]});
function assertIds(record) {
  if(!record||!SNOW.test(record.discordChannelId||'')||!SNOW.test(record.discordMessageId||''))
    nope('Require manually verified Discord channel and message identifiers');
}
function allMessages(state) {
 return state.entries.flatMap(e=>[
   ...(e.active?[e.active]:[]),
   ...(e.retirement?[e.retirement.old]:[])
 ]);
}
function validateState(state){
 if(!state||state.schemaVersion!==1||!Array.isArray(state.entries)||!Array.isArray(state.history))
  nope('Unsupported or corrupt private registry');
 const keys=new Set(),ids=new Set();
 for(const e of state.entries){
  if(!e||typeof e.identity!=='string'||keys.has(e.identity))
    nope('Duplicate or invalid event/clan registry identity');
  keys.add(e.identity);
  if(!e.active&&!e.pending&&!e.retirement)nope('Empty private registry record');
  if(e.pending){
   if(e.pending.stage!=='awaiting-manual-receipt'||typeof e.pending.edition!=='string'||
      !HEX.test(e.pending.imageSHA256||'')||!HEX.test(e.pending.projectionVersion||'')||
      !HEX.test(e.pending.planDigest||'')||
      !['first','correction'].includes(e.pending.operation))
      nope('Invalid unresolved send intent');
   if(e.retirement)nope('Cannot stage while previous message retirement is unresolved');
   if(e.pending.operation==='correction'&&!e.active)nope('Correction without original');
   if(e.pending.operation==='first'&&e.active)nope('First-send intent with existing post');
  }
  if(e.retirement){
   assertIds(e.retirement.old);
   if(!e.active||e.active.discordMessageId===e.retirement.old.discordMessageId)
     nope('Original message must remain separately tracked after replacement confirmation');
   if(typeof e.retirement.newMessageId!=='string'||
      e.retirement.newMessageId!==e.active.discordMessageId)
     nope('Replacement receipt mismatch');
  }
  for(const msg of [e.active,e.retirement?.old].filter(Boolean)){
   assertIds(msg);
   if(![msg.projectionVersion,msg.imageSHA256].every(x=>HEX.test(x||''))||
      typeof msg.templateVersion!=='string'||!msg.templateVersion||
      msg.kind!=='piggy'&&msg.kind!=='flash'&&msg.kind!=='kraken'&&msg.kind!=='space')
     nope('Invalid active/replaced edition');
   if(key(msg)!==e.identity)nope('Message belongs to a different event/clan');
   const ref=msg.discordChannelId+':'+msg.discordMessageId;
   if(ids.has(ref))nope('Discord message is assigned more than once');
   ids.add(ref);
  }
 }
 return state;
}
function viewPlan(state,{candidate,registry}){
 validateState(state);
 const id=key(candidate),entry=state.entries.find(e=>e.identity===id);
 if(entry?.pending)return {decision:'blocked-unresolved-send',identity:id,
     pendingEdition:entry.pending.edition,sendEnabled:false,deleteEnabled:false};
 if(entry?.retirement)return {decision:'blocked-unresolved-retirement',identity:id,
     oldMessageId:entry.retirement.old.discordMessageId,sendEnabled:false,deleteEnabled:false};
 return reviewPlan({candidate,registry,published:entry?.active?[entry.active]:[]});
}
function stage(state,{candidate,registry,authorization}){
 validateState(state);
 const p=viewPlan(state,{candidate,registry});
 if(p.decision.startsWith('blocked'))nope('Unresolved previous operation: reconcile manually before any new send');
 if(p.decision==='already-published')return {state,decision:'already-published',changed:false};
 if(!['needs-first-publication-approval','needs-correction-approval'].includes(p.decision))
  nope('Unsafe summary review decision');
 const digest=manifestHash(p);
 if(!authorization||authorization.approvedThisExactPlan!==true||
    authorization.planDigest!==digest||
    typeof authorization.reviewedBy!=='string'||!authorization.reviewedBy.trim()||
    authorization.reviewedBy.length>120||
    typeof authorization.approvedAt!=='string'||!Number.isFinite(Date.parse(authorization.approvedAt)))
  nope('Explicit edition-bound external human authorization required');
 const id=p.identity,previous=state.entries.find(e=>e.identity===id);
 const next=structuredClone(state),entry=next.entries.find(e=>e.identity===id)||
   {identity:id,active:null,pending:null,retirement:null};
 if(!previous)next.entries.push(entry);
 entry.pending={
  stage:'awaiting-manual-receipt',operation:previous?'correction':'first',
  edition:p.edition,projectionVersion:p.projectionVersion,imageSHA256:p.imageSHA256,
  templateVersion:p.templateVersion,planDigest:digest,
  approvedBy:authorization.reviewedBy.trim(),approvedAt:authorization.approvedAt
 };
 next.history.push({action:'manual-authorization-recorded',identity:id,
  edition:p.edition,at:authorization.approvedAt});
 validateState(next);
 return {state:next,decision:'awaiting-manual-reconciliation',changed:true};
}
function confirmReceipt(state,{identity,proof}){
 validateState(state);
 const next=structuredClone(state),entry=next.entries.find(e=>e.identity===identity);
 if(!entry?.pending||entry.retirement)nope('No pending approved message to confirm');
 if(!proof||proof.verifiedInDiscord!==true||typeof proof.verifiedBy!=='string'||
    !proof.verifiedBy.trim()||proof.verifiedBy.length>120||
    typeof proof.observedAt!=='string'||!Number.isFinite(Date.parse(proof.observedAt))||
    proof.edition!==entry.pending.edition)
   nope('Human-attested posted message and edition proof required');
 assertIds(proof);
 if(entry.active&&entry.active.discordChannelId!==proof.discordChannelId)
   nope('Correction cannot silently switch Discord channel');
 const ref=proof.discordChannelId+':'+proof.discordMessageId;
 if(allMessages(next).some(m=>m.discordChannelId+':'+m.discordMessageId===ref))
   nope('Message receipt already used or points at original');
 // No lookup of a user-supplied ID can independently verify the Discord message;
 // the ledger records the exact human attestation, not an API confirmation.
 const old=entry.active;
 const [kind,eventId,clan]=identity.split('::');
 entry.active={kind,eventId,clan,
  projectionVersion:entry.pending.projectionVersion,
  imageSHA256:entry.pending.imageSHA256,
  templateVersion:entry.pending.templateVersion,
  discordChannelId:proof.discordChannelId,discordMessageId:proof.discordMessageId,
  verifiedBy:proof.verifiedBy.trim(),verifiedAt:proof.observedAt,
  attestation:'human-verified-in-discord'};
 if(old)entry.retirement={old,newMessageId:proof.discordMessageId,
   status:'awaiting-manual-deletion-verification'};
 entry.pending=null;
 next.history.push({action:old?'replacement-receipt-recorded':'first-receipt-recorded',
  identity,edition:proof.edition,at:proof.observedAt});
 validateState(next);
 return {state:next,decision:old?'awaiting-old-message-retirement':'active-recorded',changed:true};
}
function confirmRetired(state,{identity,proof}){
 validateState(state);
 const next=structuredClone(state),entry=next.entries.find(e=>e.identity===identity);
 if(!entry?.retirement||!entry.active)nope('No old message awaiting retirement');
 if(!proof||proof.confirmedAbsentInDiscord!==true||typeof proof.confirmedBy!=='string'||
    !proof.confirmedBy.trim()||proof.confirmedBy.length>120||
    !Number.isFinite(Date.parse(proof.observedAt))||
    proof.oldChannelId!==entry.retirement.old.discordChannelId||
    proof.oldMessageId!==entry.retirement.old.discordMessageId)
   nope('Exact human-attested old-message removal proof required');
 entry.retirement=null;
 next.history.push({action:'old-message-retirement-attested',identity,
   at:proof.observedAt});
 validateState(next);
 return {state:next,decision:'retirement-recorded',changed:true};
}
function reconcileReport(state){
 validateState(state);
 return {schemaVersion:1,active:state.entries.filter(e=>e.active).length,
  awaitingReceipt:state.entries.filter(e=>e.pending).map(e=>({identity:e.identity,
   approvedEdition:e.pending.edition,manualLookupRequired:true})),
  awaitingRetirement:state.entries.filter(e=>e.retirement).map(e=>({identity:e.identity,
   oldChannelId:e.retirement.old.discordChannelId,
   oldMessageId:e.retirement.old.discordMessageId,
   newMessageId:e.retirement.newMessageId,manualDeletionReviewRequired:true})),
  automaticSendAllowed:false,automaticDeleteAllowed:false,
  limitation:'Human attestations are not independent Discord API verification.'};
}
module.exports={initial,validateState,viewPlan,stage,confirmReceipt,confirmRetired,reconcileReport};
