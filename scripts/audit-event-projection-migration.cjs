#!/usr/bin/env node
'use strict';
// Read-only inventory: no guessed clan, no ledger writes, no Discord access.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {canonical}=require('./event-projection-core.cjs');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const context=vm.createContext({window:{},console});
for(const [i,m]of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries()){
  const src=m[1].match(/\bsrc="([^"]+)"/)?.[1];
  if(src==='community-highlights.js')continue;
  const code=src?fs.readFileSync(path.join(root,src),'utf8'):m[2];
  vm.runInContext(code,context,{filename:src||'inline-'+i,timeout:20000});
  if(src==='roster-stars-snapshot-2026-10-15.js')break;
}
const D=context.window.AVENGERS_DATA,report={baseline:'legacy-browser-load-order',kinds:{},blockers:[]};
const aliasIssues=new Set();
function resolve(name){try{return canonical(name,D.aliasMap);}catch(e){aliasIssues.add(e.message);return null;}}
for(const kind of ['piggy','space']){
  const field=kind==='piggy'?'lines':'yearsB',data=D[kind];
  let rows=0,unknownClan=0,unknownScore=0,unknownSparks=0,unknownStars=0,conflictingDuplicates=0,eventHistoryDisagreements=0,historyOnlyRows=0;
  const eventRows=new Map(),historyRows=new Map(),historyConflicts=[];
  for(const [date,rs]of Object.entries(data.events||{}))for(const r of rs||[]){
    if(!r.name||['Total','#N/A'].includes(r.name))continue;rows++;
    const name=resolve(r.name);if(!name)continue;
    const id=date+'|'+name;
    if(eventRows.has(id)&&Number(eventRows.get(id)[field])!==Number(r[field]))conflictingDuplicates++;
    eventRows.set(id,r);
    if(!/^(avengers|av|av2)$/.test(String(r.eventClan||r.raceClan||r.clan||'').toLowerCase().replace(/[^a-z0-9]/g,'')))unknownClan++;
    if(r[field]==null)unknownScore++;if(r.sparks==null)unknownSparks++;if(r.stars==null)unknownStars++;
  }
  for(const [name,rs]of Object.entries(data.history||{}))for(const r of rs||[]){
    const resolved=resolve(name);if(!resolved)continue;
    const id=r.date+'|'+resolved;historyRows.set(id,r);
  }
  for(const [id,r]of historyRows){if(!eventRows.has(id))historyOnlyRows++;
    else if(Number(r[field])!==Number(eventRows.get(id)[field])){eventHistoryDisagreements++;historyConflicts.push({id,eventScore:eventRows.get(id)[field],historyScore:r[field]});}}
  const stalePB=[];
  for(const m of D.members){
    const resolved=resolve(m.name);if(!resolved)continue;
    const values=[...eventRows.entries(),...[...historyRows].filter(([id])=>!eventRows.has(id))]
      .filter(([id])=>id.slice(11)===resolved).map(([,r])=>Number(r[field])).filter(Number.isFinite);
    if(values.length&&Math.abs(Math.max(...values)-(Number(m[kind+'PB'])||0))>0.00001)
      stalePB.push({name:m.name,stored:m[kind+'PB'],observed:Math.max(...values)});
  }
  report.kinds[kind]={dates:Object.keys(data.events||{}).length,rows,unknownClan,unknownScore,unknownSparks,unknownStars,conflictingDuplicates,eventHistoryDisagreements,historyOnlyRows,historyConflicts,storedPBDisagreements:stalePB.length,examples:stalePB.slice(0,5)};
  if(unknownClan)report.blockers.push(kind+': explicit historical clan/provenance missing on '+unknownClan+' rows');
  if(eventHistoryDisagreements||conflictingDuplicates)report.blockers.push(kind+': conflicting result/history rows require source review');
}
report.aliasIssues=[...aliasIssues].sort();
if(aliasIssues.size)report.blockers.push('Alias cycles must be resolved before migration; affected identities excluded from comparison counts.');
report.flash={events:context.window.AVENGERS_PIGGY_FLASH_DATA?.events?.length||0};
report.kraken={months:context.window.AVENGERS_KRAKEN_DATA?.months?.length||0,players:context.window.AVENGERS_KRAKEN_DATA?.players?.length||0};
report.blockers.push('Full ledger migration, consumer adapters, achievements/graphics/export coverage, versioned site build and browser verification remain required.');
console.log(JSON.stringify(report,null,2));
