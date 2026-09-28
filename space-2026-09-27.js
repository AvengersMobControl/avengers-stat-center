(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D) return;

  const date='2026-09-27';
  const newRows=[
    {group:1,rank:1,name:'AV-ZolikaLoveKira',username:'(S9)AV-Zolika…',yearsB:740.0,stars:7700000,sparks:769994,share:.25},
    {group:1,rank:2,name:'AV-LuckY',username:'(S9)AV-LuckYZo',yearsB:577.8,stars:6160000,sparks:615995,share:.20},
    {group:1,rank:3,name:'AV-WolfLegend',username:'(S9)AV-WolfZoli…',yearsB:539.0,stars:5540000,sparks:554395,share:.18},
    {group:1,rank:4,name:'AV-HarryBallsagna',username:'(S9)AV-HarryBa…',yearsB:536.9,stars:3700000,sparks:369597,share:.12},
    {group:1,rank:5,name:'AV-CHEN1972',username:'AV(S9)-CHEN1972',yearsB:438.2,stars:3080000,sparks:307997,share:.10},
    {group:1,rank:6,name:'AV-INTEN',username:'AV-INTEN',yearsB:360.4,stars:2460000,sparks:246398,share:.08},
    {group:1,rank:7,name:'AV-J',username:'(S9)AV-J-Zo',yearsB:328.0,stars:1230000,sparks:123199,share:.04},
    {group:1,rank:8,name:'AV-Pablin',username:'(S9)AV-Pablin-Z…',yearsB:321.1,stars:615844,sparks:61599,share:.02},
    {group:1,rank:9,name:'AV-ZIBBY',username:'(S9)AV-ZIBBY2.0',yearsB:302.6,stars:307922,sparks:30800,share:.01},

    {group:2,rank:1,name:'AV-Animosity',username:'AV-AnimoZoty',yearsB:497.4,stars:3760000,sparks:376414,share:.25},
    {group:2,rank:2,name:'AV-8!l...Bil',username:'AV-8!…BilZol',yearsB:313.3,stars:3010000,sparks:301132,share:.20},
    {group:2,rank:3,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:267.8,stars:2710000,sparks:271018,share:.18},
    {group:2,rank:4,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:248.2,stars:1810000,sparks:180679,share:.12},
    {group:2,rank:5,name:'AV-no',username:'AV-no',yearsB:207.4,stars:1500000,sparks:150566,share:.10},
    {group:2,rank:6,name:'AV-Obajoba',username:'AV-Obajoba',yearsB:205.3,stars:1200000,sparks:120453,share:.08},
    {group:2,rank:7,name:'AV-ZoopZ',username:'AV-ZoopZ',yearsB:159.1,stars:601979,sparks:60226,share:.04},
    {group:2,rank:8,name:'AV-7-STAR',username:'AV-7-ZOLISTAR',yearsB:140.3,stars:300990,sparks:30113,share:.02},
    {group:2,rank:9,name:'AV-Finnie',username:'AV-FinZO',yearsB:4.1,stars:150495,sparks:15057,share:.01},

    {group:3,rank:1,name:'AV-SB',username:'AV-SB',yearsB:304.3,stars:3040000,sparks:304018,share:.25},
    {group:3,rank:2,name:'AV-Chuck',username:'AV-CHUCK-DEEZ',yearsB:241.9,stars:2430000,sparks:243215,share:.20},
    {group:3,rank:3,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:228.1,stars:2190000,sparks:218893,share:.18},
    {group:3,rank:4,name:'AV-BigPapi',username:'AV-BigPapi',yearsB:220.9,stars:1460000,sparks:145929,share:.12},
    {group:3,rank:5,name:'AV-JIM',username:'AV-JIMZO',yearsB:167.1,stars:1220000,sparks:121607,share:.10},
    {group:3,rank:6,name:'AV-MotherboardBeans',username:'AV-Motherboard…',yearsB:165.8,stars:972254,sparks:97286,share:.08},
    {group:3,rank:7,name:'AV-EXCALIBUR',username:'AV-EXCALIBUR',yearsB:140.4,stars:486127,sparks:48643,share:.04},
    {group:3,rank:8,name:'AV-TheOli',username:'AV-TheZOli',yearsB:101.1,stars:243064,sparks:24321,share:.02},
    {group:3,rank:9,name:'AV-Nicefellow',username:'AV-Nicefellow',yearsB:89.2,stars:121532,sparks:12161,share:.01},

    {group:4,rank:1,name:'AV-FrankAbagn',username:'AV-FrankAbagn…',yearsB:325.1,stars:2410000,sparks:240898,share:.25},
    {group:4,rank:2,name:'AV-Bubba0816',username:'AV-Bubba0816',yearsB:261.3,stars:1930000,sparks:192718,share:.20},
    {group:4,rank:3,name:'AV-HN',username:'AV-HN',yearsB:232.3,stars:1730000,sparks:173447,share:.18},
    {group:4,rank:4,name:'AV-Brisket',username:'AV-Brisket',yearsB:142.3,stars:1160000,sparks:115631,share:.12},
    {group:4,rank:5,name:'AV-Megalodon',username:'AV-Megalodon-',yearsB:132.0,stars:962880,sparks:96359,share:.10},
    {group:4,rank:6,name:'AV<STAR-LORD>',username:'AV/<STAR-LOR…',yearsB:95.6,stars:770304,sparks:77087,share:.08},
    {group:4,rank:7,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berr…',yearsB:68.3,stars:385152,sparks:38544,share:.04},
    {group:4,rank:8,name:'AV-RkHendrix',username:'AV-RkHendrix-…',yearsB:58.9,stars:192576,sparks:19272,share:.02},
    {group:4,rank:9,name:'AV-Caklet',username:'AV-Caklet',yearsB:4.6,stars:96288,sparks:9636,share:.01},

    {group:5,rank:1,name:'AV-Abu//npjp',username:'AV-Abu//GO!S9//',yearsB:385.2,stars:3070000,sparks:307487,share:.25},
    {group:5,rank:2,name:'AV-Vadik-UA',username:'AV-Vadik-Zol.UA',yearsB:255.6,stars:2460000,sparks:245990,share:.20},
    {group:5,rank:3,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:202.4,stars:2210000,sparks:221391,share:.18},
    {group:5,rank:4,name:'AV-Mendoria',username:'AV-MendiZOria',yearsB:195.4,stars:1480000,sparks:147594,share:.12},
    {group:5,rank:5,name:'AV-JeffKintz05',username:'AV-JefhKintZoli…',yearsB:172.9,stars:1230000,sparks:122995,share:.10},
    {group:5,rank:6,name:'AV-ColdCreeps',username:'AV-ColdCreeps',yearsB:165.3,stars:983354,sparks:98396,share:.08},
    {group:5,rank:7,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:148.7,stars:491677,sparks:49198,share:.04},
    {group:5,rank:8,name:'AV-DaG',username:'AV-DaG',yearsB:86.2,stars:245839,sparks:24599,share:.02},
    {group:5,rank:9,name:'AV-SiFra',username:'AV-ZoFra',yearsB:65.6,stars:122919,sparks:12299,share:.01},

    {group:6,rank:1,name:'AV-Zolikong',username:'(S9)AV-Zolikong',yearsB:310.0,stars:1270000,sparks:126761,share:.25},
    {group:6,rank:2,name:'AV-23',username:'AV-23',yearsB:144.0,stars:1010000,sparks:101409,share:.20},
    {group:6,rank:3,name:'AV-Deviantdan',username:'AV-DeviantDan',yearsB:103.2,stars:911642,sparks:91268,share:.18},
    {group:6,rank:4,name:'AV-SMILINGBANDIT',username:'AV-SmiLiNgBaN…',yearsB:81.6,stars:607761,sparks:60845,share:.12},
    {group:6,rank:5,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:42.2,stars:506468,sparks:50704,share:.10}
  ];

  const existing=new Map((D.members||[]).map(m=>[m.name,m]));
  const currentStatus=name=>existing.get(name)?.status || 'Active';

  // New names visible in the 9/27 screenshots were members of AVENGERS at event time.
  // Until the workbook roster is refreshed, they are treated as current Active members.
  ['AV-ZoopZ','AV-FrankAbagn','AV-Brisket','AV-Zolikong','AV-23'].forEach(name=>{
    if(!existing.has(name)){
      const m={name,status:'Active',piggyPB:0,spacePB:0,krakenPB:0,piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,rankingScore:0,krakenPBMonth:0,ratingPB:0,ratingAvg:0,ratingTotal:0,eventsPlayed:0,totalSparks:0};
      D.members.push(m); existing.set(name,m);
    }
  });

  newRows.forEach(r=>{
    r.status=currentStatus(r.name);
    r.years=Math.round(r.yearsB*1e9);
  });

  D.space.events[date]=newRows;
  D.meta.latestSpace=date;

  // Merge this event into each player's history.
  newRows.forEach(r=>{
    const arr=D.space.history[r.name] || (D.space.history[r.name]=[]);
    const prior=arr.filter(x=>x.date!==date);
    prior.push({date,code:'260927',yearsB:r.yearsB,stars:r.stars,sparks:r.sparks});
    prior.sort((a,b)=>a.date.localeCompare(b.date));
    D.space.history[r.name]=prior;
  });

  // Rebuild Space summary rows from history while preserving current roster status.
  const overall=[];
  const latestPBs=[];
  const latestNewMembers=[];
  Object.keys(D.space.history).forEach(name=>{
    const hist=(D.space.history[name]||[]).filter(x=>(Number(x.yearsB)||0)>0).sort((a,b)=>a.date.localeCompare(b.date));
    if(!hist.length) return;
    const vals=hist.map(x=>Number(x.yearsB)||0);
    const stars=hist.map(x=>Number(x.stars)||0);
    const sparks=hist.map(x=>Number(x.sparks)||0);
    const current=hist.find(x=>x.date===date);
    const before=hist.filter(x=>x.date<date);
    const oldPB=before.length?Math.max(...before.map(x=>Number(x.yearsB)||0)):0;
    const pb=Math.max(...vals);
    const member=existing.get(name);
    const status=member?.status || '';
    const row={
      name,status,pb,oldPB,
      improvement:oldPB>0?(pb-oldPB)/oldPB:0,
      totalYears:vals.reduce((a,b)=>a+b,0),
      totalStars:stars.reduce((a,b)=>a+b,0),
      totalSparks:sparks.reduce((a,b)=>a+b,0),
      eventsPlayed:hist.length,
      avgYears:vals.reduce((a,b)=>a+b,0)/vals.length,
      avgStars:stars.reduce((a,b)=>a+b,0)/stars.length,
      avgSparks:sparks.reduce((a,b)=>a+b,0)/sparks.length,
      pbYears:pb,
      avgLast3:vals.slice(-3).reduce((a,b)=>a+b,0)/Math.min(vals.length,3),
      avgRank:0
    };
    overall.push(row);

    if(current && current.yearsB>oldPB){
      latestPBs.push({name,score:current.yearsB,previous:oldPB,improvement:oldPB>0?(current.yearsB-oldPB)/oldPB:null});
      if(before.length===0) latestNewMembers.push({name,score:current.yearsB});
    }
    if(member){
      member.spacePB=pb;
      member.spaceAvg=row.avgYears;
    }
  });
  overall.sort((a,b)=>b.avgYears-a.avgYears);
  overall.forEach((r,i)=>r.avgRank=i+1);
  D.space.overall=overall;
  D.space.latestPBs=latestPBs.sort((a,b)=>b.score-a.score);
  D.space.latestNewMembers=latestNewMembers.sort((a,b)=>b.score-a.score);

  // Clan trends are AVENGERS-only: current AV-2 / inactive players stay in their
  // individual history but are not mixed into AVENGERS averages or star totals.
  D.space.clanTrend=Object.keys(D.space.events).sort().filter(d=>d>=D.meta.arenaStart).map(d=>{
    const rows=(D.space.events[d]||[]).filter(r=>r.name!=='Total' && r.name!=='#N/A' && currentStatus(r.name)==='Active' && (Number(r.yearsB)||0)>0);
    const vals=rows.map(r=>Number(r.yearsB)||0);
    return {
      date:d,
      avg:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0,
      total:vals.reduce((a,b)=>a+b,0),
      stars:rows.reduce((a,r)=>a+(Number(r.stars)||0),0),
      sparks:rows.reduce((a,r)=>a+(Number(r.sparks)||0),0),
      players:rows.length
    };
  }).filter(x=>x.players>0);

  D.aliasMap=Object.assign({},D.aliasMap,{
    '(S9)AV-LuckYZo':'AV-LuckY',
    '(S9)AV-WolfZoli…':'AV-WolfLegend',
    '(S9)AV-HarryBa…':'AV-HarryBallsagna',
    'AV(S9)-CHEN1972':'AV-CHEN1972',
    '(S9)AV-J-Zo':'AV-J',
    '(S9)AV-Pablin-Z…':'AV-Pablin',
    '(S9)AV-ZIBBY2.0':'AV-ZIBBY',
    'AV-AnimoZoty':'AV-Animosity',
    'AV-7-ZOLISTAR':'AV-7-STAR',
    'AV-FinZO':'AV-Finnie',
    'AV-CHUCK-DEEZ':'AV-Chuck',
    'AV-JIMZO':'AV-JIM',
    'AV-TheZOli':'AV-TheOli',
    'AV-Abu//GO!S9//':'AV-Abu//npjp',
    'AV-Vadik-Zol.UA':'AV-Vadik-UA',
    'AV-MendiZOria':'AV-Mendoria',
    'AV-ZoFra':'AV-SiFra'
  });
})();