'use strict';
// Deterministic adapter from retained source archives. Does not call Discord.
const {normalize,canonical,UNITS,periods}=require('./event-projection-core.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
const number=x=>x===null||x===undefined||x===''||!Number.isFinite(Number(x))?null:Number(x);
const clan=x=>{const n=String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');return n==='av2'?'AV-2':n==='avengers'||n==='av'?'AVENGERS':null;};
const monthDates={feb02:'2026-02-02',feb23:'2026-02-23',march:'2026-03-15',april:'2026-04-19',may:'2026-05-24',june:'2026-06-28',aug:'2026-08-02',sept:'2026-09-06',oct:'2026-10-11'};
function migrate(w){
  const D=w.AVENGERS_DATA,K=w.AVENGERS_KRAKEN_DATA,F=w.AVENGERS_PIGGY_FLASH_DATA;
  const aliases=copy(D.aliasMap),resolve=n=>canonical(n,aliases),events=[],review=[];
  const rowMeta=r=>Object.fromEntries(['rank','group','share','username','rewardEstimated','legacyLayout'].filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
  const add=(event)=>{
    const unique=new Map();
    for(const r of event.rows){
      const identity=r.player||r.sourceIdentity;
      const old=unique.get(identity);
      if(old&&old.score===r.score&&((!old.clan&&r.clan)||(!r.clan&&old.clan))){
        const accepted=r.clan?r:old;
        review.push({reason:'superseded-placeholder',eventId:event.id,player:r.player,source:'explicit clan-specific final import replaces unclassified workbook placeholder'});
        unique.set(identity,accepted);
      }else unique.set(identity,old&&JSON.stringify(old)!==JSON.stringify(r)?[old,r]:r);
    }
    event.rows=[...unique.values()].flat();
    events.push({...normalize(event,aliases),revision:1});
  };
  const proof=new Map();
  for(const kind of ['piggy','space']){
    for(const [date,list]of Object.entries(D[kind].events)){
      const rows=[];
      for(const r of list){
        if(!r.name||['Total','#N/A'].includes(r.name))continue;
        const score=number(r[kind==='piggy'?'lines':'yearsB']);
        if(!(score>0||number(r.sparks)>0||number(r.stars)>0))continue;
        let c=clan(r.eventClan||r.raceClan||r.clan);
        // Retained AVENGERS main Piggy award rows come from the named clan's
        // result sheets. Zero-award rows without clan evidence stay unknown.
        if(!c&&kind==='piggy'&&(number(r.sparks)>0||number(r.stars)>0||number(r.share)>0))c='AVENGERS';
        const player=resolve(r.name);
        rows.push({player,clan:c,...(!c?{clanAttribution:'unknown'}:{}),score,sparks:number(r.sparks),stars:number(r.stars),metadata:rowMeta(r)});
        if(c&&score>0){const p=proof.get(player)||[];p.push({date,clan:c});proof.set(player,p);}
      }
      // September 18 lobby 6 is distance-only in the retained workbook. No
      // final reward capture exists in the reviewed channel window; zeros are
      // placeholders, not proof of no payout. Preserve accepted distances.
      const missingSept18=kind==='space'&&date==='2026-09-18';
      if(missingSept18)for(const r of rows.filter(r=>r.metadata.group===6)){
        r.stars=null;r.sparks=null;r.metadata.rewardCoverage='Final rewards unavailable for lobby 6; legacy zero placeholders removed.';
      }
      const partial=missingSept18||Boolean(D[kind].historicalIncompleteDates?.[date]);
      add({id:kind+'|'+date,kind,date,status:partial?'partial':'final',unit:UNITS[kind],sources:['repository:'+kind+'.events:'+date],...(missingSept18?{metadata:{coverageNote:'Lobby 6 (Animosity, MotherboardBeans, Nicefellow, ColdCreeps) has recorded distances but no final reward screenshot. Five lobbies have known rewards; the full six-lobby pot is unavailable.'}}:{}),rows});
    }
  }
  // The one retained history-only result has no matching final screenshot;
  // preserve as review evidence, not an invented accepted event.
  for(const kind of ['piggy','space'])for(const [name,history]of Object.entries(D[kind].history))for(const h of history){
    const player=resolve(name),e=events.find(e=>e.id===kind+'|'+h.date),r=e?.rows.find(r=>r.player===player);
    const score=number(h[kind==='piggy'?'lines':'yearsB']);
    if(!r&&score>0)review.push({reason:'history-only',kind,date:h.date,player,score,source:'legacy workbook summary; no event result'});
    else if(r&&score!==r.score)review.push({reason:'stale-summary',kind,date:h.date,player,summaryScore:score,acceptedScore:r.score,source:'verified final-result event source'});
  }
  for(const ev of F.events||[]){
    const rows=(ev.entries||[]).filter(r=>r.name&&!['Total','#N/A'].includes(r.name)).map(r=>{
      const c=clan(r.clan||ev.clan||ev.rosterScope);
      return {player:resolve(r.name),clan:c,...(!c?{clanAttribution:'unknown'}:{}),score:number(r.lines),sparks:number(r.sparks),stars:number(r.stars),metadata:rowMeta(r)};
    });
    for(const r of rows)if(r.clan&&r.score>0){const ps=proof.get(r.player)||[];ps.push({date:ev.date,clan:r.clan});proof.set(r.player,ps);}
    add({id:'flash|'+ev.id,kind:'flash',date:ev.date,status:ev.complete===false?'partial':'final',unit:UNITS.flash,sources:['repository:flash:'+ev.id],metadata:Object.fromEntries(Object.entries(ev).filter(([k])=>k!=='entries'&&k!=='channelId')),rows});
  }
  for(const month of K.months){
    const date=month.date||monthDates[month.key];if(!date)throw Error('Unknown Kraken month date: '+month.key);
    const rows=[];
    if(month.key==='oct'){
      for(const r of K.octEventRows||[]){
        // Leader-confirmed identity rule: an AV-2 Frenchie result belongs to Frenchie2.
        // The separate AVENGERS Frenchie account is never merged into this identity.
        const player=(r.clan==='AV-2'&&r.name==='AV-FrenchieUSA')?resolve('AV-Frenchie2'):resolve(r.name);
        const stored=K.players.find(p=>resolve(p.name)===player);
        if(stored&&Number(stored.oct)!==Number(r.damage)){
          review.push({reason:'ambiguous-cross-clan-account',eventId:'kraken|oct',clan:r.clan,sourceRank:r.rank,sourceName:r.name,score:r.damage,sparks:r.sparks});
          rows.push({player:null,sourceIdentity:'oct|'+r.clan+'|rank:'+r.rank,clan:clan(r.clan),score:number(r.damage),sparks:number(r.sparks),stars:null,metadata:{monthKey:'oct',monthLabel:month.label,rank:r.rank,sourceName:r.name}});
          continue;
        }
        rows.push({player,clan:clan(r.clan),score:number(r.damage),sparks:number(r.sparks),stars:null,metadata:{monthKey:'oct',monthLabel:month.label,rank:r.rank}});
      }
      add({id:'kraken|oct',kind:'kraken',date,status:'partial',unit:UNITS.kraken,sources:['repository:kraken:oct'],metadata:{monthKey:'oct',monthLabel:month.label},rows});
      continue;
    }
    for(const p of K.players){
      const score=number(p[month.key]);if(!(score>0))continue;
      const player=resolve(p.name),explicit=month.key==='oct'?(K.octEventRows||[]).find(r=>resolve(r.name)===player):null;
      const period=periods.find(p=>p.end===date),earliest=period?.start||new Date(Date.parse(date)-34*86400000).toISOString().slice(0,10);
      const nearby=(proof.get(player)||[]).filter(r=>r.date>=earliest&&r.date<=date).sort((a,b)=>b.date.localeCompare(a.date));
      const best=nearby[0];
      const c=explicit?clan(explicit.clan):best&&!nearby.some(r=>r.date===best.date&&r.clan!==best.clan)?best.clan:null;
      const sparks=explicit?number(explicit.sparks):c?score*(c==='AVENGERS'?750:500):null;
      rows.push({player,clan:c,...(!c?{clanAttribution:'unknown'}:{}),score,sparks,stars:null,estimatedSparks:!explicit&&sparks!==null,metadata:{monthKey:month.key,monthLabel:month.label,payoutPolicy:'historical-clan-rate'}});
    }
    add({id:'kraken|'+month.key,kind:'kraken',date,status:'partial',unit:UNITS.kraken,sources:['repository:kraken:'+month.key],metadata:{monthKey:month.key,monthLabel:month.label},rows});
  }
  return {ledger:{schemaVersion:1,events:events.sort((a,b)=>a.id.localeCompare(b.id)),changes:[]},review,aliases,monthDates};
}
module.exports={migrate,monthDates,clan,number,copy};
