'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./create-site-release.cjs');
const {verifyPolicy}=require('./ingestion-source-holds.cjs');
const policy=require('../data/ingestion-result-holds.json');
test('leader-approved AV-2 Oct18 source release is documented and the 69 final rows exist',()=>{
 const releases=policy.releases||[];
 assert.ok(releases.some(x=>x.eventId==='piggy|2026-10-18'&&x.clan==='AV-2'&&x.status==='released'));
 assert.equal(verifyPolicy().filter(x=>x.eventId==='piggy|2026-10-18'&&x.clan==='AV-2').length,0);
 const e=create().projection.events.find(x=>x.id==='piggy|2026-10-18');
 assert.ok(e);assert.equal(e.status,'final');
 assert.equal(e.rows.filter(x=>x.clan==='AVENGERS').length,50);
 assert.equal(e.rows.filter(x=>x.clan==='AV-2').length,19);
});
test('unapproved or stale future event corrections remain protected',()=>{
 const accepted=require('../data/approved-event-updates.json').updates;
 const updates=accepted.filter(u=>u.event.id==='piggy|2026-10-18');
 assert.deepEqual(updates.map(u=>u.expectedRevision),[0,1]);
 assert.ok(updates.every(u=>u.approved===true));
});
