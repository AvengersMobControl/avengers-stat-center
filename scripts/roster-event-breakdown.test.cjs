'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.resolve(__dirname,'../roster-event-breakdown.js'),'utf8');
function fixture({aliases={},piggy={},space={},flashes=[],krakenPlayers=[],periodRows=[]}={}){
  const rows=Array.from({length:6},(_,i)=>({kraken:['oct','sept','aug','june','may','april'][i],rows:periodRows[i]||[]}));
  const w={
    AVENGERS_DATA:{aliasMap:aliases,piggy:{events:piggy},space:{events:space}},
    AVENGERS_PIGGY_FLASH_DATA:{events:flashes},
    AVENGERS_KRAKEN_DATA:{players:krakenPlayers,months:[{key:'feb02'},{key:'feb23'},{key:'march'}]},
    AVENGERS_ROSTER_SPARKS_LEDGER:{forMember(){return {flashSparks:0,octKrakenSparks:0,juneKrakenSparks:0};}},
    AVENGERS_CLAN_LEAGUE_REWARDS:{build(){return rows;}}
  };
  vm.runInNewContext(code,{window:w},{timeout:10000});
  return w.AVENGERS_ROSTER_EVENT_BREAKDOWN;
}
test('legacy totals and huge Kraken aggregates cannot inflate event-backed totals',()=>{
  const data=fixture({
    piggy:{'2026-10-01':[{name:'AV-Test',lines:7000,sparks:100,stars:1000}]},
    space:{'2026-10-02':[{name:'AV-Test',yearsB:30,sparks:200,stars:2000}]},
    flashes:[{id:'f1',clan:'AVENGERS',entries:[{name:'AV-Test',lines:100,sparks:300,stars:3000}]}],
    krakenPlayers:[{name:'AV-Test',totalSparks:999999999}],
    periodRows:[[{name:'AV-Test',clan:'AVENGERS',krakenSparks:400,estimatedKraken:0}],
      [],[],[{name:'AV-Test',clan:'AVENGERS',krakenSparks:500,estimatedKraken:500}]]
  }).forMember('AV-Test',123456789);
  assert.equal(data.krakenSparks,900);
  assert.equal(data.eventLoggedSparks,1500);
  assert.equal(data.historicBaseSparks,123456789);
  assert.equal(data.historicalBaseDiscrepancy,123456789-1500);
  assert.equal(data.baseSupplementSparks,0);
  assert.equal(data.krakenJuneReconstructedSparks,500);
  assert.equal(data.krakenOctoberSparks,400);
  assert.equal(data.totalEvents,5);
});
test('duplicate archive entries within one race are counted only once',()=>{
  const data=fixture({
    aliases:{'OldName':'AV-Test'},
    piggy:{'2026-10-01':[
      {name:'OldName',lines:7000,sparks:100,stars:1000},
      {name:'AV-Test',lines:7000,sparks:100,stars:1000}
    ]},
    flashes:[{id:'same',entries:[
      {name:'OldName',lines:50,sparks:23,stars:230},
      {name:'AV-Test',lines:50,sparks:25,stars:250}
    ]}]
  }).forMember('AV-Test',0);
  assert.equal(data.piggySparks,100);
  assert.equal(data.flashSparks,25);
  assert.equal(data.piggyEvents,1);
  assert.equal(data.flashEvents,1);
});
test('early Kraken not guessed from current clan if historical clan is missing',()=>{
  const data=fixture({
    krakenPlayers:[{name:'AV-Test',feb02:100,totalSparks:9999999,status:'Active'}]
  }).forMember('AV-Test',999999);
  assert.equal(data.krakenSparks,0);
  assert.equal(data.eventLoggedSparks,0);
});
test('dated historical AV-2 participation gives correct early Kraken rate',()=>{
  const data=fixture({
    piggy:{'2026-01-30':[{name:'AV-Test',clan:'AV-2',lines:7000,sparks:10}]},
    krakenPlayers:[{name:'AV-Test',feb02:100,totalSparks:9999999,status:'Active'}]
  }).forMember('AV-Test',1000000);
  assert.equal(data.krakenSparks,50000);
  assert.equal(data.eventLoggedSparks,50010);
});
test('current clan never overrides six-league event-time Kraken attribution',()=>{
  const data=fixture({
    periodRows:[
      [{name:'AV-Test',clan:'AV-2',krakenSparks:200,estimatedKraken:0}],
      [],[],
      [{name:'AV-Test',clan:'AVENGERS',krakenSparks:750,estimatedKraken:750}]
    ]
  }).forMember('AV-Test',99999999);
  assert.equal(data.krakenSparks,950);
  assert.equal(data.krakenHistoricalSparks,750);
  assert.equal(data.krakenOctoberSparks,200);
});

test('a September lifetime screenshot cannot swallow October Space earnings',()=>{
 const b=fixture({space:{'2026-09-27':[{name:'AV-Hoops',yearsB:45,sparks:25}],
 '2026-10-16':[{name:'AV-Hoops',yearsB:55,sparks:35}]}});
 assert.equal(b.loggedBefore('AV-Hoops','2026-09-30'),25);
 assert.equal(b.loggedBefore('AV-Hoops','2026-10-17'),60);
 assert.equal(b.forMember('AV-Hoops').eventLoggedSparks,60);
});
