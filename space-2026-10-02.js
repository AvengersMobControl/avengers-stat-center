(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D) return;

  const date='2026-10-02';
  const PB_SCALE=0.6666;
  const RATING_SPACE_START='2026-08-01';

  // Final Space Race results from the Oct. 2 Discord result review.
  // Duplicate screenshot post omitted; AV-NoX3noplay is AV-WolfLegend.
  const newRows=[
    {group:1,rank:2,name:'AV-MotherboardBeans',username:'AV-MotherboardBeans',yearsB:84.2,stars:488544,sparks:48957,share:.20},
    {group:1,rank:3,name:'AV-Brisket',username:'AV-Brisket',yearsB:74.3,stars:439690,sparks:44061,share:.18},
    {group:1,rank:4,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:35.6,stars:293126,sparks:29374,share:.12},
    {group:1,rank:5,name:'AV-Nicefellow',username:'AV-Nicefellow',yearsB:23.5,stars:244272,sparks:24478,share:.10},

    {group:2,rank:1,name:'AV-ZolikaLoveKira',username:'AV-ZolikaLoveKira',yearsB:320.4,stars:2690000,sparks:269462,share:.25},
    {group:2,rank:2,name:'AV-Pablin',username:'AV-Pablin',yearsB:319.1,stars:2150000,sparks:215570,share:.20},
    {group:2,rank:3,name:'AV-8!l...Bil',username:'AV-8!l...Bil',yearsB:217.0,stars:1940000,sparks:194013,share:.18},
    {group:2,rank:4,name:'AV-Mendoria',username:'AV-Mendoria',yearsB:162.5,stars:1290000,sparks:129342,share:.12},
    {group:2,rank:5,name:'AV-Vadik-UA',username:'AV-Vadik-UA',yearsB:137.1,stars:1080000,sparks:107785,share:.10},
    {group:2,rank:6,name:'AV-Abu//npjp',username:'AV-Abu',yearsB:115.8,stars:861674,sparks:86228,share:.08},
    {group:2,rank:7,name:'AV-ZIBBY',username:'AV-ZIBBY',yearsB:109.7,stars:430837,sparks:43114,share:.04},
    {group:2,rank:8,name:'AV-JeffKintz05',username:'AV-JeffKintz05',yearsB:46.9,stars:215419,sparks:21557,share:.02},
    {group:2,rank:9,name:'AV-Bubba0816',username:'AV-Bubba0816',yearsB:46.0,stars:107709,sparks:10778,share:.01},

    {group:3,rank:1,name:'AV-Chuck',username:'AV-CHUCK',yearsB:223.2,stars:1710000,sparks:170818,share:.25},
    {group:3,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:192.6,stars:1370000,sparks:136655,share:.20},
    {group:3,rank:3,name:'AV-INTEN',username:'AV-INTEN',yearsB:147.8,stars:1230000,sparks:122989,share:.18},
    {group:3,rank:4,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:141.8,stars:819022,sparks:81993,share:.12},
    {group:3,rank:5,name:'AV-Obajoba',username:'AV-Obajoba',yearsB:68.5,stars:682518,sparks:68327,share:.10},
    {group:3,rank:6,name:'AV-J',username:'AV-J',yearsB:53.2,stars:546014,sparks:54662,share:.08},
    {group:3,rank:7,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:48.5,stars:273007,sparks:27331,share:.04},
    {group:3,rank:8,name:'AV-JIM',username:'AV-JIM',yearsB:40.1,stars:136504,sparks:13685,share:.02},
    {group:3,rank:9,name:'AV-RkHendrix',username:'AV-RkHendrix',yearsB:32.7,stars:68252,sparks:6833,share:.01},

    {group:4,rank:1,name:'AV-WolfLegend',username:'AV-NoX3noplay',yearsB:355.0,stars:2360000,sparks:235768,share:.25},
    {group:4,rank:2,name:'AV-HarryBallsagna',username:'AV-HarryBallsagna',yearsB:271.5,stars:1880000,sparks:188615,share:.20},
    {group:4,rank:3,name:'AV-Addicted',username:'AV-FrankAbagn',yearsB:137.4,stars:1700000,sparks:169753,share:.18},
    {group:4,rank:4,name:'AV-BigPapi',username:'AV-BigPapi',yearsB:136.8,stars:1130000,sparks:113169,share:.12},
    {group:4,rank:5,name:'AV-Megalodon',username:'AV-Megalodon-',yearsB:122.5,stars:942318,sparks:94307,share:.10},
    {group:4,rank:6,name:'AV-Animosity',username:'AV-Animosity',yearsB:98.0,stars:753854,sparks:75446,share:.08},
    {group:4,rank:7,name:'AV.Saberkong',username:'AV.Saberkong',yearsB:76.2,stars:376927,sparks:37723,share:.04},
    {group:4,rank:8,name:'AV-EXCALIBUR',username:'AV-EXCALIBUR',yearsB:60.0,stars:188464,sparks:18861,share:.02},
    {group:4,rank:9,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:37.6,stars:94232,sparks:9431,share:.01},

    {group:5,rank:1,name:'AV-JAMO',username:'AV-JAMO',yearsB:255.8,stars:1600000,sparks:160187,share:.25},
    {group:5,rank:2,name:'AV-HN',username:'AV-HN',yearsB:218.5,stars:1280000,sparks:128150,share:.20},
    {group:5,rank:3,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:125.8,stars:1150000,sparks:115335,share:.18},
    {group:5,rank:4,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:86.1,stars:767992,sparks:76890,share:.12},
    {group:5,rank:5,name:'AV-Finnie',username:'AV-Finnie',yearsB:50.1,stars:639993,sparks:64075,share:.10},
    {group:5,rank:6,name:'AV-ColdCreeps',username:'AV-ColdCreeps',yearsB:47.9,stars:511994,sparks:51260,share:.08},
    {group:5,rank:7,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:40.7,stars:255997,sparks:25630,share:.04},
    {group:5,rank:8,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:36.4,stars:127999,sparks:12815,share:.02},
    {group:5,rank:9,name:'AV-no',username:'AV-no',yearsB:30.4,stars:63999,sparks:6407,share:.01}
  ];

  const existing=new Map((D.members||[]).map(m=>[m.name,m]));
  if(!existing.has('AV-JAMO')){
    const m={name:'AV-JAMO',status:'Active',piggyPB:0,spacePB:0,krakenPB:0,piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,rankingScore:0,krakenPBMonth:0,ratingPB:0,ratingAvg:0,ratingTotal:0,eventsPlayed:0,totalSparks:0};
    D.members.push(m); existing.set(m.name,m);
  }

  newRows.forEach(r=>{
    r.clan='AVENGERS';
    r.status='Active';
    r.years=Math.round(r.yearsB*1e9);
  });

  D.space.events[date]=newRows;
  D.meta.latestSpace=date;
  D.meta.generated='2026-10-02T09:45:00-05:00';

  // Capture prior PBs before merging this event.
  const priorPBByName=new Map();
  newRows.forEach(r=>{
    const hist=(D.space.history[r.name]||[]).filter(x=>(Number(x.yearsB)||0)>0 && String(x.date||'')<date);
    priorPBByName.set(r.name,hist.length?Math.max(...hist.map(x=>Number(x.yearsB)||0)):0);
  });

  // Merge raw race scores into history.
  newRows.forEach(r=>{
    const arr=D.space.history[r.name] || (D.space.history[r.name]=[]);
    const prior=arr.filter(x=>x.date!==date);
    prior.push({date,code:'261002',yearsB:r.yearsB,stars:r.stars,sparks:r.sparks});
    prior.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    D.space.history[r.name]=prior;

    const m=existing.get(r.name);
    if(m) m.totalSparks=(Number(m.totalSparks)||0)+(Number(r.sparks)||0);
  });

  const effectivePB=(x)=>{
    const raw=Number(x.yearsB)||0;
    return String(x.date||'')===date ? raw/PB_SCALE : raw;
  };

  const overall=[];
  const latestPBs=[];
  const latestNewMembers=[];
  Object.keys(D.space.history).forEach(name=>{
    const hist=(D.space.history[name]||[]).filter(x=>(Number(x.yearsB)||0)>0).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    if(!hist.length) return;
    const vals=hist.map(x=>Number(x.yearsB)||0);
    const stars=hist.map(x=>Number(x.stars)||0);
    const sparks=hist.map(x=>Number(x.sparks)||0);
    const current=hist.find(x=>String(x.date||'')===date);
    const before=hist.filter(x=>String(x.date||'')<date);
    const oldPB=before.length?Math.max(...before.map(x=>Number(x.yearsB)||0)):0;
    const pb=Math.max(...hist.map(effectivePB));
    const member=existing.get(name);
    const status=member?.status || '';
    overall.push({
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
    });

    if(current){
      if(!before.length){
        latestNewMembers.push({name,score:Number(current.yearsB)||0});
      }else if((Number(current.yearsB)||0) > oldPB*PB_SCALE){
        const normalized=(Number(current.yearsB)||0)/PB_SCALE;
        latestPBs.push({name,score:normalized,previous:oldPB,improvement:oldPB>0?(normalized-oldPB)/oldPB:null,rawScore:Number(current.yearsB)||0});
      }
    }

    if(member){
      member.spacePB=pb;
      const ratingHist=hist.filter(x=>String(x.date||'')>=RATING_SPACE_START);
      member.spaceAvg=ratingHist.length?ratingHist.reduce((sum,x)=>sum+(Number(x.yearsB)||0),0)/ratingHist.length:0;
    }
  });

  overall.sort((a,b)=>b.avgYears-a.avgYears);
  overall.forEach((r,i)=>r.avgRank=i+1);
  D.space.overall=overall;
  D.space.latestPBs=latestPBs.sort((a,b)=>b.improvement-a.improvement);
  D.space.latestNewMembers=latestNewMembers.sort((a,b)=>b.score-a.score);

  const capped=(value,benchmark)=>Math.min(1,Math.max(0,(Number(value)||0)/benchmark));
  (D.members||[]).forEach(member=>{
    member.ratingPB=capped(member.piggyPB,35000)+capped(member.spacePB,350)+capped(member.krakenPB,3500);
    member.ratingAvg=capped(member.piggyAvg,25000)+capped(member.spaceAvg,200)+capped(member.krakenAvgL3,2800);
    member.ratingTotal=member.ratingPB+member.ratingAvg;
  });

  D.space.clanTrend=Object.keys(D.space.events).sort().filter(d=>d>=D.meta.arenaStart).map(d=>{
    const rows=(D.space.events[d]||[]).filter(r=>r.name!=='Total'&&r.name!=='#N/A'&&((r.clan&&r.clan==='AVENGERS')||(!r.clan&&r.status==='Active'))&&(Number(r.yearsB)||0)>0);
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

  D.aliasMap=Object.assign({},D.aliasMap||{},{
    'AV-NoX3noplay':'AV-WolfLegend'
  });
})();