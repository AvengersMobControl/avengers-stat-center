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
  const api={efficiency,reconcile,summarize};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AVENGERS_REWARD_METRICS=api;
})(typeof window==='object'?window:globalThis);
