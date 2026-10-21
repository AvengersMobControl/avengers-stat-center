/* AVENGERS Piggy Flash historical metrics: source-backed, read-only and reusable by PNG renderer. */
(function(root){
'use strict';
const integer=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
const flashNo=e=>Number(e.flash)||0;
const mainClan=r=>r.clan==='AVENGERS';
const comparator=(a,b)=>String(a.setId).localeCompare(String(b.setId))||a.flash-b.flash||String(a.date).localeCompare(String(b.date));
const rank=(value,items,selector)=>1+items.filter(x=>selector(x)>value).length;
function analyze(events,options={}){
  const resolve=typeof options.resolveName==='function'?options.resolveName:(s=>s);
  const source=(Array.isArray(events)?events:[]).map(e=>({
    ...e,flash:flashNo(e),setId:String(e.setId||String(e.date||'')+'-A')
  })).filter(e=>e.flash>=1&&e.flash<=4).sort(comparator);
  const rows=[];
  for(const ev of source){
    for(const raw of ev.entries||[]){
      const clan=raw.clan||ev.clan||'AVENGERS';
      if(clan!=='AVENGERS')continue;
      const lines=integer(raw.lines);
      if(lines===null||lines<0||lines===1)continue;
      const player=String(resolve(raw.name)||raw.name||'').trim();
      if(!player)continue;
      rows.push({player,clan,flash:ev.flash,setId:ev.setId,date:String(ev.date||''),
        eventId:String(ev.id||ev.setId+'|PF'+ev.flash),
        lobby:String(raw.lobbyId||raw.metadata?.lobby||raw.lobby||'main'),
        lines,stars:integer(raw.stars),sparks:integer(raw.sparks),
        finish:integer(raw.rank),sourceComplete:!!ev.complete});
    }
  }
  const pots=source.filter(e=>integer(e.potStars)!==null&&Number(e.potStars)>0&&e.clan==='AVENGERS').map(e=>{
    const pot=Number(e.potStars);
    const awards=rows.filter(r=>r.eventId===e.id);
    const stars=awards.reduce((n,r)=>n+(r.stars||0),0);
    return {eventId:String(e.id),setId:e.setId,date:String(e.date),flash:e.flash,
      lobby:'AVENGERS main (source header)',potStars:pot,potStarsDisplay:String(e.potStarsDisplay||''),
      awardedStars:stars,awardedCount:awards.filter(x=>x.stars!==null).length,
      rakePercent:100*stars/pot,approximate:true,sourceComplete:!!e.complete,
      source:e.source||'',sourceMessageIds:(e.messageIds||[e.messageId]).filter(Boolean)};
  });
  for(const p of pots){
    const same=pots.filter(x=>x.flash===p.flash);
    p.pfRank=rank(p.potStars,same,x=>x.potStars);
    p.pfCount=same.length;
    p.overallRank=rank(p.potStars,pots,x=>x.potStars);
    p.overallCount=pots.length;
  }
  const singles=rows.map(r=>({...r}));
  for(const r of singles){r.allRank=rank(r.lines,singles,x=>x.lines);r.allCount=singles.length;}
  singles.sort((a,b)=>b.lines-a.lines||a.date.localeCompare(b.date)||a.player.localeCompare(b.player));
  const dayMap=new Map();
  for(const row of rows){
    const key=row.setId+'|'+row.player;
    const x=dayMap.get(key)||{setId:row.setId,date:row.setId.slice(0,10),player:row.player,
      clan:'AVENGERS',lines:0,stars:0,sparks:0,flashes:new Set(),results:0};
    x.lines+=row.lines;x.stars+=(row.stars||0);x.sparks+=(row.sparks||0);
    x.flashes.add(row.flash);x.results++;
    dayMap.set(key,x);
  }
  const days=[...dayMap.values()].map(x=>({...x,flashCount:x.flashes.size,flashes:[...x.flashes].sort(),complete:x.flashes.size===4}));
  for(const d of days){d.allRank=rank(d.lines,days,x=>x.lines);d.allCount=days.length;}
  days.sort((a,b)=>b.lines-a.lines||a.setId.localeCompare(b.setId)||a.player.localeCompare(b.player));

  // Original observed leaderboard ranks only. Career W/P reflects all tracked data through
  // the specific selected result, never future events. Same player may hold several PF podiums.
  const podiums=[],career=new Map(),uniquePlace=new Set(),usedPlacements=new Set();
  for(const e of source){
    const eventRows=rows.filter(r=>r.eventId===e.id);
    const ranked=eventRows.filter(r=>[1,2,3].includes(r.finish));
    const counts=new Map();
    for(const r of ranked){const key=r.lobby+'|'+r.finish;counts.set(key,(counts.get(key)||0)+1);}
    const valid=ranked.filter(r=>counts.get(r.lobby+'|'+r.finish)===1);
    for(const r of valid.sort((a,b)=>a.finish-b.finish)){
      const key=r.eventId+'|'+r.lobby+'|'+r.player;
      if(uniquePlace.has(key))continue;uniquePlace.add(key);
      const acc=career.get(r.player)||{wins:0,podiums:0};
      acc.podiums++;if(r.finish===1)acc.wins++;
      career.set(r.player,acc);
      podiums.push({...r,careerWins:acc.wins,careerPodiums:acc.podiums});
    }
  }
  const pb=[],baselines=new Map(),lastSingle=new Map(),lastPF=new Map(),dailyComparisons=[];
  const eventsBySet=[...new Set(source.map(e=>e.setId))].sort();
  const setsRows=new Map();
  for(const row of rows){const arr=setsRows.get(row.setId)||[];arr.push(row);setsRows.set(row.setId,arr);}
  const historicalDayTotals=new Map();
  for(const setId of eventsBySet){
    const current=(setsRows.get(setId)||[]).sort((a,b)=>a.flash-b.flash||a.player.localeCompare(b.player));
    const snapshot=new Map([...baselines].map(([key,history])=>[key,history.slice()]));
    // Prior average is restricted to earlier Flash Sets, not earlier PFs of this same set.
    for(const row of current){
      const prior=snapshot.get(row.player)||[];
      const previous=prior.length?prior.reduce((sum,x)=>sum+x,0)/prior.length:null;
      const keyPF=row.player+'|'+row.flash;
      const priorPF=lastPF.get(keyPF),priorSingle=lastSingle.get(row.player);
      // New member is a first tracked appearance only once, not on every PF of the same set.
      const fresh=!prior.length&&priorSingle===undefined;
      pb.push({...row,priorCount:prior.length,priorAverage:previous,
        abovePriorAverage:previous===null?null:row.lines>previous,
        firstTracked:fresh,
        pfPB:priorPF!==undefined&&row.lines>priorPF,
        singlePB:priorSingle!==undefined&&row.lines>priorSingle,
        oldPfBest:priorPF??null,oldSingleBest:priorSingle??null});
      lastPF.set(keyPF,Math.max(priorPF??-1,row.lines));
      lastSingle.set(row.player,Math.max(priorSingle??-1,row.lines));
    }
    for(const row of current){const history=baselines.get(row.player)||[];history.push(row.lines);baselines.set(row.player,history);}
    const dayRows=days.filter(x=>x.setId===setId);
    for(const d of dayRows){
      // One day total sums observed PF1–PF4 lines regardless of how many were
      // attended. Previous partial-day totals count for both averages and PBs.
      const prior=historicalDayTotals.get(d.player)||[];
      const mean=prior.length?prior.reduce((a,b)=>a+b,0)/prior.length:null;
      const peak=prior.length?Math.max(...prior):null;
      dailyComparisons.push({...d,comparable:prior.length>0,
        priorRecordedDays:prior.length,priorAverage:mean,
        abovePriorAverage:mean===null?null:d.lines>mean,
        priorPB:peak,combinedDayPB:peak===null?false:d.lines>peak});
      prior.push(d.lines);historicalDayTotals.set(d.player,prior);
    }
  }
  // Distinguish first appearance from PB rather than automatically crediting first result.
  return {events:source,rows,pots,singles,days,podiums,pb,dailyComparisons,
    coverage:{sourceEvents:source.length,potsRecorded:pots.length,potsMissing:source.length-pots.length,
      singleResults:singles.length,playerDays:days.length,completePlayerDays:days.filter(d=>d.complete).length}};
}
const api=Object.freeze({analyze,rank});
if(root)root.AVENGERS_FLASH_HISTORY=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?null:window);
