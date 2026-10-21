'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {tally,validPlace}=require('../piggy-flash-podiums.js');
const root=path.resolve(__dirname,'..');

function sourceEvents(){
 const window={AVENGERS_PIGGY_FLASH_DATA:{events:[]}};
 for(const file of ['piggy-flash1-data.js','piggy-flash2-data.js','piggy-flash3-data.js',
 'piggy-flash4-data.js','av2-flash-results-2026.js']){
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window},
    {filename:file,timeout:2500});
 }
 return window.AVENGERS_PIGGY_FLASH_DATA.events;
}
function flatten(events){
 return events.flatMap(e=>(e.entries||[]).map(r=>({
   ...r,name:r.name,rank:r.rank,clan:r.clan||e.clan,eventId:e.id,
   eventDate:e.date,setId:e.setId,flash:e.flash
 })));
}
test('source rank is literal 1/2/3; not a clan-only effort re-ranking',()=>{
 const res=tally([
 {eventId:'PF1-x',clan:'AVENGERS',flash:1,name:'First',rank:1},
 {eventId:'PF1-x',clan:'AVENGERS',flash:1,name:'Second',rank:2},
 {eventId:'PF1-x',clan:'AVENGERS',flash:1,name:'Third',rank:3},
 {eventId:'PF1-x',clan:'AVENGERS',flash:1,name:'Fourth',rank:4,lines:999999},
 {eventId:'PF1-x',clan:'AVENGERS',flash:1,name:'Outside',rank:null,lines:1000000}
 ]);
 assert.equal(res.perFlash[0].wins,1);assert.equal(res.perFlash[0].podiums,3);
 assert.equal(res.overall.wins,1);assert.equal(res.overall.podiums,3);
 assert.equal(res.source.missingRank,1);
 assert.ok(!res.members.some(x=>['Outside','Fourth'].includes(x.player)));
 assert.equal(res.members.find(x=>x.player==='Second').secondPlaces,1);
 assert.equal(res.members.find(x=>x.player==='Third').thirdPlaces,1);
});
test('do not count conflicting rank or conflicting same-account placements',()=>{
 const r=tally([
 {eventId:'PF1-x',clan:'AVENGERS',flash:1,name:'A',rank:1},
 {eventId:'PF1-x',clan:'AVENGERS',flash:1,name:'B',rank:1},
 {eventId:'PF1-x',clan:'AVENGERS',flash:1,name:'C',rank:2},
 {eventId:'PF1-x',clan:'AVENGERS',flash:1,name:'D',rank:3},
 {eventId:'PF1-x',clan:'AVENGERS',flash:1,name:'D',rank:2}
 ]);
 assert.equal(r.overall.wins,0);
 assert.equal(r.source.ambiguousRank>=2,true);
 assert.equal(r.overall.podiums,0,'ambiguous placement not silently promoted');
});
test('clan and explicitly distinct lobby cannot be mixed',()=>{
 const base={eventId:'PF2-x',flash:2};
 const r=tally([
 {...base,clan:'AVENGERS',name:'Alex',rank:1},
 {...base,clan:'AV-2',name:'Alex',rank:1},
 {...base,clan:'AVENGERS',name:'Teammate',rank:2},
 {...base,clan:'AVENGERS',name:'DifferentLobby',rank:1,lobbyId:'secondary'}
 ]);
 assert.equal(r.perFlash[1].wins,3);
 assert.equal(r.perFlash[1].podiums,4);
 assert.equal(r.members.filter(x=>x.player==='Alex').length,2);
 assert.equal(r.members.find(x=>x.clan==='AVENGERS'&&x.player==='Alex').wins,1);
 assert.equal(r.members.find(x=>x.clan==='AV-2'&&x.player==='Alex').wins,1);
});
test('four independent flashes and combined totals reconcile using real Sep22 source and Sep23 PF4',()=>{
 const events=sourceEvents();
 const selected=events.filter(e=>e.setId==='2026-09-22-A');
 assert.deepEqual(selected.map(e=>e.flash).slice().sort(),[1,2,3,4]);
 assert.equal(selected.find(e=>e.flash===4).date,'2026-09-23',
   'PF4 is next calendar day but still belongs in Sep22 Flash Set');
 const rows=flatten(selected);
 const av=tally(rows.filter(x=>x.clan==='AVENGERS'));
 assert.deepEqual(av.perFlash.map(x=>x.wins),[1,1,1,1]);
 assert.deepEqual(av.perFlash.map(x=>x.podiums),[3,3,3,2]);
 assert.equal(av.overall.wins,4);
 assert.equal(av.overall.podiums,11);
 assert.deepEqual(av.members.filter(x=>x.wins).map(x=>x.player).sort(),
 ['AV-Abu//npjp','AV-BigPapi','AV-LuckY','AV.Saberkong'].sort());
 const av2=tally(rows.filter(x=>x.clan==='AV-2'));
 assert.deepEqual(av2.perFlash.map(x=>x.wins),[1,1,0,0]);
 assert.equal(av2.overall.wins,2);
 assert.equal(av2.overall.podiums,4);
 assert.equal(tally(rows).overall.wins,6);
 assert.equal(tally(rows).overall.podiums,15);
 // With only PF1 selected, the PF2–PF4 podium columns remain zero.
 const pf1=tally(rows.filter(x=>x.flash===1));
 assert.deepEqual(pf1.perFlash.map(x=>x.wins),[2,0,0,0]);
 assert.equal(pf1.overall.podiums,pf1.perFlash[0].podiums);
});
test('zero/decimal/missing rank and unknown clan are not counted',()=>{
 assert.equal(validPlace(null),null);assert.equal(validPlace(''),null);assert.equal(validPlace(0),null);
 assert.equal(validPlace(-2),null);assert.equal(validPlace(1.5),null);
 const a=tally([{eventId:'PF4-a',flash:4,clan:'SAC',name:'bad',rank:1},
 {eventId:'PF4-a',flash:4,clan:'AVENGERS',name:'unknown',rank:undefined}]);
 assert.equal(a.overall.podiums,0);assert.equal(a.source.invalidScope,1);assert.equal(a.source.missingRank,1);
});
