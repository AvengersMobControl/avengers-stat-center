#!/usr/bin/env node
'use strict';
// Read-only #6 reconciliation: independent per-event sums versus six-league
// site and projection adapters. Missing historical rewards stay unknown.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {periods}=require('./event-projection-core.cjs');
const KINDS=['piggy','space','flash','kraken'],CLANS=['AVENGERS','AV-2'];
const eq=(a,b,label)=>assert(Math.abs(a-b)<.001,label+': '+a+' != '+b);
const blank=()=>({piggySparks:0,spaceSparks:0,flashSparks:0,krakenSparks:0,
  piggyStars:0,spaceStars:0,flashStars:0,sparks:0,stars:0,events:0,missing:0,
  knownSparks:0,knownStars:0,unknownSparks:0,unknownStars:0,estimatedKraken:0,
  partialRows:0,unassignedRows:0});
function reconstruct(events,windows=periods){
 assert(Array.isArray(events)&&windows.length===6,'Six periods and events required');
 const live=events.filter(e=>e.status!=='revoked'),ids=new Set();
 for(const e of live){assert(!ids.has(e.id),'Duplicate event ID');ids.add(e.id);assert(KINDS.includes(e.kind),'Unknown kind');}
 const out=windows.map(p=>{
  const clanSums=Object.fromEntries([...CLANS,'Unknown'].map(c=>[c,blank()])),people=new Map();
  const eventClanIds=new Set(),byKind=Object.fromEntries(KINDS.map(k=>[k,0])),partial=[];
  for(const e of live.filter(e=>e.date>=p.start&&e.date<=p.end)){
   byKind[e.kind]++;if(e.status==='partial')partial.push(e.id);
   for(const r of e.rows){
    const clan=r.clan===null?'Unknown':r.clan;
    assert(Object.hasOwn(clanSums,clan),'Invalid event clan');
    assert(r.player||r.sourceIdentity,'Missing source identity');
    assert(r.sparks===null||Number.isFinite(r.sparks)&&r.sparks>=0,'Invalid Sparks');
    assert(r.stars===null||Number.isFinite(r.stars)&&r.stars>=0,'Invalid Stars');
    if(e.kind==='kraken')assert.equal(r.stars,null,'Kraken Stars not allowed');
    const key=clan+'|'+(r.player||'unassigned:'+r.sourceIdentity);
    const member=people.get(key)||{...blank(),name:r.player||'Unassigned account',clan};
    for(const t of [member,clanSums[clan]]){
     t.events++;
     if(e.status==='partial')t.partialRows++;
     if(!r.player)t.unassignedRows++;
     if(r.sparks===null)t.unknownSparks++;
     else{t.knownSparks++;t[e.kind+'Sparks']+=r.sparks;t.sparks+=r.sparks;}
     if(e.kind!=='kraken'){
      if(r.stars===null)t.unknownStars++;
      else{t.knownStars++;t[e.kind+'Stars']+=r.stars;t.stars+=r.stars;}
     }
     if(r.sparks===null||(e.kind!=='kraken'&&r.stars===null))t.missing++;
     if(e.kind==='kraken'&&r.estimatedSparks===true&&r.sparks!==null)t.estimatedKraken+=r.sparks;
    }
    eventClanIds.add(e.id+'|'+clan);
    people.set(key,member);
   }
  }
  return {...p,clanSums,members:[...people.values()],
    eventCount:eventClanIds.size,byKind,partialEvents:partial.sort()};
 });
 for(let i=1;i<out.length;i++){
  const prev=new Date(out[i-1].end+'T00:00:00Z');
  prev.setUTCDate(prev.getUTCDate()+1);
  assert.equal(out[i].start,prev.toISOString().slice(0,10),'League date gap/overlap');
 }
 return out;
}
function auditRelease(release){
 assert(release?.projection?.events&&Array.isArray(release.leagues),'Canonical release required');
 const expected=reconstruct(release.projection.events);
 assert.equal(release.leagues.length,6);assert.equal(release.projection.leagues.length,6);
 const sixPeriods=[];
 for(const p of expected){
  const ui=release.leagues.find(x=>x.start===p.start&&x.end===p.end);
  const source=release.projection.leagues.find(x=>x.start===p.start&&x.end===p.end);
  assert(ui&&source,'Missing period in UI/projector '+p.end);
  const found=new Map(ui.rows.map(x=>[x.clan+'|'+x.name,x]));
  assert.equal(found.size,p.members.length,'Missing or duplicate league member rows '+p.end);
  for(const rec of p.members){
   const x=found.get(rec.clan+'|'+rec.name);
   assert(x,'Missing historical member '+p.end+' '+rec.clan+'|'+rec.name);
   for(const key of [...KINDS.map(k=>k+'Sparks'),'piggyStars','spaceStars','flashStars','sparks','stars'])
    eq(x[key],rec[key],p.end+' '+rec.name+' '+key);
   assert.equal(x.events,rec.events,'Event count drift');
   assert.equal(x.missing,rec.missing,'Missing reward counter drift');
   assert.equal(x.sparkKnown,rec.knownSparks,'Known Spark counter drift');
   assert.equal(x.starKnown,rec.knownStars,'Known Star counter drift');
   eq(x.estimatedKraken,rec.estimatedKraken,'Estimated Kraken drift');
  }
  assert.equal(ui.eventCount,p.eventCount,'League event ID counts differ');
  assert.equal(ui.memberEventCount,p.members.reduce((n,x)=>n+x.events,0),'League row count drift');
  assert.equal(ui.gaps,p.members.reduce((n,x)=>n+x.missing,0),'League reward gap drift');
  assert.equal(ui.estimates,p.members.filter(x=>x.estimatedKraken>0).length,'Kraken estimate count drift');
  for(const clan of CLANS){
   const r=p.clanSums[clan],x=source.clans[clan];
   assert(x,'Projection missing '+clan);
   eq(x.sparks,r.sparks,p.end+' '+clan+' Sparks');
   eq(x.stars,r.stars,p.end+' '+clan+' Stars');
   assert.equal(x.unknownSparks,r.unknownSparks,'Unknown source Sparks count differs');
   assert.equal(x.unknownStars,r.unknownStars,'Unknown source Stars count differs');
   assert.equal(x.events,r.events,'Source event rows differ');
  }
  const clanTotals=Object.fromEntries(CLANS.map(clan=>[clan,p.clanSums[clan]]));
  sixPeriods.push({start:p.start,end:p.end,clanTotals,
   knownClanSparks:CLANS.reduce((n,c)=>n+p.clanSums[c].sparks,0),
   knownClanStars:CLANS.reduce((n,c)=>n+p.clanSums[c].stars,0),
   unknownClanRows:p.clanSums.Unknown.events,unknownClanSparks:p.clanSums.Unknown.sparks,
   unassignedRows:Object.values(p.clanSums).reduce((n,x)=>n+x.unassignedRows,0),
   missingSparkRows:Object.values(p.clanSums).reduce((n,x)=>n+x.unknownSparks,0),
   missingStarRows:Object.values(p.clanSums).reduce((n,x)=>n+x.unknownStars,0),
   estimatedKrakenSparks:Object.values(p.clanSums).reduce((n,x)=>n+x.estimatedKraken,0),
   byKind:p.byKind,eventCount:p.eventCount,partialEventIds:p.partialEvents});
 }
 const newest=sixPeriods.at(-1),previous=sixPeriods.at(-2);
 // Reported 165M -> 171M is NOT presumed identical to known participant rewards.
 const reference={reportedEarlier:165000000,reportedLatest:171000000,reportedChange:6000000,
  verifiedMemberRewardsEarlier:previous.knownClanSparks,
  verifiedMemberRewardsLatest:newest.knownClanSparks,
  comparisonStatus:'unverified-scope',
  note:'Leader-reported league Sparks may represent whole-clan awards/pots; event member rewards are only a verified lower bound where source images or payouts are missing.'};
 return {schemaVersion:1,projectionVersion:release.projection.version,
   source:'accepted-event-ledger',sixPeriods,reference,
   verified:'all six period/clan/member/category rollups match independent event rows',
   dataModified:false,discordPosting:false};
}
function csv(report){
 const rows=[['Start','End','Clan','Piggy Sparks','Space Sparks','Flash Sparks','Kraken Sparks','Known Sparks','Known Stars','Missing Spark rewards','Missing Star rewards','Estimated Kraken Sparks','Partial event IDs','Unknown-clan rows']];
 for(const p of report.sixPeriods)for(const clan of CLANS){
  const x=p.clanTotals[clan];
  rows.push([p.start,p.end,clan,x.piggySparks,x.spaceSparks,x.flashSparks,x.krakenSparks,x.sparks,x.stars,x.unknownSparks,x.unknownStars,x.estimatedKraken,p.partialEventIds.join(';'),p.unknownClanRows]);
 }
 return rows.map(row=>row.map(z=>{const s=String(z??'');return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}).join(',')).join('\n')+'\n';
}
module.exports={reconstruct,auditRelease,csv};
if(require.main===module){
 try{
  const {create}=require('./create-site-release.cjs');
  const result=auditRelease(create());
  const folder=path.resolve(__dirname,'../reports');fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'clan-league-ledger-audit.json'),JSON.stringify(result,null,2)+'\n');
  fs.writeFileSync(path.join(folder,'clan-league-ledger-audit.csv'),csv(result));
  console.log(JSON.stringify({projectionVersion:result.projectionVersion,
   periods:result.sixPeriods.map(p=>({end:p.end,knownClanSparks:p.knownClanSparks,missingSparkRows:p.missingSparkRows,unknownClanRows:p.unknownClanRows,estimatedKrakenSparks:p.estimatedKrakenSparks,partialEvents:p.partialEventIds.length})),
   leaderReference:result.reference,files:['reports/clan-league-ledger-audit.csv','reports/clan-league-ledger-audit.json']},null,2));
 }catch(error){console.error(error.stack||error);process.exitCode=1;}
}
