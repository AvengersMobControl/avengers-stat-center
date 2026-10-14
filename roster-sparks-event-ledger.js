/* Reconcile the Roster Sparks Ledger from the four recorded event types.
   Existing member.totalSparks is the historical Piggy + Space + Kraken base.
   Flash was not included in that stored base; the Oct 11 Kraken import is
   recorded separately in K.octEventRows and must also be added once.
   Per-event identifiers prevent duplicate Flash screenshot rows from inflating rewards. */
(function(){
  'use strict';
  const D=window.AVENGERS_DATA||{};
  const F=window.AVENGERS_PIGGY_FLASH_DATA||{events:[]};
  const K=window.AVENGERS_KRAKEN_DATA||{};
  const canonical=raw=>{
    let name=String(raw||'').trim();
    const seen=new Set();
    while(D.aliasMap?.[name]&&!seen.has(name)){
      seen.add(name);name=D.aliasMap[name];
    }
    return name;
  };
  const clanOf=(r,ev)=>String(r?.clan||ev?.clan||ev?.rosterScope||'AVENGERS').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const validSpark=r=>r?.sparks!=null&&r.sparks!==''&&Number.isFinite(Number(r.sparks))&&Number(r.sparks)>=0;
  const flashResults=new Map();
  (F.events||[]).forEach(ev=>{
    const id=String(ev?.id||[ev?.setId||ev?.date||'',ev?.flash||'',ev?.channelId||''].join('|'));
    (ev?.entries||[]).forEach(r=>{
      const name=canonical(r?.name);
      if(!name||name==='Total'||name==='#N/A'||!validSpark(r))return;
      const key=[id,clanOf(r,ev),name].join('|');
      // Screenshots of the same Flash can overlap. One reward per member/clan/Flash.
      const prev=flashResults.get(key);
      if(!prev||Number(r.sparks)>prev.sparks)flashResults.set(key,{name,sparks:Number(r.sparks)});
    });
  });
  const octKrakenResults=new Map();
  (K.octEventRows||[]).forEach(r=>{
    const name=canonical(r?.name);
    if(!name||!validSpark(r))return;
    const key=[String(r.eventDate||''),clanOf(r),name].join('|');
    const prev=octKrakenResults.get(key);
    if(!prev||Number(r.sparks)>prev.sparks)octKrakenResults.set(key,{name,sparks:Number(r.sparks)});
  });
  const extras=new Map();
  const sum=(entry,key)=>{
    const row=extras.get(entry.name)||{flashSparks:0,octKrakenSparks:0};
    row[key]+=entry.sparks;
    extras.set(entry.name,row);
  };
  flashResults.forEach(r=>sum(r,'flashSparks'));
  octKrakenResults.forEach(r=>sum(r,'octKrakenSparks'));
  window.AVENGERS_ROSTER_SPARKS_LEDGER={
    byMember:extras,
    forMember(raw){
      return extras.get(canonical(raw))||{flashSparks:0,octKrakenSparks:0};
    },
    sources:{
      flashEvents:new Set((F.events||[]).map(ev=>String(ev?.id||[ev?.setId||ev?.date||'',ev?.flash||'',ev?.channelId||''].join('|'))).values()).size,
      flashMemberRewards:flashResults.size,
      octKrakenMemberRewards:octKrakenResults.size
    }
  };
})();