#!/usr/bin/env node
'use strict';
// Reproducible, guarded review candidate for the previously held Nov 6 AV-2
// Space lobby-H rank 8. This NEVER reads Discord, publishes, or sends messages.
// Original final CLAIM: AV-2 channel, message 1568324314116390953,
// second attachment image1.jpg. Its original source was accepted before the
// name was resolvable; the later Nov 8 final Big Pig spells it in full.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {root}=require('./load-site-data.cjs');

const source=JSON.parse(fs.readFileSync(path.join(root,'data/approved-event-updates.json'),'utf8'));
const revisions=source.updates.filter(u=>u.event?.id==='space|2026-11-06');
const prior=revisions.at(-1);
assert(prior?.approved===true&&prior.expectedRevision===5,'Source review has moved; re-review before staging');
assert.equal(prior.event.rows.length,62);
assert.equal(prior.event.rows.filter(r=>r.clan==='AVENGERS').length,46);
assert.equal(prior.event.rows.filter(r=>r.clan==='AV-2').length,16);
assert.equal(prior.event.metadata.complete,false,'Do not silently mark partial event complete');
assert.equal(prior.event.sources.length,16,'Previously accepted original screenshot inventory changed');
assert(!prior.event.rows.some(r=>r.player==='TheHemperor'||
  (r.clan==='AV-2'&&r.metadata?.lobby==='H'&&r.metadata?.rank===8)),
  'Previously held rank was already imported');
assert(prior.event.rows.some(r=>r.player==='AV#Rafa#Tun'&&r.clan==='AV-2'&&
  r.metadata?.lobby==='H'&&r.metadata?.rank===9),
  'The same original final-screen tail must have been accepted');

const piggy=source.updates.filter(u=>u.event?.id==='piggy|2026-11-08').at(-1)?.event;
assert(piggy?.rows.some(r=>r.player==='TheHemperor'&&r.clan==='AV-2'&&
  r.metadata?.sourceDisplayName==='AV2-TheHemperor'&&r.metadata.rank===49),
  'The full-name AV-2 screenshot must independently link the cropped source name');

const event=structuredClone(prior.event);
event.rows.push({
  player:'TheHemperor',clan:'AV-2',score:0.43,stars:34185,sparks:3430,
  metadata:{
    rank:8,lobby:'H',share:0.02,sourceDisplayName:'AV2-TheHempe...',
    starsProvenance:'visible-exact-screenshot',
    sourceDiscordMessageId:'1568324314116390953',
    sourceAttachment:'image1.jpg',
    identityProvenance:'Nov 8 AV-2 final Big Pig full display AV2-TheHemperor, existing canonical TheHemperor'
  }
});
event.metadata.coverageNote='Nov 6 final CLAIM Space screenshot reconciliation: 46 AVENGERS and 17 AV-2 rows, including lobby H rank 8 TheHemperor (original cropped AV2-TheHempe..., identity independently confirmed by Nov 8 final Big Pig). All clan-tagged rows visible in retrieved original panels are accounted for; unposted or unshown lobbies remain unknown, so event stays partial.';
const update={approved:process.argv.includes('--approved'),expectedRevision:6,
  event,authorization:structuredClone(prior.authorization)};
const reportDir=path.join(root,'reports');
fs.mkdirSync(reportDir,{recursive:true});
const output=path.join(reportDir,'nov6-space-av2-rank8.review.json');
fs.writeFileSync(output,JSON.stringify(update,null,2)+'\n');
console.log(JSON.stringify({output:path.relative(root,output),approved:update.approved,
  eventId:event.id,priorRows:62,proposedRows:event.rows.length,
  added:event.rows.at(-1),eventStillPartial:event.metadata.complete===false},null,2));
