#!/usr/bin/env node
'use strict';
// Read-only #6 leader-reported league forfeiture audit. Never zero event/member Sparks.
const fs=require('node:fs'),path=require('node:path');
const {auditRelease,reconstruct}=require('./audit-six-clan-leagues.cjs');
const {create}=require('./create-site-release.cjs');
const policy=require('../data/leader-reported-league-forfeitures.json');
function must(condition,message){if(!condition)throw Error(message);}
function evaluate(periods,sourcePolicy=policy,approximations={'2026-09-06':165000000,'2026-10-11':171000000}){
 must(sourcePolicy?.schemaVersion===1&&Array.isArray(sourcePolicy.entries),'Invalid forfeiture policy');
 const keys=new Set(),byEnd=new Map(periods.map(p=>[p.end,p]));
 must(byEnd.size===periods.length,'Duplicate league periods');
 const entries=sourcePolicy.entries.map(spec=>{
  must(typeof spec.name==='string'&&spec.name.trim()&&['AVENGERS','AV-2'].includes(spec.clan),'Invalid player/clan');
  must(spec.action==='remove_entire_tracked_member_league_sparks','Unsupported forfeiture basis');
  const key=[spec.leagueEnd,spec.clan,spec.name].join('|');
  must(!keys.has(key),'Duplicate forfeiture '+key);keys.add(key);
  const period=byEnd.get(spec.leagueEnd);
  must(period,'Unrecognized period '+spec.leagueEnd);
  const matches=period.members.filter(m=>m.clan===spec.clan&&m.name===spec.name);
  must(matches.length<=1,'Ambiguous exact historical name '+key);
  const m=matches[0];
  return {leagueEnd:spec.leagueEnd,clan:spec.clan,name:spec.name,label:spec.leaderLabel,
   status:m?'found_in_approved_event_rows':'unmatched_requires_name_or_source_review',
   eventRows:m?.events??0,
   knownEarnedSparks:m?.sparks??null,
   unknownSparkRows:m?.unknownSparks??null,
   estimatedKrakenSparks:m?.estimatedKraken??null,
   warning:m?.unknownSparks?'Member historical reward rows include unknown Spark amounts; adjustment is incomplete':null};
 });
 const comparisons=Object.keys(approximations).sort().map(end=>{
  const p=byEnd.get(end);must(p,'Unknown comparison end '+end);
  const source=p.clanSums.AVENGERS.sparks;
  const affected=entries.filter(e=>e.leagueEnd===end&&e.clan==='AVENGERS');
  const complete=affected.every(e=>e.status==='found_in_approved_event_rows'&&e.unknownSparkRows===0);
  const deducted=affected.reduce((s,e)=>s+(e.knownEarnedSparks||0),0);
  return {end,originalTrackedSparks:source,leaderReportedForfeitures:affected.length,
   matched:affected.filter(e=>e.status==='found_in_approved_event_rows').length,
   knownTrackedForfeitureSparks:deducted,
   adjustedTrackedSparks:source-deducted,
   reportedApproximateSparks:approximations[end],
   residualVersusRoundedReference:source-deducted-approximations[end],
   allSpecifiedMembersFound:affected.every(e=>e.status==='found_in_approved_event_rows'),
   allMemberSparksKnown:complete,
   coverageNote:'Derived comparison, not independent certification of complete official league score'};
 });
 return {schemaVersion:1,source:'leader-confirmed forfeiture rule + accepted event-time clan ledger',
  adjustmentScope:'CLAN LEAGUE SCORE ONLY; member earned Sparks, Stars, PBs, frozen Unlogged unchanged',
  entries,comparisons,ledgerModified:false,discordPosting:false,
  previousFlashExclusionHypothesis:'SUPERSEDED by leader confirmation of member-specific disqualification'};
}
module.exports={evaluate};
if(require.main===module){
 try{
  const release=create(),report=evaluate(reconstruct(release.projection.events));
  const dir=path.join(__dirname,'../reports');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'clan-league-forfeiture-review.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
 }catch(e){console.error(e.stack||e.message);process.exitCode=1}
}
