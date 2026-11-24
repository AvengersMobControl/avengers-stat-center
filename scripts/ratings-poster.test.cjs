'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {select,competitionRanks,build}=require('./export-ratings-poster.cjs');
const {root}=require('./load-site-data.cjs');

const DISCORD_BOUND=new Set(JSON.parse(fs.readFileSync(path.join(root,'data/discord-bound-members.json'),'utf8')).names);
const person=(name,status,adj,total=adj)=>({name,status,ratingAdjusted:adj,ratingTotal:total});

test('competition ranking shares ties and skips (1,1,3)',()=>{
  const r=competitionRanks([person('a','Active',10),person('b','Active',10),person('c','Active',9)]);
  assert.deepEqual([...r.values()],[1,1,3]);
});

test('selection: every Active, every Discord-bound AV-2 (no cap), alumni fill to the poster size',()=>{
  const boundNames=[...DISCORD_BOUND].slice(0,3);
  assert.ok(boundNames.length===3,'fixture needs at least 3 real bound names from data/discord-bound-members.json');
  const people=[
    ...Array.from({length:49},(_,i)=>person('act'+i,'Active',9-i/100)),
    ...boundNames.map((name,i)=>person(name,'AV2',8-i/100)),
    person('AV-NotOnDiscord1','AV2',9.5), // unbound but rated higher than every bound name above
    person('AV-NotOnDiscord2','AV2',9.4),
    ...Array.from({length:60},(_,i)=>person('alum'+i,'Inactive',7-i/100))];
  const s=select(people);
  assert.equal(s.left.length,49);
  assert.equal(s.av2.length,3);
  assert.deepEqual(new Set(s.av2.map(p=>p.name)),new Set(boundNames));
  assert.equal(s.alumni.length,100-49-3);
  for(const p of s.av2)assert.ok(DISCORD_BOUND.has(p.name));
});

test('an AV-2 member not in data/discord-bound-members.json never appears in the av2 panel, even rated above everyone else',()=>{
  const people=[
    ...Array.from({length:49},(_,i)=>person('act'+i,'Active',9-i/100)),
    person('AV-NotOnDiscord','AV2',9.9),
    ...Array.from({length:30},(_,i)=>person('alum'+i,'Inactive',7-i/100))];
  const s=select(people);
  assert.ok(!s.av2.some(p=>p.name==='AV-NotOnDiscord'));
  assert.equal(s.av2.length,0);
});

test('live projection always reproduces a self-consistent 100-player layout',()=>{
  // This runs the real selection against the live roster/ratings projection, so the
  // roster's Active/AV2/Inactive split (and therefore the exact avengers/av2/alumni
  // counts and who's #1) legitimately changes week to week as members move -- see
  // the select()-with-synthetic-data tests above for the pinned algorithm checks.
  // What must never change is the shape: exactly 100 shown, the three panels add up,
  // every shown AV-2 member is Discord-bound, and leaders are sorted by rating.
  const out=build('2026-11-23');
  assert.equal(out.poster.counts.total,100);
  assert.equal(out.poster.counts.avengers+out.poster.counts.av2+out.poster.counts.alumni,100);
  assert.ok(out.poster.counts.avengers>0&&out.poster.counts.alumni>=0);
  assert.equal(out.poster.leaders.length,3);
  assert.ok(out.poster.leaders[0].ratingAdjusted>=out.poster.leaders[1].ratingAdjusted);
  assert.ok(out.poster.leaders[1].ratingAdjusted>=out.poster.leaders[2].ratingAdjusted);
  assert.ok(out.changes.firstWeek===true||typeof out.changes.baseline==='string');
  for(const r of out.poster.left)assert.equal(r.posterPanel,'AVENGERS');
  for(const r of out.poster.right)assert.ok(['AV-2','ALUMNI'].includes(r.posterPanel));
  for(const r of out.poster.right)if(r.posterPanel==='AV-2')assert.ok(DISCORD_BOUND.has(r.canonicalName));
});
