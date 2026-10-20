'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const I=require('../member-profile-insights.js');
const row=(eventId,date,kind,score,sparks,stars,clan='AVENGERS',extra={})=>({eventId,date,kind,score,sparks,stars,clan,...extra});
test('new 35-day league starts the day after October Kraken; subsequent weeks roll forward',()=>{
 assert.deepEqual(I.periodFor('2026-10-19'),{start:'2026-10-12',end:'2026-11-15',days:35});
 assert.deepEqual(I.periodFor('2026-11-15'),{start:'2026-10-12',end:'2026-11-15',days:35});
 assert.deepEqual(I.periodFor('2026-11-16'),{start:'2026-11-16',end:'2026-12-20',days:35});
 assert.deepEqual(I.periodFor('2026-10-11'),{start:'2026-09-07',end:'2026-10-11',days:35});
});
test('career spans event-time clans; new league only includes its actual accepted event rows',()=>{
 const rows=[
  row('space|2026-10-11','2026-10-11','space',160,5000,50000,'AV-2'),
  row('piggy|2026-10-18','2026-10-18','piggy',25000,2000,20000),
  row('flash|oct18','2026-10-18','flash',2000,0,1000),
  row('piggy|2026-11-16','2026-11-16','piggy',27000,2500,25000),
  row('piggy|2026-10-18','2026-10-18','piggy',25000,2000,20000)
 ];
 const before=JSON.stringify(rows),s=I.summarize(rows,'2026-10-19');
 assert.equal(s.league.events,2);assert.equal(s.league.sparks,2000);assert.equal(s.league.stars,21000);
 assert.equal(s.career.events,3);assert.equal(s.career.sparks,7000);
 assert.deepEqual(s.leagueClans,['AVENGERS']);
 assert.equal(s.kinds.find(k=>k.kind==='space').leagueAverage,null);
 assert.equal(s.kinds.find(k=>k.kind==='space').careerAverage,160);
 assert.equal(JSON.stringify(rows),before);
});
test('missing amounts stay missing, Kraken never has stars, and estimated rewards are disclosed',()=>{
 const s=I.summarize([
  row('kraken|x','2026-10-12','kraken',123,300,null,'AVENGERS',{partial:true,estimatedSparks:true}),
  row('piggy|x','2026-10-13','piggy',100,null,null),
  row('space|x','2026-10-14','space',50,null,3000)
 ],'2026-10-19');
 assert.deepEqual([s.league.events,s.league.sparks,s.league.stars],[3,300,3000]);
 assert.equal(s.league.missingSparks,2);
 assert.equal(s.league.missingStars,1);
 assert.equal(s.league.partial,1);
 assert.equal(s.league.estimatedKraken,300);
});
test('recent trend compares latest three known scores with prior three, not zeros for missing',()=>{
 const scored=[100,100,100,150,150,150].map((n,i)=>row('piggy|'+i,'2026-09-'+String(i+10).padStart(2,'0'),'piggy',n,100,1000));
 const s=I.summarize(scored,'2026-11-16');
 const k=s.kinds.find(x=>x.kind==='piggy');
 assert.equal(k.careerKnownScores,6);
 assert.equal(k.recentVersusPrior,0.5);
 assert.deepEqual(k.consistency,{atOrAbove:3,sampleSize:5});
 assert.equal(s.league.events,0);
 assert.equal(s.league.sparks,0);
});
test('empty histories do not manufacture performance data',()=>{
 const s=I.summarize([],'2026-10-19');
 assert.equal(s.career.events,0);assert.equal(s.league.events,0);
 for(const k of s.kinds){assert.equal(k.careerAverage,null);assert.equal(k.consistency,null);assert.equal(k.recentVersusPrior,null);}
 assert.throws(()=>I.periodFor('2026-02-30'),/real YYYY-MM-DD/);
});
