'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {diagnostic,markdown}=require('./reconcile-league-reference.cjs');
const {auditRelease}=require('./audit-six-clan-leagues.cjs');
const {create}=require('./create-site-release.cjs');
const saved=path.join(__dirname,'../data/approved-event-updates.json');
test('original leader approximation is NOT an instruction to exclude Flash or force source totals',()=>{
 const before=fs.readFileSync(saved,'utf8'),full=auditRelease(create()),m=diagnostic(full),again=diagnostic(auditRelease(create()));
 assert.equal(m.projectionVersion,full.projectionVersion);
 assert.equal(m.knownClaim.earlier,165000000);
 assert.equal(m.knownClaim.latest,171000000);
 assert.equal(m.knownClaim.reportedIncrease,6000000);
 assert.equal(m.reconciliationStatus.startsWith('UNRESOLVED'),true);
 assert.equal(m.periods.length,2);
 const [a,b]=m.periods;
 assert.equal(a.end,'2026-09-06');
 assert.equal(b.end,'2026-10-11');
 assert.equal(a.recorded.knownSparksIncludingFlash,169303416);
 assert.equal(b.recorded.knownSparksIncludingFlash,174170820);
 assert.equal(a.recorded.knownSparksExcludingFlash,165773085);
 assert.equal(b.recorded.knownSparksExcludingFlash,170419011);
 assert.equal(a.recorded.flashSparks,3530331);
 assert.equal(b.recorded.flashSparks,3751809);
 assert.equal(m.scenarios.length,4);
 for(const s of m.scenarios){
  assert.equal(s.sourceScopeCertified,false);
  assert.equal(s.recordedChange,s.latest-s.earlier);
  assert.equal(s.differenceInReportedChange,s.recordedChange-6000000);
 }
 assert.notEqual(m.scenarios[0].recordedChange,m.knownClaim.reportedIncrease);
 assert.notEqual(m.scenarios[1].recordedChange,m.knownClaim.reportedIncrease);
 assert.deepEqual(again,m,'review report is deterministic');
 assert.equal(fs.readFileSync(saved,'utf8'),before);
 assert.equal(m.staticUnloggedSparksUntouched,true);
 assert.equal(m.discordPosting,false);
 assert.equal(m.councilIssue7Touched,false);
 assert(markdown(m).includes('NOT VERIFIED'));
 assert(markdown(m).includes('historically estimated Kraken'));
});
test('absence of old Kraken proof and partial screenshot coverage remain visible, not converted to zero',()=>{
 const m=diagnostic(auditRelease(create()));
 assert(m.periods.some(p=>p.incompleteEvidence.partialEventCount>0));
 assert(m.periods.some(p=>p.incompleteEvidence.estimatedKrakenSparks>0));
 assert(m.neededEvidence.some(s=>s.includes('Original reported')));
 assert(m.neededEvidence.some(s=>s.includes('older historically inferred Kraken')));
 assert(m.periods.every(p=>p.recorded.knownSparksExcludingKrakenEstimates<=p.recorded.knownSparksIncludingFlash));
});
test('a spoofed six-league reference cannot pass as an independently verified ledger audit',()=>{
 assert.throws(()=>diagnostic({source:'social-message',sixPeriods:[]}),/Independent six-league/);
 const r=auditRelease(create());
 r.sixPeriods.at(-1).end='2026-11-11';
 assert.throws(()=>diagnostic(r),/Unexpected leader-reference league dates/);
});
