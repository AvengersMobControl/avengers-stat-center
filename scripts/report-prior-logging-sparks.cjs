#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {create}=require('./create-site-release.cjs');
const {root}=require('./load-site-data.cjs');
const release=create(),R=release.globals.AVENGERS_MEMBER_TIMEZONES;
const people=new Map(release.projection.people.map(p=>[p.name,p]));
const aliases=release.globals.AVENGERS_DATA.aliasMap||{};
const resolve=s=>{let n=s;const seen=new Set();while(aliases[n]&&!seen.has(n)){seen.add(n);n=aliases[n];}return n;};
const rows=(R.rows||[]).filter(r=>['Active','AV2'].includes(r.status)).map(r=>{
 const id=resolve(r.name),p=people.get(id);
 if(!p)throw Error('Missing member '+id);
 return {name:id,clan:r.status==='Active'?'AVENGERS':'AV-2',
   loggedSparks:p.earned.sparks,
   priorToLoggingSparks:p.screenshotGap||0,
   totalSparks:p.totalSparks,
   priorPercent:p.totalSparks>0?Number((100*(p.screenshotGap||0)/p.totalSparks).toFixed(2)):0,
   roundedTotalSparks:Math.round(p.totalSparks),
   categories:Object.fromEntries(Object.entries(p.categories).map(([k,v])=>[k,v.sparks])),
   screenshots:p.snapshotBreakdown||[]};
});
if(rows.length!==101||new Set(rows.map(r=>r.name)).size!==rows.length)throw Error('Expected 101 unique current members from the October 19 approved roster');
rows.sort((a,b)=>b.priorToLoggingSparks-a.priorToLoggingSparks||a.name.localeCompare(b.name));
const positives=rows.filter(r=>r.priorToLoggingSparks>0);
const summary={all:rows.length,positive:positives.length,over1000:positives.filter(r=>r.priorToLoggingSparks>=1000).length,
  below1000:positives.filter(r=>r.priorToLoggingSparks<1000).length,
  priorTotal:positives.reduce((s,r)=>s+r.priorToLoggingSparks,0)};
const dir=path.join(root,'reports');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'prior-to-logging-sparks.json'),JSON.stringify({version:release.projection.version,summary,rows},null,2)+'\n');
const cols=['name','clan','loggedSparks','priorToLoggingSparks','roundedTotalSparks','priorPercent'];
fs.writeFileSync(path.join(dir,'prior-to-logging-sparks.csv'),[cols.join(','),...rows.map(r=>cols.map(k=>r[k]).join(','))].join('\n')+'\n');
console.log('PRIOR_TO_LOGGING_SUMMARY '+JSON.stringify(summary));
console.log('PRIOR_TO_LOGGING_MEMBERS '+JSON.stringify(positives.map(r=>({name:r.name,gap:r.priorToLoggingSparks,clan:r.clan}))));

console.log('PRIOR_TO_LOGGING_COMPLETE '+JSON.stringify(positives.map(r=>({
 name:r.name,clan:r.clan,logged:r.loggedSparks,prior:r.priorToLoggingSparks,
 total:r.roundedTotalSparks,pct:r.priorPercent
}))));
console.log('PRIOR_TO_LOGGING_SUSPECTS '+JSON.stringify(rows.filter(r=>
 ['AV-I.S.O','AV<STAR-LORD>','AV-SMILINGBANDIT','AV-Adigarian'].includes(r.name))));
