#!/usr/bin/env node
'use strict';
// #6: leadership headline comparison is a *source hypothesis*, not a fix.
// Reporting is read-only, NEVER edits historical rewards or headline values.
const fs=require('node:fs'),path=require('node:path');
const {auditRelease}=require('./audit-six-clan-leagues.cjs');
const {create}=require('./create-site-release.cjs');
const {root}=require('./load-site-data.cjs');
function ensure(c,m){if(!c)throw Error(m)}
const ref={earlier:165000000,latest:171000000,reportedIncrease:6000000,
  source:'Clan leader original Oct 12, 2026: “171m sparks this clan league vs the 165m we earned last league”',
  scale:'approximate millions, NOT exact recorded numeric totals',
  screenshotOfOriginalDefinitionAvailable:false,includesFlashVerified:false};
function diagnostic(audit){
 ensure(audit?.source==='accepted-event-ledger'&&audit.sixPeriods?.length===6,'Independent six-league ledger audit required');
 const [earlier,latest]=audit.sixPeriods.slice(-2);
 ensure(earlier.end==='2026-09-06'&&latest.end==='2026-10-11','Unexpected leader-reference league dates');
 const details=[['earlier',earlier,ref.earlier],['latest',latest,ref.latest]].map(([label,p,quoted])=>{
  const c=p.clanTotals.AVENGERS;
  const incl=c.sparks,ex=c.sparks-c.flashSparks;
  ensure(Number.isFinite(incl)&&c.flashSparks>=0,'Invalid source totals');
  const knownNoEstimated=totalMinusEstimate(incl,c.estimatedKraken);
  return {label,start:p.start,end:p.end,reportedApprox:quoted,
    recorded:{
      piggySparks:c.piggySparks,spaceSparks:c.spaceSparks,flashSparks:c.flashSparks,
      krakenSparks:c.krakenSparks,knownSparksIncludingFlash:incl,
      knownSparksExcludingFlash:ex,
      historicallyEstimatedKrakenSparks:c.estimatedKraken||0,
      knownSparksExcludingKrakenEstimates:knownNoEstimated,
      knownSparksExcludingBothFlashAndKrakenEstimates:knownNoEstimated-c.flashSparks,
      knownStars:c.stars},
    differencesFromApprox:{
      includingFlash:incl-quoted,excludingFlash:ex-quoted,
      includingFlashExcludingKrakenEstimates:knownNoEstimated-quoted,
      excludingFlashAndKrakenEstimates:knownNoEstimated-c.flashSparks-quoted},
    incompleteEvidence:{
      partialEventIds:p.partialEventIds,partialEventCount:p.partialEventIds.length,
      missingSparkRows:p.missingSparkRows,missingStarRows:p.missingStarRows,
      unknownClanRows:p.unknownClanRows,unknownClanSparks:p.unknownClanSparks,
      estimatedKrakenSparks:c.estimatedKraken||0
    }
  };
 });
 const [prev,now]=details;
 const scenario=(name,k)=>({scenario:name,
   earlier:prev.recorded[k],latest:now.recorded[k],
   recordedChange:now.recorded[k]-prev.recorded[k],
   differenceInReportedChange:now.recorded[k]-prev.recorded[k]-ref.reportedIncrease,
   matchesExactReportedValues:prev.recorded[k]===ref.earlier&&now.recorded[k]===ref.latest,
   sourceScopeCertified:false});
 const scenarios=[
  scenario('All recorded member rewards (includes ordinary Flash)', 'knownSparksIncludingFlash'),
  scenario('Recorded non-Flash rewards only (HYPOTHESIS; excludes real Flash Sparks)','knownSparksExcludingFlash'),
  scenario('Recorded including Flash, excluding estimated Kraken (lower evidence-only subtotal)','knownSparksExcludingKrakenEstimates'),
  scenario('Recorded excluding both Flash and estimated Kraken (sensitivity only)','knownSparksExcludingBothFlashAndKrakenEstimates')
 ];
 // Even if a future source total equals a rounded leader value, scope\n // still requires independent attestation. Never auto-certify a coincidental match.
 return {
  schemaVersion:1,source:'independent-accepted-event-ledger-audit',projectionVersion:audit.projectionVersion,
  reconciliationStatus:'UNRESOLVED — external headline scope/source not independently verified',
  knownClaim:ref,periods:details,scenarios,
  neededEvidence:[
   'Original reported clan-sparks evidence or accompanying computation defining what 165M and 171M included.',
   'Whether the headline counted individual Flash rewards and all player lobbies, and actual clan/date coverage.',
   'Source for older historically inferred Kraken rewards or an explicit leader-approved estimate definition.',
   'Evidence of missing partial event screenshots if reported clan total used complete pots instead of recorded player rewards.'
  ],
  findings:[
   'The leader compared one five-week Clan League with the immediately preceding league, NOT lifetime member Unlogged Sparks.',
   'Known participant Sparks DO include ordinary Flash rewards in the canonical ledger. Excluding Flash is only a reconciliation hypothesis, NOT permission to change league accounting.',
   'The exact reported rounded reference cannot be independently reproduced from currently approved source.',
   'Historical Kraken estimates and missing/partial screenshot results mean none of the scenario totals is certified complete.'
  ],
  staticUnloggedSparksUntouched:true,ledgerModified:false,discordPosting:false,
  councilIssue7Touched:false
 };
}
function totalMinusEstimate(total,estimated){
 const e=estimated||0;
 ensure(typeof e==='number'&&Number.isFinite(e)&&e>=0&&e<=total,'Invalid inferred Kraken subtotal');
 return total-e;
}
function markdown(r){
 const f=n=>Math.round(n).toLocaleString('en-US');
 const fields=['piggySparks','spaceSparks','flashSparks','krakenSparks','knownSparksIncludingFlash','knownSparksExcludingFlash','historicallyEstimatedKrakenSparks'];
 const l=['# AVENGERS six-league headline reference — evidence review',
  '','**NOT VERIFIED:** The user-reported “165M → 171M” is an approximate historical headline. Current audit matches known player/event rows but cannot certify the original headline’s population/Flash/Kraken inclusion.',
  '','**Leader quote (Oct 12):** '+r.knownClaim.source,'','| Recorded category / period | Prior Sep 6 | Latest Oct 11 |',
  '|---|---:|---:|'];
 for(const k of fields)l.push('| '+k+' | '+f(r.periods[0].recorded[k])+' | '+f(r.periods[1].recorded[k])+' |');
 l.push('','| Scenario (NOT confirmed leader methodology) | Prior | Latest | Delta |',
  '|---|---:|---:|---:|');
 for(const s of r.scenarios)l.push('| '+s.scenario+' | '+f(s.earlier)+' | '+f(s.latest)+' | '+f(s.recordedChange)+' |');
 l.push('','## Evidence gaps and next steps','');
 for(const p of r.periods)l.push('- '+p.label+' ('+p.end+'): '+p.incompleteEvidence.partialEventCount+' partial event sets; '+
   p.incompleteEvidence.missingSparkRows+' missing Spark rewards; '+p.incompleteEvidence.unknownClanRows+
   ' unknown-clan rows; '+f(p.incompleteEvidence.estimatedKrakenSparks)+' historically estimated Kraken Sparks.');
 for(const x of r.neededEvidence)l.push('- '+x);
 l.push('','**Never silently change approved rewards, fixed Unlogged Sparks, or league totals to force an approximate reported match. Council issue #7 excluded; no Discord reads or sends.**','');
 return l.join('\n');
}
module.exports={diagnostic,markdown};
if(require.main===module){
 try{
  const report=diagnostic(auditRelease(create()));
  const dir=path.join(root,'reports');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'clan-league-reference-review.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(dir,'clan-league-reference-review.md'),markdown(report));
  console.log(JSON.stringify({projectionVersion:report.projectionVersion,
   status:report.reconciliationStatus,scenarios:report.scenarios.map(x=>({name:x.scenario,
    earlier:x.earlier,latest:x.latest,delta:x.recordedChange})),imported:false,posted:false},null,2));
 }catch(e){console.error(e.stack||e.message);process.exitCode=1;}
}
