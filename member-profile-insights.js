/* #12 — source-bounded member league versus career overview. Read-only. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.AVENGERS_MEMBER_PROFILE_INSIGHTS=factory();
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const DAY=86400000,ANCHOR='2026-10-12',KINDS=['piggy','space','flash','kraken'];
  const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  const utc=s=>Date.parse(s+'T00:00:00Z');
  const iso=t=>new Date(t).toISOString().slice(0,10);
  const avg=a=>a.length?a.reduce((sum,x)=>sum+x,0)/a.length:null;
  const known=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
  function periodFor(asOf){
    if(!validDate(asOf))throw Error('A real YYYY-MM-DD local date is required');
    const first=utc(ANCHOR),elapsed=Math.floor((utc(asOf)-first)/(35*DAY));
    const start=first+elapsed*35*DAY;
    return {start:iso(start),end:iso(start+34*DAY),days:35};
  }
  function summarize(history,asOf){
    if(!Array.isArray(history))throw Error('Canonical event history required');
    const period=periodFor(asOf),seen=new Set();
    const all=history.filter(r=>{
      if(!r||!KINDS.includes(r.kind)||!validDate(r.date)||r.date>asOf)return false;
      const key=(r.eventId||r.kind+'|'+r.date)+'|'+(r.clan||'Unknown');
      if(seen.has(key))return false;
      seen.add(key);return true;
    }).sort((a,b)=>a.date.localeCompare(b.date)||String(a.eventId||'').localeCompare(String(b.eventId||'')));
    const active=all.filter(r=>r.date>=period.start&&r.date<=period.end);
    function totals(rows){
      let sparks=0,stars=0,missingSparks=0,missingStars=0,estimatedKraken=0,partial=0;
      for(const r of rows){
        if(known(r.sparks))sparks+=r.sparks;else missingSparks++;
        if(r.kind!=='kraken'){if(known(r.stars))stars+=r.stars;else missingStars++;}
        if(r.estimatedSparks&&known(r.sparks))estimatedKraken+=r.sparks;
        if(r.partial)partial++;
      }
      return {events:rows.length,sparks,stars,missingSparks,missingStars,estimatedKraken,partial};
    }
    const kinds=KINDS.map(kind=>{
      const career=all.filter(r=>r.kind===kind),league=active.filter(r=>r.kind===kind);
      const scores=career.filter(r=>known(r.score)).map(r=>r.score);
      const leagueScores=league.filter(r=>known(r.score)).map(r=>r.score);
      const recent=scores.slice(-3),previous=scores.slice(-6,-3);
      const oldAvg=avg(previous),newAvg=avg(recent),careerAvg=avg(scores);
      const last5=scores.slice(-5);
      return {kind,leagueEvents:league.length,careerEvents:career.length,
        leagueKnownScores:leagueScores.length,careerKnownScores:scores.length,
        leagueAverage:avg(leagueScores),careerAverage:careerAvg,
        recentVersusPrior:scores.length>=6&&oldAvg>0?newAvg/oldAvg-1:null,
        consistency:careerAvg!==null&&last5.length===5?{
          atOrAbove:last5.filter(score=>score>=careerAvg).length,sampleSize:5
        }:null};
    });
    return {asOf,period,career:totals(all),league:totals(active),kinds,
      leagueClans:[...new Set(active.map(r=>r.clan).filter(c=>c==='AVENGERS'||c==='AV-2'))].sort(),
      source:'approved event-time player history, tracked participant rewards only'};
  }
  return {periodFor,summarize,KINDS};
});
