(function(root){
  'use strict';
  const known=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
  // Space effort is already normalized to billions; Piggy/Flash effort is lines.
  function efficiency(sparks,effort){return known(sparks)&&known(effort)&&effort>0?sparks/effort:null;}
  function reconcile({sparks=null,stars=null}={}){
    return {sparks,stars:known(stars)?stars:known(sparks)?sparks*10:null,
      starsDerived:!known(stars)&&known(sparks),
      ratioDelta:known(stars)&&known(sparks)?stars-sparks*10:null};
  }
  // Aggregate only matching reward/effort pairs; never divide all rewards by
  // a subset of recorded effort. A ratio is weighted by effort, not by rows.
  function summarize(rows,scoreKey='score'){
    const paired=rows.filter(r=>known(r.sparks)&&known(r[scoreKey])&&r[scoreKey]>0);
    const sparks=paired.reduce((s,r)=>s+r.sparks,0),effort=paired.reduce((s,r)=>s+r[scoreKey],0);
    return {value:efficiency(sparks,effort),sparks,effort,paired:paired.length,missing:rows.length-paired.length};
  }
  // Use the actual stored score for both a record and its date. Imported
  // corrections are already applied; display code must not adjust them again.
  function record(rows,key='score'){
    const valid=rows.filter(r=>known(r[key])&&r[key]>0).slice()
      .sort((a,b)=>b[key]-a[key]||String(a.date||'').localeCompare(String(b.date||'')));
    return valid.length?{value:valid[0][key],date:valid[0].date||null}:null;
  }
  // Oct 2 actual Space distance is two-thirds of its approved 1.5x
  // normalized score. Presentation only: do not change stored results, PBs,
  // rankings, achievements or any other projection consumer.
  function spaceRecordDisplay(normalizedPB,eventDate){
    const adjusted=eventDate==='2026-10-02'&&known(normalizedPB)&&normalizedPB>0;
    return {value:adjusted?normalizedPB*(2/3):normalizedPB,adjusted};
  }
  function potTotals(rows){
    const groups=new Map();
    for(const r of rows){const k=String(r.group??r.metadata?.group??'legacy');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
    const pots=[...groups.values()].map(rs=>{
      const candidates=rs.map(r=>{let share=r.share??r.metadata?.share;if(share>=1)share/=100;
        if(!(share>0))share=({1:.25,2:.20,3:.18,4:.12,5:.10,6:.08,7:.04,8:.02,9:.01})[r.rank??r.metadata?.rank]||0;
        return {r,share:typeof share==='number'?share:0};}).filter(x=>x.share>0).sort((a,b)=>b.share-a.share);
      const infer=key=>{const x=candidates.find(x=>known(x.r[key])&&x.r[key]>0);return x?x.r[key]/x.share:null;};
      return {stars:infer('stars'),sparks:infer('sparks')};
    });
    const sum=key=>pots.length&&pots.every(p=>p[key]!==null)?pots.reduce((s,p)=>s+p[key],0):null;
    return {groups:groups.size,potStars:sum('stars'),potSparks:sum('sparks'),
      coveredStarGroups:pots.filter(p=>p.stars!==null).length,coveredSparkGroups:pots.filter(p=>p.sparks!==null).length};
  }

  // Every logged Space lobby pot, ranked across all races. Pot = a racer's
  // Stars (or Sparks) / their share %, from the highest-share row with a known
  // reward (leader rule 2026-10-25: screenshot pot headers can be stale).
  // Accepts {date: rows} with site rows (name/yearsB/flat fields) or
  // projection rows (player/score/metadata). Share >= 1 is a percent.
  function lobbyPots(eventsByDate){
    const pick=(r,k)=>r[k]!==undefined&&r[k]!==null?r[k]:r.metadata?.[k];
    const shareOf=r=>{let s=Number(pick(r,'share'));if(!(s>0))return null;if(s>=1)s/=100;return s;};
    const out=[];
    for(const [date,rows] of Object.entries(eventsByDate||{})){
      const groups=new Map();
      for(const r of rows||[]){
        const g=pick(r,'group');if(g===undefined||g===null||g==='')continue;
        const key=String(g);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);
      }
      for(const [lobby,rs] of groups){
        const withShare=rs.map(r=>({r,share:shareOf(r)})).filter(x=>x.share).sort((a,b)=>b.share-a.share);
        const starRow=withShare.find(x=>known(x.r.stars)&&x.r.stars>0);
        const sparkRow=withShare.find(x=>known(x.r.sparks)&&x.r.sparks>0);
        const score=r=>Number(r.score??r.yearsB)||0;
        const top=rs.slice().sort((a,b)=>score(b)-score(a))[0];
        const clans=[...new Set(rs.map(r=>r.clan||r.eventClan).filter(Boolean))].sort();
        out.push({date,lobby,clans,racers:rs.length,
          potStars:starRow?Math.round(starRow.r.stars/starRow.share):null,
          potSparks:sparkRow?Math.round(sparkRow.r.sparks/sparkRow.share):null,
          trackedShare:withShare.reduce((s,x)=>s+x.share,0),
          lightyearsB:rs.reduce((s,r)=>s+score(r),0),
          topPlayer:top?(top.player||top.name):null,topScoreB:top?score(top):null});
      }
    }
    const ranked=out.filter(x=>x.potStars!==null).sort((a,b)=>b.potStars-a.potStars||a.date.localeCompare(b.date));
    ranked.forEach((x,i)=>{x.rank=1+ranked.findIndex(y=>y.potStars===x.potStars);x.of=ranked.length;});
    return out.sort((a,b)=>b.date.localeCompare(a.date)||(b.potStars??-1)-(a.potStars??-1));
  }
  const api={efficiency,reconcile,summarize,record,spaceRecordDisplay,potTotals,lobbyPots};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AVENGERS_REWARD_METRICS=api;
})(typeof window==='object'?window:globalThis);
