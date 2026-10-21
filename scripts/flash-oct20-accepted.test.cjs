'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const source=require('../data/flash-2026-10-20-21-reviewed.json');
const hashes=require('../data/flash-2026-10-20-21-image-proofs.json');
const accepted=require('../data/approved-event-updates.json').updates;
const {create}=require('./create-site-release.cjs');
const {analyze}=require('../piggy-flash-history.js');
const {canonical}=require('./event-projection-core.cjs');

test('Oct 20-21 original 105-row transcription preserves evidence; latest commissioner exclusions apply to import',()=>{
  const aliases=create().globals.AVENGERS_DATA.aliasMap;
  assert.equal(source.events.flatMap(e=>e.rows).length,105);
  assert.deepEqual(source.events.map(e=>e.rows.length),[25,28,28,24]);
  assert.equal(Object.keys(hashes.images).length,24);
  for(const e of source.events){
    const eventId=`flash|${e.date}|${e.flash}`;
    const updates=accepted.filter(x=>x.event.id===eventId);
    assert.equal(updates.length,1,'Single import, no duplicate '+eventId);
    const one=updates[0],rows=one.event.rows;
    assert.equal(one.approved,true);
    assert.equal(one.expectedRevision,0);
    assert.equal(one.event.status,'partial','Unseen rows must not be inferred complete');
    assert.equal(one.event.metadata.setId,'2026-10-20-A');
    assert.equal(one.event.metadata.potStars,e.mainPotStars);
    assert.equal(rows.length,e.rows.filter(r=>r[2]!==1&&!/tavito/i.test(r[1])).length);
    for(const [rank,name,lines,stars,sparks,lobby,index] of e.rows){
      const displayName=canonical(name,aliases);
      const actual=rows.find(r=>r.player===displayName);
      if(lines===1||/tavito/i.test(name)){assert.equal(actual,undefined,'Excluded at commissioner direction: '+name);continue;}
      assert(actual,name+' persisted and resolved');
      assert.deepEqual([actual.metadata.rank,actual.player,actual.score,actual.stars,actual.sparks,actual.metadata.lobby],
        [rank,displayName,lines,stars,sparks,lobby],name+' exact screenshot values');
      assert(one.event.sources.includes('reviewed-image-sha256:'+hashes.images[`pf${e.flash}_${index}`].sha256));
      assert.equal(actual.clan,'AVENGERS');
    }
  }
});
test('Oct 20-21 normal flashes update site history, pots, member rewards and day totals without altering frozen baseline',()=>{
  const site=create(),flashes=site.globals.AVENGERS_PIGGY_FLASH_DATA.events;
  const newEvents=flashes.filter(x=>x.setId==='2026-10-20-A');
  assert.deepEqual(newEvents.map(x=>x.flash),[1,2,3,4]);
  assert.deepEqual(newEvents.map(x=>x.entries.length),[22,28,24,21]);
  assert(newEvents.some(x=>x.entries.some(r=>r.sparks>0)),'Normal Flash set awards Sparks');
  const hist=analyze(flashes);
  const pot=hist.pots.filter(x=>x.setId==='2026-10-20-A');
  assert.deepEqual(pot.map(x=>x.potStars),[2710000,3890000,2910000,1470000]);
  const day=hist.days.filter(x=>x.setId==='2026-10-20-A');
  assert(day.length>=28,'Combined Flash Set day totals available');
  assert.equal(hist.singles.filter(x=>x.setId==='2026-10-20-A').length,95);
  const e=site.projection.events.filter(e=>e.id.startsWith('flash|2026-10-20|')||e.id==='flash|2026-10-21|4');
  assert.equal(e.length,4);assert.equal(e.flatMap(x=>x.rows).length,95);
  assert.equal(e.flatMap(x=>x.rows).filter(r=>r.sparks===null).length,0);
  assert(e.flatMap(x=>x.rows).every(r=>r.score!==1&&!/tavito/i.test(r.player)));
  assert.equal(site.projection.people.find(p=>p.name==='AV-Timmy').status,'Active');
  const frank=site.projection.people.filter(p=>['AV-FrankAbagnale','AV-Addicted'].includes(p.name));
  assert.equal(frank.length,1,'Frank keeps one canonical history');assert.equal(frank[0].status,'Active');
  for(const p of site.projection.people){
    assert.equal(p.totalSparks,p.earned.sparks+p.screenshotGap,'Unlogged Sparks cannot change when earned events are added');
  }
});
