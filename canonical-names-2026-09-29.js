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
    const capped=(value,benchmark)=>Math.min(1,Math.max(0,(Number(value)||0)/benchmark));
    (D.members||[]).forEach(m=>{
      const p=byK.get(m.name);
      if(p){
        m.krakenPB=Number(p.pb)||0;
        m.krakenAvg=Number(p.avg)||0;
        m.krakenAvgL3=Number(p.last3)||0;
        m.krakenPBMonth=p.pbMonth||'';
      }
      m.ratingPB=
        capped(m.piggyPB,35000)+
        capped(m.spacePB,350)+
        capped(m.krakenPB,3500);
      m.ratingAvg=
        capped(m.piggyAvg,25000)+
        capped(m.spaceAvg,200)+
        capped(m.krakenAvgL3,2800);
      m.ratingTotal=m.ratingPB+m.ratingAvg;
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

// Full historical alias consolidation from user-supplied master alias table.
(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  const K=window.AVENGERS_KRAKEN_DATA;
  if(!D) return;

  const aliases={"AV#Rafa#":"AV#Rafa#Tun","AV|<STAR-LORD>|":"AV<STAR-LORD>","AV|<STAR-LORD>\\":"AV<STAR-LORD>","AV\\<STAR-LORD>\\":"AV<STAR-LORD>","AV\\<STAR-LOR...":"AV<STAR-LORD>","AV/<STAR-LORD>\\":"AV<STAR-LORD>","AV/<STAR-LOR...":"AV<STAR-LORD>","AV-8!\\...Bil":"AV-8!l...Bil","AV-8!\\....Bil":"AV-8!l...Bil","AV-Abu#npjp":"AV-Abu//npjp","AV-Abu//np.jp":"AV-Abu//npjp","AV-Andre<DE>":"AV-Andre-DE","AV-Andre":"AV-Andre-DE","AV-Shells.Ani":"AV-Animosity","AV-CowPoke":"AV-Animosity","AV-Attila":"AV-Attila-AZE","AV-Atilla-AZE":"AV-Attila-AZE","AV-Atilla":"AV-Attila-AZE","AV-BaBaVooS-BRA":"AV-BaBaVooS","AV-BaBaVooS-B...":"AV-BaBaVooS","AV-BlackPearl-Dutch":"AV-BlackPearl","AV-BlackPearl-D...":"AV-BlackPearl","AV-BLISTER-USA":"AV-BLISTER","AV-BLISTER2":"AV-BLISTER","AV-Blister2":"AV-BLISTER","BX1":"AV-BX1","AV-CRISPIN.97-MEX":"AV-CRISPIN.97","AV-CRISPIN.97_MEX":"AV-CRISPIN.97","AV-CRISPIN.27-MEX":"AV-CRISPIN.97","AV-CRISPIN.27MEX":"AV-CRISPIN.97","AV-CRISPIN.27M...":"AV-CRISPIN.97","AV-CRISPIN.27M":"AV-CRISPIN.97","AV-CRISPIN.27-...":"AV-CRISPIN.97","AV-CRISPIN.27":"AV-CRISPIN.97","AV-DrDetroit-USA":"AV-DrDetroit","AV-DrDetroit-U...":"AV-DrDetroit","AV2-DrDetroit-USA":"AV-DrDetroit","AV2-DrDetroit-U...":"AV-DrDetroit","DuluDaniels":"AV-DuluDaniels","EatSleepPlay":"AV-EatSleepPlay","AV-EventHorizon028":"AV-EventHorizon","AV-EventHorizon...":"AV-EventHorizon","EvolvedEclipse":"AV-EvolvedEclipse","AV-Witch-king":"AV-EXCALIBUR","AV-Crusader":"AV-EXCALIBUR","AV-FenixTisential":"AV-FeniXistential","HiddenFrenchie":"AV-FrenchieUSA","AV-Frenchie(-4)":"AV-FrenchieUSA","AV-Frenchie USA":"AV-FrenchieUSA","AV-Frenchie":"AV-FrenchieUSA","(AV)HiddenFrenchman":"AV-FrenchieUSA","(AV)HiddenFrench":"AV-FrenchieUSA","(AV)HiddenFrenc...":"AV-FrenchieUSA","(AV)HiddenFren":"AV-FrenchieUSA","AV-GNSK-JPN":"AV-GNSK","AV.GNSK":"AV-GNSK","AV-GreenZombie":"AV-BlueWave","AV-SaddamMiser":"AV-HarryBallsagna","AV-HarryBallsa...":"AV-HarryBallsagna","AV-HarveySpect...":"AV-HarveySpecter","AV-hoops-SCT":"AV-Hoops","AV-hoops":"AV-Hoops","Av-<INFINITY>":"AV-INFINITY","AV-InvisibleSpy":"AV-InvincibleSpy","AV-InvinsibleSpy":"AV-InvincibleSpy","AV-Tin-VNM":"AV-J","AV-TiN.":"AV-J","AV-Tin":"AV-J","AV-TiN":"AV-J","AV-TIN":"AV-J","JACK...RK":"AV-JACK","AV-jacko-TWN":"AV-jacko","AV-Scout":"AV-jacko-mini","AV-JefhKintz05":"AV-JeffKintz05","AV-JimBoy":"AV-J1M","AV-JIM80Y":"AV-J1M","AV-JIM":"AV-J1M","AV-J1m80y":"AV-J1M","AV-J1M80Y":"AV-J1M","JOKER":"AV-JOKER","AV-Liam":"AV-LiamUSA","AV.March":"AV-March","AV-MONSTER.":"AV-MONSTER","Morikila":"AV-Morikila","AV-Marikila":"AV-Morikila","AV-Motherboard...":"AV-MotherboardBeans","AV-Motherboar...":"AV-MotherboardBeans","AV-Mr.Mar.Berry-USA":"AV-Mr.Mar.Berry","AV-Mr.Mar.Berry...":"AV-Mr.Mar.Berry","AV-Mr.Mar.Berr...":"AV-Mr.Mar.Berry","M":"AV-M-usa","BigCheese":"AV-M-usa","AV-M":"AV-M-usa","PuffyMufflin":"AV-PuffyMufflin","PuffyMufflia":"AV-PuffyMufflin","Rex":"AV-Rex","AV-RkHendrix-MX":"AV-RkHendrix","AV-RkHendrix-...":"AV-RkHendrix","Phuc.Mccrevice":"AV-Robcorp","AV-Robcorp-AUS":"AV-Robcorp","AV-Rbcorp":"AV-Robcorp","<H>RobCorps":"AV-Robcorp","SiFra":"AV-SiFra","AV-SMILINGBAN...":"AV-SMILINGBANDIT","AV-SMILINGBAN":"AV-SMILINGBANDIT","AV-take-them.out":"AV-ColdCreeps","AV-take.them.out":"AV-ColdCreeps","AV-TikSON$":"AV-TiK$oN$","AV-Vadik-UKR":"AV-Vadik-UA","AV-Vadik":"AV-Vadik-UA","AV-ZIBBY2.0":"AV-ZIBBY","ZolikaLoveKira":"AV-Zolika.x.Kira","AV-ZolikaLoveKira":"AV-Zolika.x.Kira","AV-ZolikaLoveK...":"AV-Zolika.x.Kira","lam":"Iam","tgyes":"tgves","AV-LY10":"AV-BlueWave","AV-Megalodon-":"AV-Megalodon","Foot Slammed":"Foot   Slammed"};
  D.aliasMap=Object.assign({},D.aliasMap||{},aliases);

  const resolve=name=>{
    let x=String(name||'');
    const seen=new Set();
    while(D.aliasMap[x] && !seen.has(x)){
      seen.add(x);
      x=D.aliasMap[x];
    }
    return x;
  };

  // Normalize event rows to the canonical identity.
  ['piggy','space'].forEach(kind=>{
    const X=D[kind];
    if(!X) return;
    Object.values(X.events||{}).forEach(rows=>{
      (rows||[]).forEach(r=>{
        if(r?.name) r.name=resolve(r.name);
        if(r?.username) r.username=resolve(r.username);
      });
    });

    // Merge history keys so a player's old names appear in one profile/history.
    const hist=X.history||{};
    Object.keys(hist).forEach(from=>{
      const to=resolve(from);
      if(!to || to===from) return;
      const merged=[...(hist[to]||[]),...(hist[from]||[])];
      const byKey=new Map();
      merged.forEach(x=>byKey.set(String(x.date||'')+'|'+String(x.code||''),x));
      hist[to]=[...byKey.values()].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      delete hist[from];
    });

    (X.overall||[]).forEach(r=>{ if(r?.name) r.name=resolve(r.name); });
    (X.latestPBs||[]).forEach(r=>{ if(r?.name) r.name=resolve(r.name); });
    (X.latestNewMembers||[]).forEach(r=>{ if(r?.name) r.name=resolve(r.name); });
  });

  // Normalize Kraken player names as well; merge duplicate aliases by keeping
  // each month's best known score for the same person.
  if(K && Array.isArray(K.players)){
    const byName=new Map();
    (K.players||[]).forEach(p=>{
      const name=resolve(p.name);
      const prev=byName.get(name);
      if(!prev){ byName.set(name,{...p,name}); return; }
      (K.months||[]).forEach(m=>prev[m.key]=Math.max(Number(prev[m.key])||0,Number(p[m.key])||0));
      prev.pb=Math.max(Number(prev.pb)||0,Number(p.pb)||0);
      prev.totalSparks=Math.max(Number(prev.totalSparks)||0,Number(p.totalSparks)||0);
    });
    K.players=[...byName.values()];
  }
})();
