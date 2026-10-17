'use strict';
// Staging-only foundation for #42. Never reads Discord or mutates browser data.
const {createHash}=require('node:crypto');
const council=require('./council-minimums-core.cjs');
const KINDS=['piggy','space','flash','kraken'];
const UNITS={piggy:'lines',space:'billion-lightyears',flash:'lines',kraken:'million-damage'};
const ENDS=['2026-04-19','2026-05-24','2026-06-28','2026-08-02','2026-09-06','2026-10-11'];
const periods=ENDS.map(end=>{const d=new Date(end+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-34);return {start:d.toISOString().slice(0,10),end};});
function stable(x){
  if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
  if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
  return JSON.stringify(x);
}
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const clone=x=>JSON.parse(JSON.stringify(x));
function requireThat(ok,message){if(!ok)throw Error(message);}
function day(x){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;}
function amount(x,label){requireThat(x===null||(typeof x==='number'&&Number.isFinite(x)&&x>=0),'Invalid '+label+' (use null for unknown)');return x;}
function canonical(raw,aliases={}){
  let name=String(raw||'').trim();const seen=new Set();
  while(aliases[name]&&aliases[name]!==name){requireThat(!seen.has(name),'Alias cycle: '+name);seen.add(name);name=aliases[name];}
  requireThat(typeof name==='string'&&name.trim()&&name!=='Total'&&name!=='#N/A','Invalid player');return name;
}
function normalize(event,aliases={}){
  requireThat(event&&typeof event.id==='string'&&event.id.trim(),'Missing stable event id');
  requireThat(KINDS.includes(event.kind),'Invalid event kind');
  requireThat(day(event.date),'Invalid event date');
  requireThat(['final','partial','revoked'].includes(event.status),'Invalid event status');
  requireThat(event.unit===UNITS[event.kind],'Incorrect score unit');
  requireThat(Array.isArray(event.sources)&&event.sources.length>0&&event.sources.every(s=>typeof s==='string'&&s.trim()),'Missing source references');
  requireThat(Array.isArray(event.rows),'Missing event rows');
  const rows=new Map();
  for(const raw of event.rows){
    const unassigned=raw.player===null&&typeof raw.sourceIdentity==='string'&&raw.sourceIdentity.trim();
    const r={player:unassigned?null:canonical(raw.player,aliases),...(unassigned?{sourceIdentity:raw.sourceIdentity}:{}),clan:raw.clan,score:amount(raw.score,'score'),sparks:amount(raw.sparks,'sparks'),stars:amount(raw.stars,'stars')};
    requireThat(['AVENGERS','AV-2'].includes(r.clan)||(r.clan===null&&raw.clanAttribution==='unknown'),'Explicit event-time clan or marked unknown required');
    if(r.clan===null)r.clanAttribution='unknown';
    if(raw.estimatedSparks===true)r.estimatedSparks=true;
    if(raw.metadata)r.metadata=clone(raw.metadata);
    requireThat(event.kind!=='kraken'||r.stars===null,'Kraken has no Stars');
    const key=r.player||'unassigned:'+r.sourceIdentity;
    const identity=x=>({player:x.player,clan:x.clan,score:x.score,sparks:x.sparks,stars:x.stars});
    requireThat(!rows.has(key)||stable(identity(rows.get(key)))===stable(identity(r)),'Conflicting duplicate player result: '+r.player);
    rows.set(key,r);
  }
  return {id:event.id,kind:event.kind,date:event.date,status:event.status,unit:event.unit,
    ...(event.metadata?{metadata:clone(event.metadata)}:{}),sources:[...new Set(event.sources)].sort(),rows:[...rows.values()].sort((a,b)=>String(a.player||a.sourceIdentity).localeCompare(String(b.player||b.sourceIdentity)))};
}
function empty(){return {schemaVersion:1,events:[],changes:[]};}
function validate(ledger,aliases={}){
  requireThat(ledger?.schemaVersion===1&&Array.isArray(ledger.events)&&Array.isArray(ledger.changes),'Invalid ledger');
  const ids=new Set();
  for(const e of ledger.events){requireThat(!ids.has(e.id),'Duplicate event id');ids.add(e.id);normalize(e,aliases);requireThat(Number.isInteger(e.revision)&&e.revision>0,'Invalid revision');}
}
function apply(ledger,event,{approved=false,expectedRevision=0,aliases={}}={}){
  requireThat(approved===true,'Reviewed approval required');validate(ledger,aliases);
  const incoming=normalize(event,aliases),old=ledger.events.find(e=>e.id===incoming.id);
  if(old&&stable(normalize(old,aliases))===stable(incoming))return {ledger:clone(ledger),action:'unchanged'};
  requireThat((old?.revision||0)===expectedRevision,'Revision conflict');
  if(old)requireThat(old.kind===incoming.kind&&old.unit===incoming.unit,'Event kind/unit cannot change');
  const next=clone(ledger),revision=(old?.revision||0)+1;
  next.events=next.events.filter(e=>e.id!==incoming.id).concat({...incoming,revision}).sort((a,b)=>a.id.localeCompare(b.id));
  next.changes.push({id:incoming.id,revision,before:old?clone(old):null,after:{...incoming,revision}});
  return {ledger:next,action:incoming.status==='revoked'?'revoked':old?'corrected':'inserted'};
}
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const avg=xs=>xs.length?sum(xs)/xs.length:null;
function summary(rows,arenaStart){
  const known=rows.filter(r=>r.score!==null),scores=known.map(r=>r.score),positive=known.filter(r=>r.score>0);
  let best=null,streak=0;const pbs=[];
  for(const r of known){
    const previous=best,isPB=best!==null&&r.score>best;
    streak=isPB?streak+1:0;
    pbs.push({eventId:r.eventId,date:r.date,score:r.score,previousPB:previous,firstRecorded:previous===null,newPB:isPB,
      improvement:isPB&&previous>0?(r.score/previous-1):null,pbStreak:streak});
    best=best===null?r.score:Math.max(best,r.score);
  }
  return {eventsRecorded:rows.length,knownScores:known.length,unknownScores:rows.length-known.length,pb:best,
    average:avg(scores),arenaAverage:avg(known.filter(r=>r.date>=arenaStart).map(r=>r.score)),
    year2026Average:avg(known.filter(r=>r.date>='2026-01-01'&&r.date<'2027-01-01').map(r=>r.score)),
    last3:avg(scores.slice(-3)),positiveScores:positive.length,pbs};
}
function rewards(rows){
  const totals={sparks:0,stars:0,unknownSparks:0,unknownStars:0,events:rows.length};
  for(const r of rows){if(r.sparks===null)totals.unknownSparks++;else totals.sparks+=r.sparks;
    if(r.kind!=='kraken'){if(r.stars===null)totals.unknownStars++;else totals.stars+=r.stars;}}
  return totals;
}
function project(ledger,{aliases={},members=[],snapshots={},priorToLogging=null,arenaStart='2026-08-01'}={}){
  validate(ledger,aliases);requireThat(day(arenaStart),'Invalid arena start');
  const events=ledger.events.map(e=>({...normalize(e,aliases),revision:e.revision})).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  // Ambiguous concurrent events for the same player/date/type require migration review;
  // Flash events legitimately have separate daily IDs, and are not coalesced.
  const seen=new Set();const rows=[];
  for(const e of events.filter(e=>e.status!=='revoked'))for(const r of e.rows){
    const key=[e.kind,e.date,r.player||r.sourceIdentity].join('|');
    requireThat(e.kind==='flash'||!seen.has(key),'Overlapping event identity: '+key);seen.add(key);
    rows.push({...r,eventId:e.id,kind:e.kind,date:e.date,partial:e.status==='partial'});
  }
  const memberMap=new Map();
  for(const m of members){const name=canonical(m.name,aliases);requireThat(!memberMap.has(name),'Duplicate current member');memberMap.set(name,{name,status:m.status});}
  for(const r of rows)if(r.player&&!memberMap.has(r.player))memberMap.set(r.player,{name:r.player,status:'Inactive'});
  const cap=(v,b)=>Math.min(1,(v??0)/b);
  const people=[...memberMap.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(m=>{
    const history=rows.filter(r=>r.player===m.name),kinds=Object.fromEntries(KINDS.map(k=>[k,summary(history.filter(r=>r.kind===k),arenaStart)]));
    const categories=Object.fromEntries(KINDS.map(k=>[k,rewards(history.filter(r=>r.kind===k))]));
    const earned=rewards(history),evidence=Object.hasOwn(snapshots,m.name)?snapshots[m.name]:null;
    const sources=evidence===null?[]:Array.isArray(evidence)?evidence:[evidence];
    const ordered=[...sources].sort((a,b)=>String(a?.beforeDate||'9999-12-31').localeCompare(String(b?.beforeDate||'9999-12-31'))||Number(a?.amount||0)-Number(b?.amount||0));
    const snapshotBreakdown=ordered.map(item=>{
      const obj=typeof item==='number'?{amount:item}:item;
      requireThat(obj&&typeof obj==='object','Invalid snapshot source');
      const snapshot=amount(obj.amount,'snapshot'),beforeDate=obj.beforeDate??null,clan=obj.clan??null;
      if(beforeDate!==null)requireThat(day(beforeDate),'Invalid snapshot date');
      if(clan!==null)requireThat(['AVENGERS','AV-2'].includes(clan),'Invalid snapshot clan');
      const loggedAtSnapshot=beforeDate?rewards(history.filter(r=>r.date<beforeDate)).sparks:earned.sparks;
      const gap=snapshot===null?0:Math.max(0,snapshot-loggedAtSnapshot);
      return {clan,beforeDate,amount:snapshot,loggedAtSnapshot,gap,sourceName:obj.sourceName||null,label:obj.label||null};
    });
    // Screenshots are observations, not additive transfer-stint balances.
    const calculatedGap=sources.length?Math.max(0,...snapshotBreakdown.map(s=>s.gap)):null;
    // The reviewed, committed historical baseline is immutable. New rewards,
    // changes of clan and later screenshots must not recalculate this value.
    const frozen=priorToLogging!==null;
    const screenshotGap=frozen
      ?amount(Object.hasOwn(priorToLogging,m.name)?priorToLogging[m.name]:0,'prior-to-logging Sparks')
      :calculatedGap;
    const loggedAtSnapshot=sources.length?snapshotBreakdown.at(-1).loggedAtSnapshot:earned.sparks;
    const ratingPB=cap(kinds.piggy.pb,35000)+cap(kinds.space.pb,350)+cap(kinds.kraken.pb,3500);
    const ratingAvg=cap(kinds.piggy.arenaAverage,25000)+cap(kinds.space.arenaAverage,200)+cap(kinds.kraken.last3,2800);
    return {...m,kinds,categories,history,earned,screenshotGap,loggedAtSnapshot,snapshotBreakdown,totalSparks:earned.sparks+(screenshotGap??0),
      totalSparksComplete:earned.unknownSparks===0&&sources.length>0,
      ratingPB,ratingAvg,ratingTotal:ratingPB+ratingAvg,ratingComplete:['piggy','space','kraken'].every(k=>kinds[k].knownScores>0&&kinds[k].unknownScores===0)};
  });
  const clans=Object.fromEntries(['AVENGERS','AV-2'].map(c=>[c,rewards(rows.filter(r=>r.clan===c))]));
  const leagues=periods.map(p=>({...p,clans:Object.fromEntries(['AVENGERS','AV-2'].map(c=>[c,rewards(rows.filter(r=>r.clan===c&&r.date>=p.start&&r.date<=p.end))]))}));
  const rankings={};
  for(const metric of ['ratingTotal',...KINDS.map(k=>k+'PB')]){
    const value=p=>metric==='ratingTotal'?p.ratingTotal:p.kinds[metric.slice(0,-2)].pb;
    let rank=0,previous=null;
    rankings[metric]=people.filter(p=>value(p)!==null).sort((a,b)=>value(b)-value(a)||a.name.localeCompare(b.name)).map((p,i)=>{
      const score=value(p);if(previous!==score)rank=i+1;previous=score;return {name:p.name,value:score,rank};
    });
  }
  const councilEvents={piggyEvents:{},spaceEvents:{}};
  for(const r of rows.filter(r=>r.player&&r.clan&&['piggy','space'].includes(r.kind))){
    const dest=councilEvents[r.kind+'Events'];(dest[r.date]??=[]).push({name:r.player,clan:r.clan,[r.kind==='piggy'?'lines':'yearsB']:r.score});
  }
  const output={schemaVersion:1,events,people,clans,leagues,rankings,council:council.build({...councilEvents,periods}),
    coverage:{unassignedRows:rows.filter(r=>!r.player),unknownClanRows:rows.filter(r=>!r.clan).length,unknownClanRewards:rewards(rows.filter(r=>!r.clan)),partialEvents:events.filter(e=>e.status==='partial').map(e=>e.id),unknownRewards:rows.filter(r=>r.sparks===null||(r.kind!=='kraken'&&r.stars===null)).length}};
  // Version includes identity, membership, screenshot references and policy, not just events.
  output.version=hash({ledger,aliases,members:[...members].sort((a,b)=>a.name.localeCompare(b.name)),snapshots,arenaStart,projection:output});
  return output;
}
module.exports={empty,apply,project,normalize,canonical,stable,UNITS,periods};
