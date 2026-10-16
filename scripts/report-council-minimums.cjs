#!/usr/bin/env node
'use strict';
// Council-only generated artifact from public Stat Center event data.
// Read-only; never fetches Discord or changes any event/history/roster file.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {build}=require('./council-minimums-core.cjs');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const tags=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
const sandbox={window:{},console};
vm.createContext(sandbox);
for(const [index,match] of tags.entries()){
  const source=(match[1].match(/\bsrc="([^"]+)"/)||[])[1];
  if(source==='roster-stars-snapshot-2026-10-15.js')break;
  if(source){
    if(source==='community-highlights.js')continue;
    vm.runInContext(fs.readFileSync(path.join(root,source),'utf8'),sandbox,
      {filename:source,timeout:20000});
  }else if(index===0||index<42){
    vm.runInContext(match[2],sandbox,{filename:'index:inline:'+index,timeout:20000});
  }
}
const D=sandbox.window.AVENGERS_DATA;
const league=sandbox.window.AVENGERS_CLAN_LEAGUE_REWARDS;
assert(D?.piggy?.events&&D?.space?.events&&league?.build,
  'Expected Piggy/Space event ledgers and six-league builder');
const periods=league.build().map(p=>({start:p.start,end:p.end}));
const report=build({piggyEvents:D.piggy.events,spaceEvents:D.space.events,
  periods,aliasMap:D.aliasMap||{}});
assert.equal(report.length,6);
const today=report[0];
assert.equal(today.end,'2026-10-11');
assert.equal(today.rules.effectiveDate,'2026-09-11');
for(const p of report){
  for(const row of p.observedEvents){
    assert(row.value>0&&Number.isFinite(row.value));
    if(row.underMinimum)assert(row.policyActive&&row.value<row.limit);
    if(!row.policyActive)assert(!row.underMinimum&&!row.nearMinimum,
      'Do not enforce minimums before Sept 11');
  }
  assert(p.members.every(m=>m.eligibleStart==='unverified'),
    'Membership join evidence is not sufficiently complete to infer missed races');
}
const out={source:'AVENGERS Stat Center Piggy/Space event results',
  generatedFrom:'repository event ledgers; not guaranteed complete',
  policy:'Applies beginning 2026-09-11; no retroactive minimum penalties',
  scope:'observed positive-score race entries only, not attendance assertions',
  important:[
    'A recorded below-minimum score is observable; a missing race entry is NOT a recorded zero or a confirmed failure.',
    'A player without 7,000 observed Piggy lines has UNVERIFIED league-wide compliance, not a confirmed breach, until joins/event coverage are independently checked.',
    'Current roster does not prove historic join dates or clan affiliation; event-time clan may be inferred when not tagged.',
    'Near minimum means score between minimum and 110% inclusive; it is not itself a violation.',
    'Only Piggy/Space events qualify. Flashes and Kraken are excluded.'
  ],leagues:report};
const dir=path.join(root,'reports');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'council-minimums-audit.json'),JSON.stringify(out,null,2)+'\n');
const fmt=n=>n==null?'—':Math.round(n*10)/10;
const lines=['# Council minimums — observed-results audit','','**Evidence, not a membership penalty list.**',
'',...out.important.map(x=>'- '+x),'',
'Policy effective **September 11, 2026**. Piggy: 3,500 lines each observed race and at least one 7,000-line race per league. Space: 30B, except **September 27** at 50B.',
'','| League end | Observed member-races | Below threshold | Within 10% above | Repeated near-limit players | Verified 7,000 Piggy | Not verified 7,000 |',
'|---|---:|---:|---:|---:|---:|---:|',
...report.map(p=>'| '+p.end+' | '+p.summary.observedParticipantRows+' | '+
  p.summary.observedBelowMinimum+' | '+p.summary.nearMinimum+' | '+
  p.summary.repeatedNearMinimumPlayers+' | '+p.summary.oncePerLeaguePiggyMet+' | '+
  p.summary.oncePerLeaguePiggyUnverified+' |'),
'','## Current-policy league: '+today.start+' to '+today.end,'',
'All averages use **recorded positive-score races only**. “7k unverified” is **not** a confirmed miss.',
'',
'| Clan | Member | Piggy races | Avg Piggy lines | Below 3,500 | Near 3,500 | Space races | Avg Space B | Below limit | Near limit | 7k Piggy | Missing appearances (unknown) |',
'|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|',
...today.members.map(m=>'| '+m.clan+' | '+m.name.replace(/\|/g,'\\|')+' | '+m.piggyScores.length+' | '+fmt(m.piggyAverage)+' | '+m.piggyUnder+' | '+m.piggyNear+' | '+m.spaceScores.length+' | '+fmt(m.spaceAverageB)+' | '+m.spaceUnder+' | '+m.spaceNear+' | '+m.piggy7000+' | '+m.unknownAbsences+' |'),
'','## Verified below-minimum recorded race results','',
'| Date | Clan | Member | Race | Recorded score | Minimum | Clan attribution |',
'|---|---|---|---|---:|---:|---|',
...today.observedEvents.filter(x=>x.underMinimum).map(x=>'| '+x.date+' | '+x.clan+' | '+x.name.replace(/\|/g,'\\|')+' | '+x.kind+' | '+x.value+' | '+x.limit+' | '+x.clanAttribution+' |'),
'','*Rows with inferred clan attribution require historical membership confirmation before clan-specific sanctions.*'];
fs.writeFileSync(path.join(dir,'council-minimums-audit.md'),lines.join('\n')+'\n');
console.log('Council minimums report generated: '+report.length+' leagues, '+
  today.summary.observedParticipantRows+' observed positive-score rows in current-policy league');
console.log('Observed below-minimum current league: '+today.summary.observedBelowMinimum);
console.log('Near threshold current league: '+today.summary.nearMinimum);
console.log('Unknown attendance and 7k compliance are not treated as violations');
