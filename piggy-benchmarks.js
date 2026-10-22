'use strict';
/* AVENGERS Piggy line benchmark ledger.
 * Counts DISTINCT competitors at or above each threshold from actual event-time
 * race rows. AVENGERS and AV-2 are computed independently; default is AVENGERS.
 * Authoritative input: window.AVENGERS_DATA.piggy.events, derived from the
 * approved event ledger. No editable/manual record count declarations.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.AVENGERS_PIGGY_BENCHMARKS=api;
})(typeof globalThis==='object'?globalThis:undefined,function(){
  const BASE_THRESHOLDS=Object.freeze([5000,10000,20000,30000,40000,50000,60000,70000]);
  const stamp=date=>/^\d{4}-\d{2}-\d{2}$/.test(date||'');
  function compute(events,{clan='AVENGERS',startDate='2026-01-01'}={}){
    if(!events||typeof events!=='object')throw Error('Piggy source events are required');
    const source=Object.entries(events).filter(([date,rows])=>stamp(date)&&date>=startDate&&Array.isArray(rows));
    const weekly=source.map(([date,rows])=>{
      const distinct=new Map();
      for(const row of rows){
        if(row.clan!==clan)continue;
        const name=String(row.name||row.player||row.username||'').trim();
        const score=Number(row.lines??row.score);
        if(!name||!Number.isFinite(score)||score<=1)continue;
        // A player appearing twice in one event still counts just once.
        distinct.set(name,Math.max(distinct.get(name)||0,score));
      }
      return {date,players:distinct.size,scores:[...distinct.values()]};
    }).filter(r=>r.players>0);
    let maxScore=Math.max(0,...weekly.flatMap(w=>w.scores));
    const thresholds=[...BASE_THRESHOLDS];
    for(let t=80000;t<=maxScore;t+=10000)thresholds.push(t);
    const counted=weekly.map(w=>({
      date:w.date,
      players:w.players,
      counts:thresholds.map(t=>w.scores.filter(v=>v>=t).length)
    })).sort((a,b)=>b.date.localeCompare(a.date));
    const records=thresholds.map((threshold,i)=>{
      const count=Math.max(0,...counted.map(w=>w.counts[i]));
      const dates=counted.filter(w=>w.counts[i]===count&&count>0).map(w=>w.date).sort();
      return {threshold,count,firstDate:dates[0]||null,tiedDates:dates};
    });
    return {clan,startDate,thresholds,weekly:counted,records};
  }
  return {BASE_THRESHOLDS,compute};
});
