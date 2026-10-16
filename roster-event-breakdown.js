/* Deduplicated roster event breakdown; stars remain partial until the all-time roster screenshots arrive. */
(function initializeRosterBreakdown(){
  'use strict';
  const D=window.AVENGERS_DATA||{},K=window.AVENGERS_KRAKEN_DATA||{},F=window.AVENGERS_PIGGY_FLASH_DATA||{events:[]};
  const ledger=window.AVENGERS_ROSTER_SPARKS_LEDGER||{};
  const canonical=raw=>{let n=String(raw||'').trim();const visited=new Set();while(D.aliasMap?.[n]&&!visited.has(n)){visited.add(n);n=D.aliasMap[n];}return n;};
  const clan=(r,ev)=>String(r?.clan||ev?.clan||ev?.rosterScope||'AVENGERS').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const totals=new Map();
  const get=name=>{name=canonical(name);if(!totals.has(name))totals.set(name,{piggy:{sparks:0,stars:0,events:new Set()},space:{sparks:0,stars:0,events:new Set()},flash:{sparks:0,stars:0,events:new Set()},kraken:{events:new Set()}});return totals.get(name);};
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
    if(!prev||sparks>prev.sparks||(sparks===prev.sparks&&stars>prev.stars))records[kind].set(key,{name,key,sparks,stars});
  };
  for(const kind of ['piggy','space'])Object.entries(D[kind]?.events||{}).forEach(([date,rows])=>(rows||[]).forEach(r=>add(kind,date,r,null)));
  (F.events||[]).forEach(ev=>{const id=String(ev?.id||[ev?.setId||ev?.date||'',ev?.flash||'',ev?.channelId||''].join('|'));(ev.entries||[]).forEach(r=>add('flash',id,r,ev));});
  for(const kind of ['piggy','space','flash'])records[kind].forEach(row=>{const dest=get(row.name)[kind];dest.sparks+=row.sparks;dest.stars+=row.stars;dest.events.add(row.key);});
  (K.players||[]).forEach(p=>{if(!p?.name)return;const dest=get(p.name).kraken.events;(K.months||[]).forEach(m=>{if(Number(p[m.key])>0)dest.add(m.key);});});
  (K.octEventRows||[]).forEach(r=>{if(Number(r.damage)>0&&r.name)get(r.name).kraken.events.add('oct');});
  window.AVENGERS_ROSTER_EVENT_BREAKDOWN={
    forMember(raw,baseTotal=0){
      const data=get(raw),extra=ledger.forMember?.(raw)||{flashSparks:0,octKrakenSparks:0,juneKrakenSparks:0};
      const historicBase=Math.max(0,Number(baseTotal)||0);
      // Existing member.totalSparks is an older historical base. Recorded
      // deduplicated Piggy + Space rewards establish a minimum independently.
      // Use the larger amount, never add them: adding would double-count old
      // rewards that are already present in the stored base.
      const directRewardFloor=data.piggy.sparks+data.space.sparks;
      const base=Math.max(historicBase,directRewardFloor);
      const baseSupplementSparks=base-historicBase;
      const piggy=Math.min(base,data.piggy.sparks);
      // Keep the original logged Sparks authoritative when historic event reward rows
      // differ slightly due to rounding; the Kraken remainder is historical base.
      const space=Math.min(Math.max(0,base-piggy),data.space.sparks);
      const kraken=Math.max(0,base-piggy-space)+(Number(extra.octKrakenSparks)||0)+(Number(extra.juneKrakenSparks)||0);
      const flash=Number(extra.flashSparks)||0;
      const knownStars=data.piggy.stars+data.space.stars+data.flash.stars;
      return {
        piggySparks:piggy,spaceSparks:space,flashSparks:flash,krakenSparks:kraken,
        eventLoggedSparks:base+flash+(Number(extra.octKrakenSparks)||0)+(Number(extra.juneKrakenSparks)||0),
        historicBaseSparks:historicBase,eventBackedBaseFloor:base,baseSupplementSparks,
        directRewardFloor,
        piggyStars:data.piggy.stars,spaceStars:data.space.stars,flashStars:data.flash.stars,krakenStars:null,
        loggedStars:knownStars,unloggedStars:null,knownStars,
        piggyEvents:data.piggy.events.size,spaceEvents:data.space.events.size,
        flashEvents:data.flash.events.size,krakenEvents:data.kraken.events.size,
        totalEvents:data.piggy.events.size+data.space.events.size+data.flash.events.size+data.kraken.events.size,
        sparksReconciliationDelta:data.piggy.sparks-piggy+data.space.sparks-space,
        storedBaseDifference:directRewardFloor-historicBase
      };
    }
  };
})();
