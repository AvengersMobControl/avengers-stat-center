(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D?.space?.events) return;

  const BASE={1:25,2:20,3:18,4:12,5:10,6:8,7:4,8:2,9:1};

  // Final-result audit of the complete AVENGERS Space Discord channel (channel begins 2025-10-14).
  // Only CLAIM/final screens are used. Preliminary/progress screens are intentionally excluded.
  // denom=99 represents the older normalized payout display (25.3/20.2/18.2/...).
  const G={
    '2025-10-14':{1:{pot:366800,denom:99},2:{pot:279760},3:{pot:275280}},
    '2025-10-21':{1:{pot:164140,denom:99},2:{pot:170960},3:{pot:353720}},
    '2025-10-28':{1:{pot:158920}},
    '2025-11-04':{1:{pot:163920},2:{pot:163350,denom:99}},
    '2025-12-10':{1:{pot:374280},2:{pot:294760}},
    '2025-12-17':{2:{pot:403320},4:{pot:292360},5:{pot:161080},6:{pot:319080}},
    '2025-12-30':{1:{pot:269230,denom:99},2:{pot:261800},3:{pot:379320}},
    '2026-01-06':{1:{pot:210450}},
    '2026-01-14':{1:{pot:257120},2:{pot:243520},3:{pot:204800}},
    '2026-01-21':{1:{pot:428288},2:{pot:376424}},
    '2026-01-27':{1:{pot:372540},2:{pot:317792},3:{pot:347528}},
    '2026-02-04':{1:{pot:359264},2:{pot:372752},3:{pot:429916}},
    '2026-02-11':{2:{pot:312760},3:{pot:26212},4:{pot:69290},5:{pot:149440},6:{pot:154104}},
    '2026-02-22':{1:{pot:93960},2:{pot:850704},3:{pot:698900}},
    '2026-02-24':{1:{pot:545464},2:{pot:124368},3:{pot:369744}},
    '2026-02-25':{1:{pot:344560}},
    '2026-03-03':{1:{pot:228752},2:{pot:547488},3:{pot:408380}},
    '2026-03-06':{1:{pot:344016},2:{pot:254020},3:{pot:355924},4:{pot:671604},5:{pot:93240}},
    '2026-04-01':{1:{pot:1620660},2:{pot:617060},3:{pot:1742140}},
    '2026-04-02':{1:{pot:803152}},
    '2026-04-03':{1:{pot:321110},2:{pot:1053728}},
    '2026-04-08':{1:{pot:720880},2:{pot:241205}},
    '2026-04-11':{1:{pot:1291620},2:{pot:1617620},3:{pot:234904},4:{pot:1686120},5:{pot:1805420}},
    '2026-04-19':{1:{pot:1144260},2:{pot:624288},3:{pot:1414120}},
    '2026-04-29':{1:{pot:1232688},2:{pot:1196120},3:{pot:1176012},4:{pot:496752}},
    '2026-05-06':{1:{pot:935760},2:{pot:100068},3:{pot:1310740},4:{pot:818020},5:{pot:1327632}},
    '2026-05-14':{1:{pot:1393952},2:{pot:1043920},3:{pot:1484232},4:{pot:891750}},
    '2026-05-20':{1:{pot:985580},2:{pot:884440},3:{pot:1683880},4:{pot:1309540}},
    '2026-05-27':{1:{pot:777628},2:{pot:647648}}
  };

  const incomplete={
    '2025-12-17':'Final reward screenshots for two historical lobbies (groups 1 and 3) were not posted in the Space channel.',
    '2026-01-21':'One historical Mr. Mar. Berry lobby is represented only by a progress/preliminary capture; its final rewards are unavailable.',
    '2026-02-11':'Group 1 has player distances but no final reward screenshot in the Space channel.'
  };
  D.space.historicalIncompleteDates=Object.assign({},D.space.historicalIncompleteDates||{},incomplete);

  const canonical=n=>{
    const map=D.aliasMap||{};
    return map[n]||n;
  };

  const ensureRow=(date,row)=>{
    const arr=D.space.events[date]||(D.space.events[date]=[]);
    const name=canonical(row.name);
    let x=arr.find(r=>r&&canonical(r.name)===name&&Number(r.group)===Number(row.group)&&Number(r.rank)===Number(row.rank));
    if(!x){
      x={...row,name,username:row.username||row.name,years:Math.round((Number(row.yearsB)||0)*1e9),clan:'AVENGERS',status:''};
      arr.push(x);
    }else{
      if(row.yearsB!=null)x.yearsB=row.yearsB;
      if(row.stars!=null)x.stars=row.stars;
      if(row.sparks!=null)x.sparks=row.sparks;
      if(row.share!=null)x.share=row.share;
      x.clan='AVENGERS';
    }
    const hist=D.space.history[name]||(D.space.history[name]=[]);
    let h=hist.find(v=>String(v.date||'')===date && Math.abs((Number(v.yearsB)||0)-(Number(x.yearsB)||0))<0.0001);
    if(!h){
      h={date,code:date.replace(/-/g,'').slice(2),yearsB:x.yearsB,stars:x.stars??null,sparks:x.sparks??null,share:x.share??null,group:x.group,clan:'AVENGERS'};
      hist.push(h);hist.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    }else{
      h.group=x.group;h.clan='AVENGERS';
      if(x.stars!=null)h.stars=x.stars;
      if(x.sparks!=null)h.sparks=x.sparks;
      if(x.share!=null)h.share=x.share;
    }
    return x;
  };

  [
    ['2025-12-30',{group:3,rank:8,name:'AV-I.S.O',yearsB:11.7}],
    ['2025-12-30',{group:3,rank:9,name:'AV-FrenchieUSA',yearsB:6.2}],
    ['2026-01-27',{group:1,rank:7,name:'AV-I.S.O',yearsB:13.8,stars:14902,sparks:1490,share:.04}],
    ['2026-01-27',{group:3,rank:1,name:'AV-HarryBallsagna',yearsB:56.4,stars:86882,sparks:8690,share:.25}],
    ['2026-01-27',{group:3,rank:2,name:'AV-Andre-DE',yearsB:24.8,stars:69506,sparks:6952,share:.20}],
    ['2026-01-27',{group:3,rank:3,name:'AV-Caklet',yearsB:23.7,stars:62555,sparks:6257,share:.18}],
    ['2026-01-27',{group:3,rank:4,name:'AV-Attila-AZE',yearsB:19.1,stars:41704,sparks:4171,share:.12}],
    ['2026-01-27',{group:3,rank:5,name:'AV-J',yearsB:17.0,stars:34753,sparks:3476,share:.10}],
    ['2026-01-27',{group:3,rank:6,name:'AV-Morre',yearsB:15.3,stars:27802,sparks:2781,share:.08}],
    ['2026-01-27',{group:3,rank:7,name:'AV-CRISPIN.97',yearsB:8.1,stars:13901,sparks:1390,share:.04}],
    ['2026-01-27',{group:3,rank:8,name:'AV#Rafa#Tun',yearsB:4.1,stars:6951,sparks:695,share:.02}],
    ['2026-01-27',{group:3,rank:9,name:'AV-KitKat',yearsB:4.1,stars:3475,sparks:348,share:.01}],
    ['2026-02-04',{group:3,rank:7,name:'AV-Adigarian',yearsB:13.5}]
  ].forEach(([d,r])=>ensureRow(d,r));

  {
    const date='2026-01-21';
    const arr=D.space.events[date]||[];
    const x=arr.find(r=>canonical(r.name)==='AV-EventHorizon'&&Math.abs((Number(r.yearsB)||0)-10.9)<.0001);
    if(x){
      x.group=4;x.rank=2;x.stars=11501;x.sparks=1154;x.share=20/97;x.clan='AVENGERS';
      const hist=D.space.history[canonical(x.name)]||[];
      const h=hist.find(v=>String(v.date||'')===date&&Math.abs((Number(v.yearsB)||0)-10.9)<.0001);
      if(h){h.group=4;h.stars=11501;h.sparks=1154;h.share=20/97;h.clan='AVENGERS';}
    }
    const mr=arr.find(r=>canonical(r.name)==='AV-Mr.Mar.Berry'&&Math.abs((Number(r.yearsB)||0)-6.8)<.0001);
    if(mr) mr.group=3;
  }

  Object.entries(G).forEach(([date,groups])=>{
    const rows=D.space.events[date]||[];
    Object.entries(groups).forEach(([g,cfg])=>{
      const denom=Number(cfg.denom)||100;
      rows.filter(r=>Number(r.group)===Number(g) && canonical(r.name)!=='Total').forEach(r=>{
        const pct=BASE[Number(r.rank)]||0;
        if(!(pct>0))return;
        const share=pct/denom;
        if(!(Number(r.share)>0))r.share=share;
        if(!(Number(r.stars)>0))r.stars=Math.round(Number(cfg.pot)*share);
        if(!(Number(r.sparks)>0))r.sparks=Math.round(Number(r.stars)/10);
        r.clan='AVENGERS';
        r.rewardSource='Verified final Space Race screenshot; reward reconstructed from final lobby pot/share where not directly visible.';
        const name=canonical(r.name);
        const hist=D.space.history[name]||[];
        const h=hist.find(v=>String(v.date||'')===date&&Math.abs((Number(v.yearsB)||0)-(Number(r.yearsB)||0))<.0001);
        if(h){
          h.stars=r.stars;h.sparks=r.sparks;h.share=r.share;h.group=r.group;h.clan='AVENGERS';
          h.rewardSource=r.rewardSource;
        }
      });
    });
  });

  const completeDates=Object.keys(G).filter(d=>!incomplete[d]);
  D.space.historicalPotTotals=D.space.historicalPotTotals||{};
  D.space.historicalRewardTotals=D.space.historicalRewardTotals||{};
  completeDates.forEach(date=>{
    const groups=G[date];
    const potStars=Object.values(groups).reduce((s,x)=>s+(Number(x.pot)||0),0);
    if(!D.space.historicalPotTotals[date]){
      D.space.historicalPotTotals[date]={
        groups:Object.keys(groups).length,
        potStars,
        source:'Full Space Discord channel audit: final CLAIM screenshots only; older K-display rewards may introduce minor rounding variance.'
      };
    }
    if(!D.space.historicalRewardTotals[date]){
      const rows=(D.space.events[date]||[]).filter(r=>{
        const clan=String(r?.clan||'').toLowerCase().replace(/[^a-z0-9]/g,'');
        return r&&r.name&&r.name!=='Total'&&r.name!=='#N/A'&&clan!=='av2';
      });
      D.space.historicalRewardTotals[date]={
        stars:rows.reduce((s,r)=>s+(Number(r.stars)||0),0),
        sparks:rows.reduce((s,r)=>s+(Number(r.sparks)||0),0),
        groups:Object.keys(groups).length,
        source:'Full Space Discord channel audit: verified final results.'
      };
    }
  });

  D.space.historicalSourceNotes=Object.assign({},D.space.historicalSourceNotes||{},{
    'full-channel-audit-2026-10-07':'Space Discord channel audited from its first available post (2025-10-14) through 2026-10-02. Preliminary/progress screenshots were excluded. Final-reward gaps are explicitly listed in historicalIncompleteDates.'
  });
})();