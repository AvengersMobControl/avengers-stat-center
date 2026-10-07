(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D?.piggy) return;

  // Full AV-2 Piggy Race history pulled from the AV-2 Discord results channel.
  // Event-time clan is explicit and never changes a known member's current roster status.
  const events={
    '2026-09-13':{
      potStars:3600000,
      messageId:'1548892578458505266',
      rows:[
        {name:'AV-J',rank:2,lines:7781,stars:327481,sparks:32748,share:.09},
        {name:'AV-TigerMx',rank:3,lines:7046,stars:291094,sparks:29109,share:.08},
        {name:'AV-KitKat',rank:4,lines:4333,stars:181934,sparks:18193,share:.05}
      ]
    },
    '2026-09-20':{
      potStars:8180000,
      messageId:'1551339629469372436',
      rows:[
        {name:'AV-J',rank:1,lines:12001,stars:821161,sparks:82116,share:.10},
        {name:'AV-TigerMx',rank:2,lines:10954,stars:739045,sparks:73904,share:.09},
        {name:'AV-Adigarian',rank:5,lines:4300,stars:369522,sparks:36952,share:.045},
        {name:'AV-KitKat',rank:6,lines:4287,stars:361311,sparks:36131,share:.044},
        {name:'AV-KiraLoveZolika',rank:11,lines:2431,stars:238137,sparks:23814,share:.029}
      ]
    },
    '2026-09-25':{
      potStars:2490000,
      messageId:'1553078047153070090',
      rows:[
        {name:'AV-OblivX',rank:1,lines:7796,stars:250168,sparks:25016,share:.10},
        {name:'AV-KitKat',rank:2,lines:5156,stars:225151,sparks:22514,share:.09},
        {name:'AV-TigerMx',rank:3,lines:4761,stars:200134,sparks:20013,share:.08},
        {name:'AV-Adigarian',rank:4,lines:2823,stars:125084,sparks:12508,share:.05},
        {name:'AV-LittleZ',rank:5,lines:981,stars:112576,sparks:11257,share:.045},
        {name:'Foot Slammed',rank:6,lines:578,stars:110074,sparks:11007,share:.044},
        {name:'AV-KiraLoveZolika',rank:7,lines:527,stars:107572,sparks:10757,share:.043},
        {name:'AV-HECKTO',rank:8,lines:445,stars:92562,sparks:9256,share:.037},
        {name:'AV-KO',rank:10,lines:238,stars:75050,sparks:7505,share:.03}
      ]
    },
    '2026-10-04':{
      potStars:5620000,
      messageId:'1556577824826073089',
      rows:[
        {name:'AV-SiFra',rank:1,lines:15456,stars:564519,sparks:56451,share:.10},
        {name:'AV-2Lin',rank:3,lines:7124,stars:451615,sparks:45161,share:.08},
        {name:'AV-TigerMx',rank:5,lines:3401,stars:254034,sparks:25403,share:.045},
        {name:'AV-KitKat',rank:8,lines:2182,stars:208872,sparks:20887,share:.037},
        {name:'AV-KiraLoveZolika',rank:11,lines:823,stars:163711,sparks:16371,share:.029}
      ]
    }
  };

  D.piggy.av2PotTotals=Object.assign({},D.piggy.av2PotTotals||{},
    Object.fromEntries(Object.entries(events).map(([date,x])=>[date,x.potStars]))
  );
  D.piggy.av2Sources=Object.assign({},D.piggy.av2Sources||{},
    Object.fromEntries(Object.entries(events).map(([date,x])=>[date,{messageId:x.messageId,source:'AV-2 Discord results channel'}]))
  );

  const memberMap=new Map((D.members||[]).map(m=>[m.name,m]));
  const ensureMember=name=>{
    if(memberMap.has(name)) return memberMap.get(name);
    const m={name,status:'AV2',piggyPB:0,spacePB:0,krakenPB:0,piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,rankingScore:0,krakenPBMonth:0,ratingPB:0,ratingAvg:0,ratingTotal:0,eventsPlayed:0,totalSparks:0};
    D.members.push(m); memberMap.set(name,m); return m;
  };
  ensureMember('AV-2Lin');

  const touched=new Set();
  Object.entries(events).forEach(([date,event])=>{
    const arr=D.piggy.events[date]||(D.piggy.events[date]=[]);
    event.rows.forEach(src=>{
      const row={...src,username:src.name,clan:'AV2',eventClan:'AV2',status:'AV2'};
      let target=arr.find(x=>x && x.name===row.name && Number(x.rank)===Number(row.rank) && Number(x.lines)===Number(row.lines));
      if(!target){
        target=arr.find(x=>x && x.name===row.name && Number(x.lines)===Number(row.lines));
      }
      if(target){
        Object.assign(target,row);
      }else{
        arr.push(row);
      }

      const hist=D.piggy.history[row.name]||(D.piggy.history[row.name]=[]);
      const prev=hist.find(x=>String(x.date||'')===date);
      const oldSparks=Number(prev?.sparks)||0;
      const hx={...(prev||{}),date,code:date.replace(/-/g,'').slice(2),rank:row.rank,lines:row.lines,stars:row.stars,sparks:row.sparks,share:row.share,clan:'AV2',eventClan:'AV2'};
      D.piggy.history[row.name]=hist.filter(x=>String(x.date||'')!==date).concat(hx).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));

      const m=ensureMember(row.name);
      m.totalSparks=(Number(m.totalSparks)||0)+(Number(row.sparks)||0)-oldSparks;
      touched.add(row.name);
    });
  });

  const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
  touched.forEach(name=>{
    const m=ensureMember(name);
    const hist=(D.piggy.history[name]||[]).filter(x=>(Number(x.lines)||0)>0).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    if(!hist.length) return;
    const arena=hist.filter(x=>String(x.date||'')>=String(D.meta.arenaStart||'2026-08-01'));
    const vals=hist.map(x=>Number(x.lines)||0);
    const arenaVals=arena.map(x=>Number(x.lines)||0);
    const summary={
      name,
      status:m.status||'AV2',
      pb:Math.max(...vals),
      prevPB:Math.max(...vals),
      improvement:0,
      totalLines:vals.reduce((a,b)=>a+b,0),
      totalStars:hist.reduce((s,x)=>s+(Number(x.stars)||0),0),
      totalSparks:hist.reduce((s,x)=>s+(Number(x.sparks)||0),0),
      eventsPlayed:hist.length,
      avg2026:avg(vals),
      avgArena:avg(arenaVals),
      avgStars2026:avg(hist.map(x=>Number(x.stars)||0)),
      avgSparks2026:avg(hist.map(x=>Number(x.sparks)||0)),
      avgStarsArena:avg(arena.map(x=>Number(x.stars)||0)),
      avgSparksArena:avg(arena.map(x=>Number(x.sparks)||0)),
      pbRank:0,
      avgLast3:avg(vals.slice(-3)),
      avgRank:0
    };
    const i=(D.piggy.overall||[]).findIndex(x=>x.name===name);
    if(i>=0) D.piggy.overall[i]={...D.piggy.overall[i],...summary};
    else (D.piggy.overall||(D.piggy.overall=[])).push(summary);
    m.piggyPB=summary.pb;
    m.piggyAvg=summary.avgArena;
  });

  D.piggy.overall.sort((a,b)=>(Number(b.avgArena)||0)-(Number(a.avgArena)||0));
  D.piggy.overall.forEach((r,i)=>r.avgRank=i+1);

  const capped=(v,b)=>Math.min(1,Math.max(0,(Number(v)||0)/b));
  (D.members||[]).forEach(m=>{
    m.ratingPB=capped(m.piggyPB,35000)+capped(m.spacePB,350)+capped(m.krakenPB,3500);
    m.ratingAvg=capped(m.piggyAvg,25000)+capped(m.spaceAvg,200)+capped(m.krakenAvgL3,2800);
    m.ratingTotal=m.ratingPB+m.ratingAvg;
  });
})();