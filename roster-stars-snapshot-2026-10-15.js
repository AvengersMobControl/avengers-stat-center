/* October 15, 2026 in-game membership + lifetime Stars snapshots.
   AVENGERS: 48 screenshot members; AV-2: 50 screenshot members + 2 leader-confirmed.
   Never add all-time screenshot totals to event payout ledgers.
   This is the current roster source plus explicit manual membership corrections;
   historical event records and event-time clan associations are untouched. */
(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  const R=window.AVENGERS_MEMBER_TIMEZONES;
  const S=window.AVENGERS_SPARKS_SNAPSHOT;
  if(!D||!R||!S||!Array.isArray(S.currentAv2))return;

  // Rows: current in-game display name, all-time Stars, historical canonical
  // player identity when known. AV-Zolika.x.TheBoss is the canonical display; older Kira screenshot spelling remains source evidence.
  const avengers=[["AV-HarryBallsagna",400339498],["AV-INTEN",295354229],["AV-CHEN1972",210766659],["AV-Abu//JPN",191426769,"AV-Abu//npjp"],["AV-Rita",184944924],["AV-SweetiePL",172243399],["AV-FrankAbagnale",168758985,"AV-Addicted"],["AV-Zolika.x.Kira",154295001],["AV.Saberkong",141432133],["AV-Supreeth",129942683],["AV-J1M",126722897],["AV#Rafa#Tun",124802010],["AV-UANGELES",116808654],["AV-Nicefellow",110725222],["AV-8!\\...Bil",98147102,"AV-8!l...Bil"],["AV-Adigarian",94176442],["AV/<STAR-LORD>\\",93230935,"AV<STAR-LORD>"],["AV-7-STAR",91847646],["AV-DaG",91766832],["AV-WolfLegend",90310063],["AV-I.S.O",89811462],["AV-Animosity",82634334],["AV-SB",78041109],["AV-ColdCreeps",77597230],["AV-McNasty",74473253],["AV-ZIBBY2.0",67946378,"AV-ZIBBY"],["AV-MotherboardBeans",64609753],["AV-JAMO",63526777],["AV-Mr.Mar.Berry-USA",57617633,"AV-Mr.Mar.Berry"],["AV-Pablin",56912596],["AV-Obajoba",55047311],["AV-Finnie",53208603],["AV-Megalodon-",47461999,"AV-Megalodon"],["AV-Mendoria",47224732],["AV-SmiLiNgBaNDiT",46658755,"AV-SMILINGBANDIT"],["AV-RkHendrix-MX",44494571,"AV-RkHendrix"],["AV-ShielDBreaker",43105003],["AV-Vadik-UA",40009566],["AV-no",39398485],["AV-DeviantDan",34267316,"AV-Deviantdan"],["AV-HN",26010956],["AV-TheOli",22766791],["AV-BigPapi",22514173],["AV-Neez",21967962,"AV-neez"],["AV-Royal",19582308],["AV-KNAVEN",19336443],["AV-23",12598064]];
  const av2Stars=[["AV-J",157970485],["AV-Squishy",118435300],["AV-OblivX",115410535],["Av-TigerMx",95252050],["AV-SiFra",86755295],["AV-MONSTER.",83294098],["AV-KitKat",72664989],["AV-EventHorizon",60623212],["AV-Hoops",57704868],["AV-Jess-PT",56305141],["AV-JefhKintz05",55968184],["AV-Derya(OnVACATION)",51009356],["AV-JOKER",49492939],["AV-EXCALIBUR",44079911],["AV-Frenchie(-4)",42825753],["AV-CRISPIN.27",36863572],["AV-CHUCK",26639937],["AV-Caklet",24619901],["AV-CLJM",24451119],["AV-AC3",22072027],["AV-2Lin",15079352],["AV2-Brisket",11402244],["AV-Fahad",6770902],["AV2-Kira",5475845],["AV2-KO",2982415],["AV-HECKTO",2527230],["AV-LittleZ",1974899],["AV-braa",1493972],["Basecreature",1215393],["Jamaica",1209314],["Ibrahim",1101869],["AV-2(TAMIM)",811686],["Punchy",756979],["AV2-MayyaZ",655915],["DedHed",639115],["Blade",625924],["GANESH",591593],["AV-2Pipesis",549684],["AV-fueravini",429822],["uLTRaSLaN",428560],["Shelby",417889],["Creatureboost",359939],["Keyler",342737],["kayesie",313403],["AV-ItsNospace",273397],["Pro",249779],["GirlsOnly",181611],["AV-Frenchie2",179505],["yooossss",145128],["Piton",132536]];
  if(avengers.length!==47||av2Stars.length!==50||S.currentAv2.length!==50)
    throw new Error('Incomplete roster screenshot snapshot');
  const av2StarMap=new Map(av2Stars);
  if(S.currentAv2.some(x=>!av2StarMap.has(x.name)))
    throw new Error('AV-2 Sparks and Stars snapshots do not match');
  S.currentAv2.forEach(row=>{row.allTimeStars=av2StarMap.get(row.name);});
  S.currentAvengersStars=avengers.map(([name,allTimeStars,profileName],i)=>({
    rank:i+1,name,profileName:profileName||name,allTimeStars
  }));
  S.avengersStarsDate='2026-10-15';
  S.av2StarsDate='2026-10-15';

  // Preserve historical aliases but do not merge two separately confirmed
  // AV-2 accounts, AV-Frenchie2 and AV-Frenchie(-4).
  const extraAliases={
    'AV-Abu//JPN':'AV-Abu//npjp',
    'AV-Zolika.x.Kira':'AV-Zolika.x.TheBoss',
    'AV-ZIBBY2.0':'AV-ZIBBY',
    'AV-Neez':'AV-neez',
    'AVS9.Saberkong':'AV.Saberkong',
    'AVS9-HN':'AV-HN'
  };
  D.aliasMap=Object.assign({},D.aliasMap||{},extraAliases);
  delete D.aliasMap['AV-Frenchie2'];
  const canonical=raw=>{
    let n=String(raw||'').trim();
    const seen=new Set();
    while(D.aliasMap[n]&&D.aliasMap[n]!==n&&!seen.has(n)){
      seen.add(n);n=D.aliasMap[n];
    }
    return n;
  };
  const oldRows=R.rows||[];
  const oldByName=R.byName||{};
  const priorRows=new Map();
  oldRows.forEach(row=>{
    const id=canonical(row.name);
    const prev=priorRows.get(id);
    if(!prev || (prev.utc==null && row.utc!=null))priorRows.set(id,row);
  });
  // Explicit clan-leader membership correction (Oct 15): these two players
  // belong in AV-2, while AV-Bubba0816 stays Inactive. They are not in the
  // original 50-player AV-2 screenshot; do not invent Sparks or Stars totals.
  const manualAv2=['AV-DrDetroit','AV-Starred'];
  S.av2ManualMembers=manualAv2.slice();
  const rosterEntries=[
    ...avengers.map(([name,allTimeStars,profileName])=>({
      name,profileName:canonical(profileName||name),status:'Active'
    })),
    ...S.currentAv2.map(x=>({
      name:x.name,profileName:canonical(x.profileName||x.name),status:'AV2'
    })),
    ...manualAv2.map(name=>({name,profileName:canonical(name),status:'AV2'}))
  ];
  // Add approved new Discord UTC roster entries after the fixed screenshot
  // baseline. Existing screenshot and council-provided status always wins.
  const fixedIds=new Set(rosterEntries.map(x=>x.profileName));
  if(fixedIds.size!==99)
    throw new Error('October 15 screenshot and Council roster identities overlap');

  // October 18 clan-leader membership update. Keep the October 15 Sparks/Stars
  // captures intact as historical evidence, even for members since transferred.
  // Jeff's previous screenshot spelling is an alias; AV-JeffKintz05 is the
  // current canonical/display name and retains ALL historical results.
  // October 21: Timmy joins AVENGERS. Frank already has the canonical
  // AV-Addicted account via AV-FrankAbagnale; confirm active without duplicating.
  const activeCorrections=['AV-Lin','AV-JefhKintz05','AV-SiFra','AV-Timmy','AV-FrankAbagnale','AV-Fred'];
  for(const correctName of activeCorrections){
    const profileName=canonical(correctName);
    const existing=rosterEntries.find(row=>row.profileName===profileName);
    if(existing){
      existing.status='Active';
      if(profileName==='AV-JefhKintz05')existing.name='AV-JefhKintz05';
      if(profileName==='AV-Lin')existing.name='AV-Lin';
    }else{
      rosterEntries.push({name:correctName,profileName,status:'Active'});
    }
  }
  // Zibby transferred to AV-2. The historic Oct 15 main-clan screenshot
  // remains untouched; this changes CURRENT membership only.
  const zibby=rosterEntries.find(row=>row.profileName===canonical('AV-ZIBBY'));
  if(!zibby)throw new Error('Unable to locate Zibby canonical profile');
  zibby.status='AV2';
  // October 21 leader-directed transfer: current membership only.
  const theOli=rosterEntries.find(row=>row.profileName===canonical('AV-TheOli'));
  if(!theOli)throw new Error('Unable to locate TheOli canonical profile');
  theOli.status='AV2';
  // October 23 leader correction: Animosity is a former member, with a
  // one-week Big Pig eligibility exception documented in the intake policy.
  // Preserve his profile, historical results and dated screenshot evidence.
  const formerIndex=rosterEntries.findIndex(row=>row.profileName===canonical('AV-Animosity'));
  if(formerIndex<0)throw new Error('Unable to locate Animosity canonical profile');
  rosterEntries.splice(formerIndex,1);
  for(const name of ['Mickzzz','AV2-Froyo']){
    const profileName=canonical(name);
    if(rosterEntries.some(row=>row.profileName===profileName))
      throw new Error('New AV-2 identity already exists: '+name);
    rosterEntries.push({name,profileName,status:'AV2'});
    fixedIds.add(profileName);
  }
  // Historical screenshot-only LT entry is removed at leader direction and
  // never gets a profile shell: zero known event rows or event rewards.
  if(new Set(rosterEntries.map(row=>row.profileName)).size!==102)
    throw new Error('October 23 roster identities unexpectedly overlap');
  const discordMembers=window.AVENGERS_DISCORD_UTC_ROSTER?.members||[];
  for(const member of discordMembers){
    const name=String(member.name||'').trim();
    const status=member.status;
    if(!name||!['Active','AV2'].includes(status))continue;
    const profileName=canonical(name);
    if(fixedIds.has(profileName))continue;
    rosterEntries.push({name,profileName,status});
    fixedIds.add(profileName);
  }
  const currentIds=new Set(rosterEntries.map(x=>x.profileName));
  if(currentIds.size!==rosterEntries.length)
    throw new Error('Dynamic Discord roster identities overlap');
  if(currentIds.has(canonical('AV-Bubba0816')))
    throw new Error('Bubba should remain Inactive');
  const currentRows=rosterEntries.map(row=>{
    const p=priorRows.get(row.profileName)||priorRows.get(canonical(row.name));
    return {
      name:row.name,status:row.status,
      utc:p?.utc??null,tzg:p?.tzg??null,
      state:p?.state||'',location:p?.location||''
    };
  });
  const inactiveRows=[...priorRows.entries()]
    .filter(([id])=>!currentIds.has(id))
    .map(([,row])=>({...row,status:'Inactive'}));
  R.rows=[...currentRows,...inactiveRows];

  // Current screenshot membership supersedes prior active and AV-2 statuses;
  // metadata and alias lookup remain available on player history pages.
  const fromRow=row=>({
    sourceName:row.name,canonicalName:canonical(row.name),
    status:row.status,utc:row.utc,
    utcLabel:R.formatUtc?.(row.utc)||'',
    timeZoneGroup:row.tzg==null?'':String(row.tzg),
    state:row.state||'',location:row.location||''
  });
  const byName={};
  R.rows.forEach(row=>{byName[row.name]=fromRow(row);});
  rosterEntries.forEach((x,i)=>{
    byName[x.name]=fromRow(currentRows[i]);
    byName[x.profileName]=byName[x.name];
    if(x.name!==x.profileName)D.aliasMap[x.name]=x.profileName;
  });
  // Do not restore stale aliases from the old R.byName for aliases now
  // belonging to a different account (notably Frenchie2).
  Object.keys(oldByName).forEach(alias=>{
    const resolved=canonical(alias);
    if(byName[resolved])byName[alias]=byName[resolved];
  });
  delete D.aliasMap['AV-Frenchie2'];
  byName['AV-Frenchie2']=fromRow(currentRows.find(r=>r.name==='AV-Frenchie2'));
  R.byName=byName;
  R.source='October 15 AVENGERS/AV-2 snapshots + October 23 leader identity and membership corrections';
  R.precedence='October 15 source screenshots retained as dated provenance, except leader-removed LT shell; current changes: AV-2Lin → AV-Lin, Jeff canonical AV-JefhKintz05, SiFra and Timmy Active, Fred Active, FrankAbagnale linked to existing Addicted account, Zibby and TheOli AV-2; Animosity Inactive, Mickzzz and AV2-Froyo AV-2; 49 Active and 53 AV-2; UTC/TZG/country retained.';

  // Only current member status changes. Event history, clan attribution,
  // personal records, event totals, and rating math remain unchanged.
  (D.members||[]).forEach(m=>{m.status=byName[m.name]?.status||'Inactive';});
  const existingProfiles=new Set((D.members||[]).map(m=>canonical(m.name)));
  rosterEntries.forEach(({profileName,status})=>{
    if(existingProfiles.has(profileName))return;
    D.members.push({
      name:profileName,status,
      piggyPB:0,spacePB:0,krakenPB:0,
      piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,
      rankingScore:0,krakenPBMonth:'',
      ratingPB:0,ratingAvg:0,ratingTotal:0,
      eventsPlayed:0,totalSparks:0
    });
    existingProfiles.add(profileName);
  });
  (window.AVENGERS_KRAKEN_DATA?.players||[]).forEach(p=>{
    p.status=byName[p.name]?.status||'Inactive';
  });
})();
