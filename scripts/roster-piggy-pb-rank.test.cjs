'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {rankRows}=require('../roster-piggy-pb-rank.js');

test('Piggy PB rank uses highest recorded lines, competition ties, and omits missing data',()=>{
  const original=[{name:'A',piggyPB:47000},{name:'B',piggyPB:51000},{name:'C',piggyPB:51000},{name:'D',piggyPB:12000},{name:'E',piggyPB:0},{name:'F',piggyPB:null},{name:'G',piggyPB:NaN}];
  const out=rankRows(original);
  assert.deepEqual(out.map(r=>r.piggyPBRank),[3,1,1,4,null,null,null]);
  assert.equal(original[0].piggyPBRank,undefined,'should not mutate source event projection rows');
});
test('Piggy PB ranks recompute per selected clan or all-members roster',()=>{
  const av=[{name:'AV top',piggyPB:70000},{name:'AV second',piggyPB:40000}];
  const av2=[{name:'AV-2 top',piggyPB:60000},{name:'AV-2 missing',piggyPB:0}];
  assert.deepEqual(rankRows(av).map(r=>r.piggyPBRank),[1,2]);
  assert.deepEqual(rankRows(av2).map(r=>r.piggyPBRank),[1,null]);
  assert.deepEqual(rankRows([...av,...av2]).map(r=>r.piggyPBRank),[1,3,2,null]);
  assert.deepEqual(rankRows([]),[]);
});
test('Rosters render the always-visible sortable Piggy PB Rank column',()=>{
  const html=readFileSync(join(__dirname,'../index.html'),'utf8');
  assert.match(html,/<script src="roster-piggy-pb-rank\.js"><\/script>/);
  assert.match(html,/rows=window\.AVENGERS_ROSTER_PIGGY_PB_RANK\.rankRows\(rows\);/);
  assert.match(html,/piggyPBRank:\{label:'Piggy PB Rank',type:'number',get:r=>r\.piggyPBRank\}/);
  assert.match(html,/sortHeader\('Piggy PB Rank','piggyPBRank',true\)/);
  assert.match(html,/r\.piggyPBRank==null\?missing:/);
});
