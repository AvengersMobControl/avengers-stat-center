'use strict';
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
  const maxObserved=Math.max(0,...(p.snapshotBreakdown||[]).map(x=>x.gap));
  // The saved baseline is authoritative. Minor positive screenshot residuals
  // can be rounding, not actual unrecorded historical rewards.
  const saved=require('../data/sparks-prior-to-logging-2026-10-16.json');
  const committed=saved.amounts[id]||0;
  // Only user-approved whole-number Unlogged Sparks enter the canonical total.
  // The 1% exclusion was a ONE-TIME decision, not a recurring percentage test
  // that could silently clear approved history as new Logged Sparks arrive.
  if(Math.abs(current-committed)>0.001)
   throw Error('User-locked Unlogged Sparks changed for '+id);
  if(committed>0&&Math.abs(committed-maxObserved)>0.500001)
   throw Error('Approved Unlogged Sparks lack matching screenshot evidence for '+id);
  if(saved.excludedBelowOnePercent?.[id]){
   const excluded=saved.excludedBelowOnePercent[id];
   if(current!==0||excluded.sharePctAtApproval>=1)
    throw Error('Excluded sub-1% balance incorrectly restored for '+id);
   if(Math.abs(excluded.originalUnloggedSparks-maxObserved)>0.500001)
    throw Error('Excluded sub-1% evidence lost for '+id);
  }else if(saved.excludedRoundingReview?.[id]){
   if(current!==0||maxObserved>=1000)
    throw Error('Sub-1000 rounding candidate incorrectly restored for '+id);
  }else if(committed===0&&maxObserved>=1000)
   throw Error('Unreviewed substantial historical Sparks gap for '+id);
  if(Math.abs(p.totalSparks-p.earned.sparks-current)>0.001)
   throw Error('Sparks reconciliation failed for '+id);
  return {name:id,roster:r.status,logged:p.earned.sparks,oldGap:previous,
   unlogged:current,total:p.totalSparks,recovered:current-previous,
   screenshots:p.snapshotBreakdown?.length||0,qualifyingScreenshots:(p.snapshotBreakdown||[]).filter(x=>x.gap>0).length,
   evidence:p.snapshotBreakdown};
 });
 if(rows.length!==100||new Set(rows.map(r=>r.name)).size!==100)
  throw Error('Expected 100 distinct current clan members');
 const gained=rows.filter(r=>r.recovered>0.001),lowered=rows.filter(r=>r.recovered< -0.001);
 return {version:release.projection.version,
  summary:{roster:rows.length,withScreenshots:rows.filter(r=>r.screenshots).length,
   gained:gained.length,lowered:lowered.length,
   restored:gained.reduce((n,r)=>n+r.recovered,0),
   loweredAmount:lowered.reduce((n,r)=>n-r.recovered,0),
   totalUnlogged:rows.reduce((n,r)=>n+r.unlogged,0)},
  rows:rows.sort((a,b)=>b.recovered-a.recovered||a.name.localeCompare(b.name))};
}
module.exports={audit};
