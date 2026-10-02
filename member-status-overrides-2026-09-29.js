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

  // Add zero-history profile shells for current Active / AV-2 members who have
  // joined since the original workbook snapshot. This keeps them searchable and
  // clickable immediately, while their stats remain zero until an event is logged.
  const known=new Set((D.members||[]).map(m=>m.name));
  (R.rows||[]).forEach(row=>{
    if(!row || (row.status!=='Active' && row.status!=='AV2') || known.has(row.name)) return;
    D.members.push({
      name:row.name,
      status:row.status,
      piggyPB:0,spacePB:0,krakenPB:0,
      piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,
      rankingScore:0,krakenPBMonth:'',
      ratingPB:0,ratingAvg:0,ratingTotal:0,
      eventsPlayed:0,totalSparks:0
    });
    known.add(row.name);
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
