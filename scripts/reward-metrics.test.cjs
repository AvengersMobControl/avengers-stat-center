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
