(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  const R=window.AVENGERS_MEMBER_TIMEZONES;
  if(!D || !R) return;

  const byName=R.byName||{};

  // The roster updated 2026-10-01 is authoritative for CURRENT member status.
  // Anyone in tracked historical data but absent from this roster is treated as Inactive.
  (D.members||[]).forEach(m=>{
    const row=byName[m.name];
    m.status=row?.status||'Inactive';
  });

  // Add zero-history profile shells only for genuinely new current members.
  // Resolve roster display names through the canonical alias map first so renamed
  // players (JIM/J1M, Zolika, Hoops, etc.) reuse their existing historical profile.
  const resolve=name=>{
    let x=String(name||'');
    const seen=new Set();
    while(D.aliasMap?.[x] && !seen.has(x)){
      seen.add(x);
      x=D.aliasMap[x];
    }
    return x;
  };
  const known=new Set((D.members||[]).map(m=>m.name));
  (R.rows||[]).forEach(row=>{
    if(!row || (row.status!=='Active' && row.status!=='AV2')) return;
    const canonical=resolve(row.name);
    const existing=(D.members||[]).find(m=>m.name===canonical || m.name===row.name);
    if(existing){
      existing.status=row.status;
      return;
    }
    D.members.push({
      name:canonical||row.name,
      status:row.status,
      piggyPB:0,spacePB:0,krakenPB:0,
      piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,
      rankingScore:0,krakenPBMonth:'',
      ratingPB:0,ratingAvg:0,ratingTotal:0,
      eventsPlayed:0,totalSparks:0
    });
    known.add(canonical||row.name);
  });

  // Keep Kraken player cards aligned with the same current-status source.
  const K=window.AVENGERS_KRAKEN_DATA;
  if(K && Array.isArray(K.players)){
    K.players.forEach(p=>{
      const row=byName[p.name];
      p.status=row?.status||'Inactive';
    });
  }

  // Historical Piggy/Space event rows are intentionally NOT rewritten here.
  // Event-time clan attribution remains independent from today's roster status.
})();
