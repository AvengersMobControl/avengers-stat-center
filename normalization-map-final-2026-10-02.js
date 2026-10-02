(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D) return;
  const K=window.AVENGERS_KRAKEN_DATA||null;
  const S=window.AVENGERS_SPARKS_SNAPSHOT||null;
  const R=window.AVENGERS_MEMBER_TIMEZONES||null;
  const aliases={"AV#Rafa#Tun":"AV#Rafa#Tun","AV#Rafa#":"AV#Rafa#Tun","AV-(SP)gaby":"AV-(SP)gaby","AV.Saberkong":"AV.Saberkong","AV+IRON.JAWs":"AV+IRON.JAWs","AV<STAR-LORD>":"AV<STAR-LORD>","AV|<STAR-LORD>|":"AV<STAR-LORD>","AV|<STAR-LORD>\\":"AV<STAR-LORD>","AV\\<STAR-LORD>\\":"AV<STAR-LORD>","AV\\<STAR-LOR...":"AV<STAR-LORD>","AV/<STAR-LORD>\\":"AV<STAR-LORD>","AV/<STAR-LOR...":"AV<STAR-LORD>","AV-67":"AV-67","AV-7-STAR":"AV-7-STAR","AV-8!l...Bil":"AV-8!l...Bil","AV-8!\\...Bil":"AV-8!l...Bil","AV-8!\\....Bil":"AV-8!l...Bil","AV-Abu//npjp":"AV-Abu//npjp","AV-Abu#npjp":"AV-Abu//npjp","AV-Abu//np.jp":"AV-Abu//npjp","AV-Adigarian":"AV-Adigarian","AV-AG":"AV-AG","AV-Ajnabi":"AV-Ajnabi","AV-Anamiko":"AV-Anamiko","AV-Andre-DE":"AV-Andre-DE","AV-Andre<DE>":"AV-Andre-DE","AV-Andre":"AV-Andre-DE","AV-Shells.Ani":"AV-Animosity","AV-CowPoke":"AV-Animosity","AV-Animosity":"AV-Animosity","AV-ANITTAfan":"AV-ANITTAfan","AV-AP":"AV-AP","AV-Arachne":"AV-Arachne","AV-AresS":"AV-AresS","AV-Attila-AZE":"AV-Attila-AZE","AV-Attila":"AV-Attila-AZE","AV-Atilla-AZE":"AV-Attila-AZE","AV-Atilla":"AV-Attila-AZE","AV-BaBaVooS-BRA":"AV-BaBaVooS","AV-BaBaVooS-B...":"AV-BaBaVooS","AV-BEEN":"AV-BEEN","AV-BeerMan":"AV-BeerMan","AV-BlackPearl-Dutch":"AV-BlackPearl","AV-BlackPearl-D...":"AV-BlackPearl","AV-BLISTER-USA":"AV-BLISTER","AV-BLISTER2":"AV-BLISTER","AV-Blister2":"AV-BLISTER","AV-Bubba0816":"AV-Bubba0816","AV-BudzyQ":"AV-BudzyQ","BX1":"AV-BX1","AV-BX1":"AV-BX1","AV-Caklet":"AV-Caklet","AV-CC":"AV-CC","AV-CHEN1972":"AV-CHEN1972","AV-CHUCK":"AV-CHUCK","AV-CLJM":"AV-CLJM","AV-COCO":"AV-COCO","AV-CR7":"AV-CR7","AV-CRISPIN.97-MEX":"AV-CRISPIN.97","AV-CRISPIN.97_MEX":"AV-CRISPIN.97","AV-CRISPIN.97":"AV-CRISPIN.97","AV-CRISPIN.27-MEX":"AV-CRISPIN.97","AV-CRISPIN.27MEX":"AV-CRISPIN.97","AV-CRISPIN.27M...":"AV-CRISPIN.97","AV-CRISPIN.27M":"AV-CRISPIN.97","AV-CRISPIN.27-...":"AV-CRISPIN.97","AV-CRISPIN.27":"AV-CRISPIN.97","AV-DaG":"AV-DaG","AV-Dareyou!":"AV-Dareyou!","AV-Derya":"AV-Derya","AV-Deviantdan":"AV-Deviantdan","AV-Dih":"AV-Dih","AV-DrDetroit-USA":"AV-DrDetroit","AV-DrDetroit-U...":"AV-DrDetroit","AV-DrDetroit":"AV-DrDetroit","AV2-DrDetroit-USA":"AV-DrDetroit","AV2-DrDetroit-U...":"AV-DrDetroit","DuluDaniels":"AV-DuluDaniels","AV-DuluDaniels":"AV-DuluDaniels","EatSleepPlay":"AV-EatSleepPlay","AV-EatSleepPlay":"AV-EatSleepPlay","AV-ELMINKYA":"AV-ELMINKYA","AV-EventHorizon028":"AV-EventHorizon","AV-EventHorizon...":"AV-EventHorizon","AV-EventHorizon":"AV-EventHorizon","EvolvedEclipse":"AV-EvolvedEclipse","AV-EvolvedEclipse":"AV-EvolvedEclipse","AV-Witch-king":"AV-EXCALIBUR","AV-EXCALIBUR":"AV-EXCALIBUR","AV-Crusader":"AV-EXCALIBUR","AV-Fatman.69":"AV-Fatman.69","AV-FenixTisential":"AV-FeniXistential","AV-FeniXistential":"AV-FeniXistential","AV-Finnie":"AV-Finnie","HiddenFrenchie":"AV-FrenchieUSA","AV-FrenchieUSA":"AV-FrenchieUSA","AV-Frenchie(-4)":"AV-FrenchieUSA","AV-Frenchie USA":"AV-FrenchieUSA","AV-Frenchie":"AV-FrenchieUSA","(AV)HiddenFrenchman":"AV-FrenchieUSA","(AV)HiddenFrench":"AV-FrenchieUSA","(AV)HiddenFrenc...":"AV-FrenchieUSA","(AV)HiddenFren":"AV-FrenchieUSA","AV-Garou":"AV-Garou","AV-GNSK-JPN":"AV-GNSK","AV-GNSK":"AV-GNSK","AV.GNSK":"AV-GNSK","AV-BlueWave":"AV-LemonBlue","AV-LemonBlue":"AV-LemonBlue","AV-HarleyBob":"AV-HarleyBob","AV-SaddamMiser":"AV-HarryBallsagna","AV-HarryBallsagna":"AV-HarryBallsagna","AV-HarryBallsa...":"AV-HarryBallsagna","AV-HarveySpecter":"AV-HarveySpecter","AV-HarveySpect...":"AV-HarveySpecter","AV-HN":"AV-HN","AV-hoops-SCT":"AV-Hoops","AV-hoops":"AV-Hoops","AV-I.S.O":"AV-I.S.O","AV-INDIA-VIVEK":"AV-INDIA-VIVEK","AV-INFINITY":"AV-INFINITY","Av-<INFINITY>":"AV-INFINITY","AV-INTEN":"AV-INTEN","AV-InvisibleSpy":"AV-InvincibleSpy","AV-InvinsibleSpy":"AV-InvincibleSpy","AV-InvincibleSpy":"AV-InvincibleSpy","AV-Ironeagle":"AV-Ironeagle","AV-Tin-VNM":"AV-J","AV-TiN.":"AV-J","AV-Tin":"AV-J","AV-TiN":"AV-J","AV-TIN":"AV-J","AV-J":"AV-J","JACK...RK":"AV-JACK","AV-JACK":"AV-JACK","AV-jacko-TWN":"AV-jacko","AV-jacko":"AV-jacko","AV-jacko-mini":"AV-jacko-mini","AV-Scout":"AV-jacko-mini","AV-JAKE":"AV-JAKE","AV-Jay":"AV-Jay","AV-JefhKintz05":"AV-JeffKintz05","AV-JeffKintz05":"AV-JeffKintz05","AV-Jess-PT":"AV-Jess-PT","AV-JimBoy":"AV-J1M","AV-JIM80Y":"AV-J1M","AV-JIM":"AV-J1M","AV-J1m80y":"AV-J1M","AV-J1M80Y":"AV-J1M","AV-J1M":"AV-J1M","JOKER":"AV-JOKER","AV-JOKER":"AV-JOKER","AV-kent":"AV-kent","AV-Kerowyn":"AV-Kerowyn","AV-KitKat":"AV-KitKat","AV-KNAVEN":"AV-KNAVEN","AV-KnightRider":"AV-KnightRider","AV-LEO":"AV-LEO","AV-LeoMessi10":"AV-LeoMessi10","AV-Leon":"AV-Leon","AV-LiamUSA":"AV-LiamUSA","AV-Liam":"AV-LiamUSA","AV-ManChan":"AV-ManChan","AV-March":"AV-March","AV.March":"AV-March","AV-MARCO":"AV-MARCO","AV-Marlon":"AV-Marlon","AV-Mendoria":"AV-Mendoria","AV-MONSTER.":"AV-MONSTER","AV-MONSTER":"AV-MONSTER","Morikila":"AV-Morikila","AV-Morikila":"AV-Morikila","AV-Marikila":"AV-Morikila","AV-Morre":"AV-Morre","AV-MotherboardBeans":"AV-MotherboardBeans","AV-Motherboard...":"AV-MotherboardBeans","AV-Motherboar...":"AV-MotherboardBeans","AV-Mr.Mar.Berry-USA":"AV-Mr.Mar.Berry","AV-Mr.Mar.Berry...":"AV-Mr.Mar.Berry","AV-Mr.Mar.Berry":"AV-Mr.Mar.Berry","AV-Mr.Mar.Berr...":"AV-Mr.Mar.Berry","AV-MTBlue":"AV-MTBlue","M":"AV-M-usa","BigCheese":"AV-M-usa","AV-M-usa":"AV-M-usa","AV-M":"AV-M-usa","AV-neez":"AV-neez","AV-Nicefellow":"AV-Nicefellow","AV-no":"AV-no","AV-Obajoba":"AV-Obajoba","AV-OblivX":"AV-OblivX","AV-PanCake":"AV-PanCake","AV-Perhaps":"AV-Perhaps","PuffyMufflin":"AV-PuffyMufflin","PuffyMufflia":"AV-PuffyMufflin","AV-PuffyMufflin":"AV-PuffyMufflin","AV-Punisher":"AV-Punisher","AV-Push-Ups":"AV-Push-Ups","AV-Raj":"AV-Raj","AV-Ratman":"AV-Ratman","AV-ReMit":"AV-ReMit","Rex":"AV-Rex","AV-Rex":"AV-Rex","AV-RkHendrix-MX":"AV-RkHendrix","AV-RkHendrix-...":"AV-RkHendrix","AV-RkHendrix":"AV-RkHendrix","Phuc.Mccrevice":"AV-Robcorp","AV-Robcorp-AUS":"AV-Robcorp","AV-Robcorp":"AV-Robcorp","AV-Rbcorp":"AV-Robcorp","<H>RobCorps":"AV-Robcorp","AV-Rocket!!!":"AV-Rocket!!!","AV-RODRIGO":"AV-RODRIGO","AV-Rojotonyo":"AV-Rojotonyo","AV-Ronin":"AV-Ronin","AV-SB":"AV-SB","AV-SHAH-G":"AV-SHAH-G","AV-Shekab":"AV-Shekab","SiFra":"AV-SiFra","AV-SiFra":"AV-SiFra","AV-SMILINGBANDIT":"AV-SMILINGBANDIT","AV-SMILINGBAN...":"AV-SMILINGBANDIT","AV-SMILINGBAN":"AV-SMILINGBANDIT","AV-Spectris":"AV-Spectris","AV-SPP":"AV-SPP","AV-Starred":"AV-Starred","AV-STI44ERS":"AV-STI44ERS","AV-SupperMan":"AV-SupperMan","AV-Supreeth":"AV-Supreeth","AV-Suwair":"AV-Suwair","AV-Suwako":"AV-Suwako","AV-SweetiePL":"AV-SweetiePL","AV-take-them.out":"AV-ColdCreeps","AV-take.them.out":"AV-ColdCreeps","AV-ColdCreeps":"AV-ColdCreeps","AV-TheGreatCor":"AV-TheGreatCor","AV-TigerMx":"AV-TigerMx","AV-TikSON$":"AV-TiK$oN$","AV-TiK$oN$":"AV-TiK$oN$","AV-Tornado":"AV-Tornado","AV-TwirpSlayer":"AV-TwirpSlayer","AV-tyranitatay":"AV-tyranitatay","AV-UANGELES":"AV-UANGELES","AV-Vadik-UKR":"AV-Vadik-UA","AV-Vadik-UA":"AV-Vadik-UA","AV-Vadik":"AV-Vadik-UA","AV-VaDoS":"AV-VaDoS","AV-Warrior":"AV-Warrior","AV-WeaponX":"AV-WeaponX","AV-WolfLegend":"AV-WolfLegend","AV-ZIBBY":"AV-ZIBBY","AV-ZIBBY2.0":"AV-ZIBBY","ZolikaLoveKira":"AV-Zolika.x.Kira","AV-ZolikaLoveKira":"AV-Zolika.x.Kira","AV-ZolikaLoveK...":"AV-Zolika.x.Kira","AV-ZongXi":"AV-ZongXi","lam":"Iam","Iam":"Iam","IrmaFerkengerd":"IrmaFerkengerd","Malik":"Malik","Noob":"Noob","SOLOLEVEL":"SOLOLEVEL","tgyes":"tgves","tgves":"tgves","AV-LuckY":"AV-LuckY","AV-Pablin":"AV-Pablin","AV-TheOli":"AV-TheOli","AV-LY10":"AV-LemonBlue","AV-Addicted":"AV-Addicted","AV-Megalodon-":"AV-Megalodon","AV-HECKTO":"AV-HECKTO","AV-Megalodon":"AV-Megalodon","AV-KiraLoveZolika":"AV-KiraLoveZolika","AV-LittleZ":"AV-LittleZ","DedHed":"DedHed","Basecreature":"Basecreature","AngelDoll":"AngelDoll","AV-BigPapi":"AV-BigPapi","Foot Slammed":"Foot   Slammed","AV-KO":"AV-KO","AV-Zolika.x.Kira":"AV-Zolika.x.Kira","AV-Hoops":"AV-Hoops","AV-JIMForWes":"AV-J1M"};

  D.aliasMap=Object.assign({},D.aliasMap||{},aliases);

  // Reviewed historical spellings that are absent from the supplied alias table.
  Object.assign(D.aliasMap,{
    'Adigarian':'AV-Adigarian',
    'KNAVEN':'AV-KNAVEN',
    'RkHendrix':'AV-RkHendrix',
    'VADER':'AV-VADER',
    'Gunner':'AV-Gunner',
    'AV-A.G':'AV-AG',
    'AV-Joker':'AV-JOKER',
    '(AV)ABA':'AV>ABA',
    'AV-CRISPI':'AV-CRISPIN.97',
    'AV-CRISPIN':'AV-CRISPIN.97',
    'AV-Mr.Mar':'AV-Mr.Mar.Berry',
    'AV-TiKsON$':'AV-TiK$oN$'
  });

  const exactResolve=name=>{
    let x=String(name||'').trim(),seen=new Set();
    while(D.aliasMap[x] && D.aliasMap[x]!==x && !seen.has(x)){
      seen.add(x);
      x=D.aliasMap[x];
    }
    return x;
  };

  // Match only full known aliases: casing, spacing, separator and AV-prefix
  // differences are harmless. Never use fuzzy/substring matching or drop digits
  // (mini accounts and numbered player names must stay distinct).
  const identityKey=name=>String(name||'').normalize('NFKC').trim().toLowerCase()
    .replace(/^(?:\(av2?\)|av2?[\s._\->|/\\]+)\s*/,'')
    .replace(/[\s._\-\u200B-\u200D\uFEFF]+/g,'');
  const knownAliases=new Map();
  const register=(alias,target)=>{
    const key=identityKey(alias);
    if(!key)return;
    const targets=knownAliases.get(key)||new Set();
    targets.add(exactResolve(target));
    knownAliases.set(key,targets);
  };
  Object.entries(D.aliasMap).forEach(([alias,target])=>register(alias,target));
  const resolve=name=>{
    const exact=exactResolve(name);
    if(D.aliasMap[String(name||'').trim()])return exact;
    const targets=knownAliases.get(identityKey(exact));
    return targets?.size===1?[...targets][0]:exact;
  };
  // Register actual data spellings so existing consumers of aliasMap also share
  // this resolution, including historical player buttons and profile links.
  const dataNames=new Set([
    ...(D.members||[]).map(r=>r.name),
    ...(R?.rows||[]).map(r=>r.name),
    ...(K?.players||[]).map(r=>r.name)
  ]);
  ['piggy','space'].forEach(kind=>{
    Object.keys(D[kind]?.history||{}).forEach(n=>dataNames.add(n));
    Object.values(D[kind]?.events||{}).forEach(rows=>(rows||[]).forEach(r=>{
      if(r.name)dataNames.add(r.name);
      if(r.username)dataNames.add(r.username);
    }));
  });
  dataNames.forEach(name=>{
    const canonical=resolve(name);
    if(canonical!==name)D.aliasMap[name]=canonical;
  });
  D.resolvePlayerName=resolve;

  const avg=a=>a.length?a.reduce((s,v)=>s+(Number(v)||0),0)/a.length:0;
  const arenaStart=D.meta?.arenaStart||'2026-08-01';

  // Normalize every Piggy/Space event row and merge historical aliases.
  ['piggy','space'].forEach(kind=>{
    const X=D[kind];
    if(!X) return;

    Object.values(X.events||{}).forEach(rows=>(rows||[]).forEach(r=>{
      if(r?.name) r.name=resolve(r.name);
      if(r?.username) r.username=resolve(r.username);
    }));

    const merged={};
    Object.entries(X.history||{}).forEach(([from,items])=>{
      const to=resolve(from);
      const dest=merged[to]||(merged[to]=[]);
      (items||[]).forEach(item=>{
        const key=String(item.date||'')+'|'+String(item.code||'')+'|'+String(item.group??'')+'|'+String(item.clan||'');
        const idx=dest.findIndex(x=>
          String(x.date||'')+'|'+String(x.code||'')+'|'+String(x.group??'')+'|'+String(x.clan||'')===key
        );
        if(idx<0) dest.push({...item});
        else{
          const prev=dest[idx];
          // Keep the more complete/highest-value version of a duplicated event row.
          ['lines','yearsB','stars','sparks','share'].forEach(k=>{
            if((Number(item[k])||0)>(Number(prev[k])||0)) prev[k]=item[k];
          });
          if(!prev.clan&&item.clan) prev.clan=item.clan;
          if(prev.group==null&&item.group!=null) prev.group=item.group;
        }
      });
    });
    Object.values(merged).forEach(items=>items.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))));
    X.history=merged;

    ['latestPBs','latestNewMembers'].forEach(key=>{
      const arr=X[key]||[];
      const by=new Map();
      arr.forEach(r=>{
        const name=resolve(r.name);
        const prev=by.get(name);
        if(!prev || (Number(r.score)||0)>(Number(prev.score)||0)) by.set(name,{...r,name});
      });
      X[key]=[...by.values()];
    });
  });

  // Normalize Kraken identities and merge duplicate aliases month-by-month.
  if(K && Array.isArray(K.players)){
    const by=new Map();
    (K.players||[]).forEach(p=>{
      const name=resolve(p.name);
      let q=by.get(name);
      if(!q){q={...p,name};by.set(name,q);}
      else{
        (K.months||[]).forEach(m=>q[m.key]=Math.max(Number(q[m.key])||0,Number(p[m.key])||0));
        q.totalSparks=Math.max(Number(q.totalSparks)||0,Number(p.totalSparks)||0);
      }
    });
    K.players=[...by.values()];
    K.players.forEach(p=>{
      const vals=(K.months||[]).map(m=>({m,v:Number(p[m.key])||0})).filter(x=>x.v>0);
      if(vals.length){
        const best=vals.reduce((a,b)=>b.v>a.v?b:a);
        p.pb=best.v;
        p.pbMonth=best.m.label||best.m.key||'';
        p.avg=avg(vals.map(x=>x.v));
        p.last3=avg(vals.slice(-3).map(x=>x.v));
      }else{
        p.pb=0;p.pbMonth='';p.avg=0;p.last3=0;
      }
    });
  }

  // Normalize the all-time Sparks snapshot and keep the highest known snapshot value.
  if(S && Array.isArray(S.currentAvengers)){
    const by=new Map();
    S.currentAvengers.forEach(r=>{
      const name=resolve(r.name);
      const prev=by.get(name);
      if(!prev || (Number(r.allTimeSparks)||0)>(Number(prev.allTimeSparks)||0)) by.set(name,{...r,name});
    });
    S.currentAvengers=[...by.values()];
  }

  // Normalize the authoritative current roster itself so dropdowns and roster tables
  // display one canonical name per person.
  if(R && Array.isArray(R.rows)){
    const priority=s=>String(s||'').toLowerCase()==='active'?3:(String(s||'').toLowerCase()==='av2'?2:1);
    const by=new Map();
    R.rows.forEach(row=>{
      const name=resolve(row.name);
      const prev=by.get(name);
      const next={...row,name,sourceName:row.sourceName||row.name,canonicalName:name};
      if(!prev || priority(next.status)>priority(prev.status)) by.set(name,next);
      else{
        ['utc','tzg','state','location'].forEach(k=>{if((prev[k]==null||prev[k]==='')&&next[k]!=null&&next[k]!=='')prev[k]=next[k];});
      }
    });
    R.rows=[...by.values()];
    const byName={};
    R.rows.forEach(row=>{
      const item={
        sourceName:row.sourceName||row.name,
        canonicalName:row.name,
        status:row.status,
        utc:row.utc,
        utcLabel:R.formatUtc?R.formatUtc(row.utc):(row.utc==null?'':String(row.utc)),
        timeZoneGroup:row.tzg==null?'':String(row.tzg),
        state:row.state||'',
        location:row.location||''
      };
      byName[row.name]=item;
    });
    Object.keys(D.aliasMap||{}).forEach(alias=>{
      const canonical=resolve(alias);
      if(byName[canonical]) byName[alias]=byName[canonical];
    });
    R.byName=byName;
  }

  // Merge duplicate member cards after all aliases have been resolved.
  const memberGroups=new Map();
  (D.members||[]).forEach(m=>{
    const name=resolve(m.name);
    const arr=memberGroups.get(name)||[];
    arr.push(m);
    memberGroups.set(name,arr);
  });
  const members=[];
  memberGroups.forEach((group,name)=>{
    const preferred=group.find(m=>m.name===name)||group[0];
    const m={...preferred,name};
    const numericMax=['piggyPB','spacePB','krakenPB','piggyAvg','spaceAvg','krakenAvgL3','krakenAvg','rankingScore','ratingPB','ratingAvg','ratingTotal'];
    numericMax.forEach(k=>m[k]=Math.max(...group.map(x=>Number(x[k])||0)));
    m.eventsPlayed=Math.max(...group.map(x=>Number(x.eventsPlayed)||0));
    // Old-name shells carry 0 total sparks; summing preserves genuine split histories if any exist.
    m.totalSparks=group.reduce((s,x)=>s+(Number(x.totalSparks)||0),0);
    const roster=R?.byName?.[name];
    m.status=roster?.status||m.status||'Inactive';
    members.push(m);
  });
  D.members=members;

  const memberBy=new Map(D.members.map(m=>[m.name,m]));

  // Rebuild overall Piggy/Space summary rows from the normalized histories so old aliases
  // contribute to the canonical player's profile instead of appearing as separate players.
  if(D.piggy){
    const overall=[];
    Object.entries(D.piggy.history||{}).forEach(([name,hist])=>{
      const rows=(hist||[]).filter(x=>(Number(x.lines)||0)>0).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      if(!rows.length)return;
      const all=rows.map(x=>Number(x.lines)||0);
      const y26=rows.filter(x=>String(x.date||'')>='2026-01-01');
      const arena=rows.filter(x=>String(x.date||'')>=arenaStart);
      const m=memberBy.get(name);
      overall.push({
        name,status:m?.status||'Inactive',
        pb:Math.max(...all),prevPB:Math.max(...all),improvement:0,
        totalLines:all.reduce((s,v)=>s+v,0),
        totalStars:rows.reduce((s,x)=>s+(Number(x.stars)||0),0),
        totalSparks:rows.reduce((s,x)=>s+(Number(x.sparks)||0),0),
        eventsPlayed:rows.length,
        avg2026:avg(y26.map(x=>Number(x.lines)||0)),
        avgArena:avg(arena.map(x=>Number(x.lines)||0)),
        avgStars2026:avg(y26.map(x=>Number(x.stars)||0)),
        avgSparks2026:avg(y26.map(x=>Number(x.sparks)||0)),
        avgStarsArena:avg(arena.map(x=>Number(x.stars)||0)),
        avgSparksArena:avg(arena.map(x=>Number(x.sparks)||0)),
        avgLast3:avg(all.slice(-3))
      });
    });
    overall.sort((a,b)=>b.pb-a.pb);overall.forEach((r,i)=>r.pbRank=i+1);
    overall.slice().sort((a,b)=>b.avgArena-a.avgArena).forEach((r,i)=>r.avgRank=i+1);
    D.piggy.overall=overall;
  }

  if(D.space){
    const overall=[];
    Object.entries(D.space.history||{}).forEach(([name,hist])=>{
      const rows=(hist||[]).filter(x=>(Number(x.yearsB)||0)>0).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      if(!rows.length)return;
      const raw=rows.map(x=>Number(x.yearsB)||0);
      const effective=rows.map(x=>String(x.date||'')==='2026-10-02'?(Number(x.yearsB)||0)/0.6666:(Number(x.yearsB)||0));
      const m=memberBy.get(name);
      const pb=Math.max(...effective);
      overall.push({
        name,status:m?.status||'Inactive',pb,oldPB:0,improvement:0,
        totalYears:raw.reduce((s,v)=>s+v,0),
        totalStars:rows.reduce((s,x)=>s+(Number(x.stars)||0),0),
        totalSparks:rows.reduce((s,x)=>s+(Number(x.sparks)||0),0),
        eventsPlayed:rows.length,
        avgYears:avg(raw),
        avgStars:avg(rows.map(x=>Number(x.stars)||0)),
        avgSparks:avg(rows.map(x=>Number(x.sparks)||0)),
        pbYears:pb,
        avgLast3:avg(raw.slice(-3))
      });
    });
    overall.slice().sort((a,b)=>b.avgYears-a.avgYears).forEach((r,i)=>r.avgRank=i+1);
    D.space.overall=overall;
  }

  // Refresh member PB/average/rating fields from the consolidated histories.
  const pigOverall=new Map((D.piggy?.overall||[]).map(r=>[r.name,r]));
  const spaceOverall=new Map((D.space?.overall||[]).map(r=>[r.name,r]));
  const krakenBy=new Map((K?.players||[]).map(p=>[p.name,p]));
  const capped=(v,b)=>Math.min(1,Math.max(0,(Number(v)||0)/b));
  D.members.forEach(m=>{
    const p=pigOverall.get(m.name),s=spaceOverall.get(m.name),k=krakenBy.get(m.name);
    if(p){m.piggyPB=Math.max(Number(m.piggyPB)||0,Number(p.pb)||0);m.piggyAvg=Number(p.avgArena)||0;}
    if(s){
      m.spacePB=Math.max(Number(m.spacePB)||0,Number(s.pb)||0);
      const recent=(D.space.history[m.name]||[]).filter(x=>String(x.date||'')>=arenaStart&&(Number(x.yearsB)||0)>0);
      m.spaceAvg=avg(recent.map(x=>Number(x.yearsB)||0));
    }
    if(k){
      m.krakenPB=Number(k.pb)||0;
      m.krakenAvg=Number(k.avg)||0;
      m.krakenAvgL3=Number(k.last3)||0;
      m.krakenPBMonth=k.pbMonth||'';
    }
    m.ratingPB=capped(m.piggyPB,35000)+capped(m.spacePB,350)+capped(m.krakenPB,3500);
    m.ratingAvg=capped(m.piggyAvg,25000)+capped(m.spaceAvg,200)+capped(m.krakenAvgL3,2800);
    m.ratingTotal=m.ratingPB+m.ratingAvg;
  });

  // Make sure summary-row statuses follow the final current roster status.
  ['piggy','space'].forEach(kind=>(D[kind]?.overall||[]).forEach(r=>{
    r.status=memberBy.get(r.name)?.status||r.status||'Inactive';
  }));

  D.meta.normalizationSource='User normalization map reviewed 2026-10-02';
})();
