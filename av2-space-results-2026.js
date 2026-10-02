(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D?.space) return;

  const PB_SCALE=0.6666;
  const RATING_SPACE_START='2026-08-01';

  // AV-2 Space Race results backfilled from the AV-2 Discord review PDF.
  // Additive only: AVENGERS event rows are never replaced.
  const events={
    '2026-10-02':[
      {group:'AV2-1',rank:1,name:'AV-SiFra',username:'AV-SiFra',yearsB:141.5,stars:401741,sparks:40314,share:.25},
      {group:'AV2-1',rank:2,name:'AV-KitKat',username:'AV-KitKat',yearsB:40.7,stars:321393,sparks:32251,share:.20},
      {group:'AV2-1',rank:3,name:'AV-TigerMx',username:'Av-TigerMx',yearsB:23.2,stars:289254,sparks:29026,share:.18},
      {group:'AV2-1',rank:4,name:'AV-braa',username:'AV-braa',yearsB:10.8,stars:192836,sparks:19350,share:.12},
      {group:'AV2-1',rank:5,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:8.8,stars:160696,sparks:16125,share:.10},
      {group:'AV2-1',rank:6,name:'AV-HECKTO',username:'AV-HECKTO',yearsB:6.6,stars:128557,sparks:12900,share:.08},
      {group:'AV2-1',rank:7,name:'Basecreature',username:'Basecreature',yearsB:6.3,stars:64279,sparks:6450,share:.04},
      {group:'AV2-1',rank:8,name:'AV-KO',username:'AV-KO',yearsB:3.7,stars:32139,sparks:3223,share:.02},
      {group:'AV2-1',rank:9,name:'AV-KiraLoveZolika',username:'AV-KiraLoveZoli...',yearsB:3.2,stars:16070,sparks:1613,share:.01}
    ],
    '2026-09-27':[
      {group:'AV2-1',rank:1,name:'AV-LemonBlue',username:'AV-BlueWave',yearsB:55.8,stars:367939,sparks:36948,share:.25},
      {group:'AV2-1',rank:2,name:'AV-KitKat',username:'AV-KitKat',yearsB:51.2,stars:294351,sparks:29558,share:.20},
      {group:'AV2-1',rank:3,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:45.8,stars:264916,sparks:26602,share:.18},
      {group:'AV2-1',rank:4,name:'AV-KiraLoveZolika',username:'AV-KiraLoveZoli...',yearsB:28.7,stars:176611,sparks:17735,share:.12},
      {group:'AV2-1',rank:5,name:'Foot Slammed',username:'Foot Slammed',yearsB:22.9,stars:147176,sparks:14779,share:.10},
      {group:'AV2-1',rank:6,name:'AV-HECKTO',username:'AV-HECKTO',yearsB:9.1,stars:117740,sparks:11823,share:.08},
      {group:'AV2-1',rank:7,name:'Basecreature',username:'Basecreature',yearsB:6.6,stars:58870,sparks:5912,share:.04},
      {group:'AV2-1',rank:8,name:'AV-KO',username:'AV-KO',yearsB:5.7,stars:29435,sparks:2956,share:.02},
      {group:'AV2-1',rank:9,name:'Keyler',username:'Keyler',yearsB:2.9,stars:14718,sparks:1478,share:.01}
    ],
    '2026-09-18':[
      {group:'AV2-1',rank:1,name:'AV-J',username:'AV-J',yearsB:138.6,stars:797936,sparks:79953,share:.25},
      {group:'AV2-1',rank:2,name:'AV-Caklet',username:'AV-Caklet',yearsB:136.8,stars:638349,sparks:63965,share:.20},
      {group:'AV2-1',rank:3,name:'AV-KitKat',username:'AV-KitKat',yearsB:73.2,stars:574514,sparks:57569,share:.18},
      {group:'AV2-1',rank:4,name:'AV-TigerMx',username:'Av-TigerMx',yearsB:51.2,stars:383009,sparks:38379,share:.12},
      {group:'AV2-1',rank:5,name:'AV-HECKTO',username:'AV-HECKTO',yearsB:26.6,stars:319174,sparks:31983,share:.10},
      {group:'AV2-1',rank:6,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:13.8,stars:255340,sparks:25586,share:.08}
    ]
  };

  const memberMap=new Map((D.members||[]).map(m=>[m.name,m]));
  const ensureMember=name=>{
    if(memberMap.has(name)) return memberMap.get(name);
    const m={name,status:'AV2',piggyPB:0,spacePB:0,krakenPB:0,piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,rankingScore:0,krakenPBMonth:0,ratingPB:0,ratingAvg:0,ratingTotal:0,eventsPlayed:0,totalSparks:0};
    D.members.push(m); memberMap.set(name,m); return m;
  };
  ['AV-braa','Keyler','Basecreature','Foot Slammed'].forEach(ensureMember);

  Object.entries(events).forEach(([date,rows])=>{
    const arr=D.space.events[date]||(D.space.events[date]=[]);
    rows.forEach(r=>{
      const row={...r,clan:'AV2',status:'AV2',years:Math.round(r.yearsB*1e9)};
      // If the same historical result already exists from the older workbook import,
      // reclassify that row to its event-time AV-2 clan instead of duplicating it.
      const same=arr.find(x=>x && x.name===row.name && Math.abs((Number(x.yearsB)||0)-row.yearsB)<0.0001 && Number(x.rank)===Number(row.rank));
      if(same){
        same.clan='AV2';
        same.status='AV2';
        if(!(Number(same.stars)>0)) same.stars=row.stars;
        if(!(Number(same.sparks)>0)) same.sparks=row.sparks;
        if(!(Number(same.share)>0)) same.share=row.share;
        if(same.group==null) same.group=row.group;
      }else{
        const exists=arr.some(x=>x && x.name===row.name && String(x.clan||'').toLowerCase().replace(/[^a-z0-9]/g,'')==='av2' && Number(x.rank)===Number(row.rank));
        if(!exists) arr.push(row);
      }

      const hist=D.space.history[row.name]||(D.space.history[row.name]=[]);
      let hx=hist.find(x=>String(x.date||'')===date && Math.abs((Number(x.yearsB)||0)-row.yearsB)<0.0001);
      if(hx){
        hx.clan='AV2';
        hx.group=row.group;
        if(hx.stars==null) hx.stars=row.stars;
        if(hx.sparks==null) hx.sparks=row.sparks;
      }else{
        hist.push({date,code:date.replace(/-/g,'').slice(2),yearsB:row.yearsB,stars:row.stars,sparks:row.sparks,clan:'AV2',group:row.group});
        hist.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      }
    });
  });

  // Aliases from the AV-2 screenshots.
  D.aliasMap=Object.assign({},D.aliasMap||{},{
    'AV-BlueWave':'AV-LemonBlue',
    'Av-TigerMx':'AV-TigerMx'
  });

  // Rebuild player Space summaries from history without altering any existing event row.
  const effectivePB=x=>{
    const raw=Number(x.yearsB)||0;
    return String(x.date||'')==='2026-10-02'?raw/PB_SCALE:raw;
  };
  const overall=[], latestPBs=[], latestNew=[];
  Object.keys(D.space.history||{}).forEach(name=>{
    const hist=(D.space.history[name]||[]).filter(x=>(Number(x.yearsB)||0)>0).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    if(!hist.length) return;
    const vals=hist.map(x=>Number(x.yearsB)||0), stars=hist.map(x=>Number(x.stars)||0), sparks=hist.map(x=>Number(x.sparks)||0);
    const before=hist.filter(x=>String(x.date||'')<'2026-10-02');
    const current=hist.find(x=>String(x.date||'')==='2026-10-02');
    const oldPB=before.length?Math.max(...before.map(x=>Number(x.yearsB)||0)):0;
    const pb=Math.max(...hist.map(effectivePB));
    const member=memberMap.get(name);
    overall.push({
      name,status:member?.status||'',
      pb,oldPB,improvement:oldPB>0?(pb-oldPB)/oldPB:0,
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
      if(!before.length) latestNew.push({name,score:Number(current.yearsB)||0});
      else if((Number(current.yearsB)||0)>oldPB*PB_SCALE){
        const normalized=(Number(current.yearsB)||0)/PB_SCALE;
        latestPBs.push({name,score:normalized,previous:oldPB,improvement:oldPB>0?(normalized-oldPB)/oldPB:null,rawScore:Number(current.yearsB)||0});
      }
    }
    if(member){
      member.spacePB=pb;
      const rh=hist.filter(x=>String(x.date||'')>=RATING_SPACE_START);
      member.spaceAvg=rh.length?rh.reduce((s,x)=>s+(Number(x.yearsB)||0),0)/rh.length:0;
    }
  });
  overall.sort((a,b)=>b.avgYears-a.avgYears); overall.forEach((r,i)=>r.avgRank=i+1);
  D.space.overall=overall;
  D.space.latestPBs=latestPBs.sort((a,b)=>(b.improvement||0)-(a.improvement||0));
  D.space.latestNewMembers=latestNew.sort((a,b)=>b.score-a.score);

  const capped=(v,b)=>Math.min(1,Math.max(0,(Number(v)||0)/b));
  (D.members||[]).forEach(m=>{
    m.ratingPB=capped(m.piggyPB,35000)+capped(m.spacePB,350)+capped(m.krakenPB,3500);
    m.ratingAvg=capped(m.piggyAvg,25000)+capped(m.spaceAvg,200)+capped(m.krakenAvgL3,2800);
    m.ratingTotal=m.ratingPB+m.ratingAvg;
  });

  D.meta.generated='2026-10-02T11:05:00-05:00';
})();