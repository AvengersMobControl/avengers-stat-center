'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const policy=require('../data/approved-post-kraken-no-spark-sets.json');
const {load}=require('./load-site-data.cjs'),{migrate}=require('./migrate-event-ledger.cjs');
const {create}=require('./create-site-release.cjs'),{exportRelease}=require('./export-event-summary.cjs');
const {buildWeekly}=require('./export-weekly-review.cjs');
test('all nine first post-Kraken Flash sets drop Sparks, retain scores, Stars, source rank and clan',()=>{
  const input=load(),source=input.AVENGERS_PIGGY_FLASH_DATA.events;
  const migration=migrate(input);
  let accepted=0,reduced=0,validated=0;
  for(const approved of policy.postKrakenFlashSets){
    const raw=source.filter(e=>e.setId===approved.setId);
    assert(raw.length>0,'first Flash set source exists: '+approved.setId);
    assert(new Set(raw.map(e=>e.flash)).size===raw.length,'each Flash identity once');
    const release=migration.ledger.events.filter(e=>e.kind==='flash'&&raw.some(x=>'flash|'+x.id===e.id));
    assert.equal(release.length,raw.length,'one canonical flash event per source');
    for(const original of raw){
      const e=release.find(x=>x.id==='flash|'+original.id);
      assert(e,'accepted original id');
      assert.equal(e.date,original.date);assert.equal(e.status,original.complete===false?'partial':'final');
      for(const r of e.rows){
        assert.equal(r.sparks,0,'zero earned Sparks on first after Kraken');
        assert.equal(r.metadata.awardPolicy,'first-post-kraken-no-sparks');
        assert.equal(r.metadata.sourceKrakenDate,approved.krakenDate);
        assert(r.stars===null||(Number.isFinite(r.stars)&&r.stars>=0),'unmodified Stars');
        assert(r.score===null||(Number.isFinite(r.score)&&r.score>=0),'unmodified score');
        assert(['AVENGERS','AV-2'].includes(r.clan),'retain source clan');
        assert(r.metadata.archivalDerivedSparksDiscarded>=0,'reviewable original derived amount');
        reduced+=r.metadata.archivalDerivedSparksDiscarded;
      }
      accepted++;validated+=e.rows.length;
    }
  }
  assert.equal(accepted>20,true,'reviewed cross-year set coverage');
  assert.equal(validated>200,true,'source rows reviewed');
  assert(reduced>1000000,'material erroneous derived Sparks removed from projection');
  const ordinary=migration.ledger.events.filter(e=>e.kind==='flash'&&e.date==='2026-09-15');
  assert(ordinary.length>0&&ordinary.some(e=>e.rows.some(r=>r.sparks>0)),'normal Flash reward unchanged');
});
test('four October flashes are zero for both event-time clans and all derived projections',()=>{
 const r=create(),events=r.projection.events,oct=events.filter(e=>e.kind==='flash'&&e.date>='2026-10-13'&&e.date<='2026-10-14');
 assert.equal(oct.length,4);
 let former=0;
 for(const e of oct)for(const row of e.rows){
  assert.equal(row.sparks,0);
  former+=row.metadata.archivalDerivedSparksDiscarded||0;
  const hist=r.projection.people.find(p=>p.name===row.player)?.history.find(h=>h.eventId===e.id&&h.clan===row.clan);
  assert(hist,'source event reflected in member history');
  assert.equal(hist.sparks,0);
 }
 assert.equal(former,469394,'exact archived October Sparks amount excluded, not transferred to another kind');
 assert.equal(oct.flatMap(e=>e.rows).filter(r=>r.clan==='AVENGERS').length,58);
 assert.equal(oct.flatMap(e=>e.rows).filter(r=>r.clan==='AV-2').length,18);
 for(const e of r.globals.AVENGERS_PIGGY_FLASH_DATA.events.filter(e=>e.date>='2026-10-13')){
  assert(e.entries.every(row=>row.sparks===0),'site Flash tables also zero');
 }
 for(const x of r.projection.people){
   const sums=['piggy','space','flash','kraken'].reduce((s,k)=>s+x.categories[k].sparks,0);
   assert.equal(x.earned.sparks,sums);
   assert.equal(x.totalSparks,x.earned.sparks+x.screenshotGap,'frozen prior-logging balance unchanged');
 }
 const m=buildWeekly(exportRelease(),{week:'2026-10-12',clan:'AVENGERS'});
 assert.equal(m.sourceFlashSparkConflict,false,'week recap does not warn about already corrected Flash Sparks');
 assert.equal(m.totalKnownSparks,m.events.filter(e=>['piggy','space'].includes(e.kind)).reduce((s,e)=>s+e.knownSparks,0));
 assert.equal(m.postKrakenNoSparkFlash,true);
});
