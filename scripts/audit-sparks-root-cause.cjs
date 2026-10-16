#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const tags=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
const sandbox={window:{},console};vm.createContext(sandbox);
for(const [i,t] of tags.entries()){
  const f=(t[1].match(/\bsrc="([^"]+)"/)||[])[1];
  if(f){if(f==='community-highlights.js')continue;
    vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),sandbox,{filename:f,timeout:20000});
    if(f==='roster-stars-snapshot-2026-10-15.js')break;
  } else if(i===0||i<42){vm.runInContext(t[2],sandbox,{filename:'inline:'+i,timeout:20000});}
}
const w=sandbox.window,D=w.AVENGERS_DATA,K=w.AVENGERS_KRAKEN_DATA,L=w.AVENGERS_ROSTER_SPARKS_LEDGER,B=w.AVENGERS_ROSTER_EVENT_BREAKDOWN,R=w.AVENGERS_MEMBER_TIMEZONES,S=w.AVENGERS_SPARKS_SNAPSHOT;
function canon(n){const seen=new Set();while(D.aliasMap?.[n]&&!seen.has(n)){seen.add(n);n=D.aliasMap[n];}return n;}
const current=(R.rows||[]).filter(x=>['Active','AV2'].includes(x.status));
const krakenMap=new Map();
(K.players||[]).forEach(x=>{const k=canon(x.name);const p=krakenMap.get(k);if(!p||Number(x.totalSparks)>Number(p.totalSparks))krakenMap.set(k,x);});
const snapshotMap=new Map([...(S.currentAvengers||[]),...(S.currentAv2||[])].map(x=>[canon(x.profileName||x.name),x]));
const storedMap=new Map((D.members||[]).map(x=>[canon(x.name),x]));
const raw={piggy:new Map(),space:new Map()};
for(const kind of ['piggy','space']){
  for(const [date,rows] of Object.entries(D[kind]?.events||{})){
    for(const r of rows||[]){
      if(!r?.name||r.name==='Total'||r.name==='#N/A')continue;
      const clan=String(r.clan||r.eventClan||r.raceClan||'').toUpperCase().replace(/[^A-Z0-9]/g,'')||'?';
      const id=date+'|'+clan+'|'+canon(r.name);
      const value=r.sparks==null||r.sparks===''?0:Math.max(0,Number(r.sparks)||0);
      const prev=raw[kind].get(id);
      if(!prev||value>prev.sparks)raw[kind].set(id,{name:canon(r.name),sparks:value});
    }
  }
}
function total(kind,n){let sum=0;raw[kind].forEach(r=>{if(r.name===n)sum+=r.sparks});return sum;}
// Council-provided recent Sparks comparisons. Zolika explicitly excluded as a
// validation benchmark: they participated before the currently covered history.
// All 100 current players, including Zolika, remain in the systemic audit.
const targets=[['Saber','AV.Saberkong',17620180],['Abu','AV-Abu//JPN',15902449],
 ['Animosity','AV-Animosity',12672420],['Finnie','AV-Finnie',14956807],['Bil','AV-8!l...Bil',13245089]];
const targetMap=new Map(targets.map(([label,n,t])=>[canon(n),{label,expected:t}]));
const rows=current.map(r=>{
  const n=canon(r.name),m=storedMap.get(n)||{},p=krakenMap.get(n)||{},e=L.forMember(n),b=B.forMember(n,Number(m.totalSparks)||0);
  const pb=total('piggy',n),sp=total('space',n),fl=Number(e.flashSparks)||0,kr=Number(p.totalSparks)||0;
  const base=Math.max(0,Number(m.totalSparks)||0),remainder=b.krakenSparks,logged=b.eventLoggedSparks;
  const snap=snapshotMap.get(n);
  const snapValue=snap?.allTimeSparks??null;
  const unlogged=snapValue==null?0:Math.max(0,Number(snapValue)-logged);
  const t=targetMap.get(n)||null;
  const oldKrakenAggregateFour=pb+sp+fl+kr;
  // Unlike K.players.totalSparks, the actual displayed categories are built
  // independently from each Kraken event's damage and historical clan.
  const four=b.piggySparks+b.spaceSparks+b.flashSparks+b.krakenSparks;
  const oldK=kr-(Number(e.octKrakenSparks)||0);
  const extraOct=Number(e.octKrakenSparks)||0;
  return {display:r.name,canonical:n,clan:r.status,storedBase:base,piggy:pb,space:sp,flash:fl,
    krakenPublishedTotal:kr,octAddedToKrakenTotal:extraOct,juneAdditional:Number(e.juneKrakenSparks)||0,
    storedBaseResidualKraken:Math.max(0,base-pb-sp),
    eventBackedBase:b.eventBackedBaseFloor,baseSupplement:b.baseSupplementSparks,
    shownKraken:remainder,shownLogged:logged,shownUnlogged:unlogged,shownTotal:logged+unlogged,
    fourCategorySum:four,diffShownVsFour:logged-four,oldKrakenAggregateFour,krakenAggregateDifference:b.krakenSparks-(kr+(Number(e.juneKrakenSparks)||0)),storedBaseDiffVsSources:base-(pb+sp+oldK),
    septSnapshot:snapValue,reportedTarget:t?.expected??null,example:t?.label??null,
    diffVsUserTarget:t?logged-t.expected:null};
});
console.log('ROSTER-SCOPE audit: '+rows.length+' current member identities');
console.log('External reference examples: '+targets.length+' (Zolika excluded as prehistory); Animosity 12,672,420; screenshot rounding not yet quantified');
const cases=rows.filter(x=>x.example);
for(const r of cases)console.log('EXAMPLE '+JSON.stringify(r));
const signs=rows.filter(r=>r.diffShownVsFour>5000).sort((a,b)=>b.diffShownVsFour-a.diffShownVsFour);
console.log('POSITIVE logged minus 4-category sum >5k: '+signs.length);
console.log('SUM logged-minus-four over roster: '+rows.reduce((s,r)=>s+r.diffShownVsFour,0));
console.log('SUM legacy base minus piggy,space,preOctKraken: '+rows.reduce((s,r)=>s+r.storedBaseDiffVsSources,0));
console.log('TOP OVERAGES: '+JSON.stringify(signs.slice(0,18).map(x=>({name:x.display,shown:x.shownLogged,four:x.fourCategorySum,excess:x.diffShownVsFour,base:x.storedBase,baseDiff:x.storedBaseDiffVsSources}))));
console.log('JUNE reconstruction rows: '+(L.sources.juneKrakenReconstructed||[]).length);
console.log('LEGACY Kraken subtotal discrepancy vs independent event-derived Kraken: '+
  rows.reduce((sum,row)=>sum+row.krakenAggregateDifference,0));
console.log('EVENT-SOURCE coverage: '+rows.filter(row=>Math.abs(row.diffShownVsFour)>0.01).length+
  ' members fail four-category invariant (must be zero)');
const six=w.AVENGERS_CLAN_LEAGUE_REWARDS?.build()||[];
for(const name of ['AV.Saberkong','AV-Abu//npjp','AV-Animosity','AV-Finnie','AV-8!l...Bil']){
  const byLeague=six.map(p=>({end:p.end,entries:p.rows.filter(x=>canon(x.name)===canon(name)).map(x=>({clan:x.clan,krakenSparks:x.krakenSparks,estimated:x.estimatedKraken}))})).filter(p=>p.entries.length);
  console.log('MONTHLY_KRAKEN_SOURCE '+JSON.stringify({name,byLeague}));
}

const report={notes:[
  'All 100 current roster members are audited. Zolika is excluded ONLY as an external validation benchmark because some membership predates the available source history.',
  'Four-category sum includes K.players.totalSparks, which already includes October when published; Kraken rewards estimated from historical damage and may use non-event time clans.',
  'Five user-provided comparison values are benchmarks, not source-of-truth replacements. Screenshot rounding, truncation and observation-time differences must be checked before calling small residuals arithmetic inflation.',
  'Animosity user reference corrected to 12,672,420; its earlier 126,722,420 value was a typo.',
  'Signed net of per-player differences does not measure total Sparks inflation and should not be interpreted as a confirmed accounting correction.'
],comparisonReference:{numberOfExternalBenchmarks:targets.length,excluded:['AV-Zolika.x.Kira'],roundingTolerance:'unknown; requires source-display precision and screenshot times'},rows};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/sparks-root-cause-diagnostic.json'),JSON.stringify(report,null,2)+'\n');
