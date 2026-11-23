'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {select,competitionRanks,build}=require('./export-ratings-poster.cjs');

const person=(name,status,adj,total=adj)=>({name,status,ratingAdjusted:adj,ratingTotal:total});

test('competition ranking shares ties and skips (1,1,3)',()=>{
  const r=competitionRanks([person('a','Active',10),person('b','Active',10),person('c','Active',9)]);
  assert.deepEqual([...r.values()],[1,1,3]);
});

test('selection: every Active, top AV-2 slots, alumni fill to the poster size',()=>{
  const people=[
    ...Array.from({length:49},(_,i)=>person('act'+i,'Active',9-i/100)),
    ...Array.from({length:40},(_,i)=>person('av2_'+i,'AV2',8-i/100)),
    ...Array.from({length:30},(_,i)=>person('alum'+i,'Inactive',7-i/100))];
  const s=select(people);
  assert.equal(s.left.length,49);assert.equal(s.av2.length,32);assert.equal(s.alumni.length,19);
  assert.equal(s.av2.at(-1).name,'av2_31');assert.equal(s.alumni.at(-1).name,'alum18');
});

test('a 50th Active member takes an alumni slot, never an AV-2 slot',()=>{
  const people=[
    ...Array.from({length:50},(_,i)=>person('act'+i,'Active',9)),
    ...Array.from({length:40},(_,i)=>person('av2_'+i,'AV2',8)),
    ...Array.from({length:30},(_,i)=>person('alum'+i,'Inactive',7))];
  const s=select(people);
  assert.equal(s.av2.length,32);assert.equal(s.alumni.length,18);
});

test('live projection always reproduces a self-consistent 100-player layout',()=>{
  // This runs the real selection against the live roster/ratings projection, so the
  // roster's Active/AV2/Inactive split (and therefore the exact avengers/av2/alumni
  // counts and who's #1) legitimately changes week to week as members move -- see
  // the select()-with-synthetic-data tests above for the pinned algorithm checks.
  // What must never change is the shape: exactly 100 shown, the three panels add up,
  // AV-2 never exceeds its 32-slot cap, and leaders are sorted by rating.
  const out=build('2026-11-23');
  assert.equal(out.poster.counts.total,100);
  assert.equal(out.poster.counts.avengers+out.poster.counts.av2+out.poster.counts.alumni,100);
  assert.ok(out.poster.counts.av2<=32);
  assert.ok(out.poster.counts.avengers>0&&out.poster.counts.alumni>=0);
  assert.equal(out.poster.leaders.length,3);
  assert.ok(out.poster.leaders[0].ratingAdjusted>=out.poster.leaders[1].ratingAdjusted);
  assert.ok(out.poster.leaders[1].ratingAdjusted>=out.poster.leaders[2].ratingAdjusted);
  assert.ok(out.changes.firstWeek===true||typeof out.changes.baseline==='string');
  for(const r of out.poster.left)assert.equal(r.posterPanel,'AVENGERS');
  for(const r of out.poster.right)assert.ok(['AV-2','ALUMNI'].includes(r.posterPanel));
});
