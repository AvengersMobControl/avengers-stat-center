const {test}=require('node:test'),assert=require('node:assert/strict');
const {efficiency,reconcile}=require('../event-reward-metrics.js');
test('Space matches workbook Sparks / Years * 1e9; lines use their native unit',()=>{
 assert.equal(efficiency(199353,225.8),199353/(225.8e9)*1e9);
 assert.equal(efficiency(1000,500),2);
 assert.equal(efficiency(0,500),0);
 for(const args of [[null,5],[5,null],[5,0],[5,-1],[5,NaN]])assert.equal(efficiency(...args),null);
});
test('derive only missing stars; retain conflicting observed values and audit the delta',()=>{
 assert.deepEqual(reconcile({sparks:415318}),{sparks:415318,stars:4153180,starsDerived:true,ratioDelta:null});
 assert.deepEqual(reconcile({sparks:66451,stars:664207}),{sparks:66451,stars:664207,starsDerived:false,ratioDelta:-303});
 assert.equal(reconcile({}).stars,null);
});
const {summarize}=require('../event-reward-metrics.js');
test('aggregate efficiency weights matched effort and excludes unknown payouts',()=>{
 assert.deepEqual(summarize([{score:10,sparks:100},{score:90,sparks:450},{score:50,sparks:null},{score:null,sparks:500}]),{value:5.5,sparks:550,effort:100,paired:2,missing:2});
 assert.equal(summarize([{lines:25,sparks:0}],'lines').value,0);
});
test('Sept 18 preserves distances, represents lobby 6 rewards as unknown and keeps both clans separate',()=>{
 const r=require('./create-site-release.cjs').create();const e=r.projection.events.find(e=>e.id==='space|2026-09-18');
 assert.equal(e.status,'partial');const missing=e.rows.filter(r=>r.metadata.group===6);
 assert.equal(missing.length,4);assert(missing.every(r=>r.stars===null&&r.sparks===null&&r.score>0));
 assert.equal(e.rows.filter(r=>r.clan==='AVENGERS').reduce((s,r)=>s+(r.sparks||0),0),5703046);
 assert.equal(e.rows.filter(r=>r.clan==='AV-2').reduce((s,r)=>s+(r.sparks||0),0),297435);
 assert.match(r.globals.AVENGERS_DATA.space.historicalIncompleteDates['2026-09-18'],/Lobby 6/);
});

const {record,potTotals}=require('../event-reward-metrics.js');
test('record date belongs to the actual PB, with corrected Oct 2 values never adjusted again',()=>{
 const D=require('./create-site-release.cjs').create().globals.AVENGERS_DATA;
 assert.deepEqual(record(D.space.history['AV-HarryBallsagna'],'yearsB'),{value:549.9,date:'2026-08-30'});
 // Oct 25 2026 Space (473.1B) superseded the earlier Oct 9 PB of 439.3B.
 assert.deepEqual(record(D.space.history['AV-JAMO'],'yearsB'),{value:473.1,date:'2026-10-25'});
 assert.deepEqual(record(D.space.history['AV-JAMO'].filter(r=>r.date<'2026-10-25'),'yearsB'),{value:439.3,date:'2026-10-09'});
 assert.deepEqual(record([{date:'2026-10-02',score:100},{date:'2026-08-30',score:100}]),{value:100,date:'2026-08-30'});
});
test('Oct 2 Space Records display actual distance only for a standing Oct 2 PB',()=>{
 const {spaceRecordDisplay}=require('../event-reward-metrics.js');
 const D=require('./create-site-release.cjs').create().globals.AVENGERS_DATA;
 const cases=D.members.flatMap(member=>{
   const hit=record(D.space.history[member.name]||[],'yearsB');
   return hit?.date==='2026-10-02'?[{member,date:hit.date}]:[];
 });
 assert(cases.length>0,'Oct 2 is still the highest-PB date for at least one member');
 for(const {member,date}of cases){
   const before=member.spacePB;
   const display=spaceRecordDisplay(before,date);
   assert.equal(display.adjusted,true,member.name+' current Oct 2 PB marked');
   assert(Math.abs(display.value-before*2/3)<.000001,member.name+' actual distance');
   assert.equal(member.spacePB,before,member.name+' canonical normalized PB untouched');
 }
 assert.equal(spaceRecordDisplay(334.8,'2026-10-02').adjusted,true);
 assert(Math.abs(spaceRecordDisplay(334.8,'2026-10-02').value-223.2)<.000001);
 assert.deepEqual(spaceRecordDisplay(478.7,'2026-10-02').adjusted,true);
 const prior=record(D.space.history['AV-HarryBallsagna'],'yearsB');
 assert.equal(prior.date,'2026-08-30');
 assert.deepEqual(spaceRecordDisplay(prior.value,prior.date),{value:549.9,adjusted:false});
 assert.deepEqual(spaceRecordDisplay(500,'2026-10-09'),{value:500,adjusted:false});
});
test('partial player coverage does not erase calculable lobby pots; missing lobby rewards still do',()=>{
 const R=require('./create-site-release.cjs').create();const events=R.projection.events;
 const recent=events.find(e=>e.id==='space|2026-10-16');assert.equal(recent.status,'partial');
 for(const clan of ['AVENGERS','AV-2']){
   const pots=potTotals(recent.rows.filter(r=>r.clan===clan));
   assert(pots.potStars>0&&pots.potSparks>0);assert.equal(pots.coveredStarGroups,pots.groups);assert.equal(pots.coveredSparkGroups,pots.groups);
 }
 const missing=potTotals(events.find(e=>e.id==='space|2026-09-18').rows.filter(r=>r.clan==='AVENGERS'));
 assert.equal(missing.groups,6);assert.equal(missing.coveredStarGroups,5);assert.equal(missing.potStars,null);assert.equal(missing.potSparks,null);
});

test('lobby pots: reward / share per lobby, percent shares normalized, ranked across all races',()=>{
 const {lobbyPots}=require('../event-reward-metrics.js');
 const D=require('./create-site-release.cjs').create().globals.AVENGERS_DATA;
 const all=lobbyPots(D.space.events),ranked=all.filter(x=>x.rank).sort((a,b)=>a.rank-b.rank);
 assert(ranked.length>=210);
 assert.equal(ranked[0].date,'2026-10-25');assert.equal(ranked[0].potStars,37505480);
 // Aug 13 2026 stored the 9th-place share as 1 (=1%); shares must still total 100%.
 const aug=all.find(x=>x.date==='2026-08-13'&&x.lobby==='1');
 assert.equal(aug.potStars,11920000);assert(Math.abs(aug.trackedShare-1)<1e-9);
 // A lobby pot is independent of which clan raced in it, and ranks are 1..N by pot.
 ranked.forEach((x,i)=>assert(x.rank<=i+1));
 const synthetic=lobbyPots({'2030-01-01':[{name:'A',clan:'AVENGERS',group:1,share:0.25,stars:250,yearsB:5},{name:'B',clan:'AVENGERS',group:1,share:20,stars:200,yearsB:4},{name:'C',clan:'AV-2',group:2,share:0.25,stars:null,sparks:null,yearsB:1}]});
 assert.equal(synthetic.find(x=>x.lobby==='1').potStars,1000);
 assert.equal(synthetic.find(x=>x.lobby==='2').potStars,null);
});
