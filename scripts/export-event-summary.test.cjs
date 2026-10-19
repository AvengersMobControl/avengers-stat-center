'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {exportRelease,writeApprovedRelease}=require('./export-event-summary.cjs');
const {create}=require('./create-site-release.cjs');
const approved=path.join(__dirname,'../data/approved-event-updates.json');
test('PNG input comes from exactly the accepted canonical projection; never a draft',()=>{
 const before=fs.readFileSync(approved,'utf8'),exported=exportRelease(),canonical=create();
 assert.equal(exported.schemaVersion,1);
 assert.equal(exported.source,'approved-event-ledger');
 assert.equal(exported.projection.version,canonical.projection.version);
 assert.equal(typeof exported.piggyPlacementPBs,'object');
 assert(Array.isArray(exported.piggyPlacementPBs['piggy|2026-10-11']));
 for(const rows of Object.values(exported.piggyPlacementPBs))for(const pb of rows){
  assert(Number.isInteger(pb.newRank)&&pb.newRank>0);
  assert(pb.previousRank===null||pb.newRank<pb.previousRank);
  assert.equal(pb.eventId.startsWith('piggy|'),true);
 }
 assert.deepEqual(exported.projection.events,canonical.projection.events);
 assert.equal(fs.readFileSync(approved,'utf8'),before);
 const kinds=new Set(exported.projection.events.filter(e=>e.status!=='revoked').map(e=>e.kind));
 for(const kind of ['piggy','flash','kraken','space'])assert(kinds.has(kind),'source has '+kind);
 const people=new Set(exported.projection.people.map(p=>p.name));
 for(const event of exported.projection.events)if(event.status!=='revoked')for(const row of event.rows){
  if(row.player)assert(people.has(row.player),'canonical identity '+row.player);
  assert(row.clan===null||row.clan==='AVENGERS'||row.clan==='AV-2','event-time clan');
  assert.equal(event.kind==='kraken'?row.stars:null,event.kind==='kraken'?null:null,'Kraken has no Stars');
 }
});
test('exporter writes only reports/ and refuses unexpected output names',()=>{
 const file='review-event-summary-unit.json';
 const before=fs.readFileSync(approved,'utf8');
 for(const name of ['../overwrite.json','/tmp/out.json','a.txt','.secrets.json'])
  assert.throws(()=>writeApprovedRelease(name),/Output must/);
 try{
  const output=writeApprovedRelease(file),doc=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(doc.source,'approved-event-ledger');
  assert(path.resolve(output).startsWith(path.resolve(__dirname,'../reports')+path.sep));
 }finally{
  fs.rmSync(path.join(__dirname,'../reports',file),{force:true});
 }
 assert.equal(fs.readFileSync(approved,'utf8'),before);
});

test('Piggy PNG export classifies first AVENGERS event by clan, not first all-clan event',()=>{
 const exported=exportRelease(),lin=exported.projection.people.find(p=>p.name==='AV-Lin');
 assert(lin);
 const firstMain=lin.kinds.piggy.pbs.find(p=>p.eventId==='piggy|2026-10-18');
 assert(firstMain);
 assert.equal(firstMain.firstRecorded,false);
 assert.equal(firstMain.firstClanRecorded,true);
 assert.equal(firstMain.score,31749);
 assert(lin.history.some(e=>e.kind==='piggy'&&e.clan==='AV-2'&&e.date<'2026-10-18'));
 assert.equal(exported.projection.people.filter(p=>['AV-2Lin','AV-JeffKintz05','LT'].includes(p.name)).length,0);
 assert(exported.projection.people.some(p=>p.name==='AV-JefhKintz05'));
});
