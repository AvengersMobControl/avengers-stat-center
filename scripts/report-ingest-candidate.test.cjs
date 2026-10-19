'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {make,csv}=require('./report-ingest-candidate.cjs');
const {UNITS}=require('./event-projection-core.cjs');
const {create}=require('./create-site-release.cjs');
const accepted=require('../data/approved-event-updates.json').updates;
const rawfile=path.join(__dirname,'../data/approved-event-updates.json');
const snap=()=>fs.readFileSync(rawfile,'utf8');
const row=(player='AV-HarryBallsagna',sparks=333,stars=3330)=>({player,clan:'AV-2',score:1200,sparks,stars,metadata:{rank:4,lobby:'B'}});
const event=()=>({id:'flash|2026-10-10|1',kind:'flash',date:'2026-10-10',status:'partial',unit:UNITS.flash,
 sources:['reviewed-image-sha256:'+'b'.repeat(64)],metadata:{flash:1},
 rows:[row()]});
const proposal=()=>({approved:false,expectedRevision:0,event:event()});
test('candidate produces stable, complete side-by-side member, league, clan and source impact without import',()=>{
 const before=snap(),input=proposal(),m=make(accepted,input),again=make(accepted,input);
 assert.equal(m.mode,'REVIEW_ONLY');assert.equal(m.readyToImport,false);assert.equal(m.discordSent,false);
 assert.equal(m.sourceCoverage.startsWith('PARTIAL'),true);
 assert.equal(m.counts.newRows,1);assert.equal(m.counts.correctedRows,0);assert.equal(m.counts.removedRows,0);
 assert.equal(m.counts.membersAffected,1);assert.equal(m.counts.leaguesAffected,1);
 assert.equal(m.rows[0].eventClan,'AV-2');
 assert.equal(m.rows[0].originalLobbyFinish,4);
 assert.equal(m.clanChanges['AV-2'].sparksDelta,333);
 assert.equal(m.clanChanges['AV-2'].starsDelta,3330);
 assert.equal(m.clanChanges.AVENGERS.sparksDelta,0);
 assert.equal(m.changedMembers[0].before.unloggedSparks,m.changedMembers[0].proposed.unloggedSparks);
 assert.equal(m.leagueChanges[0].end,'2026-10-11');
 assert.equal(m.reviewDigest,again.reviewDigest,'independent review must be deterministic');
 assert.equal(csv(m).split('\n')[0].split(',').length,10,'same approval columns in CSV');
 assert.equal(snap(),before,'no source data writes');
});
test('corrections including rank-only changes, and explicit revocations, are visible',()=>{
 const acceptedRow={...proposal(),approved:true},first=make(accepted,proposal());
 const revisedEvent=event();revisedEvent.rows=[{...row(),sparks:10,stars:100,score:1250}];
 const correction=make([...accepted,acceptedRow],{approved:false,expectedRevision:1,event:revisedEvent});
 assert.equal(correction.counts.correctedRows,1);
 assert.equal(correction.clanChanges['AV-2'].sparksDelta,10-333);
 assert.equal(correction.clanChanges['AV-2'].starsDelta,100-3330);
 const rankOnly=event();rankOnly.rows=[{...row(),metadata:{rank:2,lobby:'B'}}];
 const changed=make([...accepted,acceptedRow],{approved:false,expectedRevision:1,event:rankOnly});
 assert.equal(changed.counts.correctedRows,1,'source lobby rank correction cannot be concealed');
 const revoked=make([...accepted,acceptedRow],{approved:false,expectedRevision:1,event:{...event(),status:'revoked'}});
 assert.equal(revoked.counts.removedRows,1);
 assert.equal(revoked.clanChanges['AV-2'].sparksDelta,-333);
 assert.equal(revoked.counts.leaguesAffected,1);
 assert.notEqual(first.toVersion,revoked.toVersion);
});
test('never silently convert unknown Spark or Star rewards to zero known payouts',()=>{
 const e=event();e.rows=[row('AV-HarryBallsagna',null,null)];
 const m=make(accepted,{approved:false,expectedRevision:0,event:e});
 assert.equal(m.clanChanges['AV-2'].proposed.knownSparks,0);
 assert.equal(m.clanChanges['AV-2'].proposed.unknownSparkPayouts,1);
 assert.equal(m.clanChanges['AV-2'].proposed.unknownStarPayouts,1);
 assert.equal(m.counts.newRows,1);
});
test('unsafe, prereviewed or incorrect revision inputs cannot create user approval sheet',()=>{
 const p=proposal();assert.throws(()=>make(accepted,{...p,approved:true}),/must not already/);
 assert.throws(()=>make(accepted,{event:null}),/Require a candidate/);
 assert.throws(()=>make(accepted,{...p,expectedRevision:76}),/revision/i);
 const direct=create();const existing=direct.ledger.events.find(x=>x.id==='space|2026-10-16');
 assert(existing);
 const repeated=make(accepted,{approved:false,expectedRevision:existing.revision,event:existing});
 assert.equal(repeated.projectionUnchanged,true,'same accepted results are idempotent and do not create new awards');
 assert.equal(repeated.counts.added,undefined);
 assert.equal(repeated.counts.newRows,0);
});
