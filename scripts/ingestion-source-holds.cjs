'use strict';
// Keep explicit leader-held event/clan results out of the canonical ledger.
// A source-only sample, a manually flipped approved:true or same-day
// AVENGERS Piggy correction must never inadvertently release AV-2 results.
const {stable}=require('./event-projection-core.cjs');
const policy=require('../data/ingestion-result-holds.json');
function verifyPolicy(){
 if(policy.schemaVersion!==1||!Array.isArray(policy.holds))throw Error('Invalid ingestion hold policy');
 const keys=new Set();
 for(const h of policy.holds){
  if(typeof h.eventId!=='string'||!['AVENGERS','AV-2'].includes(h.clan)||h.status!=='held'||
     typeof h.reason!=='string'||!h.reason.trim())
   throw Error('Invalid leader source hold');
  const k=h.eventId+'|'+h.clan;
  if(keys.has(k))throw Error('Duplicate leader source hold: '+k);
  keys.add(k);
 }
 return policy.holds;
}
function assertNotHeld(old,incoming){
 for(const hold of verifyPolicy()){
  if(incoming.id!==hold.eventId)continue;
  const previous=old?.status==='revoked'?[]:(old?.rows||[]).filter(x=>x.clan===hold.clan);
  const proposed=incoming.status==='revoked'?[]:(incoming.rows||[]).filter(x=>x.clan===hold.clan);
  const sort=rows=>rows.map(x=>({player:x.player,sourceIdentity:x.sourceIdentity??null,
    clan:x.clan,score:x.score,sparks:x.sparks,stars:x.stars,metadata:x.metadata??null}))
    .sort((a,b)=>stable(a).localeCompare(stable(b)));
  if(stable(sort(previous))!==stable(sort(proposed)))
   throw Error('Leader-held results must not be inserted, corrected or revoked: '+hold.eventId+
      ' / '+hold.clan+'. '+hold.reason);
 }
}
module.exports={assertNotHeld,verifyPolicy};
