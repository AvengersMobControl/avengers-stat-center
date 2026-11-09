#!/usr/bin/env node
'use strict';
// Reproduce a narrowly scoped leader-requested correction from the original
// already-reviewed Nov 8 AV-2 final CLAIM panels. Never reads or posts Discord.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {root}=require('./load-site-data.cjs');
const eventId='piggy|2026-11-08';
const accepted=JSON.parse(fs.readFileSync(path.join(root,'data/approved-event-updates.json'),'utf8'));
const revisions=accepted.updates.filter(u=>u.event.id===eventId);
const previous=revisions.at(-1);
assert(previous?.approved===true&&previous.expectedRevision===2,'Review the current event revision before preparing this correction');
assert.equal(previous.event.rows.length,62,'Original accepted 62-row final-screen state has changed');
assert.equal(previous.event.rows.filter(r=>r.clan==='AV-2').length,14,'AV-2 input baseline changed');

// Rank 24 and ranks 48-50 from original complete Nov 8 Big Pig reward images.
// CRISPIN.27 already resolves to canonical CRISPIN.97, and AV2-J to AV-J.
// Tier 10 not reached: no Stars/Sparks payout is displayed, so preserve null.
const additions=[
  {player:'AV-J',clan:'AV-2',score:53,stars:85714,sparks:8571,
    metadata:{rank:24,share:0.016,lobby:'AV2-main',sourceDisplayName:'AV2-J'}},
  {player:'AV-TheOli',clan:'AV-2',score:1,stars:null,sparks:null,
    metadata:{rank:48,lobby:'AV2-main',sourceDisplayName:'AV-TheOli',payoutDisplay:'Tier 10 not reached'}},
  {player:'TheHemperor',clan:'AV-2',score:1,stars:null,sparks:null,
    metadata:{rank:49,lobby:'AV2-main',sourceDisplayName:'AV2-TheHemperor',payoutDisplay:'Tier 10 not reached'}},
  {player:'AV-CRISPIN.97',clan:'AV-2',score:1,stars:null,sparks:null,
    metadata:{rank:50,lobby:'AV2-main',sourceDisplayName:'AV-CRISPIN.27',payoutDisplay:'Tier 10 not reached'}}
];
for(const row of additions){
  assert(!previous.event.rows.some(existing=>existing.player===row.player),'Already imported: '+row.player);
  assert.equal(row.clan,'AV-2');
}
const event=structuredClone(previous.event);
event.rows.push(...additions);
event.metadata.coverageNote='Nov 8 main lobby: all 50 rank positions visually reviewed; 48 AVENGERS players including Finnie one-line. AV-2: 18 separately verified rows across two source lobbies including AV2-J (rank 24) and three valid one-line results (ranks 48-50). Remaining cropped AV-2 rank windows may omit others; stay partial. Original proof limitations on main lobby JPG attachments 9-10 persist; no missing rewards guessed.';
event.metadata.oneLineNonparticipantsExcluded=0;
event.metadata.av2SourceAudit={...event.metadata.av2SourceAudit,verifiedEligibleRows:18,identityHoldRank:null,excludedExactlyOneLineRanks:[],includedExactlyOneLineRanks:[48,49,50]};
const update={approved:process.argv.includes('--approved'),expectedRevision:3,event,
  authorization:structuredClone(previous.authorization)};
const reportDir=path.join(root,'reports');
fs.mkdirSync(reportDir,{recursive:true});
const output=path.join(reportDir,'nov8-av2-completeness.review.json');
fs.writeFileSync(output,JSON.stringify(update,null,2)+'\n');
console.log(JSON.stringify({output:path.relative(root,output),approved:update.approved,eventId,oldRows:62,
  newRows:event.rows.length,added:additions.map(r=>({name:r.player,sourceName:r.metadata.sourceDisplayName,
    rank:r.metadata.rank,lines:r.score,stars:r.stars,sparks:r.sparks}))},null,2));
