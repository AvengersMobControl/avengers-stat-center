// Piggy personal-best ranks within the currently selected roster.
// Use only recorded positive Piggy Race line PBs; a missing result is not last place.
(function(root){
  'use strict';
  function rankRows(rows){
    const source=Array.isArray(rows)?rows:[];
    const scores=source.map(r=>Number(r?.piggyPB)).filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>b-a);
    const rankByScore=new Map();
    scores.forEach((score,index)=>{
      if(!rankByScore.has(score)) rankByScore.set(score,index+1); // competition ranking: 1, 1, 3
    });
    return source.map(r=>{
      const score=Number(r?.piggyPB);
      return {...r,piggyPBRank:Number.isFinite(score)&&score>0?rankByScore.get(score):null};
    });
  }
  const api=Object.freeze({rankRows});
  if(root)root.AVENGERS_ROSTER_PIGGY_PB_RANK=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?null:window);
