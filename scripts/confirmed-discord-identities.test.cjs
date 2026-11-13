'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('./create-site-release.cjs');
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
test('JR is included without invented game results or false clan attribution',()=>{
 const jr=byName('AV-$JR.$');
 assert.ok(jr);
 assert.equal(jr.status,'Unassigned');
 assert.equal(jr.history.length,0);
 assert.equal(jr.earned.sparks,0);
 const counts=people.reduce((o,p)=>(o[p.status]=(o[p.status]||0)+1,o),{});
 assert.equal(counts.Active,49,'Do not silently replace a main clan member');
 assert.equal(counts.AV2,51,'Do not silently put JR in AV-2');
});
