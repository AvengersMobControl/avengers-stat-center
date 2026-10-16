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
const targets=[['Saber','AV.Saberkong',17620180],['Zolika','AV-Zolika.x.Kira',16174707],['Abu','AV-Abu//JPN',15902449],
 ['Animosity','AV-Animosity',126722420],['Finnie','AV-Finnie',14956807],['Bil','AV-8!l...Bil',13245089]];
const targetMap=new Map(targets.map(([label,n,t])=>[canon(n),{label,expected:t}]));
const rows=current.map(r=>{
  const n=canon(r.name),m=storedMap.get(n)||{},p=krakenMap.get(n)||{},e=L.forMember(n),b=B.forMember(n,Number(m.totalSparks)||0);
  const pb=total('piggy',n),sp=total('space',n),fl=Number(e.flashSparks)||0,kr=Number(p.totalSparks)||0;
  const base=Math.max(0,Number(m.totalSparks)||0),remainder=b.krakenSparks,logged=b.eventLoggedSparks;
  const snap=snapshotMap.get(n);
  const snapValue=snap?.allTimeSparks??null;
  const unlogged=snapValue==null?0:Math.max(0,Number(snapValue)-logged);
  const t=targetMap.get(n)||null;
  const four=pb+sp+fl+kr;
  const oldK=kr-(Number(e.octKrakenSparks)||0);
  const extraOct=Number(e.octKrakenSparks)||0;
  return {display:r.name,canonical:n,clan:r.status,storedBase:base,piggy:pb,space:sp,flash:fl,
    krakenPublishedTotal:kr,octAddedToKrakenTotal:extraOct,juneAdditional:Number(e.juneKrakenSparks)||0,
    storedBaseResidualKraken:Math.max(0,base-pb-sp),
    eventBackedBase:b.eventBackedBaseFloor,baseSupplement:b.baseSupplementSparks,
    shownKraken:remainder,shownLogged:logged,shownUnlogged:unlogged,shownTotal:logged+unlogged,
    fourCategorySum:four,diffShownVsFour:logged-four,storedBaseDiffVsSources:base-(pb+sp+oldK),
    septSnapshot:snapValue,reportedTarget:t?.expected??null,example:t?.label??null,
    diffVsUserTarget:t?logged-t.expected:null};
});
console.log('ROSTER-SCOPE audit: '+rows.length+' current member identities');
const cases=rows.filter(x=>x.example);
for(const r of cases)console.log('EXAMPLE '+JSON.stringify(r));
const signs=rows.filter(r=>r.diffShownVsFour>5000).sort((a,b)=>b.diffShownVsFour-a.diffShownVsFour);
console.log('POSITIVE logged minus 4-category sum >5k: '+signs.length);
console.log('SUM logged-minus-four over roster: '+rows.reduce((s,r)=>s+r.diffShownVsFour,0));
console.log('SUM legacy base minus piggy,space,preOctKraken: '+rows.reduce((s,r)=>s+r.storedBaseDiffVsSources,0));
console.log('TOP OVERAGES: '+JSON.stringify(signs.slice(0,18).map(x=>({name:x.display,shown:x.shownLogged,four:x.fourCategorySum,excess:x.diffShownVsFour,base:x.storedBase,baseDiff:x.storedBaseDiffVsSources}))));
console.log('JUNE reconstruction rows: '+(L.sources.juneKrakenReconstructed||[]).length);
const report={notes:['Four-category sum includes K.players.totalSparks, which already includes October when published; Kraken rewards estimated from historical damage and may use non-event time clans','The six target figures are user-provided; Animosity value seems order of magnitude unusual, retained unchanged pending verification'],rows};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/sparks-root-cause-diagnostic.json'),JSON.stringify(report,null,2)+'\n');
