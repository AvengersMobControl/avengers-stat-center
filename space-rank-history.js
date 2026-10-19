/* Reviewed Space Race source finishes. These are NOT sorted-distance guesses. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.AVENGERS_SPACE_RANKS=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const place=n=>{
    if(n===null||n===undefined||n==='')return null;
    const v=Number(n);
    return Number.isSafeInteger(v)&&v>0?v:null;
  };
  const number=n=>n===null||n===undefined||n===''?null:(Number.isFinite(Number(n))?Number(n):null);
  const validClan=c=>c==='AVENGERS'||c==='AV-2';
  const canonical=(raw,aliases)=>{
    let n=String(raw||''),seen=new Set();
    while(aliases[n]&&aliases[n]!==n){
      if(seen.has(n))throw Error('Space identity alias cycle');
      seen.add(n);n=aliases[n];
    }
    return n;
  };
  const lobbyFor=r=>{
    const x=r?.metadata?.lobby??r?.metadata?.group??r?.lobby??r?.group;
    return x===null||x===undefined||String(x).trim()===''?null:String(x);
  };
  const ordinal=n=>{
    const v=place(n);
    if(v===null)return '—';
    return v+(v%100>=11&&v%100<=13?'th':v%10===1?'st':v%10===2?'nd':v%10===3?'rd':'th');
  };
  function analyze(events=[],aliases={}){
    const byEvent=new Map(),lobbyBestByClan=new Map(),verifiedClanBestByClan=new Map();
    const lobbyBestByPlayer=new Map(),verifiedClanBestByPlayer=new Map();
    const lobbyTransitionsByEvent=new Map(),verifiedTransitionsByEvent=new Map();
    const list=events.filter(e=>e?.kind==='space'&&e.status!=='revoked').slice()
      .sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.id).localeCompare(String(b.id)));
    for(const event of list){
      const ranks=new Map(),lobbyTransitions=[],verifiedTransitions=[];
      const rows=(event.rows||[]).filter(r=>r?.player&&validClan(r.clan)).map(r=>({
        player:canonical(r.player,aliases),clan:r.clan,score:number(r.score),
        lobby:lobbyFor(r),sourcePlace:place(r.metadata?.rank??r.rank)
      }));
      const clanBuckets=new Map();
      for(const row of rows){
        const bucket=clanBuckets.get(row.clan)||[];bucket.push(row);clanBuckets.set(row.clan,bucket);
      }
      for(const [clan,bucket] of clanBuckets){
        const positive=bucket.filter(r=>r.score!==null&&r.score>0).slice()
          .sort((a,b)=>b.score-a.score||a.player.localeCompare(b.player));
        const captured=new Map();
        let last=null,competition=0;
        positive.forEach((r,i)=>{if(r.score!==last)competition=i+1;captured.set(r.player,competition);last=r.score;});
        // A 'final' event alone proves nothing about omitted screenshots.
        // Only explicit, clan-specific approved evidence can certify all lobbies.
        const attested=event.status==='final'&&event.metadata?.verifiedAllLobbyClans?.[clan]===true
          &&bucket.every(r=>r.score!==null&&r.score>0)
          &&new Set(bucket.map(r=>r.player)).size===bucket.length;
        for(const row of bucket){
          const key=clan+'|'+row.player;
          const capturedPlace=captured.get(row.player)??null;
          const sourcePlace=row.lobby===null?null:row.sourcePlace;
          const verifiedPlace=attested?capturedPlace:null;
          ranks.set(key,{...row,lobbyFinish:sourcePlace,recordedClanFinish:capturedPlace,verifiedClanFinish:verifiedPlace,
            capturedClanCount:positive.length,verifiedAllLobbies:attested});
          if(sourcePlace!==null){
            const prior=lobbyBestByClan.get(key)||null;
            if(!prior||sourcePlace<prior.rank){
              const transition={player:row.player,clan,date:event.date,eventId:event.id,lobby:row.lobby,
                previous:prior?.rank??null,previousDate:prior?.date??null,rank:sourcePlace,first:!prior,improved:!!prior};
              lobbyTransitions.push(transition);
              const next={rank:sourcePlace,date:event.date,eventId:event.id,clan,lobby:row.lobby};
              lobbyBestByClan.set(key,next);
              const overall=lobbyBestByPlayer.get(row.player);
              if(!overall||sourcePlace<overall.rank)lobbyBestByPlayer.set(row.player,next);
            }
          }
          if(verifiedPlace!==null){
            const prior=verifiedClanBestByClan.get(key)||null;
            if(!prior||verifiedPlace<prior.rank){
              verifiedTransitions.push({player:row.player,clan,date:event.date,eventId:event.id,
                previous:prior?.rank??null,rank:verifiedPlace,first:!prior,improved:!!prior});
              const next={rank:verifiedPlace,date:event.date,eventId:event.id,clan};
              verifiedClanBestByClan.set(key,next);
              const overall=verifiedClanBestByPlayer.get(row.player);
              if(!overall||verifiedPlace<overall.rank)verifiedClanBestByPlayer.set(row.player,next);
            }
          }
        }
      }
      byEvent.set(event.id,ranks);
      lobbyTransitionsByEvent.set(event.id,lobbyTransitions.sort((a,b)=>a.rank-b.rank||a.player.localeCompare(b.player)));
      verifiedTransitionsByEvent.set(event.id,verifiedTransitions.sort((a,b)=>a.rank-b.rank||a.player.localeCompare(b.player)));
    }
    return {byEvent,lobbyBestByClan,verifiedClanBestByClan,lobbyBestByPlayer,verifiedClanBestByPlayer,
      lobbyTransitionsByEvent,verifiedTransitionsByEvent};
  }
  return Object.freeze({analyze,ordinal,place,lobbyFor});
});
