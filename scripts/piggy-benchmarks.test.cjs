'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const benchmarks=require('../piggy-benchmarks.js');
const {create}=require('./create-site-release.cjs');
test('inclusive thresholds, distinct players, historical event-time clan and 50K-70K',()=>{
  const events={
    '2026-08-02':[
      {name:'AV-Lin',clan:'AV-2',lines:98000},
      {name:'A',clan:'AVENGERS',lines:70000},
      {name:'A',clan:'AVENGERS',lines:71000},
      {name:'B',clan:'AVENGERS',lines:50000},
      {name:'C',clan:'AVENGERS',lines:40000},
      {name:'N',clan:null,lines:80000}
    ],
    '2026-08-09':[
      {name:'AV-Lin',clan:'AVENGERS',lines:72000},
      {name:'B',clan:'AVENGERS',lines:50000}
    ],
    '2026-07-20':[{name:'Z',clan:'AVENGERS',lines:99999}]
  };
  const x=benchmarks.compute(events,{startDate:'2026-08-01'});
  assert.deepEqual(x.thresholds,[5000,10000,20000,30000,40000,50000,60000,70000]);
  assert.deepEqual(x.weekly.map(r=>[r.date,r.players]),[['2026-08-09',2],['2026-08-02',3]]);
  assert.deepEqual(x.weekly[1].counts,[3,3,3,3,3,2,1,1]);
  assert.deepEqual(x.records.at(-1),{threshold:70000,count:1,firstDate:'2026-08-02',tiedDates:['2026-08-02','2026-08-09']});
});
test('thresholds extend automatically if a future racer exceeds 80K',()=>{
  const x=benchmarks.compute({'2026-10-25':[{name:'A',clan:'AVENGERS',lines:90000}]});
  assert(x.thresholds.includes(80000)&&x.thresholds.includes(90000));
  assert.equal(x.records.at(-1).count,1);
});
test('records and date are derived from approved 2026 historical Piggy event data',()=>{
  const {globals}=create();
  const x=benchmarks.compute(globals.AVENGERS_DATA.piggy.events);
  const actual=x.records.map(r=>[r.threshold,r.count,r.firstDate]);
  assert.deepEqual(actual,[
    [5000,48,'2026-09-20'],
    [10000,39,'2026-09-20'],
    [20000,23,'2026-10-18'],
    [30000,11,'2026-10-18'],
    [40000,6,'2026-09-13'],
    [50000,3,'2026-09-20'],
    [60000,1,'2026-09-13'],
    [70000,1,'2026-09-13']
  ]);
  assert.deepEqual(x.records[0].tiedDates,['2026-09-20','2026-10-18']);
  const sep=x.weekly.find(w=>w.date==='2026-09-13');
  assert.deepEqual(sep.counts.slice(-4),[6,2,1,1]);
  const oct=x.weekly.find(w=>w.date==='2026-10-18');
  assert.equal(oct.players,50);
  assert.deepEqual(oct.counts,[48,38,23,11,3,0,0,0]);
  assert(x.weekly.some(w=>w.date==='2026-01-04'),'All tracked 2026 races must be included');
});
