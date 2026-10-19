'use strict';
// Only for validating the originally approved source baseline after the
// later removal of incorrectly inferred zero-award Flash Sparks.
// Never use this function to update the user-frozen Unlogged Sparks value.
function originallyObservedGap(player,snapshot){
 const removed=player.history.filter(h=>h.kind==='flash'&&h.metadata?.awardPolicy==='first-post-kraken-no-sparks'&&
   (!snapshot.beforeDate||h.date<snapshot.beforeDate))
   .reduce((n,h)=>n+(Number(h.metadata.archivalDerivedSparksDiscarded)||0),0);
 return Math.max(0,snapshot.gap-removed);
}
function audit(release){
 const S=release.globals.AVENGERS_SPARKS_SNAPSHOT,D=release.globals.AVENGERS_DATA;
 const R=release.globals.AVENGERS_MEMBER_TIMEZONES;
 const canonical=raw=>{let n=String(raw||'').trim(),seen=new Set();
  while(D.aliasMap?.[n]&&D.aliasMap[n]!==n){
   if(seen.has(n))throw Error('Sparks alias cycle: '+n);
   seen.add(n);n=D.aliasMap[n];
  }return n;};
 const originals=[
  ...(S.currentAvengers||[]).map(x=>({...x,beforeDate:'2026-09-30'})),
  ...(S.currentAv2||[]).map(x=>({...x,beforeDate:'2026-10-16'})),
  ...(S.preSpaceOct16||[]),...(S.historicalSparkFloors||[])
 ];
 const latest=new Map(),counts=new Map();
 for(const s of originals){
  if(s.allTimeSparks==null)continue;
  const id=canonical(s.profileName||s.name);
  latest.set(id,s);counts.set(id,(counts.get(id)||0)+1);
 }
 const all=new Map(release.projection.people.map(p=>[p.name,p]));
 const rows=(R.rows||[]).filter(r=>r.status==='Active'||r.status==='AV2').map(r=>{
  const id=canonical(r.name),p=all.get(id);
  if(!p)throw Error('Unresolved player '+id);
  if((p.snapshotBreakdown||[]).length!==(counts.get(id)||0))
   throw Error('Lost snapshot for '+id);
  const last=latest.get(id),before=last?.beforeDate;
  const tracked=before?p.history.filter(x=>x.date<before).reduce((n,x)=>n+(x.sparks||0),0):p.earned.sparks;
  const previous=last?Math.max(0,last.allTimeSparks-tracked):0;
  const current=p.screenshotGap||0;
  const maxObserved=Math.max(0,...(p.snapshotBreakdown||[]).map(x=>originallyObservedGap(p,x)));
  const currentDerivedGap=Math.max(0,...(p.snapshotBreakdown||[]).map(x=>x.gap));
  // The saved baseline is authoritative. Minor positive screenshot residuals
  // can be rounding, not actual unrecorded historical rewards.
  const saved=require('../data/sparks-prior-to-logging-2026-10-16.json');
  const committed=saved.amounts[id]||0;
  if(Math.abs(current-committed)>0.001)
   throw Error('Frozen official Unlogged Sparks changed for '+id);
  // Oct 18 leader-confirmed correction credited the Oct 11 AV-2 Kraken
  // 18,100 Sparks to Frenchie2, after the prior-to-logging figures were
  // explicitly frozen. The later identity correction must not recalculate or
  // reduce that historical baseline. Reconstruct the ORIGINAL evidence check
  // while still requiring exact source event+clan+amount for this exception.
  const frenchieCorrection=id==='AV-Frenchie2'
   ?p.history.filter(x=>x.eventId==='kraken|oct'&&x.clan==='AV-2').reduce((n,x)=>n+(x.sparks||0),0):0;
  if(id==='AV-Frenchie2'&&frenchieCorrection!==18100)
   throw Error('Missing leader-confirmed Frenchie2 October Kraken correction');
  const frozenEvidence=maxObserved+frenchieCorrection;
  // The 1% exclusion was a one-time, leader-approved action. Later balance
  // changes (including all new event payouts) must NEVER rerun that cutoff.
  if(committed>0&&Math.abs(committed-frozenEvidence)>0.500001)
   throw Error('Official historical Sparks do not match source evidence for '+id);
  if(saved.excludedBelowOnePercent?.[id]){
   const removed=saved.excludedBelowOnePercent[id];
   if(current!==0||removed.sharePctAtApproval>=1||
      Math.abs(removed.originalUnloggedSparks-frozenEvidence)>0.500001)
    throw Error('Excluded historical sub-1% evidence not retained for '+id);
  }else if(saved.excludedRoundingReview?.[id]){
   if(current!==0||maxObserved>=1000)
    throw Error('Excluded small rounded residual was included for '+id);
  }
  if(Math.abs(p.totalSparks-p.earned.sparks-current)>0.001)
   throw Error('Sparks reconciliation failed for '+id);
  return {name:id,roster:r.status,logged:p.earned.sparks,oldGap:previous,
   unlogged:current,total:p.totalSparks,recovered:current-previous,
   screenshots:p.snapshotBreakdown?.length||0,qualifyingScreenshots:(p.snapshotBreakdown||[]).filter(x=>x.gap>0).length,
   derivedGapAfterAwardCorrection:currentDerivedGap,
   originallyObservedGap:maxObserved,
   evidence:p.snapshotBreakdown};
 });
 const currentCount=(R.rows||[]).filter(r=>r.status==='Active'||r.status==='AV2').length;
 if(rows.length!==currentCount||new Set(rows.map(r=>r.name)).size!==currentCount)
  throw Error('Current clan roster has missing or duplicate canonical members');
 const gained=rows.filter(r=>r.recovered>0.001),lowered=rows.filter(r=>r.recovered< -0.001);
 return {version:release.projection.version,
  summary:{roster:rows.length,withScreenshots:rows.filter(r=>r.screenshots).length,
   gained:gained.length,lowered:lowered.length,
   restored:gained.reduce((n,r)=>n+r.recovered,0),
   loweredAmount:lowered.reduce((n,r)=>n-r.recovered,0),
   totalUnlogged:rows.reduce((n,r)=>n+r.unlogged,0)},
  rows:rows.sort((a,b)=>b.recovered-a.recovered||a.name.localeCompare(b.name))};
}
module.exports={audit,originallyObservedGap};
