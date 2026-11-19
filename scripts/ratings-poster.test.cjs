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

test('live projection reproduces the approved Nov 17 100-player layout',()=>{
  const out=build('2026-11-23');
  assert.deepEqual(out.poster.counts,{total:100,avengers:49,av2:32,alumni:19});
  assert.equal(out.poster.leaders[0].canonicalName,'AV-INTEN');
  assert.ok(out.changes.firstWeek===true||typeof out.changes.baseline==='string');
  for(const r of out.poster.left)assert.equal(r.posterPanel,'AVENGERS');
  for(const r of out.poster.right)assert.ok(['AV-2','ALUMNI'].includes(r.posterPanel));
});
