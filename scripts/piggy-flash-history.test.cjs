'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {analyze,rank}=require('../piggy-flash-history.js');
function fixture(){
 const window={AVENGERS_PIGGY_FLASH_DATA:{events:[]}};
 for(const name of ['piggy-flash1-data.js','piggy-flash2-data.js','piggy-flash3-data.js','piggy-flash4-data.js','av2-flash-results-2026.js']){
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),{window},{filename:name,timeout:2500});
 }
 return window.AVENGERS_PIGGY_FLASH_DATA.events;
}
test('35 recorded pot headers, 836 AVENGERS single Flash results and 383 recorded player-day lines',()=>{
 const h=analyze(fixture());assert.equal(h.coverage.potsRecorded,35);
 assert.equal(h.coverage.potsMissing,1);
 assert.equal(h.singles.length,836);
 assert.equal(h.days.length,383);
 assert.ok(h.pots.every(x=>x.lobby.includes('source header')&&x.approximate===true));
 assert.ok(h.rows.every(x=>x.clan==='AVENGERS'));
});
test('September 22 pot rankings and rake are grounded in existing header and stars',()=>{
 const h=analyze(fixture());
 const sep=h.pots.filter(x=>x.setId==='2026-09-22-A').sort((a,b)=>a.flash-b.flash);
 assert.deepEqual(sep.map(x=>x.flash),[1,2,3,4]);
 assert.deepEqual(sep.map(x=>x.potStars),[2500000,3310000,3090000,2760000]);
 assert.deepEqual(sep.map(x=>x.pfRank),[1,3,1,1]);
 assert.deepEqual(sep.map(x=>x.overallRank),[12,3,5,8]);
 assert.deepEqual(sep.map(x=>x.pfCount),[9,8,9,9]);
 assert.ok(Math.abs(sep[0].rakePercent-(1935828/2500000)*100)<1e-8);
 assert.ok(Math.abs(sep[1].rakePercent-(3093736/3310000)*100)<1e-8);
 assert.ok(Math.abs(sep[2].rakePercent-(2915465/3090000)*100)<1e-8);
 assert.ok(Math.abs(sep[3].rakePercent-(2096636/2760000)*100)<1e-8);
});
test('four Flash event-day historical rankings remain stable, actual day ranks and repeated single performances',()=>{
 const h=analyze(fixture());
 const days=h.days.filter(x=>x.setId==='2026-09-22-A').sort((a,b)=>b.lines-a.lines);
 assert.equal(days[0].player,'AV-ZolikaLoveKira');assert.equal(days[0].lines,9880);
 assert.equal(days[0].allRank,6);assert.equal(days[0].allCount,383);
 const single=h.singles.filter(x=>x.setId==='2026-09-22-A').sort((a,b)=>b.lines-a.lines);
 assert.equal(single[0].player,'AV-Abu//npjp');assert.equal(single[0].lines,4936);
 assert.equal(single[0].allRank,5);assert.equal(single[0].allCount,836);
 assert.ok(single.slice(0,10).filter(x=>x.player==='AV-ZolikaLoveKira').length===2,
   'Single race ranking permits the same player twice on one day');
 assert.equal(h.podiums.filter(x=>x.setId==='2026-09-22-A').length,11);
});
test('PB categories stay distinct and partial-days are never compared against complete 4/4 PBs',()=>{
 const h=analyze(fixture());
 const pb=h.pb.filter(x=>x.setId==='2026-09-22-A');
 assert.ok(pb.every(x=>x.firstTracked===true?(x.oldPfBest===null&&x.oldSingleBest===null):true));
 assert.ok(pb.some(x=>x.pfPB&&!x.singlePB),'PF-specific records differ from all-PF record');
 const day=h.dailyComparisons.filter(x=>x.setId==='2026-09-22-A');
 assert.equal(day.filter(x=>x.comparable).length,5);
 assert.equal(day.filter(x=>x.abovePriorAverage).length,5);
 assert.equal(day.filter(x=>x.combinedDayPB).length,3);
 assert.ok(day.filter(x=>!x.complete).every(x=>x.comparable===false));
 assert.equal(rank(50,[{n:51},{n:50},{n:50}],x=>x.n),2,'competition ties retain same rank');
});
test('AV-2 rows do not contaminate calculated AVENGERS scores, pot rake, rank or podium',()=>{
 const e=fixture(),before=analyze(e);
 e[0].entries.push({name:'AV2-Fake',clan:'AV-2',rank:1,lines:999999,stars:999999,sparks:1});
 const after=analyze(e);
 assert.equal(after.singles.length,before.singles.length);
 assert.equal(after.days.length,before.days.length);
 assert.equal(after.pots.reduce((a,b)=>a+b.awardedStars,0),before.pots.reduce((a,b)=>a+b.awardedStars,0));
});
