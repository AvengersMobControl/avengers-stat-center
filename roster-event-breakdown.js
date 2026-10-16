/* Event-sourced roster reward totals: Piggy + Space + Flash + Kraken.
   Historical snapshot totals and the legacy member.totalSparks are comparison
   evidence ONLY. Never convert an unexplained difference to Kraken Sparks. */
(function initializeRosterBreakdown(){
  'use strict';
  const D=window.AVENGERS_DATA||{},K=window.AVENGERS_KRAKEN_DATA||{},F=window.AVENGERS_PIGGY_FLASH_DATA||{events:[]};
  const ledger=window.AVENGERS_ROSTER_SPARKS_LEDGER||{};
  const canonical=raw=>{
    let n=String(raw||'').trim();const seen=new Set();
    while(D.aliasMap?.[n]&&!seen.has(n)){seen.add(n);n=D.aliasMap[n];}
    return n;
  };
  const clan=(r,ev)=>String(r?.clan||ev?.clan||ev?.rosterScope||'AVENGERS').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const totals=new Map();
  const get=raw=>{
    const name=canonical(raw);
    if(!totals.has(name))totals.set(name,{
      piggy:{sparks:0,stars:0,events:new Set()},
      space:{sparks:0,stars:0,events:new Set()},
      flash:{sparks:0,stars:0,events:new Set()},
      kraken:{events:new Set(),historical:0,october:0,juneBackfill:0}
    });
    return totals.get(name);
  };
  const records={piggy:new Map(),space:new Map(),flash:new Map()};
  const add=(kind,id,r,ev)=>{
    const name=canonical(r?.name);
    if(!name||name==='Total'||name==='#N/A')return;
    const label=kind==='piggy'?'lines':kind==='space'?'yearsB':'lines';
    if(!(Number(r?.[label])>0||Number(r?.sparks)>0||Number(r?.stars)>0))return;
    const key=[id,clan(r,ev),name].join('|');
    const sparks=Number.isFinite(Number(r?.sparks))?Math.max(0,Number(r.sparks)):0;
    const stars=Number.isFinite(Number(r?.stars))?Math.max(0,Number(r.stars)):0;
    const prev=records[kind].get(key);
    if(!prev||sparks>prev.sparks||(sparks===prev.sparks&&stars>prev.stars))
      records[kind].set(key,{name,key,sparks,stars});
  };
  for(const kind of ['piggy','space'])
    Object.entries(D[kind]?.events||{}).forEach(([date,rows])=>
      (rows||[]).forEach(r=>add(kind,date,r,null)));
  (F.events||[]).forEach(ev=>{
    const id=String(ev?.id||[ev?.setId||ev?.date||'',ev?.flash||'',ev?.channelId||''].join('|'));
    (ev.entries||[]).forEach(r=>add('flash',id,r,ev));
  });
  for(const kind of ['piggy','space','flash'])
    records[kind].forEach(row=>{
      const dest=get(row.name)[kind];dest.sparks+=row.sparks;
      dest.stars+=row.stars;dest.events.add(row.key);
    });

  // The original Kraken source's totalSparks is a Kraken-ONLY rewards
  // aggregate, unlike D.members.totalSparks (which is ALL event categories).
  // The October importer also adds the October payout to K.players.totalSparks.
  // Remove that October payout from its aggregate, then count explicit October
  // event rows ONCE. This also supports alias changes within a Kraken month.
  const october=new Map(),octoberRowsByName=new Map();
  (K.octEventRows||[]).forEach(r=>{
    const name=canonical(r.name);
    if(!name||!(Number(r.damage)>0)||!(Number(r.sparks)>=0))return;
    const key=[r.eventDate||'2026-10-11',clan(r),name].join('|');
    const prev=october.get(key);
    if(!prev||Number(r.sparks)>prev.sparks)
      october.set(key,{name,key,damage:Number(r.damage),sparks:Number(r.sparks)});
  });
  october.forEach(r=>{
    get(r.name).kraken.october+=r.sparks;
    get(r.name).kraken.events.add(r.key);
    if(!octoberRowsByName.has(r.name))octoberRowsByName.set(r.name,[]);
    octoberRowsByName.get(r.name).push(r);
  });
  (K.players||[]).forEach(p=>{
    if(!p?.name)return;
    const name=canonical(p.name),dest=get(name).kraken;
    (K.months||[]).forEach(m=>{
      if(m.key!=='oct'&&Number(p[m.key])>0)dest.events.add(m.key);
    });
    const recordedTotal=Number(p.totalSparks);
    if(!Number.isFinite(recordedTotal)||recordedTotal<0)return;
    const matchingOctober=(octoberRowsByName.get(name)||[]).find(r=>
      Number(p.oct)>0&&Math.abs(r.damage-Number(p.oct))<0.001);
    const historical=Math.max(0,recordedTotal-(matchingOctober?.sparks||0));
    // Historical aliases sometimes have two Kraken player records. They
    // represent one account, not two mutually additive lifetime aggregates.
    dest.historical=Math.max(dest.historical,historical);
  });
  // June payouts reconstructed in the older ledger are included ONLY for
  // accounts proven to have omitted June from the Kraken source aggregate.
  // A player whose Kraken source already included June receives no backfill.
  ledger.sources?.juneKrakenReconstructed?.forEach(r=>{
    const dest=get(r.name).kraken;
    dest.juneBackfill=Math.max(dest.juneBackfill,Number(r.sparks)||0);
  });

  window.AVENGERS_ROSTER_EVENT_BREAKDOWN={
    forMember(raw,legacyTotal=0){
      const data=get(raw),historicBase=Math.max(0,Number(legacyTotal)||0);
      const piggy=data.piggy.sparks,space=data.space.sparks,flash=data.flash.sparks;
      const kraken=data.kraken.historical+data.kraken.october+data.kraken.juneBackfill;
      const logged=piggy+space+flash+kraken;
      const knownStars=data.piggy.stars+data.space.stars+data.flash.stars;
      const directRewardFloor=piggy+space;
      return {
        piggySparks:piggy,spaceSparks:space,flashSparks:flash,krakenSparks:kraken,
        eventLoggedSparks:logged,
        krakenHistoricalSparks:data.kraken.historical,
        krakenOctoberSparks:data.kraken.october,
        krakenJuneReconstructedSparks:data.kraken.juneBackfill,
        krakenProvenance:'historical Kraken source aggregate (partly reconstructed) + unique October event + verified missing June',
        historicBaseSparks:historicBase,eventBackedBaseFloor:directRewardFloor,
        baseSupplementSparks:0,directRewardFloor,
        historicalBaseDiscrepancy:historicBase-logged,
        piggyStars:data.piggy.stars,spaceStars:data.space.stars,
        flashStars:data.flash.stars,krakenStars:null,
        loggedStars:knownStars,unloggedStars:null,knownStars,
        piggyEvents:data.piggy.events.size,spaceEvents:data.space.events.size,
        flashEvents:data.flash.events.size,krakenEvents:data.kraken.events.size,
        totalEvents:data.piggy.events.size+data.space.events.size+
          data.flash.events.size+data.kraken.events.size,
        sparksReconciliationDelta:0,storedBaseDifference:directRewardFloor-historicBase
      };
    }
  };
})();
