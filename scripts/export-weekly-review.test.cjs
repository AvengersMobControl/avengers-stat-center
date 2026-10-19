'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {buildWeekly,discordDraft,writeWeekly}=require('./export-weekly-review.cjs');
const {exportRelease}=require('./export-event-summary.cjs');
const version='a'.repeat(64);
const E=(kind,date,id,rows,meta={},status='final')=>({kind,date,id,rows,metadata:meta,status});
const R=(player,score,sparks,clan='AVENGERS')=>({player,clan,score,sparks,stars:sparks===null?null:sparks*10,metadata:{}});
function fake(){
 const events=[
 E('kraken','2026-10-11','kraken|oct',[R('AV-A',100,0)]),
 E('piggy','2026-10-04','piggy|2026-10-04',[R('AV-A',10000,100)]),
 E('space','2026-10-09','space|2026-10-09',[R('AV-A',200,500)]),
 E('flash','2026-10-06','flash|PF1-2026-10-06',[R('AV-A',300,9)],{flash:1}),
 E('flash','2026-10-13','flash|PF1-2026-10-13',[R('AV-A',500,90),R('AV-B',300,70,'AV-2')],{flash:1},'partial'),
 E('flash','2026-10-13','flash|PF2-2026-10-13',[R('AV-A',450,15)],{flash:2},'partial'),
 E('flash','2026-10-13','flash|PF3-2026-10-13',[R('AV-A',400,10)],{flash:3},'partial'),
 E('flash','2026-10-14','flash|PF4-2026-10-14',[R('AV-A',600,25)],{flash:4},'partial'),
 E('space','2026-10-16','space|2026-10-16',[R('AV-A',350,400),R('AV-C',70,120)],{},'partial'),
 E('piggy','2026-10-18','piggy|2026-10-18',[R('AV-A',12000,200),R('AV-New',6000,130)],{},'partial')
 ];
 const people=[
 {name:'AV-A',kinds:{piggy:{pbs:[{eventId:'piggy|2026-10-18',newPB:true,firstRecorded:false,previousPB:10000,improvement:0.2}]},
 space:{pbs:[{eventId:'space|2026-10-16',newPB:true,firstRecorded:false,previousPB:200,improvement:.75}]}}},
 {name:'AV-C',kinds:{space:{pbs:[{eventId:'space|2026-10-16',firstRecorded:true,newPB:false}]}}}
 ];
 return {schemaVersion:1,source:'approved-event-ledger',projection:{version,events,people},
 piggyPlacementPBs:{'piggy|2026-10-18':[{player:'AV-A',previousRank:5,newRank:2,improved:true}]}}
}
test('first flashes after Sunday Kraken have ZERO weekly sparks even with stale ledger values',()=>{
 const m=buildWeekly(fake(),{week:'2026-10-12'});
 assert.equal(m.eventCount,6);assert.equal(m.expectedEventCount,6);
 assert.equal(m.postKrakenNoSparkFlash,true);
 assert.equal(m.totalKnownSparks,400+120+200+130,'only Space and Piggy earned sparks');
 assert(m.sourceFlashSparkConflict,'review required for source flash spark mismatch');
 assert.equal(m.events.filter(e=>e.kind==='flash').every(e=>e.knownSparks===0&&e.noSparkAward),true);
 assert.equal(m.events.find(e=>e.kind==='space').aboveAverage,1);
 assert.equal(m.events.find(e=>e.kind==='space').benchmarkEligible,1);
 assert.equal(m.events.find(e=>e.kind==='piggy').aboveAverage,1);
 assert.equal(m.newMilestones,1,'one new 250B Space explorer badge for AV-A');
 assert.equal(m.scorePBs,2);assert.equal(m.piggyFinishRankImproved,1);
 assert.equal(m.top5Sparks[0].player,'AV-A');
 assert(m.discordDraft.includes('NO SPARKS'));
 assert(m.discordDraft.includes('DRAFT ONLY'));assert.equal(m.readyToPost,false);
});
test('weekly packet cannot invent missing events, members, payouts or official averages',()=>{
 const r=fake();r.projection.events=r.projection.events.filter(e=>e.id!=='flash|PF3-2026-10-13');
 r.projection.events.find(e=>e.id==='space|2026-10-16').rows[1].sparks=null;
 const m=buildWeekly(r,{week:'2026-10-12'});
 assert.equal(m.eventCount,5);
 assert(m.events.some(e=>e.flash===3&&e.missing));
 assert.equal(m.hasUnknownSparkPayouts,true);
 assert.equal(m.totalKnownSparks,400+200+130);
 assert(m.warnings.some(w=>w.includes('Unverified Spark payout')));
 assert.equal(m.events.find(e=>e.kind==='space').unbenchmarked,1);
 assert(!m.discordPostingEnabled);
});
test('no-Kraken regular flash rewards remain counted; AV-2 stays independent',()=>{
 const r=fake();r.projection.events=r.projection.events.filter(e=>e.kind!=='kraken');
 const m=buildWeekly(r,{week:'2026-10-12'});
 assert.equal(m.postKrakenNoSparkFlash,false);
 assert.equal(m.sourceFlashSparkConflict,false);
 assert.equal(m.totalKnownSparks,850+90+15+10+25);
 const a=buildWeekly(fake(),{week:'2026-10-12',clan:'AV-2'});
 assert.equal(a.top5Sparks.length,1);
 assert.equal(a.top5Sparks[0].player,'AV-B');
 assert.equal(a.totalKnownSparks,0,'post-Kraken AV-2 flash also earns no Sparks');
 assert.equal(a.eventCount,1);
 assert(a.warnings.length>0,'missing AV-2 events reported');
});
test('reject unapproved sources, invalid Monday, duplicate PF numbers, and no invented auto-send',()=>{
 const r=fake();assert.throws(()=>buildWeekly({...r,source:'draft-screenshot-review'}),/Accepted/);
 assert.throws(()=>buildWeekly(r,{week:'2026-10-13'}),/Monday/);
 r.projection.events.push(E('flash','2026-10-15','flash|PF1-other',[R('AV-A',500,20)],{flash:1}));
 assert.throws(()=>buildWeekly(r,{week:'2026-10-12'}),/Duplicate PF1/);
});
test('October 12-18 real projection includes six slots and known 2026 final-result provenance',()=>{
 const r=exportRelease(),m=buildWeekly(r,{week:'2026-10-12',clan:'AVENGERS'});
 assert.equal(m.projectionVersion,r.projection.version);
 assert.equal(m.eventCount,6);
 assert.equal(m.events.find(x=>x.kind==='piggy').participants,50);
 assert.equal(m.events.find(x=>x.kind==='space').participants,44);
 assert(m.events.filter(x=>x.kind==='flash').length===4);
 assert(m.events.filter(x=>x.kind==='flash').every(x=>x.noSparkAward),'first PF after Kraken have no Sparks');
 assert.equal(m.totalKnownSparks,m.events.filter(x=>['space','piggy'].includes(x.kind)).reduce((s,x)=>s+x.knownSparks,0));
 assert.equal(m.top5Sparks.length,5);
 assert(m.warnings.some(x=>x.startsWith('SOURCE RECONCILIATION')),'legacy flash spark discrepancy explicitly review-blocked');
 assert.equal(m.readyToPost,false);assert.equal(m.discordChannelVerified,false);
 const again=buildWeekly(r,{week:'2026-10-12',clan:'AVENGERS'});
 assert.equal(again.reviewDigest,m.reviewDigest);
 assert.equal(again.discordDraft,m.discordDraft);
});
