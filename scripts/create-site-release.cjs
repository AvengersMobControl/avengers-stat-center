'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {load,root}=require('./load-site-data.cjs');
const {migrate,copy,number}=require('./migrate-event-ledger.cjs');
const {apply,project,canonical}=require('./event-projection-core.cjs');
const sum=(rs,key)=>rs.reduce((s,r)=>s+(number(r[key])||0),0);
const average=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
function refreshHistoricalPayouts(ledger){
  const live=ledger.events.filter(e=>e.status!=='revoked'),proof=new Map();
  for(const e of live.filter(e=>e.kind!=='kraken'))for(const r of e.rows){
    if(!r.player||!r.clan||!(r.score>0||r.sparks>0||r.stars>0))continue;
    const list=proof.get(r.player)||[];list.push({date:e.date,clan:r.clan,eventId:e.id});proof.set(r.player,list);
  }
  for(const e of live.filter(e=>e.kind==='kraken'))for(const r of e.rows){
    if(r.metadata?.payoutPolicy!=='historical-clan-rate')continue;
    const start=new Date(Date.parse(e.date)-34*86400000).toISOString().slice(0,10);
    const nearby=(proof.get(r.player)||[]).filter(p=>p.date>=start&&p.date<=e.date).sort((a,b)=>b.date.localeCompare(a.date));
    const latest=nearby[0],known=latest&&!nearby.some(p=>p.date===latest.date&&p.clan!==latest.clan);
    r.clan=known?latest.clan:null;r.sparks=known?r.score*(latest.clan==='AVENGERS'?750:500):null;
    if(known){r.estimatedSparks=true;delete r.clanAttribution;r.metadata.clanEvidenceEvent=latest.eventId;}
    else{delete r.estimatedSparks;r.clanAttribution='unknown';delete r.metadata.clanEvidenceEvent;}
  }
}
function create({updates=JSON.parse(fs.readFileSync(path.join(root,'data/approved-event-updates.json'),'utf8')).updates}={}){
  const legacy=load(),migration=migrate(legacy),aliases=migration.aliases,resolve=n=>canonical(n,aliases);
  let ledger=migration.ledger;
  for(const update of updates){
    if(update.approved!==true)throw Error('Unreviewed event update cannot be published');
    ledger=apply(ledger,update.event,{approved:true,expectedRevision:update.expectedRevision,aliases}).ledger;
  }
  refreshHistoricalPayouts(ledger);
  const D=copy(legacy.AVENGERS_DATA),K=copy(legacy.AVENGERS_KRAKEN_DATA),S=copy(legacy.AVENGERS_SPARKS_SNAPSHOT),R=copy(legacy.AVENGERS_MEMBER_TIMEZONES);
  const memberMap=new Map();for(const m of D.members){const name=resolve(m.name);if(!memberMap.has(name))memberMap.set(name,{...m,name});}
  // Current roster authority is applied only to current status, not past events.
  for(const r of R.rows||[]){const name=resolve(r.profileName||r.name);if(memberMap.has(name))memberMap.get(name).status=r.status;}
  // Game "All time" clan Sparks reset when a player moves between clans.
  // Screenshots are per-clan contribution balances, NOT account lifetime totals.
  // Keep old-clan evidence on the canonical player when the member transfers.
  const snapshots={};
  const sources=[
    ...(S.currentAvengers||[]).map(r=>({...r,clan:'AVENGERS',beforeDate:'2026-09-30',snapshotLabel:'2026-09-29'})),
    ...(S.currentAv2||[]).map(r=>({...r,clan:'AV-2',beforeDate:'2026-10-16',snapshotLabel:'2026-10-15'})),
    ...(S.preSpaceOct16||[]).map(r=>({...r,clan:'AVENGERS'})),
    ...(S.historicalSparkFloors||[]).map(r=>({...r,clan:r.clan||'AVENGERS'}))
  ];
  for(const r of sources){
    if(r.allTimeSparks==null)continue;
    const name=resolve(r.profileName||r.name);
    (snapshots[name]??=[]).push({
      amount:Number(r.allTimeSparks),clan:r.clan,beforeDate:r.beforeDate,
      label:r.snapshotLabel||'',sourceName:r.name,
      ...(r.stintId?{stintId:r.stintId}:{}),
      ...(r.stintStart?{stintStart:r.stintStart}:{})
    });
  }
  const p=project(ledger,{aliases,members:[...memberMap.values()].map(m=>({name:m.name,status:m.status})),snapshots,arenaStart:D.meta.arenaStart});
  const metrics=require('../event-reward-metrics.js');
  for(const person of p.people)person.effort=Object.fromEntries(['piggy','space','flash'].map(kind=>[kind,metrics.summarize(person.history.filter(r=>r.kind===kind))]));
  const activeEvents=p.events.filter(e=>e.status!=='revoked');
  for(const kind of ['piggy','space']){
    const X=D[kind],field=kind==='piggy'?'lines':'yearsB',events=activeEvents.filter(e=>e.kind===kind);
    X.events={};X.history={};X.latestPBs=[];X.latestNewMembers=[];
    X.historicalIncompleteDates=Object.fromEntries(events.filter(e=>e.status==='partial').map(e=>[e.date,e.metadata?.coverageNote||legacy.AVENGERS_DATA[kind].historicalIncompleteDates?.[e.date]||'Partial final-result coverage; only observed results are included.']));
    for(const e of events){
      if(e.revision>1){delete X.historicalRewardTotals?.[e.date];delete X.historicalPotTotals?.[e.date];}
      X.events[e.date]=e.rows.map(r=>({...r.metadata,name:r.player,username:r.player,status:memberMap.get(r.player)?.status||'Inactive',
        [field]:r.score,...(kind==='space'?{years:r.score===null?null:r.score*1e9}:{}),sparks:r.sparks,stars:r.stars,clan:r.clan||'Unknown',eventClan:r.clan||'Unknown',partial:e.status==='partial'}));
      for(const r of X.events[e.date]){const h=X.history[r.name]||[];h.push({...r,date:e.date,code:e.date.replaceAll('-','').slice(2)});X.history[r.name]=h;}
    }
    const latest=events.at(-1)?.date||null;D.meta[kind==='piggy'?'latestPiggy':'latestSpace']=latest;
    X.overall=[];
    for(const person of p.people){
      const s=person.kinds[kind],rows=(X.history[person.name]||[]).filter(r=>r[field]!==null&&r[field]>0);
      if(!rows.length)continue;
      const arena=rows.filter(r=>r.date>=D.meta.arenaStart),year=rows.filter(r=>r.date>='2026-01-01'&&r.date<'2027-01-01');
      const before=rows.filter(r=>r.date<latest),previous=before.length?Math.max(...before.map(r=>r[field])):0;
      const base={name:person.name,status:person.status,pb:s.pb,prevPB:previous,oldPB:previous,improvement:previous>0?(s.pb-previous)/previous:0,
        totalStars:sum(rows,'stars'),totalSparks:sum(rows,'sparks'),eventsPlayed:rows.length,avgLast3:s.last3};
      if(kind==='piggy')Object.assign(base,{totalLines:sum(rows,'lines'),avg2026:s.year2026Average||0,avgArena:s.arenaAverage||0,
        avgStars2026:average(year.map(r=>r.stars||0)),avgSparks2026:average(year.map(r=>r.sparks||0)),
        avgStarsArena:average(arena.map(r=>r.stars||0)),avgSparksArena:average(arena.map(r=>r.sparks||0))});
      else Object.assign(base,{totalYears:sum(rows,'yearsB'),avgYears:s.average||0,avgStars:average(rows.map(r=>r.stars||0)),avgSparks:average(rows.map(r=>r.sparks||0)),pbYears:s.pb});
      X.overall.push(base);
      const transition=s.pbs.find(r=>r.date===latest),current=rows.find(r=>r.date===latest);
      if(current&&transition?.firstRecorded)X.latestNewMembers.push({name:person.name,score:current[field],clan:current.clan,status:person.status});
      else if(current&&transition?.newPB)X.latestPBs.push({name:person.name,score:current[field],previous:transition.previousPB,improvement:transition.improvement,clan:current.clan,status:person.status});
    }
    X.overall.sort((a,b)=>b.pb-a.pb).forEach((r,i)=>r.pbRank=i+1);
    X.overall.slice().sort((a,b)=>(kind==='piggy'?b.avgArena-a.avgArena:b.avgYears-a.avgYears)).forEach((r,i)=>r.avgRank=i+1);
    X.latestPBs.sort((a,b)=>b.improvement-a.improvement);
    X.clanTrend=events.filter(e=>e.date>=D.meta.arenaStart).map(e=>{const rs=X.events[e.date].filter(r=>r.clan==='AVENGERS'&&r[field]>0);return {date:e.date,total:sum(rs,field),avg:average(rs.map(r=>r[field])),stars:sum(rs,'stars'),sparks:sum(rs,'sparks'),players:rs.length};}).filter(r=>r.players);
  }
  K.months=activeEvents.filter(e=>e.kind==='kraken').map(e=>({key:e.metadata?.monthKey||e.id.split('|')[1],label:e.metadata?.monthLabel||e.date,date:e.date}));
  K.players=p.people.filter(person=>person.kinds.kraken.eventsRecorded>0).map(person=>{
    const hist=person.history.filter(r=>r.kind==='kraken'),s=person.kinds.kraken;
    const months=Object.fromEntries(K.months.map(m=>[m.key,hist.find(h=>h.eventId==='kraken|'+m.key)?.score||0]));
    const best=hist.find(r=>r.score===s.pb);
    return {...months,name:person.name,status:person.status,pb:s.pb||0,pbMonth:K.months.find(m=>'kraken|'+m.key===best?.eventId)?.label||'',avg:s.average||0,last3:s.last3||0,
      totalSparks:person.categories.kraken.sparks,pbCheck:months.oct===s.pb,rankingScore:(s.pb||0)+(s.last3||0)};
  });
  K.octEventRows=(activeEvents.find(e=>e.id==='kraken|oct')?.rows||[]).map(r=>({name:r.player||'Unassigned account',unassigned:!r.player,clan:r.clan||'Unknown',damage:r.score,sparks:r.sparks,eventDate:'2026-10-11'}));
  K.octEventTotals=Object.fromEntries(['AVENGERS','AV-2'].map(c=>{const rs=K.octEventRows.filter(r=>r.clan===c);return[c,{date:'2026-10-11',players:rs.length,damage:sum(rs,'damage'),sparks:sum(rs,'sparks')}]}));
  D.members=p.people.map(person=>({...memberMap.get(person.name),name:person.name,status:person.status,
    piggyPB:person.kinds.piggy.pb||0,spacePB:person.kinds.space.pb||0,krakenPB:person.kinds.kraken.pb||0,
    piggyAvg:person.kinds.piggy.arenaAverage||0,spaceAvg:person.kinds.space.arenaAverage||0,krakenAvg:person.kinds.kraken.average||0,krakenAvgL3:person.kinds.kraken.last3||0,
    krakenPBMonth:K.players.find(r=>r.name===person.name)?.pbMonth||'',rankingScore:(person.kinds.kraken.pb||0)+(person.kinds.kraken.last3||0),
    ratingPB:person.ratingPB,ratingAvg:person.ratingAvg,ratingTotal:person.ratingTotal,eventsPlayed:person.earned.events,totalSparks:person.earned.sparks}));
  D.meta.eventProjectionVersion=p.version;D.meta.latestResult=activeEvents.at(-1)?.date||null;D.aliasMap=aliases;
  const F={...copy(legacy.AVENGERS_PIGGY_FLASH_DATA),events:activeEvents.filter(e=>e.kind==='flash').map(e=>({...e.metadata,id:e.id.slice(6),date:e.date,complete:e.status==='final',entries:e.rows.map(r=>({...r.metadata,name:r.player,lines:r.score,sparks:r.sparks,stars:r.stars,clan:r.clan||'Unknown'}))}))};
  const breakdowns=Object.fromEntries(p.people.map(person=>{
    const c=person.categories,kraken=person.history.filter(r=>r.kind==='kraken'),oct=kraken.filter(r=>r.eventId==='kraken|oct'),june=kraken.filter(r=>r.eventId==='kraken|june'&&r.estimatedSparks),historic=kraken.filter(r=>r.estimatedSparks);
    return [person.name,{piggySparks:c.piggy.sparks,spaceSparks:c.space.sparks,flashSparks:c.flash.sparks,krakenSparks:c.kraken.sparks,eventLoggedSparks:person.earned.sparks,
      screenshotGap:person.screenshotGap,loggedAtSnapshot:person.loggedAtSnapshot,
      snapshotBreakdown:person.snapshotBreakdown,
      krakenHistoricalSparks:sum(historic,'sparks'),krakenOctoberSparks:sum(oct,'sparks'),krakenJuneReconstructedSparks:sum(june,'sparks'),
      piggyStars:c.piggy.stars,spaceStars:c.space.stars,flashStars:c.flash.stars,krakenStars:null,loggedStars:person.earned.stars,knownStars:person.earned.stars,
      piggyEvents:c.piggy.events,spaceEvents:c.space.events,flashEvents:c.flash.events,krakenEvents:c.kraken.events,totalEvents:person.earned.events,
      unknownSparks:person.earned.unknownSparks,unknownStars:person.earned.unknownStars,eventBackedBaseFloor:c.piggy.sparks+c.space.sparks,directRewardFloor:c.piggy.sparks+c.space.sparks,baseSupplementSparks:0}];
  }));
  const leagues=p.leagues.slice().reverse().map(period=>{
    const events=activeEvents.filter(e=>e.date>=period.start&&e.date<=period.end),people=new Map(),ids=new Set();
    for(const e of events)for(const r of e.rows){
      const clan=r.clan||'Unknown',key=clan+'|'+(r.player||r.sourceIdentity);ids.add(e.id+'|'+clan);
      const rec=people.get(key)||{name:r.player||'Unassigned account',clan,flashSparks:0,piggySparks:0,spaceSparks:0,krakenSparks:0,flashStars:0,piggyStars:0,spaceStars:0,sparkKnown:0,starKnown:0,missing:0,estimatedKraken:0,events:0};
      rec[e.kind+'Sparks']+=r.sparks||0;if(e.kind!=='kraken')rec[e.kind+'Stars']+=r.stars||0;
      if(r.sparks!==null)rec.sparkKnown++;if(e.kind!=='kraken'&&r.stars!==null)rec.starKnown++;
      if(r.sparks===null||(e.kind!=='kraken'&&r.stars===null))rec.missing++;
      if(e.kind==='kraken'&&r.estimatedSparks)rec.estimatedKraken+=r.sparks||0;
      rec.events++;people.set(key,rec);
    }
    const rows=[...people.values()].map(r=>({...r,effort:Object.fromEntries(['piggy','space','flash'].map(kind=>[kind,metrics.summarize(events.filter(e=>e.kind===kind).flatMap(e=>e.rows).filter(x=>x.player===r.name&&x.clan===r.clan))])),sparks:r.flashSparks+r.piggySparks+r.spaceSparks+r.krakenSparks,stars:r.flashStars+r.piggyStars+r.spaceStars}));
    return {...period,kraken:events.find(e=>e.kind==='kraken')?.metadata?.monthKey,rows,eventCount:ids.size,memberEventCount:rows.reduce((s,r)=>s+r.events,0),gaps:rows.reduce((s,r)=>s+r.missing,0),estimates:rows.filter(r=>r.estimatedKraken>0).length};
  });
  for(const person of p.people){const b=breakdowns[person.name];b.effort=person.effort;assert(Math.abs(b.eventLoggedSparks-b.piggySparks-b.spaceSparks-b.flashSparks-b.krakenSparks)<0.001);}
  return {projection:p,ledger,review:migration.review,breakdowns,leagues,globals:{AVENGERS_DATA:D,AVENGERS_KRAKEN_DATA:K,AVENGERS_PIGGY_FLASH_DATA:F,
    AVENGERS_SPARKS_SNAPSHOT:S,AVENGERS_MEMBER_TIMEZONES:R,AVENGERS_DISCORD_UTC_ROSTER:copy(legacy.AVENGERS_DISCORD_UTC_ROSTER),AVENGERS_KRAKEN_ROSTER_SNAPSHOT:copy(legacy.AVENGERS_KRAKEN_ROSTER_SNAPSHOT)}};
}
module.exports={create};
if(require.main===module){const r=create();console.log(JSON.stringify({version:r.projection.version,events:r.ledger.events.length,people:r.projection.people.length,review:r.review,coverage:r.projection.coverage},null,2));}
