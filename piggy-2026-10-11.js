(function() {
  'use strict';
  // Approved Piggy Race results from final 2026-10-11 Discord screenshots.
  // AV-2: exclude rows under 100 lines; the raw CSVs were reviewed by commissioner.
  const D=window.AVENGERS_DATA;
  if(!D || !D.piggy || !D.piggy.history || !D.piggy.events) return;
  const date='2026-10-11',code='261011';
  const sourceCSV={"AVENGERS":"1,AV-Zolika.x.Kira,45763,6673690,667369\n2,AV-Saberkong,41546,6006321,600632\n3,AV-JAMO,34394,5338952,533895\n4,AV-FrankAbagnale,31188,3336845,333684\n5,AV-Animosity,29021,3003161,300316\n6,AV-HarryBallsagna,26159,2936424,293642\n7,AV-Abu//,24088,2869687,286969\n8,AV-Neez,22179,2469265,246927\n9,AV-Nicefellow,21770,2335792,233579\n10,AV-Obajoba,20451,2002107,200211\n11,AV-Mendoria,19898,1935370,193537\n12,AV-Supreeth,19065,1868633,186863\n13,AV-Adigarjan,17392,1801896,180190\n14,AV-KitKat,17137,1735159,173516\n15,AV-I.S.O,16551,1668423,166842\n16,AV-8l...Bil,16450,1601686,160169\n17,AV-SB,15730,1534949,153495\n18,AV-BigPapi,15585,1468212,146821\n19,AV-HN,15479,1401475,140148\n20,AV-7-STAR,15045,1334738,133474\n21,AV-UANGELES,15036,1268001,126800\n22,AV-J1M,15036,1201264,120126\n23,AV-INTEN,12444,1134527,113453\n24,AV-CHEN1972,10995,1067790,106779\n25,AV-Motherboard...,10870,1001054,100105\n26,AV-Mr.Mar.Berry...,10844,934317,93432\n27,AV-Megalodon-,10224,867580,86758\n28,AV#Rafa#Tun,9660,800843,80084\n29,AV-ColdCreeps,8796,734106,73411\n30,AV-SmiLiNgBaN...,8696,667369,66737\n31,AV-WolfLegend,8446,600632,60063\n32,AV-EventHorizon,7629,533895,53390\n33,AV<STAR-LORD>\\,7612,467158,46716\n34,AV-Vadik-UA,7500,400421,40042\n35,AV-Finnie,7430,333685,33368\n36,AV-DeviantDan,7183,266948,26695\n37,AV-DaG,7003,200211,20021\n38,AV-TheOli,5980,133474,13347\n39,AV-RkHendrix-MX,4948,66737,6674\n40,AV-J,4848,66737,6674\n41,AV-Bubba0816,4799,66737,6674\n42,AV-Hoops,4317,66737,6674\n43,AV-23,3881,66737,6674\n44,AV-MONSTER.,3165,66737,6674\n45,AV-Frenchie(-4),2504,66737,6674\n46,AV-DrDetroit-USA,1672,66737,6674\n47,AV-no,1294,66737,6674\n48,AV-OblivX,386,66737,6674\n50,AV-Caklet,48,66737,6674","AV2":"1,AV-SiFra,20387,914578,91457\n2,AV-Pablin,13417,823120,82311\n3,AV-TigerMx,12230,731663,73165\n4,AV-2Lin,11560,457289,45728\n5,AV-JeffHintz05,11040,411560,41156\n6,AV-CHUCK,8692,402414,40241\n7,AV-EXCALIBUR,8013,393269,39326\n8,AV-Brisket,3103,338394,33839\n10,AV-KO,390,274373,27437\n12,AV-HECKTO,286,256082,25608\n13,AV-braa,178,246936,24693\n15,Punchy,138,228645,22864\n18,MayyaZ,108,201207,20120"};
  const aliases={"AV-Saberkong":"AV.Saberkong","AV-FrankAbagnale":"AV-Addicted","AV-Abu//":"AV-Abu//npjp","AV-Neez":"AV-neez","AV-Adigarjan":"AV-Adigarian","AV-8l...Bil":"AV-8!l...Bil","AV-SmiLiNgBaN...":"AV-SMILINGBANDIT","AV<STAR-LORD>\\":"AV<STAR-LORD>","AV-DeviantDan":"AV-Deviantdan","AV-JeffHintz05":"AV-JeffKintz05"};
  const sources={
    AVENGERS:{messageId:'1558983430404841582',channel:'AVENGERS Piggy results',pot:66740000},
    AV2:{messageId:'1558947994865246240',channel:'AV-2 results',pot:9100000}
  };
  D.aliasMap=Object.assign({},D.aliasMap||{},aliases);
  const canonical=(n)=>D.resolvePlayerName?D.resolvePlayerName(aliases[n]||n):(D.aliasMap[aliases[n]||n]||aliases[n]||n);
  const existingMembers=new Map((D.members||[]).map(m=>[m.name,m]));
  const ensureMember=(name,clan)=>{
    if(existingMembers.has(name))return existingMembers.get(name);
    const m={name,status:clan==='AV2'?'AV2':'Active',piggyPB:0,spacePB:0,krakenPB:0,piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,rankingScore:0,krakenPBMonth:0,ratingPB:0,ratingAvg:0,ratingTotal:0,eventsPlayed:0,totalSparks:0};
    (D.members||(D.members=[])).push(m);
    existingMembers.set(name,m);
    return m;
  };
  const parse=(clan)=>{
    const pot=sources[clan].pot;
    return sourceCSV[clan].trim().split(/\r?\n/).map(line=>{
      const parts=line.split(',');
      const rank=Number(parts[0]),sourceName=parts[1],lines=Number(parts[2]),stars=Number(parts[3]),sparks=Number(parts[4]);
      const name=canonical(sourceName);
      if(parts.length!==5 || !name || !Number.isFinite(rank+lines+stars+sparks) || (clan==='AV2' && lines<100)) throw Error('Invalid approved Piggy row: '+line);
      const member=ensureMember(name,clan);
      return {name,username:name,sourceName,rank,lines,stars,sparks,share:stars/pot,clan,eventClan:clan,status:member.status};
    });
  };
  const av=parse('AVENGERS'),av2=parse('AV2');
  const sum=(rs,key)=>rs.reduce((s,r)=>s+Number(r[key]||0),0);
  if(av.length!==49 || av2.length!==13 || sum(av,'lines')!==668137 || sum(av2,'lines')!==89542
     || sum(av,'stars')!==66670167 || sum(av2,'stars')!==5679530
     || sum(av,'sparks')!==6667020 || sum(av2,'sparks')!==567945
     || new Set(av.map(r=>r.name)).size!==49 || new Set(av2.map(r=>r.name)).size!==13) {
    throw Error('2026-10-11 Piggy import integrity check failed');
  }
  const incoming=av.concat(av2);
  const key=r=>String(r.name)+'|'+String(r.eventClan||r.clan||'').replace(/[^a-zA-Z0-9]/g,'').toUpperCase();
  const keys=new Set(incoming.map(key));
  const keep=(D.piggy.events[date]||[]).filter(r=>r && !keys.has(key(r)));
  D.piggy.events[date]=keep.concat(incoming);
  incoming.forEach(r=>{
    const hist=D.piggy.history[r.name]||(D.piggy.history[r.name]=[]);
    const prev=hist.find(x=>String(x.date||'')===date);
    const historyRow={date,code,rank:r.rank,lines:r.lines,stars:r.stars,sparks:r.sparks,share:r.share,clan:r.clan,eventClan:r.eventClan};
    D.piggy.history[r.name]=hist.filter(x=>String(x.date||'')!==date)
      .concat(historyRow).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    const m=ensureMember(r.name,r.clan);
    m.totalSparks=(Number(m.totalSparks)||0)+r.sparks-(Number(prev?.sparks)||0);
  });
  D.piggy.officialPotTotals=Object.assign({},D.piggy.officialPotTotals||{},{[date]:sources.AVENGERS.pot});
  D.piggy.av2PotTotals=Object.assign({},D.piggy.av2PotTotals||{},{[date]:sources.AV2.pot});
  D.piggy.av2Sources=Object.assign({},D.piggy.av2Sources||{},{[date]:{messageId:sources.AV2.messageId,source:'AV-2 Discord final Piggy screenshots'}});
  D.piggy.avengersSources=Object.assign({},D.piggy.avengersSources||{},{[date]:{messageId:sources.AVENGERS.messageId,source:'AVENGERS Discord final Piggy screenshots'}});
  D.meta.latestPiggy=date;
  const values=av.map(r=>r.lines);
  D.piggy.clanTrend=(D.piggy.clanTrend||[]).filter(x=>String(x.date||'')!==date)
    .concat({date,avg:sum(av,'lines')/av.length,total:sum(av,'lines'),stars:sources.AVENGERS.pot,
      rewardStars:sum(av,'stars'),sparks:sum(av,'sparks'),players:av.length})
    .sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  const avg=(xs)=>xs.length?xs.reduce((s,x)=>s+Number(x||0),0)/xs.length:0;
  const arenaStart=String(D.meta.arenaStart||'2026-08-01');
  const overall=[];
  Object.entries(D.piggy.history||{}).forEach(([name,hist])=>{
    const rows=(hist||[]).filter(x=>(Number(x.lines)||0)>0).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    if(!rows.length)return;
    const all=rows.map(x=>Number(x.lines)||0);
    const y26=rows.filter(x=>String(x.date||'')>='2026-01-01');
    const arena=rows.filter(x=>String(x.date||'')>=arenaStart);
    const m=existingMembers.get(name);
    overall.push({
      name,status:m?.status||'Inactive',pb:Math.max(...all),prevPB:Math.max(...all),improvement:0,
      totalLines:sum(rows,'lines'),totalStars:sum(rows,'stars'),totalSparks:sum(rows,'sparks'),
      eventsPlayed:rows.length,avg2026:avg(y26.map(x=>x.lines)),avgArena:avg(arena.map(x=>x.lines)),
      avgStars2026:avg(y26.map(x=>x.stars)),avgSparks2026:avg(y26.map(x=>x.sparks)),
      avgStarsArena:avg(arena.map(x=>x.stars)),avgSparksArena:avg(arena.map(x=>x.sparks)),
      avgLast3:avg(all.slice(-3))
    });
  });
  overall.sort((a,b)=>b.pb-a.pb);
  overall.forEach((r,i)=>r.pbRank=i+1);
  overall.slice().sort((a,b)=>b.avgArena-a.avgArena).forEach((r,i)=>r.avgRank=i+1);
  D.piggy.overall=overall;
  const summaryByName=new Map(overall.map(r=>[r.name,r]));
  const cap=(v,b)=>Math.min(1,Math.max(0,(Number(v)||0)/b));
  (D.members||[]).forEach(m=>{
    const p=summaryByName.get(m.name);
    if(p){m.piggyPB=Math.max(Number(m.piggyPB)||0,p.pb);m.piggyAvg=Number(p.avgArena)||0;}
    m.ratingPB=cap(m.piggyPB,35000)+cap(m.spacePB,350)+cap(m.krakenPB,3500);
    m.ratingAvg=cap(m.piggyAvg,25000)+cap(m.spaceAvg,200)+cap(m.krakenAvgL3,2800);
    m.ratingTotal=m.ratingPB+m.ratingAvg;
  });
  D.piggy.latestPBs=[];
  D.piggy.latestNewMembers=[];
  av.forEach(r=>{
    const before=(D.piggy.history[r.name]||[]).filter(h=>String(h.date||'')<date&&(Number(h.lines)||0)>0);
    const prior=Math.max(0,...before.map(h=>Number(h.lines)||0));
    if(!before.length)D.piggy.latestNewMembers.push({name:r.name,score:r.lines});
    else if(r.lines>prior)D.piggy.latestPBs.push({name:r.name,score:r.lines,previous:prior,improvement:(r.lines-prior)/prior});
  });
  D.piggy.latestPBs.sort((a,b)=>b.improvement-a.improvement);
  D.piggy.importAudit=Object.assign({},D.piggy.importAudit||{},{[date]:{
    avengers:{players:av.length,lines:sum(av,'lines'),rewardStars:sum(av,'stars'),sparks:sum(av,'sparks'),potStars:sources.AVENGERS.pot},
    av2:{players:av2.length,lines:sum(av2,'lines'),rewardStars:sum(av2,'stars'),sparks:sum(av2,'sparks'),potStars:sources.AV2.pot},
    rule:'AV-2 >=100 lines; event-date clan is authoritative'
  }});
})();