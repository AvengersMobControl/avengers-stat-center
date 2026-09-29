(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D) return;

  const targets=new Set(['av-lucky']);
  const isTarget=name=>targets.has(String(name||'').trim().toLowerCase());

  (D.members||[]).forEach(m=>{
    if(isTarget(m.name)) m.status='Inactive';
  });

  if(D.piggy){
    (D.piggy.overall||[]).forEach(r=>{
      if(isTarget(r.name)) r.status='Inactive';
    });
    Object.values(D.piggy.events||{}).forEach(rows=>{
      (rows||[]).forEach(r=>{
        if(isTarget(r.name)||isTarget(r.username)) r.status='Inactive';
      });
    });
  }

  if(D.space){
    (D.space.overall||[]).forEach(r=>{
      if(isTarget(r.name)) r.status='Inactive';
    });
    Object.values(D.space.events||{}).forEach(rows=>{
      (rows||[]).forEach(r=>{
        if(isTarget(r.name)||isTarget(r.username)) r.status='Inactive';
      });
    });
  }

  const K=window.AVENGERS_KRAKEN_DATA;
  if(K && Array.isArray(K.players)){
    K.players.forEach(p=>{
      if(isTarget(p.name)) p.status='Inactive';
    });
  }

  const S=window.AVENGERS_SPARKS_SNAPSHOT;
  if(S && Array.isArray(S.currentAvengers)){
    S.currentAvengers=S.currentAvengers.filter(x=>!isTarget(x && x.name));
  }
})();
