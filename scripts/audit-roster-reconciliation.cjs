#!/usr/bin/env node
'use strict';
// Read-only replay of the Stat Center's data scripts in published load order.
// Does not fetch Discord, alter event data, or write to production.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
// Compile all inline and local external browser JavaScript, including UI code
// not executed by the headless data replay. Catch malformed template strings.
for (const [index, match] of tags.entries()) {
  const source = (match[1].match(/\bsrc="([^"]+)"/) || [])[1];
  const code = source
    ? fs.readFileSync(path.join(root, source), 'utf8')
    : match[2];
  new vm.Script(code, {filename: source || 'index.html:inline:' + index});
}
const sandbox = {window: {}, console};
vm.createContext(sandbox);
const loaded = [];
for (const [index, match] of tags.entries()) {
  const source = (match[1].match(/\bsrc="([^"]+)"/) || [])[1];
  if (source === 'roster-stars-snapshot-2026-10-15.js') {
    vm.runInContext(fs.readFileSync(path.join(root, source), 'utf8'), sandbox, {filename: source, timeout: 20000});
    loaded.push(source);
    break;
  }
  if (index > 0 && !source && (match[2].includes('const D = window.AVENGERS_DATA;') || match[2].length > 20000)) {
    // The large application UI script comes after the roster data; it is not run.
    // Inline event rows before the snapshot remain eligible.
  }
  if (source) {
    if (source === 'community-highlights.js') continue;
    vm.runInContext(fs.readFileSync(path.join(root, source), 'utf8'), sandbox, {filename:source,timeout:20000});
    loaded.push(source);
  } else if (index === 0 || index < 42) {
    vm.runInContext(match[2], sandbox, {filename: 'index.html:inline:' + index,timeout:20000});
  }
}
const w = sandbox.window, D=w.AVENGERS_DATA, R=w.AVENGERS_MEMBER_TIMEZONES;
const S=w.AVENGERS_SPARKS_SNAPSHOT, L=w.AVENGERS_ROSTER_SPARKS_LEDGER;
const B=w.AVENGERS_ROSTER_EVENT_BREAKDOWN;
assert(D && R && S && L && B, 'Missing loaded roster/ledger data scripts');
const currentAv=(R.rows||[]).filter(r=>r.status==='Active');
const currentAv2=(R.rows||[]).filter(r=>r.status==='AV2');
assert.equal(currentAv.length, 48, 'Expected 48 October 15 AVENGERS players');
assert.equal(currentAv2.length, 52, 'Expected 50 screenshot + 2 leader-confirmed AV-2 players');
assert.equal(S.currentAvengersStars.length, 48);
assert.equal(S.currentAv2.length, 50);
assert(currentAv2.some(r=>r.name==='AV-DrDetroit'));
assert(currentAv2.some(r=>r.name==='AV-Starred'));
assert(![...currentAv,...currentAv2].some(r=>r.name==='AV-Bubba0816'));
assert(currentAv2.some(r=>r.name==='AV-Frenchie2'));
assert(currentAv2.some(r=>r.name==='AV-Frenchie(-4)'));
const canonical=raw=>{
  let name=String(raw||'').trim();
  const seen=new Set();
  while(D.aliasMap?.[name] && !seen.has(name)) {
    seen.add(name); name=D.aliasMap[name];
  }
  return name;
};
assert.notEqual(canonical('AV-Frenchie2'),canonical('AV-Frenchie(-4)'));
const current=[...currentAv,...currentAv2];
const identityKeys=current.map(r=>canonical(r.name));
assert.equal(new Set(identityKeys).size, 100, 'Duplicate canonical identities in current rosters');
const starRows=[...(S.currentAvengersStars||[]),...(S.currentAv2||[])];
const stars=new Map();
for(const x of starRows){
  if(x.allTimeStars==null)continue;
  for(const key of [x.name,x.profileName,canonical(x.profileName||x.name)].filter(Boolean))
    stars.set(key,x);
}
const sparkRows=[...(S.currentAvengers||[]),...(S.currentAv2||[])];
const sparks=new Map();
for(const x of sparkRows){
  for(const key of [x.name,x.profileName,canonical(x.profileName||x.name)].filter(Boolean))
    sparks.set(key,x);
}
const members=new Map((D.members||[]).map(x=>[canonical(x.name),x]));
const records=current.map(r=>{
  const name=canonical(r.name),m=members.get(name);
  const base=Math.max(0,Number(m?.totalSparks)||0);
  const extra=L.forMember(name);
  const event=B.forMember(name,base);
  const adjustedBase=Math.max(base,Number(event.eventBackedBaseFloor)||0);
  const baseSupplementSparks=adjustedBase-base;
  const loggedSparks=adjustedBase+(Number(extra.flashSparks)||0)+(Number(extra.octKrakenSparks)||0)+(Number(extra.juneKrakenSparks)||0);
  const starLogged=Number(event.loggedStars)||0;
  const spark=sparks.get(name)||sparks.get(r.name);
  const star=stars.get(name)||stars.get(r.name);
  const sparkScreenshot=spark?.allTimeSparks==null?null:Number(spark.allTimeSparks);
  const starScreenshot=star?.allTimeStars==null?null:Number(star.allTimeStars);
  assert(Number.isFinite(loggedSparks)&&loggedSparks>=0, 'Invalid logged Sparks: '+r.name);
  assert(Number.isFinite(starLogged)&&starLogged>=0, 'Invalid logged Stars: '+r.name);
  if(sparkScreenshot!==null)assert(Number.isFinite(sparkScreenshot)&&sparkScreenshot>=0,'Invalid screenshot Sparks: '+r.name);
  if(starScreenshot!==null)assert(Number.isFinite(starScreenshot)&&starScreenshot>=0,'Invalid screenshot Stars: '+r.name);
  return {
    name:r.name,canonicalName:name,clan:r.status==='Active'?'AVENGERS':'AV-2',
    sparkSnapshotDate:r.status==='AV2'&&S.currentAv2.some(x=>x.name===r.name)?S.av2Date:S.date,
    starSnapshotDate:star? '2026-10-15':null,
    sparkSnapshot:sparkScreenshot,starSnapshot:starScreenshot,
    loggedSparks,loggedStars:starLogged,baseSupplementSparks,
    sparkDelta:sparkScreenshot===null?null:sparkScreenshot-loggedSparks,
    starDelta:starScreenshot===null?null:starScreenshot-starLogged,
    piggySparks:event.piggySparks,spaceSparks:event.spaceSparks,
    flashSparks:event.flashSparks,krakenSparks:event.krakenSparks,
    piggyStars:event.piggyStars,spaceStars:event.spaceStars,flashStars:event.flashStars,
    sparksCategoryMismatch:Number(event.eventLoggedSparks||0)-loggedSparks,
    eventRowDelta:Number(event.storedBaseDifference)||0
  };
});
const missingStar=records.filter(x=>x.starSnapshot===null);
const missingSpark=records.filter(x=>x.sparkSnapshot===null);
const overStar=records.filter(x=>x.starDelta!==null&&x.starDelta<0).sort((a,b)=>a.starDelta-b.starDelta);
const overSpark=records.filter(x=>x.sparkDelta!==null&&x.sparkDelta<0).sort((a,b)=>a.sparkDelta-b.sparkDelta);
const mismatches=records.filter(x=>Math.abs(x.sparksCategoryMismatch)>0.01);
const eventDeltas=records.filter(x=>x.eventRowDelta>0.01);
const corrected=records.filter(x=>x.baseSupplementSparks>0.01);
assert.equal(corrected.length,eventDeltas.length,'Recorded event base supplements must match positive historical differences');
assert.equal(mismatches.length,0,'Reconciled event categories must sum to logged Sparks');
const report={
  generatedFrom:'repository data sources',snapshotDate:'2026-10-15',
  loadedScriptCount:loaded.length,roster:{avengers:currentAv.length,av2:currentAv2.length},
  sparkSnapshots:{available:records.length-missingSpark.length,missing:missingSpark.length,
    negativeDifferences:overSpark.length,priorSnapshotDateWarning:'AVENGERS Sparks source is September 29; event data includes later results'},
  starSnapshots:{available:records.length-missingStar.length,missing:missingStar.length,
    negativeDifferences:overStar.length},
  categoryMismatches:mismatches.length,historicalEventVsBaseDeltas:eventDeltas.length,
  eventBackedCorrections:corrected.length,eventBackedSupplementTotal:corrected.reduce((s,r)=>s+r.baseSupplementSparks,0),
  negativeSparks:overSpark.map(x=>({name:x.name,clan:x.clan,delta:x.sparkDelta,date:x.sparkSnapshotDate})),
  negativeStars:overStar.map(x=>({name:x.name,clan:x.clan,delta:x.starDelta})),
  missingSparkNames:missingSpark.map(x=>x.name),missingStarNames:missingStar.map(x=>x.name),
  categoryMismatchNames:mismatches.map(x=>({name:x.name,delta:x.sparksCategoryMismatch})),
  historicEventDifferenceNames:eventDeltas.map(x=>({name:x.name,delta:x.eventRowDelta})),
  members:records
};
const dir=path.join(root,'reports');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'roster-reconciliation-audit.json'),JSON.stringify(report,null,2)+'\n');
const lines=[
'# AVENGERS roster ledger audit — October 15, 2026',
'',
'Source: reconstructed from the current Stat Center repository scripts in load order. Does not rewrite historic data.',
'',
'## Summary',
'- Roster: '+currentAv.length+' AVENGERS / '+currentAv2.length+' AV-2.',
'- Missing Spark snapshots: '+missingSpark.length+'; missing Star snapshots: '+missingStar.length+'.',
'- Negative snapshot-minus-logged Sparks: '+overSpark.length+'; Stars: '+overStar.length+'.',
'- Breakdown vs ledger mismatches: '+mismatches.length+'.',
'- Historical per-event reward vs stored base differences: '+eventDeltas.length+'.',
'- Conservative event-backed Spark base corrections: '+corrected.length+' members; '+report.eventBackedSupplementTotal+' Sparks of supported base floor above old stored totals.',
'',
'**Caution:** A negative Spark difference is not automatically a data error: AVENGERS all-time Spark screenshots are from September 29 and logged results include later events; AV-2 screenshots can have clan-specific zeros for transferred members. Flag for review rather than clamp and claim reconciled.',
'',
'## Snapshot-minus-logged anomalies (Sparks)',
'| Name | Clan | Snapshot date | Difference |',
'|---|---|---|---:|',
...overSpark.map(x=>'| '+x.name+' | '+x.clan+' | '+x.sparkSnapshotDate+' | '+x.sparkDelta+' |'),
'',
'## Snapshot-minus-logged anomalies (Stars)',
'| Name | Clan | Difference |',
'|---|---|---:|',
...overStar.map(x=>'| '+x.name+' | '+x.clan+' | '+x.starDelta+' |'),
'',
'## Missing snapshots',
'- Spark: '+(missingSpark.map(x=>x.name).join(', ')||'none'),
'- Star: '+(missingStar.map(x=>x.name).join(', ')||'none'),
'',
'## Category reconciliation mismatches',
...mismatches.map(x=>'- '+x.name+': '+x.sparksCategoryMismatch),
'',
'**Do not** treat historical event base discrepancies as proof of identity problems without source screenshots.'
];
fs.writeFileSync(path.join(dir,'roster-reconciliation-audit.md'),lines.join('\n')+'\n');

const leagueApi=w.AVENGERS_CLAN_LEAGUE_REWARDS;
assert(leagueApi && typeof leagueApi.build==='function','Clan League builder is missing');
const leaguePeriods=leagueApi.build();
assert.equal(leaguePeriods.length,6,'Expected six completed five-week Clan Leagues');
const day=iso=>Date.parse(iso+'T00:00:00Z')/86400000;
const ledgerFields=['piggySparks','spaceSparks','flashSparks','krakenSparks','piggyStars','spaceStars','flashStars'];
const leagueSummaries=leaguePeriods.map((p,index)=>{
  assert.equal(day(p.end)-day(p.start),34,'A league must cover exactly 35 inclusive dates: '+p.end);
  if(index>0)assert.equal(day(leaguePeriods[index-1].start),day(p.end)+1,'League boundary gap/overlap: '+p.end);
  const seen=new Set(),clans={};
  for(const r of p.rows){
    const id=r.clan+'|'+r.name;
    assert(!seen.has(id),'Duplicate member+clan in league: '+p.end+' '+id);
    seen.add(id);
    assert(['AVENGERS','AV-2'].includes(r.clan),'Unexpected clan: '+id);
    for(const field of [...ledgerFields,'sparks','stars','estimatedKraken','missing','events']){
      assert(Number.isFinite(Number(r[field])) && Number(r[field])>=0,'Invalid '+field+' for '+id);
    }
    const calculatedSparks=r.piggySparks+r.spaceSparks+r.flashSparks+r.krakenSparks;
    const calculatedStars=r.piggyStars+r.spaceStars+r.flashStars;
    assert(Math.abs(r.sparks-calculatedSparks)<0.01,'Spark categories do not sum for '+id);
    assert(Math.abs(r.stars-calculatedStars)<0.01,'Star categories do not sum for '+id);
    assert(r.estimatedKraken<=r.krakenSparks+0.01,'Estimated Kraken exceeds total for '+id);
    const c=clans[r.clan]||{players:0,sparks:0,stars:0,flashSparks:0,piggySparks:0,
      spaceSparks:0,krakenSparks:0,estimatedKrakenSparks:0,rowsMissingRewardFields:0};
    c.players++;c.sparks+=r.sparks;c.stars+=r.stars;
    c.flashSparks+=r.flashSparks;c.piggySparks+=r.piggySparks;
    c.spaceSparks+=r.spaceSparks;c.krakenSparks+=r.krakenSparks;
    c.estimatedKrakenSparks+=r.estimatedKraken;c.rowsMissingRewardFields+=r.missing;
    clans[r.clan]=c;
  }
  return {start:p.start,end:p.end,rosterRecords:p.rows.length,
    uniqueEventMemberEntries:p.eventMembers.size,
    clans};
});
// Council-reported season totals are approximate external comparison points,
// NOT authoritative inputs to the event ledger. Never force-match the data.
const councilReportedApprox = {'2026-10-11':171000000,'2026-09-06':165000000};
const comparisons=leagueSummaries
  .filter(p=>Object.prototype.hasOwnProperty.call(councilReportedApprox,p.end))
  .map(p=>({
    end:p.end,reportedApprox:councilReportedApprox[p.end],
    eventLedger:p.clans.AVENGERS?.sparks||0,
    flashSparks:p.clans.AVENGERS?.flashSparks||0,
    eventLedgerWithoutFlash:(p.clans.AVENGERS?.sparks||0)-(p.clans.AVENGERS?.flashSparks||0),
    delta:(p.clans.AVENGERS?.sparks||0)-councilReportedApprox[p.end],
    remainingDeltaWithoutFlash:(p.clans.AVENGERS?.sparks||0)-(p.clans.AVENGERS?.flashSparks||0)-councilReportedApprox[p.end],
    requiresSourceAudit:true
  }));
const leagueReport={
  source:'current Stat Center event ledgers; **not** proof all screenshots exist',
  scope:'six completed five-week Clan Leagues; includes estimated older Kraken amounts',
  warnings:['Missing and partly estimated rewards must not be described as verified clan-wide lifetime totals.',
    'Event-time clan is authoritative when recorded; historical Kraken reconstruction may use inferred last-known league clan.'],
  periods:leagueSummaries,reportedComparisons:comparisons
};
fs.writeFileSync(path.join(dir,'clan-league-audit.json'),JSON.stringify(leagueReport,null,2)+'\n');
const clanLines=[
  '# Six Clan League accounting audit','',
  'Source: Stat Center event ledgers, replayed in published load order. **Not a complete external leaderboard.**',
  '',
  'Earlier Kraken awards may be estimated from damage and historical clan inference. A zero missing-field count does NOT establish that every event screenshot or player result was captured.',
  '',
  '| Period | Clan | Players | Sparks recorded/estimated | Stars recorded | Kraken Sparks estimated | Incomplete reward records |',
  '|---|---|---:|---:|---:|---:|---:|',
  ...leagueSummaries.flatMap(p=>Object.entries(p.clans).map(([clan,c])=>
    '| '+p.start+' to '+p.end+' | '+clan+' | '+c.players+' | '+c.sparks+' | '+c.stars+' | '+c.estimatedKrakenSparks+' | '+c.rowsMissingRewardFields+' |')),
  '',
  '## Comparison to approximate council-reported season totals', '',
  '| Kraken end | Including Flash | Flash Sparks | Excluding Flash | Council reported (approx.) | Residual excluding Flash |',
  '|---|---:|---:|---:|---:|---:|',
  ...comparisons.map(c=>'| '+c.end+' | '+c.eventLedger+' | '+c.flashSparks+' | '+c.eventLedgerWithoutFlash+' | '+c.reportedApprox+' | '+c.remainingDeltaWithoutFlash+' |'),
  '',
  'Most of the headline difference is consistent with Flash Sparks being included in the new ledger but possibly excluded from earlier reported approximations. This is a hypothesis, not a verified source reconciliation. Do not alter source rewards to match rounded reports.',
  'Original event records and inferred allocations were not modified.'
];
fs.writeFileSync(path.join(dir,'clan-league-audit.md'),clanLines.join('\n')+'\n');
console.log('CLAN_LEAGUE_AUDIT '+JSON.stringify(leagueSummaries));

console.log('ROSTER_AUDIT_SUMMARY '+JSON.stringify({
  roster:report.roster,negativeSparks:overSpark.length,negativeStars:overStar.length,
  missingSparks:missingSpark.length,missingStars:missingStar.length,
  categoryMismatches:mismatches.length,historicalEventDeltas:eventDeltas.length,
  correctedBaselinePlayers:corrected.length,addedEventBackedSparkFloor:report.eventBackedSupplementTotal
}));
console.log('ROSTER_AUDIT_NEGATIVE_STARS '+JSON.stringify(report.negativeStars.slice(0,20)));
console.log('ROSTER_AUDIT_NEGATIVE_SPARKS '+JSON.stringify(report.negativeSparks.slice(0,20)));
console.log('ROSTER_AUDIT_EVENT_BASE_DIFFERENCES '+JSON.stringify(report.historicEventDifferenceNames));
console.log('ROSTER_AUDIT_MISSING '+JSON.stringify({spark:report.missingSparkNames,star:report.missingStarNames}));
