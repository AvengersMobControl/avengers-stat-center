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
      kraken:{events:new Set(),historical:0,october:0,juneBackfill:0},datedSparks:[]
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
      records[kind].set(key,{name,key,sparks,stars,date:kind==='flash'?ev?.date:id});
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
      get(row.name).datedSparks.push({date:row.date,sparks:row.sparks});
    });

  // Kraken is derived from event-time payouts, NOT the old K.players.totalSparks
  // lifetime aggregate. The latter was found to contain mismatched and in
  // some cases inflated source totals (notably Saber, Animosity and Finnie).
  // The six five-week league ledgers have explicit October rewards and
  // older damage-based payouts with event-time clan inference.
  const leagues=window.AVENGERS_CLAN_LEAGUE_REWARDS?.build?.()||[];
  if(leagues.length!==6)
    throw new Error('Missing six-period Kraken event provenance');
  for(const league of leagues){
    for(const row of league.rows||[]){
      if(!(Number(row.krakenSparks)>0))continue;
      const dest=get(row.name).kraken;
      const estimated=Math.max(0,Number(row.estimatedKraken)||0);
      const oct=Number(row.krakenSparks)-estimated;
      dest.historical+=estimated;
      dest.october+=Math.max(0,oct);
      if(league.kraken==='june')dest.juneBackfill+=estimated;
      dest.events.add(league.kraken);
      get(row.name).datedSparks.push({date:league.end||({oct:'2026-10-11',sept:'2026-09-06',aug:'2026-08-02',june:'2026-06-28',may:'2026-05-24',april:'2026-04-19'}[league.kraken]),sparks:Number(row.krakenSparks)});
    }
  }
  // The retained archive also includes Feb 2, Feb 23 and March Kraken
  // (older than the six reported leagues). Reconstruct these ONLY when
  // a dated Piggy/Space event provides a nearby historical clan. Never
  // default to the player's current clan or an all-time stored number.
  const proof=new Map();
  const clanAt=(r,kind)=>{
    const raw=String(r.eventClan||r.raceClan||r.clan||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    if(raw==='avengers'||raw==='av')return 'AVENGERS';
    if(raw==='av2')return 'AV-2';
    if(kind==='piggy')return (Number(r.stars)>0||Number(r.sparks)>0||Number(r.share)>0)?'AVENGERS':'AV-2';
    return 'AVENGERS';
  };
  for(const kind of ['piggy','space']){
    for(const [date,rows] of Object.entries(D[kind]?.events||{})){
      for(const r of rows||[]){
        if(!r?.name||r.name==='Total'||r.name==='#N/A')continue;
        if(!(Number(r[kind==='piggy'?'lines':'yearsB'])>0))continue;
        const name=canonical(r.name);
        if(!proof.has(name))proof.set(name,[]);
        proof.get(name).push({date,clan:clanAt(r,kind)});
      }
    }
  }
  const earlier=[['feb02','2026-02-02'],['feb23','2026-02-23'],['march','2026-03-15']];
  const earlyEventScores=new Map();
  for(const p of K.players||[]){
    if(!p?.name)continue;
    const name=canonical(p.name);
    for(const [month,date] of earlier){
      const damage=Number(p[month])||0;
      if(!(damage>0))continue;
      const key=month+'|'+name;
      const previous=earlyEventScores.get(key);
      if(!previous||damage>previous.damage)
        earlyEventScores.set(key,{name,month,date,damage});
    }
  }
  for(const row of earlyEventScores.values()){
    const end=Date.parse(row.date+'T00:00:00Z');
    const nearby=(proof.get(row.name)||[]).filter(x=>{
      const t=Date.parse(x.date+'T00:00:00Z');
      return Number.isFinite(t)&&t<=end&&end-t<=34*86400000;
    }).sort((a,b)=>b.date.localeCompare(a.date));
    const nearest=nearby[0];
    if(!nearest)continue; // unknown: no clan assigned and no inferred payout
    if(nearby.some(x=>x.date===nearest.date&&x.clan!==nearest.clan))continue;
    const rate=nearest.clan==='AVENGERS'?750:500;
    const dest=get(row.name).kraken;
    dest.historical+=row.damage*rate;
    dest.events.add(row.month);
    get(row.name).datedSparks.push({date:row.date,sparks:row.damage*rate});
  }
  // Counts represent observed Kraken activity even if a particular older
  // event lacks sufficient historical clan evidence for a Spark payout.
  for(const p of K.players||[]){
    if(!p?.name)continue;
    const dest=get(p.name).kraken.events;
    for(const m of K.months||[]){
      if(Number(p[m.key])>0)dest.add(m.key);
    }
  }

  window.AVENGERS_ROSTER_EVENT_BREAKDOWN={
    loggedBefore(raw,beforeDate){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(String(beforeDate)))return null;
      return get(raw).datedSparks.reduce((sum,r)=>sum+(typeof r.date==='string'&&r.date<beforeDate?r.sparks:0),0);
    },
    forMember(raw,legacyTotal=0){
      const data=get(raw),historicBase=Math.max(0,Number(legacyTotal)||0);
      const piggy=data.piggy.sparks,space=data.space.sparks,flash=data.flash.sparks;
      // June is already included in historical per-event payouts.
      // Its provenance is separate; do not add it again.
      const kraken=data.kraken.historical+data.kraken.october;
      const logged=piggy+space+flash+kraken;
      const knownStars=data.piggy.stars+data.space.stars+data.flash.stars;
      const directRewardFloor=piggy+space;
      return {
        piggySparks:piggy,spaceSparks:space,flashSparks:flash,krakenSparks:kraken,
        eventLoggedSparks:logged,
        krakenHistoricalSparks:data.kraken.historical,
        krakenOctoberSparks:data.kraken.october,
        krakenJuneReconstructedSparks:data.kraken.juneBackfill,
        krakenProvenance:'per-event damage x historical clan rate (estimates) + verified October payout; unknown-clan historical damage not assigned',
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
