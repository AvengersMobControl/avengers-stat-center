(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  const R=window.AVENGERS_MEMBER_TIMEZONES;
  if(!D || !R) return;

  const byName=R.byName||{};

  // The supplied 2026-09-29 roster is authoritative for CURRENT member status.
  // Anyone in tracked historical data but absent from this roster is treated as Inactive.
  (D.members||[]).forEach(m=>{
    const row=byName[m.name];
    m.status=row?.status||'Inactive';
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
