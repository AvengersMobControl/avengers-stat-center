/* Reconcile the Roster Sparks Ledger from the four recorded event types.
   Existing member.totalSparks is the historical Piggy + Space + Kraken base.
   Flash was not included in that stored base; the Oct 11 Kraken import is
   recorded separately in K.octEventRows and must also be added once.
   Per-event identifiers prevent duplicate Flash screenshot rows from inflating rewards.
   June 2026 Kraken score backfills are included only if the source's earlier
   stored Kraken Sparks equal its August + September rewards, proving June was omitted. */
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
    const row=extras.get(entry.name)||{flashSparks:0,octKrakenSparks:0,juneKrakenSparks:0};
    row[key]+=entry.sparks;
    extras.set(entry.name,row);
  };
  flashResults.forEach(r=>sum(r,'flashSparks'));
  octKrakenResults.forEach(r=>sum(r,'octKrakenSparks'));

  // June Kraken damages were imported for some members after their all-time
  // Kraken reward totals had already been calculated. For six June-first
  // participants, the stored historical rewards match August + September
  // EXACTLY, which demonstrates that June was never included. Don't re-add
  // June for players whose existing totals already contain other historical
  // rewards or cannot be reconciled safely.
  const juneAvengers=new Set();
  Object.entries(D.piggy?.events||{}).forEach(([date,rows])=>{
    if(date<'2026-05-25'||date>'2026-06-28')return;
    (rows||[]).forEach(r=>{
      if(!r?.name||r.name==='Total'||!(Number(r.sparks)>0))return;
      if(clanOf(r)==='AV2')return;
      juneAvengers.add(canonical(r.name));
    });
  });
  const octByPlayer=new Map();
  octKrakenResults.forEach(r=>octByPlayer.set(r.name,(octByPlayer.get(r.name)||0)+r.sparks));
  const juneBackfills=[];
  (K.players||[]).forEach(p=>{
    const name=canonical(p.name);
    const damage=Number(p.june)||0;
    if(!(damage>0)||!juneAvengers.has(name))return;
    if(['feb02','feb23','march','april','may'].some(m=>(Number(p[m])||0)>0))return;
    const previous=Number(p.totalSparks)-(octByPlayer.get(name)||0);
    const augustSeptember=(Number(p.aug)||0)*750+(Number(p.sept)||0)*750;
    if(!Number.isFinite(previous)||Math.abs(previous-augustSeptember)>1)return;
    const sparks=damage*750; // reconstructed June AVENGERS reward, not a direct payout screenshot
    const row=extras.get(name)||{flashSparks:0,octKrakenSparks:0,juneKrakenSparks:0};
    row.juneKrakenSparks=sparks;
    extras.set(name,row);
    juneBackfills.push({name,damage,sparks});
  });
  window.AVENGERS_ROSTER_SPARKS_LEDGER={
    byMember:extras,
    forMember(raw){
      return extras.get(canonical(raw))||{flashSparks:0,octKrakenSparks:0,juneKrakenSparks:0};
    },
    sources:{
      flashEvents:new Set((F.events||[]).map(ev=>String(ev?.id||[ev?.setId||ev?.date||'',ev?.flash||'',ev?.channelId||''].join('|'))).values()).size,
      flashMemberRewards:flashResults.size,
      octKrakenMemberRewards:octKrakenResults.size,
      juneKrakenReconstructed:juneBackfills
    }
  };
})();