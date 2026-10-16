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
 assert.deepEqual(record(D.space.history['AV-JAMO'],'yearsB'),{value:439.3,date:'2026-10-09'});
 assert.deepEqual(record([{date:'2026-10-02',score:100},{date:'2026-08-30',score:100}]),{value:100,date:'2026-08-30'});
});
test('Oct 2 Space Records display actual distance only for a standing Oct 2 PB',()=>{
 const {spaceRecordDisplay}=require('../event-reward-metrics.js');
 const D=require('./create-site-release.cjs').create().globals.AVENGERS_DATA;
 const cases=[
   ['AV-Pablin',478.7,319.1333333333333],
   ['AV-Chuck',334.8,223.2],
   ['AV-HN',327.8,218.53333333333333],
   ['AV-Megalodon',183.8,122.53333333333333],
   ['AV-23',162,108],
   ['AV-Deviantdan',153.2,102.13333333333334],
   ['AV-SMILINGBANDIT',137,91.33333333333333]
 ];
 for(const [name,pb,expected]of cases){
   const member=D.members.find(m=>m.name.toLowerCase()===name.toLowerCase());
   assert(member, name+' included');
   assert(Math.abs(member.spacePB-pb)<.001,name+' approved normalized PB unchanged');
   const hit=record(D.space.history[member.name]||[],'yearsB');
   assert.equal(hit.date,'2026-10-02',name+' is an Oct 2 standing record');
   const display=spaceRecordDisplay(member.spacePB,hit.date);
   assert.equal(display.adjusted,true);
   assert(Math.abs(display.value-expected)<.001,name+' original game distance recovered');
   assert.equal(member.spacePB,pb,'underlying PB remains unchanged');
 }
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
