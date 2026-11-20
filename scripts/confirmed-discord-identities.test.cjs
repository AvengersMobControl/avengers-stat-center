'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {create:createRelease}=require('./create-site-release.cjs');
// These assertions exercise the historical source fixture.
const create=options=>createRelease({...options,rosterChanges:{revision:0,changes:[]}});
const release=create(),people=release.projection.people,byName=n=>people.find(p=>p.name===n);
test('Leader-confirmed Frenchie(-4) merges into USA, not Frenchie2',()=>{
 assert.equal(byName('AV-Frenchie(-4)'),undefined,'No duplicate retired -4 profile');
 assert.ok(byName('AV-FrenchieUSA'));
 assert.ok(byName('AV-Frenchie2'));
 assert.notEqual(byName('AV-FrenchieUSA'),byName('AV-Frenchie2'));
 assert.equal(release.globals.AVENGERS_DATA.aliasMap['AV-Frenchie(-4)'],'AV-FrenchieUSA');
 assert.equal(release.globals.AVENGERS_DATA.aliasMap['AV-Frenchie2'],undefined);
 const kraken=release.projection.events.find(e=>e.id==='kraken|oct');
 assert.ok(kraken);
 const members=kraken.rows.filter(r=>['AV-FrenchieUSA','AV-Frenchie2'].includes(r.player));
 assert.ok(members.some(x=>x.player==='AV-FrenchieUSA'&&x.clan==='AVENGERS'&&x.score===2558.3),
  'Original AVENGERS historical Frenchie result stays with USA');
 assert.ok(members.some(x=>x.player==='AV-Frenchie2'&&x.clan==='AV-2'&&x.score===36.2),
  'Original October AV-2 distinct account stays with Frenchie2');
});
test('J-Zo resolves to established J and does not make duplicate profile',()=>{
 assert.ok(byName('AV-J'));
 assert.equal(byName('AV-J-Zo'),undefined);
 assert.equal(release.globals.AVENGERS_DATA.aliasMap['AV-J-Zo'],'AV-J');
});
test('JR keeps the unassigned roster status and the verified event-time clan',()=>{
 const jr=byName('AV-$JR.$');
 assert.ok(jr);
 assert.equal(jr.status,'Unassigned');
 const flash=jr.history.find(row=>row.eventId==='flash|2026-11-11|4');
 assert.equal(flash?.clan,'AVENGERS');
 assert.equal(flash?.score,278);
 assert.equal(flash?.sparks,1697);
 const counts=people.reduce((o,p)=>(o[p.status]=(o[p.status]||0)+1,o),{});
 assert.equal(counts.Active,47,'Six leader-confirmed members moved from main to AV-2 on November 20');
 assert.equal(counts.AV2,52,'Six leader-confirmed transfers join AV-2 without losing historical identities');
});
