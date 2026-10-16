'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {preview}=require('./stage-event-update.cjs');
const update={approved:false,expectedRevision:0,event:{id:'piggy|review-fixture',kind:'piggy',date:'2026-10-10',status:'partial',unit:'lines',sources:['fixture:review'],rows:[{player:'AV-HarryBallsagna',clan:'AVENGERS',score:90000,sparks:1,stars:10}]}};
test('an unapproved candidate can be simulated without changing its approval or accepted source file',()=>{
  const file=path.join(__dirname,'../data/approved-event-updates.json'),before=fs.readFileSync(file,'utf8'),input=JSON.stringify(update);
  const r=preview([],update);assert(r.reviewRequired);assert(r.changed.includes('AV-HarryBallsagna'));
  assert.notEqual(r.before.projection.version,r.after.projection.version);
  assert.equal(fs.readFileSync(file,'utf8'),before);assert.equal(JSON.stringify(update),input);
});
test('applying still requires explicit parsed-result approval; invalid revisions fail before any write',()=>{
  assert.throws(()=>preview([],update,{requireApproval:true}),/reviewed approval/);
  assert.throws(()=>preview([],{...update,approved:true,expectedRevision:8},{requireApproval:true}),/Revision conflict/);
});
