(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  const K=window.AVENGERS_KRAKEN_DATA;
  const S=window.AVENGERS_SPARKS_SNAPSHOT;
  if(!D) return;

  const renameMap=new Map([
    ['AV-JM','AV-J1M'],
    ['AV-JIM','AV-J1M'],
    ['AV-GreenZombie','AV-BlueWave'],
    ['AV-ZolikaLoveKira','AV-Zolika.x.Kira'],
    ['AV-hoops-SCT','AV-Hoops']
  ]);
  const target=name=>renameMap.get(name)||name;

  const mergeHistory=(hist,from,to)=>{
    if(!hist||!hist[from]) return;
    const merged=[...(hist[to]||[]),...hist[from]];
    const byKey=new Map();
    merged.forEach(x=>byKey.set(String(x.date||'')+'|'+String(x.code||''),x));
    hist[to]=[...byKey.values()].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    delete hist[from];
  };

  renameMap.forEach((to,from)=>{
    const fromMember=(D.members||[]).find(m=>m.name===from);
    const toMember=(D.members||[]).find(m=>m.name===to);
    if(fromMember && !toMember) fromMember.name=to;
    else if(fromMember && toMember){
      Object.keys(fromMember).forEach(k=>{
        if(k==='name'||k==='status') return;
        if(typeof fromMember[k]==='number'){
          if(k==='totalSparks'||k==='eventsPlayed') toMember[k]=(Number(toMember[k])||0)+(Number(fromMember[k])||0);
          else toMember[k]=Math.max(Number(toMember[k])||0,Number(fromMember[k])||0);
        }
      });
      D.members=D.members.filter(m=>m!==fromMember);
    }

    ['piggy','space'].forEach(kind=>{
      const X=D[kind];
      if(!X) return;
      mergeHistory(X.history,from,to);
      (X.overall||[]).forEach(r=>{ if(r.name===from) r.name=to; });
      Object.values(X.events||{}).forEach(rows=>(rows||[]).forEach(r=>{ if(r.name===from) r.name=to; }));
      (X.latestPBs||[]).forEach(r=>{ if(r.name===from) r.name=to; });
      (X.latestNewMembers||[]).forEach(r=>{ if(r.name===from) r.name=to; });
    });

    if(K){
      const fp=(K.players||[]).find(p=>p.name===from);
      const tp=(K.players||[]).find(p=>p.name===to);
      if(fp && !tp) fp.name=to;
      else if(fp && tp){
        (K.months||[]).forEach(m=>tp[m.key]=Math.max(Number(tp[m.key])||0,Number(fp[m.key])||0));
        tp.pb=Math.max(Number(tp.pb)||0,Number(fp.pb)||0);
        tp.totalSparks=(Number(tp.totalSparks)||0)+(Number(fp.totalSparks)||0);
        K.players=K.players.filter(p=>p!==fp);
      }
    }

    if(S){
      (S.currentAvengers||[]).forEach(r=>{ if(r.name===from) r.name=to; });
    }
  });

  if(S){
    const byName=new Map();
    (S.currentAvengers||[]).forEach(r=>{
      const name=target(r.name);
      const prev=byName.get(name);
      if(!prev || (Number(r.allTimeSparks)||0)>(Number(prev.allTimeSparks)||0)) byName.set(name,{...r,name});
    });
    S.currentAvengers=[...byName.values()];
  }

  if(K){
    const byK=new Map((K.players||[]).map(p=>[p.name,p]));
    (D.members||[]).forEach(m=>{
      const p=byK.get(m.name);
      if(!p) return;
      m.krakenPB=Number(p.pb)||0;
      m.krakenAvg=Number(p.avg)||0;
      m.krakenAvgL3=Number(p.last3)||0;
      m.krakenPBMonth=p.pbMonth||'';
    });
  }

  D.aliasMap=Object.assign({},D.aliasMap||{},{
    'AV-JM':'AV-J1M',
    'AV-JIM':'AV-J1M',
    'AV-GreenZombie':'AV-BlueWave',
    'AV-ZolikaLoveKira':'AV-Zolika.x.Kira',
    'AV-hoops-SCT':'AV-Hoops'
  });
})();