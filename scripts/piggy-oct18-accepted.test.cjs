'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('./create-site-release.cjs');
const updates=require('../data/approved-event-updates.json').updates;
test('October 18 AVENGERS-only Piggy approved source remains complete, distinct and AV-2 held',()=>{
  const matches=updates.filter(x=>x.event?.id==='piggy|2026-10-18');
  assert.equal(matches.length,1,'No duplicate or partial duplicate import');
  const u=matches[0],event=u.event;
  assert.equal(u.approved,true);
  assert.equal(event.status,'partial','AV-2 held; overall event cannot be marked complete');
  assert.deepEqual([...new Set(event.rows.map(r=>r.clan))],['AVENGERS']);
  assert.equal(event.rows.length,50);
  assert.equal(event.sources.length,2);
  assert.ok(event.sources.every(s=>/^discord-original-jpeg-sha256:[0-9a-f]{64}$/.test(s)));
  const rows=[...event.rows].sort((a,b)=>a.metadata.rank-b.metadata.rank);
  assert.deepEqual(rows.map(r=>r.metadata.rank),Array.from({length:50},(_,i)=>i+1));
  assert.deepEqual(rows.slice(0,3).map(r=>[r.player,r.score]),[
    ['AV-SiFra',44258],['AV-Chuck',44182],['AV-WolfLegend',43651]
  ]);
  assert.equal(rows.reduce((s,r)=>s+r.score,0),971186);
  assert.equal(rows.reduce((s,r)=>s+r.sparks,0),9701649);
  assert.equal(rows.reduce((s,r)=>s+r.stars,0),97016544);
  for(const [threshold,count] of [[40000,3],[30000,11],[20000,23],[10000,38],[5000,48]]){
    assert.equal(rows.filter(r=>r.score>=threshold).length,count,threshold+'+ recorded places');
  }
  assert.equal(rows.filter(r=>r.metadata.starsDerived).length,29);
  const release=create(),published=release.projection.events.find(e=>e.id==='piggy|2026-10-18');
  assert.ok(published);
  assert.equal(published.rows.filter(r=>r.clan==='AVENGERS').length,50);
  assert.equal(published.rows.filter(r=>r.clan==='AV-2').length,0);
  assert.equal(release.projection.coverage.unassignedRows.length,0);
});
