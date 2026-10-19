/* AV-2 current in-game roster and lifetime Sparks, supplied 2026-10-15.
   Latest AV-2 screenshots are authoritative for AV-2 membership.
   Sparks are account all-time snapshots, NOT new event payouts.
   Preserve historical event/clan attribution and all player statistics.
   The AVENGERS primary roster awaits its own current screenshots. */
(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  const R=window.AVENGERS_MEMBER_TIMEZONES;
  const S=window.AVENGERS_SPARKS_SNAPSHOT;
  if(!D||!R||!S)return;
  const entries=[["AV-CHUCK",1240995,"AV-Chuck"],["Av-TigerMx",1177393,"AV-TigerMx"],["AV-Jess-PT",1078111],["AV-CRISPIN.27",971440,"AV-CRISPIN.97"],["AV-2Lin",863222],["AV-EXCALIBUR",698404],["AV-SiFra",693692],["AV2-Kira",503784,"AV-KiraLoveZolika"],["AV2-Brisket",384615,"AV-Brisket"],["AV-Fahad",214296],["AV2-KO",103599,"AV-KO"],["AV-HECKTO",91992],["AV2-MayyaZ",83398],["AV-braa",68536],["Basecreature",64830],["Ibrahim",58724],["Punchy",42978],["AV-LittleZ",30152],["AV-Frenchie2",21123],["DedHed",20471],["Keyler",20136],["uLTRaSLaN",19645],["kayesie",18057],["AV-fueravini",16987],["AV-JOKER",5728],["GANESH",5487],["Blade",4598],["AV-CLJM",2124],["GirlsOnly",43],["yooossss",0],["Shelby",0],["Piton",0],["Jamaica",0],["AV-ItsNospace",0],["AV-Squishy",0],["AV-2Pipesis",0],["AV-AC3",0],["AV-2(TAMIM)",0],["AV-JefhKintz05",0],["AV-Frenchie(-4)",0,"AV-FrenchieUSA"],["AV-Caklet",0],["AV-OblivX",0],["Pro",0],["AV-EventHorizon",0],["AV-Hoops",0],["AV-Derya(OnVACATION)",0,"AV-Derya"],["AV-KitKat",0],["Creatureboost",0],["AV-J",0],["AV-MONSTER.",0,"AV-MONSTER"]];
  const oldRows=Array.isArray(R.rows)?R.rows:[];
  const oldByName=R.byName||{};
  const used=new Set();
  const lineage=new Map();
  const newAv2=entries.map(([name,sparks,profile],i)=>{
    const linked=profile||name;
    const prev=oldRows.find(r=>r.name===linked||r.name===name);
    if(prev)used.add(prev);
    const row={...(prev||{utc:null,tzg:null,state:'',location:''}),name,status:'AV2'};
    lineage.set(linked,row);
    lineage.set(name,row);
    return row;
  });
  // Anyone on the previously reported AV-2 list but missing from the
  // supplied complete 50-member screenshot is no longer confirmed in AV-2.
  // Do not alter the previous AVENGERS membership without new main-clan evidence.
  const otherRows=oldRows.filter(r=>!used.has(r)).map(r=>
    r.status==='AV2'?{...r,status:'Inactive'}:{...r});
  R.rows=[...otherRows,...newAv2];
  const build=r=>({
    sourceName:r.name,canonicalName:r.name,status:r.status,
    utc:r.utc==null?null:r.utc,
    utcLabel:R.formatUtc?.(r.utc)||'',
    timeZoneGroup:r.tzg==null?'':String(r.tzg),
    state:r.state||'',location:r.location||''
  });
  const byName={};
  R.rows.forEach(r=>{byName[r.name]=build(r);});
  // Keep old aliases and location references pointing at the corresponding
  // updated member row, including a renamed player's former roster identity.
  Object.entries(oldByName).forEach(([key,old])=>{
    const linked=lineage.get(old?.sourceName)||lineage.get(old?.canonicalName);
    if(linked)byName[key]=build(linked);
    else if(byName[old?.sourceName])byName[key]=byName[old.sourceName];
  });
  const aliasAdd={};
  entries.forEach(([display,sparks,profile],i)=>{
    const linked=profile||display;
    // A legacy alias might have occupied this exact name: latest explicit
    // screenshot entries must take precedence over legacy alias links.
    byName[display]=build(newAv2[i]);
    byName[linked]=byName[display];
    if(linked!==display)aliasAdd[display]=linked;
  });
  R.byName=byName;
  R.source='AVENGERS membership 2026-10-01; AV-2 screenshot 2026-10-15';
  R.precedence='AV-2 membership and all-time Sparks from Oct 15 screenshots; other existing metadata retained; TZG never inferred from UTC.';
  D.aliasMap=Object.assign({},D.aliasMap||{},aliasAdd);
  // Two different AV-2 accounts coexist in the supplied screenshots.
  // Previously both Frenchie names were aliases for a single profile.
  // Keep Frenchie2 distinct, while Frenchie(-4) retains the legacy record.
  delete D.aliasMap['AV-Frenchie2'];

  // Update only current status; do not rewrite event records or rewards.
  (D.members||[]).forEach(m=>{
    const current=byName[m.name];
    m.status=current?.status||'Inactive';
  });
  const known=new Set((D.members||[]).map(m=>m.name));
  entries.forEach(([display,sparks,profile])=>{
    const linked=profile||display;
    if(known.has(linked)||known.has(display))return;
    D.members.push({
      name:linked,status:'AV2',
      piggyPB:0,spacePB:0,krakenPB:0,
      piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,
      rankingScore:0,krakenPBMonth:'',
      ratingPB:0,ratingAvg:0,ratingTotal:0,
      eventsPlayed:0,totalSparks:0
    });
    known.add(linked);
  });
  (window.AVENGERS_KRAKEN_DATA?.players||[]).forEach(p=>{
    p.status=byName[p.name]?.status||'Inactive';
  });
  S.currentAv2=entries.map(([name,allTimeSparks,profile],i)=>({
    rank:i+1,name,profileName:profile||name,allTimeSparks
  }));
  S.av2Date='2026-10-15';
  S.av2Label='AV-2 in-game All time Sparks screenshots';
  // Stars will be attached from separately supplied Stars screenshots,
  // rather than estimated from Sparks or prior event history.
})();
