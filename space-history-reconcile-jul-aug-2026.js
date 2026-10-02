(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D?.space?.events) return;

  const SHARE_BY_RANK={1:.25,2:.20,3:.18,4:.12,5:.10,6:.08,7:.04,8:.02,9:.01};
  const setGroup=(date,group,names)=>{
    const rows=D.space.events[date]||[];
    names.forEach(name=>{
      const matches=rows.filter(r=>r&&r.name===name);
      matches.forEach(r=>{
        r.group=group;
        r.clan='AVENGERS';
        const s=Number(r.share)||0;
        if(s>1) r.share=s/100;
        else if(!(s>0)&&SHARE_BY_RANK[r.rank]) r.share=SHARE_BY_RANK[r.rank];
      });
    });
  };

  // The main Space Race review PDF is the AVENGERS event source.
  // Current roster status does not change historical event clan attribution.
  Object.values(D.space.events).forEach(rows=>(rows||[]).forEach(r=>{
    if(!r||r.name==='Total'||r.name==='#N/A') return;
    if(String(r.clan||'').toLowerCase().replace(/[^a-z0-9]/g,'')!=='av2') r.clan='AVENGERS';
    const s=Number(r.share)||0;
    if(s>1) r.share=s/100;
    else if(!(s>0)&&Number(r.stars)>0&&SHARE_BY_RANK[r.rank]) r.share=SHARE_BY_RANK[r.rank];
  }));

  // 7/19/26 — five unique AVENGERS lobbies.
  setGroup('2026-07-19',1,['AV-Abu//npjp','AV-SweetiePL','AV-SHAH-G','AV-JeffKintz05','AV-JIM','AV-Deviantdan','AV#Rafa#Tun','AV-ColdCreeps','AV-Mr.Mar.Berry']);
  setGroup('2026-07-19',2,['AV-jacko','AV-CHEN1972','AV-UANGELES','AV-INTEN','AV-EXCALIBUR','AV-7-STAR','AV-EventHorizon','AV-Starred','AV-TigerMx']);
  setGroup('2026-07-19',3,['AV-HarryBallsagna','AV-Nicefellow','AV-STI44ERS','AV-8!l...Bil','AV-no','AV-I.S.O','AV-DaG','AV-Morikila','AV-Finnie']);
  setGroup('2026-07-19',4,['AV-Jess-PT','AV-Animosity','AV-GNSK','AV-KitKat','AV-Hoops','AV-MotherboardBeans','AV-MONSTER','AV-Adigarian','AV-RkHendrix']);
  setGroup('2026-07-19',5,['AV-J','AV-ZolikaLoveKira','AV-Supreeth','AV.Saberkong','AV-COCO','AV-ManChan','AV<STAR-LORD>','AV-Suwako','AV-DrDetroit']);

  // 7/24/26 — five unique lobbies in the PDF. Four rank-9 rows were accidental
  // carry-over duplicates from 7/19 and are removed from both the event and history.
  const dup724=new Set(['AV-TigerMx','AV-DrDetroit','AV-Mr.Mar.Berry','AV-Finnie']);
  D.space.events['2026-07-24']=(D.space.events['2026-07-24']||[]).filter(r=>{
    if(!dup724.has(r?.name)) return true;
    const duplicate=(Number(r.rank)===9)&&['19.5','13.6','9.1','7.1'].includes(String(Number(r.yearsB)));
    return !duplicate;
  });
  dup724.forEach(name=>{
    if(D.space.history?.[name]){
      D.space.history[name]=D.space.history[name].filter(x=>String(x.date||'')!=='2026-07-24');
    }
  });
  setGroup('2026-07-24',1,['AV-Deviantdan','AV-TigerMx','AV#Rafa#Tun','AV-MONSTER','AV-OblivX']);
  setGroup('2026-07-24',2,['AV-7-STAR','AV-J','AV-ZolikaLoveKira','AV-Supreeth','AV-MotherboardBeans','AV-JeffKintz05','AV-Mr.Mar.Berry','AV-ManChan','AV-DaG']);
  setGroup('2026-07-24',3,['AV-Nicefellow','AV-UANGELES','AV<STAR-LORD>','AV-I.S.O','AV-GNSK','AV-ColdCreeps','AV-RkHendrix','AV-jacko','AV-Starred']);
  setGroup('2026-07-24',4,['AV-Rex','AV-CHEN1972','AV-HarryBallsagna','AV-8!l...Bil','AV-Abu//npjp','AV-EventHorizon','AV-JIM','AV-no','AV-Morikila']);
  setGroup('2026-07-24',5,['AV-SweetiePL','AV-INTEN','AV-STI44ERS','AV-EXCALIBUR','AV-SHAH-G','AV-Animosity','AV-KitKat']);

  // 7/30/26 — five lobbies.
  [
    ['AV-Supreeth','AV-Jess-PT','AV-Animosity','AV-KitKat','AV#Rafa#Tun','AV-ManChan','AV-OblivX','AV-no','AV-SHAH-G'],
    ['AV-Rex','AV-HarryBallsagna','AV-ZolikaLoveKira','AV-STI44ERS','AV-8!l...Bil','AV-Deviantdan','AV-Hoops','AV-RkHendrix','AV-DrDetroit'],
    ['AV-7-STAR','AV-CHEN1972','AV-SweetiePL','AV-J','AV-Abu//npjp','AV-JeffKintz05','AV-MotherboardBeans','AV-JIM','AV-Vadik-UA'],
    ['AV-UANGELES','AV-Starred','AV-EventHorizon','AV-SiFra','AV-jacko','AV-TigerMx','AV-Mr.Mar.Berry','AV-DaG','AV-I.S.O'],
    ['AV-Nicefellow','AV-INTEN','AV-MONSTER','AV-EXCALIBUR','AV-GNSK','AV-Adigarian','AV-Finnie']
  ].forEach((names,i)=>setGroup('2026-07-30',i+1,names));

  // 8/7/26 — six lobbies.
  [
    ['AV-Supreeth','AV-MONSTER','AV-Nicefellow','AV-TigerMx','AV-Deviantdan','AV-GNSK','AV-Dareyou!','AV<STAR-LORD>'],
    ['AV-Rex','AV-SweetiePL','AV-INTEN','AV-ZolikaLoveKira','AV-J','AV-8!l...Bil','AV#Rafa#Tun','AV-RkHendrix','AV-I.S.O'],
    ['AV-jacko','AV-JeffKintz05','AV-EXCALIBUR','AV-FrenchieUSA','AV-JIM','AV-DaG','AV-neez','AV-Mr.Mar.Berry','AV+IRON.JAWs'],
    ['AV-Abu//npjp','AV-INFINITY','AV-MotherboardBeans','AV-Mendoria','AV-SiFra','AV-UANGELES','AV-KitKat','AV-SHAH-G','AV-STI44ERS'],
    ['AV-HarryBallsagna','AV-Jess-PT','AV-Finnie','AV-SMILINGBANDIT','AV-OblivX','AV-ColdCreeps','AV-EventHorizon','AV.Saberkong','AV-no'],
    ['AV-Animosity']
  ].forEach((names,i)=>setGroup('2026-08-07',i+1,names));

  // 8/13/26 — six lobbies.
  [
    ['AV-CHEN1972','AV-SweetiePL','AV-GNSK','AV-8!l...Bil','AV-no','AV-JeffKintz05','AV-J','AV-I.S.O','AV-FrenchieUSA'],
    ['AV-Finnie','AV-SHAH-G','AV-EventHorizon','AV-JOKER','AV-Animosity','AV-neez','AV-STI44ERS','AV-MONSTER'],
    ['AV-INTEN','AV-Rex','AV-Jess-PT','AV-jacko','AV-OblivX','AV-Nicefellow','AV-KitKat','AV-ColdCreeps','AV-Dareyou!'],
    ['AV-HarryBallsagna','AV-Abu//npjp','AV.Saberkong','AV<STAR-LORD>','AV-UANGELES','AV-Deviantdan','AV-EXCALIBUR','AV-SMILINGBANDIT','AV-Caklet'],
    ['AV-Supreeth','AV-ZolikaLoveKira','AV-INFINITY','AV-Mendoria','AV-SiFra','AV-DaG','AV-Hoops','AV-JIM','AV-Mr.Mar.Berry'],
    ['AV-MotherboardBeans','AV-CLJM','AV#Rafa#Tun','AV-RkHendrix']
  ].forEach((names,i)=>setGroup('2026-08-13',i+1,names));

  // 8/21/26 — six lobbies.
  [
    ['AV-CHEN1972','AV-Supreeth','AV-INFINITY','AV-INTEN','AV-Abu//npjp','AV#Rafa#Tun','AV-JIM','AV-Hoops','AV-DaG'],
    ['AV-Rex','AV-SweetiePL','AV-HarryBallsagna','AV-ZolikaLoveKira','AV-8!l...Bil','AV-Mendoria','AV.Saberkong','AV-UANGELES','AV-STI44ERS'],
    ['AV-CLJM','AV-SiFra','AV-TigerMx','AV-Deviantdan','AV-EXCALIBUR','AV-ColdCreeps','AV-Adigarian','AV-neez','AV-Mr.Mar.Berry'],
    ['AV-7-STAR','AV-Finnie','AV-OblivX','AV-JeffKintz05','AV-SHAH-G','AV-I.S.O','AV-KitKat','AV-no','AV-FrenchieUSA'],
    ['AV-GNSK','AV-Jess-PT','AV-Caklet','AV-EventHorizon','AV-SMILINGBANDIT','AV<STAR-LORD>','AV-JOKER','AV-RkHendrix','AV-Leon'],
    ['AV-Animosity','AV-MotherboardBeans','AV-Nicefellow','AV-Dareyou!','AV-MONSTER']
  ].forEach((names,i)=>setGroup('2026-08-21',i+1,names));

  // Rebuild history metadata for corrected recent events so event-clan and lobby are retained.
  ['2026-07-19','2026-07-24','2026-07-30','2026-08-07','2026-08-13','2026-08-21','2026-08-30','2026-09-04','2026-09-11','2026-09-18'].forEach(date=>{
    (D.space.events[date]||[]).forEach(r=>{
      if(!r||!r.name||r.name==='Total'||r.name==='#N/A') return;
      const h=D.space.history?.[r.name];
      if(!h) return;
      const x=h.find(z=>String(z.date||'')===date);
      if(x){
        x.clan=r.clan||'AVENGERS';
        x.group=r.group??null;
        if(x.stars==null&&r.stars!=null) x.stars=r.stars;
        if(x.sparks==null&&r.sparks!=null) x.sparks=r.sparks;
      }
    });
  });
})();