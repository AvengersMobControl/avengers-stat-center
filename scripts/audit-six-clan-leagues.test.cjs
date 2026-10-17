'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {reconstruct,auditRelease,csv}=require('./audit-six-clan-leagues.cjs');
const {periods}=require('./event-projection-core.cjs');
const {create}=require('./create-site-release.cjs');
const approved=path.join(__dirname,'../data/approved-event-updates.json');
const money=(x)=>JSON.stringify(x);
test('all SIX actual league periods independently match approved source event rows, UI totals and projection',()=>{
 const before=fs.readFileSync(approved,'utf8'),release=create(),r=auditRelease(release);
 assert.equal(r.sixPeriods.length,6);
 assert.equal(r.projectionVersion,release.projection.version);
 assert.equal(r.source,'accepted-event-ledger');
 assert.equal(r.dataModified,false);
 assert.equal(r.discordPosting,false);
 assert.deepEqual(r.sixPeriods.map(p=>p.end),periods.map(p=>p.end));
 assert.equal(r.reference.reportedChange,6000000);
 assert.equal(r.reference.comparisonStatus,'scope-hypothesis-not-proven');
 assert.equal(r.reference.avengersEarlierExcludingFlash,r.reference.avengersEarlierIncludingFlash-r.reference.avengersEarlierFlashSparks);
 assert.equal(r.reference.avengersLatestExcludingFlash,r.reference.avengersLatestIncludingFlash-r.reference.avengersLatestFlashSparks);
 assert(Math.abs(r.reference.excludingFlashLatestResidual)<2000000,'Reference remains approximate, not forced equal');
 assert(Math.abs(r.reference.excludingFlashEarlierResidual)<2000000,'Source comparison uses AVENGERS-only');
 assert(r.sixPeriods.some(p=>p.byKind.flash>0),'Flash activity represented');
 assert(r.sixPeriods.some(p=>p.clanTotals.AVENGERS.piggySparks>0));
 assert(r.sixPeriods.some(p=>p.clanTotals['AV-2'].spaceSparks>0));
 assert(csv(r).includes('Flash Sparks'));
 assert.equal(fs.readFileSync(approved,'utf8'),before,'Audit never alters approved rewards');
});
test('independent audit catches one incorrect member/category amount without changing source',()=>{
 const rel=create(),x=rel.leagues.find(l=>l.rows.some(r=>r.flashSparks>0));
 assert(x,'Flash Sparks example required');
 const r=x.rows.find(r=>r.flashSparks>0);
 r.flashSparks+=123;
 assert.throws(()=>auditRelease(rel),/flashSparks/);
});
test('independent audit detects bad historical clan transfer, not current roster reattribution',()=>{
 const rel=create(),l=rel.leagues.find(p=>p.rows.some(r=>r.clan==='AV-2'));
 assert(l);const r=l.rows.find(p=>p.clan==='AV-2');
 r.clan='AVENGERS';
 assert.throws(()=>auditRelease(rel),/member row|Missing historical member|duplicate/i);
});
test('independent audit detects inflated projected category and missing reward counts',()=>{
 const rel=create(),clan=rel.projection.leagues[0].clans.AVENGERS;
 clan.stars+=500;
 assert.throws(()=>auditRelease(rel),/Stars/);
 const other=create(),c=other.projection.leagues[0].clans.AVENGERS;
 c.unknownSparks++;
 assert.throws(()=>auditRelease(other),/Unknown source Sparks/);
});
test('reconstruction preserves multiple Flash IDs, unknown payments, unassigned and incomplete events',()=>{
 const [p]=periods,events=[
  {id:'flash|a',kind:'flash',date:p.start,status:'final',rows:[{player:'AV-X',clan:'AVENGERS',score:100,sparks:20,stars:200}]},
  {id:'flash|b',kind:'flash',date:p.start,status:'final',rows:[{player:'AV-X',clan:'AVENGERS',score:200,sparks:30,stars:300}]},
  {id:'piggy|x',kind:'piggy',date:p.start,status:'partial',rows:[{player:'AV-X',clan:'AV-2',score:3500,sparks:null,stars:null}]},
  {id:'kraken|x',kind:'kraken',date:p.end,status:'final',rows:[{player:null,sourceIdentity:'source1',clan:null,score:200,sparks:500,stars:null,estimatedSparks:true}]},
  {id:'space|x',kind:'space',date:p.start,status:'revoked',rows:[{player:'AV-X',clan:'AVENGERS',score:1,sparks:1000000,stars:10000000}]}
 ];
 const out=reconstruct(events),f=out[0];
 assert.equal(f.eventCount,4);
 assert.equal(f.byKind.flash,2);
 assert.equal(f.byKind.space,0);
 assert.equal(f.clanSums.AVENGERS.flashSparks,50);
 assert.equal(f.clanSums.AVENGERS.flashStars,500);
 assert.equal(f.clanSums['AV-2'].unknownSparks,1);
 assert.equal(f.clanSums['AV-2'].unknownStars,1);
 assert.equal(f.clanSums.Unknown.krakenSparks,500);
 assert.equal(f.clanSums.Unknown.estimatedKraken,500);
 assert.equal(f.clanSums.Unknown.unassignedRows,1);
 assert.deepEqual(f.partialEvents,['piggy|x']);
 assert.equal(f.members.filter(x=>x.name==='AV-X').length,2,'transfer same player is two clan ledger entries');
});
test('Kraken Stars are rejected and six periods cannot overlap',()=>{
 const events=[{id:'kraken|bad',kind:'kraken',date:periods[0].end,status:'final',
    rows:[{player:'AV-X',clan:'AVENGERS',score:5,sparks:5,stars:1}]}];
 assert.throws(()=>reconstruct(events),/Kraken Stars/);
 const broken=structuredClone(periods);broken[1].start=periods[0].end;
 assert.throws(()=>reconstruct([],broken),/date gap\/overlap/);
});
