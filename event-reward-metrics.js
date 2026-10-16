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
  const api={efficiency,reconcile};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AVENGERS_REWARD_METRICS=api;
})(typeof window==='object'?window:globalThis);
