(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D?.space?.events) return;
  const SHARE={1:.25,2:.20,3:.18,4:.12,5:.10,6:.08,7:.04,8:.02,9:.01};

  // Historical rows in the main Space review are attributed by the clan shown
  // in that event, not by the player's current roster status.
  Object.entries(D.space.events).forEach(([date,rows])=>{
    (rows||[]).forEach(r=>{
      if(!r||!r.name||r.name==='Total'||r.name==='#N/A') return;
      const clan=String(r.clan||'').toLowerCase().replace(/[^a-z0-9]/g,'');
      if(clan!=='av2') r.clan='AVENGERS';

      let s=Number(r.share)||0;
      if(s>1){ r.share=s/100; s=r.share; }
      if(!(s>0) && Number(r.stars)>0 && SHARE[r.rank]) r.share=SHARE[r.rank];

      const hist=D.space.history?.[r.name]||[];
      const h=hist.find(x=>String(x.date||'')===date && Math.abs((Number(x.yearsB)||0)-(Number(r.yearsB)||0))<0.0001);
      if(h){
        h.clan=r.clan;
        h.group=r.group??null;
        if(h.stars==null&&r.stars!=null) h.stars=r.stars;
        if(h.sparks==null&&r.sparks!=null) h.sparks=r.sparks;
      }
    });
  });

  // Reward totals confirmed from the remade Space Race PDF. These totals sum
  // rewards earned by players shown as AVENGERS in the historical screenshots.
  D.space.historicalRewardTotals=Object.assign({},D.space.historicalRewardTotals||{},{
    '2026-04-19':{stars:2632790,source:'Remade Discord Space Race PDF; 3 AVENGERS lobbies'},
    '2026-04-11':{stars:6459706,source:'Remade Discord Space Race PDF; 5 AVENGERS lobbies, duplicate repost excluded'},
    '2026-04-08':{stars:720880,source:'Remade Discord Space Race PDF; JIM lobby only; 4/8 Rafa repost of 4/3 excluded'}
  });

  D.space.historicalSourceNotes=Object.assign({},D.space.historicalSourceNotes||{},{
    'reconcile-2026-10-02':'Historical Space rows reconciled against the remade Discord final-result review PDF; event-time clan attribution is preserved separately from current roster status.'
  });
})();