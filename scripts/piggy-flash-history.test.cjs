'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {analyze,rank}=require('../piggy-flash-history.js');
function fixture(){
 const window={AVENGERS_PIGGY_FLASH_DATA:{events:[]}};
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const sources=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).filter(n=>
  /^piggy-flash[1-4]-(data|backfill)/.test(n)||n==='av2-flash-results-2026.js'||/^piggy-flash-2026-/.test(n));
 assert.equal(sources.length,12,'Fixture imports every Flash source script in exact published load order');
 for(const name of sources){
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),{window},{filename:name,timeout:2500});
 }
 return window.AVENGERS_PIGGY_FLASH_DATA.events;
}
test('165 recorded pot headers, excluding one-line nonparticipants from 2708 results and 1510 player-days',()=>{
 const h=analyze(fixture());assert.equal(h.coverage.potsRecorded,165);
 assert.equal(h.coverage.potsMissing,13);
 assert.equal(h.singles.length,2708);
 assert.equal(h.days.length,1510);
 assert.ok(h.pots.every(x=>x.lobby.includes('source header')&&x.approximate===true));
 assert.ok(h.rows.every(x=>x.clan==='AVENGERS'));
});
test('September 22 pot rankings and rake are grounded in existing header and stars',()=>{
 const h=analyze(fixture());
 const sep=h.pots.filter(x=>x.setId==='2026-09-22-A').sort((a,b)=>a.flash-b.flash);
 assert.deepEqual(Array.from(sep,x=>x.flash),[1,2,3,4]);
 assert.deepEqual(Array.from(sep,x=>x.potStars),[2500000,3310000,3090000,2760000]);
 assert.deepEqual(Array.from(sep,x=>x.pfRank),[1,3,1,1]);
 assert.deepEqual(Array.from(sep,x=>x.overallRank),[12,3,5,8]);
 assert.deepEqual(Array.from(sep,x=>x.pfCount),[38,50,40,37]);
 assert.ok(Math.abs(sep[0].rakePercent-(1935828/2500000)*100)<1e-8);
 assert.ok(Math.abs(sep[1].rakePercent-(3093736/3310000)*100)<1e-8);
 assert.ok(Math.abs(sep[2].rakePercent-(2915465/3090000)*100)<1e-8);
 assert.ok(Math.abs(sep[3].rakePercent-(2096636/2760000)*100)<1e-8);
});
test('four Flash event-day historical rankings remain stable, actual day ranks and repeated single performances',()=>{
 const h=analyze(fixture());
 const days=h.days.filter(x=>x.setId==='2026-09-22-A').sort((a,b)=>b.lines-a.lines);
 assert.equal(days[0].player,'AV-ZolikaLoveKira');assert.equal(days[0].lines,9879);
 assert.equal(days[0].allRank,7);assert.equal(days[0].allCount,1510);
 const single=h.singles.filter(x=>x.setId==='2026-09-22-A').sort((a,b)=>b.lines-a.lines);
 assert.equal(single[0].player,'AV-Abu//npjp');assert.equal(single[0].lines,4936);
 assert.equal(single[0].allRank,6);assert.equal(single[0].allCount,2708);
 assert.ok(single.slice(0,10).filter(x=>x.player==='AV-ZolikaLoveKira').length===2,
   'Single race ranking permits the same player twice on one day');
 assert.equal(h.podiums.filter(x=>x.setId==='2026-09-22-A').length,11);
});
test('daily-total PBs use observed Flash Set lines regardless of PF attendance',()=>{
 const h=analyze(fixture());
 const pb=h.pb.filter(x=>x.setId==='2026-09-22-A');
 assert.ok(pb.every(x=>x.firstTracked===true?(x.oldPfBest===null&&x.oldSingleBest===null):true));
 assert.ok(pb.some(x=>x.pfPB&&!x.singlePB),'PF-specific and all-PF PBs are distinct');
 const day=h.dailyComparisons.filter(x=>x.setId==='2026-09-22-A');
 assert.equal(day.filter(x=>x.comparable).length,38);
 assert.equal(day.filter(x=>x.abovePriorAverage).length,28);
 assert.equal(day.filter(x=>x.combinedDayPB).length,9);
 assert.ok(day.some(x=>!x.complete&&x.combinedDayPB),'Partial PF days can set daily PBs');
 assert.ok(day.filter(x=>!x.comparable).every(x=>x.priorPB===null&&!x.combinedDayPB));
 const harry=day.find(x=>x.player==='AV-HarryBallsagna');
 assert.equal(harry.priorPB,12050);
 assert.equal(harry.combinedDayPB,false);
 assert.equal(rank(50,[{n:51},{n:50},{n:50}],x=>x.n),2,'Competition ties');
});
test('one PF beats four PFs for daily PB; first day is not a PB',()=>{
 const entry=(id,date,flash,player,lines)=>({id,date,setId:date+'-A',flash,clan:'AVENGERS',complete:true,
   entries:[{name:player,clan:'AVENGERS',rank:4,lines,stars:10,sparks:1}]});
 const h=analyze([
   entry('a','2026-01-01',1,'AV-Test',10),entry('b','2026-01-01',2,'AV-Test',20),
   entry('c','2026-01-01',3,'AV-Test',30),entry('d','2026-01-01',4,'AV-Test',40),
   entry('e','2026-01-08',1,'AV-Test',125),
   entry('f','2026-01-15',1,'AV-Test',110),
   entry('g','2026-01-15',2,'AV-New',500)
 ]);
 const before=h.dailyComparisons.find(x=>x.player==='AV-Test'&&x.setId==='2026-01-01-A');
 const beat=h.dailyComparisons.find(x=>x.player==='AV-Test'&&x.setId==='2026-01-08-A');
 const later=h.dailyComparisons.find(x=>x.player==='AV-Test'&&x.setId==='2026-01-15-A');
 const newcomer=h.dailyComparisons.find(x=>x.player==='AV-New');
 assert.equal(before.complete,true);assert.equal(before.comparable,false);
 assert.equal(beat.complete,false);assert.equal(beat.priorPB,100);assert.equal(beat.combinedDayPB,true);
 assert.equal(beat.priorRecordedDays,1);assert.equal(beat.abovePriorAverage,true);
 assert.equal(later.priorPB,125);assert.equal(later.combinedDayPB,false);
 assert.equal(newcomer.comparable,false);assert.equal(newcomer.combinedDayPB,false);
});
test('AV-2 rows do not contaminate calculated AVENGERS scores, pot rake, rank or podium',()=>{
 const e=fixture(),before=analyze(e);
 e[0].entries.push({name:'AV2-Fake',clan:'AV-2',rank:1,lines:999999,stars:999999,sparks:1});
 const after=analyze(e);
 assert.equal(after.singles.length,before.singles.length);
 assert.equal(after.days.length,before.days.length);
 assert.equal(after.pots.reduce((a,b)=>a+b.awardedStars,0),before.pots.reduce((a,b)=>a+b.awardedStars,0));
});
