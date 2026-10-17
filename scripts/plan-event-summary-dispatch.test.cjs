'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {plan,manifestHash}=require('./plan-event-summary-dispatch.cjs');
const registry=require('../data/event-png-template-approvals.json');
const v='a'.repeat(64),img='b'.repeat(64);
const candidate=(overrides={})=>({kind:'piggy',eventId:'piggy|2026-10-11',clan:'AVENGERS',
 projectionVersion:v,imageSHA256:img,approvedSourceOnly:true,readyToPost:false,
 discordPostingEnabled:false,eventStatus:'final',...overrides});
const published=(overrides={})=>({kind:'piggy',eventId:'piggy|2026-10-11',clan:'AVENGERS',
 projectionVersion:v,imageSHA256:img,templateVersion:'piggy-temp-v1-20261016',
 discordMessageId:'111111111111111111',discordChannelId:'222222222222222222',...overrides});
test('first result can only enter explicit human send review',()=>{
 const p=plan({candidate:candidate(),registry});
 assert.equal(p.decision,'needs-first-publication-approval');
 assert.deepEqual(p.actions,[{type:'review-send',requiresExplicitAuthorization:true}]);
 assert.equal(p.approvedToPost,false);assert.equal(p.sendEnabled,false);assert.equal(p.deleteEnabled,false);
 assert.equal(p.templateVersion,'piggy-temp-v1-20261016');
 assert.equal(manifestHash(p),manifestHash(p));
});
test('repeated same event and artwork is a no-op; no repeat sends',()=>{
 const p=plan({candidate:candidate(),registry,published:[published()]});
 assert.equal(p.decision,'already-published');assert.deepEqual(p.actions,[]);
});
test('different event, clan or event kind is not the same publication',()=>{
 const p=plan({candidate:candidate({clan:'AV-2'}),registry,published:[published()]});
 assert.equal(p.decision,'needs-first-publication-approval');
 const flash=plan({candidate:candidate({kind:'flash',eventId:'flash|2026-10-13|2'}),registry,published:[published()]});
 assert.equal(flash.decision,'needs-first-publication-approval');
});
test('corrected projection or changed image requires replacement review, not deleting original',()=>{
 for(const different of [{projectionVersion:'c'.repeat(64)},{imageSHA256:'d'.repeat(64)}]){
  const p=plan({candidate:candidate(different),registry,published:[published()]});
  assert.equal(p.decision,'needs-correction-approval');
  assert.equal(p.actions[0].type,'review-replacement');
  assert.equal(p.actions[0].deletePriorOnlyAfterReplacementVerified,true);
  assert.equal(p.priorMessageId,'111111111111111111');
  assert.equal(p.sendEnabled,false);assert.equal(p.deleteEnabled,false);
 }
});
test('multiple current posts for one event and clan fail closed',()=>{
 assert.throws(()=>plan({candidate:candidate(),registry,published:[published(),
 published({discordMessageId:'333333333333333333'})]}),/Multiple active/);
});
test('unapproved source, partial results, and unsafe registry reject',()=>{
 for(const x of [{approvedSourceOnly:false},{readyToPost:true},{discordPostingEnabled:true},
 {eventStatus:'partial'},{eventStatus:'revoked'},{projectionVersion:'bad'},{imageSHA256:'wrong'}])
 assert.throws(()=>plan({candidate:candidate(x),registry}),/Summary|Only explicitly|Missing/);
 assert.throws(()=>plan({candidate:candidate(),registry:{...registry,automaticDispatchEnabled:true}}),/safety flags/);
 assert.throws(()=>plan({candidate:candidate(),registry,published:[published({discordMessageId:'oops'})]}),/Discord/);
});
test('temporary approvals remain reusable but never activate posting',()=>{
 for(const kind of ['piggy','flash','kraken']){
  for(const clan of ['AVENGERS','AV-2']){
   const p=plan({candidate:candidate({kind,eventId:kind+'|fixture',clan}),registry});
   assert.equal(p.templateVersion,registry.templates[kind].version);
   assert.equal(p.approvedToPost,false);
  }
 }
});
