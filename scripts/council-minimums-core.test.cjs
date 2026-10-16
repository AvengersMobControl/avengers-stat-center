'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {build,eventClan,threshold,scoreOf,canonical}=require('./council-minimums-core.cjs');
const periods=[{start:'2026-09-07',end:'2026-10-11'},
  {start:'2026-08-03',end:'2026-09-06'}];
const piggy=(name,lines,clan='AVENGERS')=>({name,lines,clan});
const space=(name,yearsB,clan='AVENGERS')=>({name,yearsB,clan});
const evaluate=(opts={})=>build({periods,...opts});
test('minimum policy starts September 11 and is never applied retroactively',()=>{
  const [now,prior]=evaluate({piggyEvents:{
    '2026-09-10':[piggy('A',100)],
    '2026-09-11':[piggy('A',3499)],
    '2026-08-31':[piggy('A',100)]
  }});
  assert.equal(prior.summary.observedBelowMinimum,0);
  assert.equal(prior.members[0].piggy7000,'not_effective');
  assert.equal(now.summary.observedBelowMinimum,1);
  assert.equal(now.observedEvents.find(x=>x.date==='2026-09-10').underMinimum,false);
  assert.equal(now.observedEvents.find(x=>x.date==='2026-09-11').underMinimum,true);
});
test('Piggy 3500 is compliant and near, 3499 is below; 7000 marks league requirement met',()=>{
  const [p]=evaluate({piggyEvents:{
    '2026-09-11':[piggy('A',3499)],
    '2026-09-18':[piggy('A',3500)],
    '2026-09-25':[piggy('A',7000)]
  }});
  const m=p.members[0];
  assert.equal(m.piggyUnder,1);assert.equal(m.piggyNear,1);
  assert.equal(m.piggy7000,'met');
  assert.equal(m.piggyScores.length,3);
  assert.equal(m.piggyAverage,(3499+3500+7000)/3);
});
test('unobserved 7000 never becomes an asserted breach',()=>{
  const [p]=evaluate({piggyEvents:{'2026-09-11':[piggy('A',5000)]}});
  assert.equal(p.members[0].piggy7000,'unverified');
  assert.equal(p.summary.oncePerLeaguePiggyUnverified,1);
});
test('September 27 space threshold is 50B; other space events use 30B',()=>{
  const [p]=evaluate({spaceEvents:{
    '2026-09-27':[space('A',45)],
    '2026-10-02':[space('A',29.9)],
    '2026-10-09':[space('A',30)]
  }});
  assert.equal(threshold('space','2026-09-27'),50);
  assert.equal(threshold('space','2026-10-02'),30);
  assert.equal(p.members[0].spaceUnder,2);
  assert.equal(p.members[0].spaceNear,1);
});
test('near minimum is 0 to 10% above threshold and repeated counts are reproducible',()=>{
  const [p]=evaluate({piggyEvents:{
    '2026-09-11':[piggy('A',3500)],
    '2026-09-18':[piggy('A',3850)],
    '2026-09-25':[piggy('A',3851)]
  }});
  assert.equal(p.members[0].piggyNear,2);
  assert.equal(p.summary.repeatedNearMinimumPlayers,1);
});
test('zero/blank event scores are unknown, never known missed requirements',()=>{
  const [p]=evaluate({piggyEvents:{
    '2026-09-11':[piggy('A',0),piggy('B',null)],
    '2026-09-18':[piggy('C',null),piggy('D',-50)]
  },spaceEvents:{'2026-09-27':[space('X',0)]}});
  assert.equal(p.members.length,0);
  assert.equal(p.summary.observedBelowMinimum,0);
  assert.equal(p.summary.observedParticipantRows,0);
  assert.equal(scoreOf({lines:null},'piggy'),null);
});
test('duplicate archive imports and verified aliases count once per race',()=>{
  const [p]=evaluate({aliasMap:{'old-A':'A'},piggyEvents:{
    '2026-09-11':[piggy('old-A',3400),piggy('A',3300)],
    '2026-09-18':[piggy('A',3450)]
  }});
  assert.equal(p.members.length,1);
  assert.equal(p.members[0].piggyScores.length,2);
  assert.equal(p.members[0].piggyUnder,2);
  assert.equal(p.members[0].piggyScores[0].value,3400);
});
test('clan is recorded at event time, not inferred from current roster',()=>{
  const [p]=evaluate({piggyEvents:{
    '2026-09-11':[piggy('Transfer',4000,'AV-2')],
    '2026-09-18':[piggy('Transfer',4100,'AVENGERS')]
  }});
  assert.equal(p.members.length,2);
  assert.deepEqual(new Set(p.members.map(m=>m.clan)),new Set(['AV-2','AVENGERS']));
});
test('uncertain clan attribution is explicitly flagged for review',()=>{
  const meta=eventClan({name:'A',lines:4000,stars:0},'piggy');
  assert.equal(meta.attribution,'inferred');
  assert.equal(meta.clan,'AV-2');
  const [p]=evaluate({piggyEvents:{'2026-09-11':[{name:'A',lines:3400,stars:0}]}});
  assert.equal(p.members[0].unverifiedClanAttributions,1);
  assert.equal(p.observedEvents[0].underMinimum,true);
});
test('missing race entry is unknown even if member was recorded in an earlier race',()=>{
  const [p]=evaluate({piggyEvents:{
    '2026-09-11':[piggy('A',5000),piggy('B',5000)],
    '2026-09-18':[piggy('B',5000)]
  }});
  const a=p.members.find(m=>m.name==='A');
  assert.equal(a.unknownAbsences,1);
  assert.equal(a.missedObserved,0);
  assert.equal(a.eligibleStart,'unverified');
});
test('Flashes and Kraken are out of scope and no historical attendance is invented',()=>{
  const [p]=evaluate({piggyEvents:{},spaceEvents:{}});
  assert.equal(p.members.length,0);
  assert.equal(p.summary.observedBelowMinimum,0);
  assert.equal(p.summary.oncePerLeaguePiggyUnverified,0);
});
test('trend uses recorded scores only and requires four samples',()=>{
  const [p]=evaluate({piggyEvents:{
    '2026-09-11':[piggy('A',4000),piggy('B',4000)],
    '2026-09-18':[piggy('A',4000)],
    '2026-09-25':[piggy('A',8000)],
    '2026-10-04':[piggy('A',8000)]
  }});
  assert.equal(p.members.find(m=>m.name==='A').trendPiggy,100);
  assert.equal(p.members.find(m=>m.name==='B').trendPiggy,null);
});
test('invalid league window and near-band parameter fail closed',()=>{
  assert.throws(()=>evaluate({periods:[{start:'2026-10-11',end:'2026-09-07'}]}),/Invalid league dates/);
  assert.throws(()=>evaluate({nearFraction:5}),/Invalid near/);
  assert.equal(canonical('Alias',{Alias:'Canonical'}),'Canonical');
});
