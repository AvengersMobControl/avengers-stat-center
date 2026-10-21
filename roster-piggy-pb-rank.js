// Best finishing PLACE in a qualifying AVENGERS Piggy Race, never a lines ranking.
// A qualifying lobby has at least 30 distinct, observed AVENGERS participants.
// An AV-2 lobby, small/solo AVENGERS lobby, Piggy Flash or unverified rank does not count.
// This is a read-only derivative of the accepted, canonical event projection.
(function(root){
  'use strict';
  const MIN_AVENGERS_IN_LOBBY=30;
  const MIN_AV2_IN_LOBBY=5;
  const validPlace=value=>{
    if(value===null||value===undefined||value==='') return null;
    const n=Number(value);
    return Number.isSafeInteger(n)&&n>0?n:null;
  };
  function lobbyId(row){
    // Keep explicit lobby/race partitions separate; never combine two 20-player
    // lobbies to manufacture a qualifying 40-player race. Old single-lobby
    // Piggy leaderboards have no lobby key and use a common legacy main key.
    const m=row.metadata||{};
    const id=m.lobbyId??m.lobby??m.group??m.raceId??row.lobbyId??row.lobby??row.group??row.raceId;
    return id===null||id===undefined||id===''?'legacy-main':String(id);
  }
  function bestFinishes(events,{clan='AVENGERS',minParticipants=MIN_AVENGERS_IN_LOBBY}={}){
    const qualifying=new Map(),byPlayer=new Map();
    for(const event of Array.isArray(events)?events:[]){
      if(event?.kind!=='piggy'||event.status==='revoked')continue;
      const groups=new Map();
      for(const row of Array.isArray(event.rows)?event.rows:[]){
        if(row?.clan!==clan||!row.player)continue;
        // A qualifying racer needs a known positive result. Reward availability
        // is independent of finishing position.
        const effort=Number(row.score);
        if(!Number.isFinite(effort)||effort<=0)continue;
        const key=lobbyId(row),group=groups.get(key)||new Map();
        const prior=group.get(row.player);
        if(prior){
          // Conflicting duplicate placements cannot be used as PB evidence.
          if(prior.rank!==validPlace(row.metadata?.rank??row.rank))group.set(row.player,{invalid:true});
        }else group.set(row.player,{rank:validPlace(row.metadata?.rank??row.rank),invalid:false});
        groups.set(key,group);
      }
      for(const [key,group] of groups){
        if(group.size<minParticipants)continue;
        qualifying.set(event.id+'|'+key,group.size);
        for(const [player,record] of group){
          if(record.invalid||record.rank===null)continue;
          const prior=byPlayer.get(player);
          if(prior===undefined||record.rank<prior)byPlayer.set(player,record.rank);
        }
      }
    }
    return {byPlayer,qualifying};
  }
  // Independent historical PB stream: *best finishing place*, never lines.
  // First eligible finish and subsequent strictly better finishes are both
  // preserved for the event's PB page and the reviewed PNG export.
  function placementHistory(events,clan='AVENGERS'){
    if(!['AVENGERS','AV-2'].includes(clan))throw Error('Unsupported event-time clan');
    const minParticipants=clan==='AV-2'?MIN_AV2_IN_LOBBY:MIN_AVENGERS_IN_LOBBY;
    const bestByPlayer=new Map(),bestDateByPlayer=new Map(),byEvent=new Map();
    const ordered=(Array.isArray(events)?events:[])
      .filter(e=>e?.kind==='piggy'&&e.status!=='revoked')
      .slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))
                         ||String(a.id||'').localeCompare(String(b.id||'')));
    for(const event of ordered){
      const placements=bestFinishes([event],{clan,minParticipants}).byPlayer;
      const transitions=[];
      for(const [player,finish] of placements){
        const previousRank=bestByPlayer.get(player)??null;
        const previousDate=bestDateByPlayer.get(player)??null;
        // Ignore equal/worse finishes; first qualifying result is a PB baseline.
        if(previousRank!==null&&finish>=previousRank)continue;
        transitions.push({
          player,eventId:event.id,date:event.date,previousRank,previousDate,newRank:finish,
          firstQualified:previousRank===null,improved:previousRank!==null
        });
        bestByPlayer.set(player,finish);
        bestDateByPlayer.set(player,event.date);
      }
      transitions.sort((a,b)=>a.newRank-b.newRank||a.player.localeCompare(b.player));
      byEvent.set(event.id,transitions);
    }
    return {byPlayer:bestByPlayer,byEvent};
  }
  // Career podiums derived from literal finishing positions in qualifying,
  // event-time clan-specific Piggy lobbies. Each event contributes at most one
  // placement per canonical account; AVENGERS and AV-2 remain independent.
  function careerPodiums(events,clan='AVENGERS'){
    if(!['AVENGERS','AV-2'].includes(clan))throw Error('Unsupported event-time clan');
    const minParticipants=clan==='AV-2'?MIN_AV2_IN_LOBBY:MIN_AVENGERS_IN_LOBBY;
    const byPlayer=new Map(),byEvent=new Map();
    const ordered=(Array.isArray(events)?events:[])
      .filter(e=>e?.kind==='piggy'&&e.status!=='revoked')
      .slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))
                         ||String(a.id||'').localeCompare(String(b.id||'')));
    for(const event of ordered){
      const valid=bestFinishes([event],{clan,minParticipants}).byPlayer;
      const records=[];
      for(const [player,place] of valid){
        if(place>3)continue;
        const tally=byPlayer.get(player)||{wins:0,secondPlaces:0,thirdPlaces:0,podiums:0};
        const next={...tally};
        if(place===1)next.wins++;
        else if(place===2)next.secondPlaces++;
        else if(place===3)next.thirdPlaces++;
        next.podiums++;
        byPlayer.set(player,next);
        records.push({player,place,date:event.date,eventId:event.id,...next});
      }
      records.sort((a,b)=>a.place-b.place||a.player.localeCompare(b.player));
      byEvent.set(event.id,records);
    }
    return {byPlayer,byEvent};
  }
  function rankRows(rows,events,aliases={}){
    const best=bestFinishes(events).byPlayer;
    const podiums=careerPodiums(events).byPlayer;
    const resolve=raw=>{
      let name=String(raw||''),seen=new Set();
      while(aliases[name]&&!seen.has(name)){
        seen.add(name);name=aliases[name];
      }
      return name;
    };
    return (Array.isArray(rows)?rows:[]).map(row=>{
      const name=resolve(row.profileName||row.name);
      const tally=podiums.get(name)||{wins:0,secondPlaces:0,thirdPlaces:0,podiums:0};
      return {...row,piggyPBRank:best.get(name)??null,
        piggyWins:tally.wins,piggySecondPlaces:tally.secondPlaces,
        piggyThirdPlaces:tally.thirdPlaces,piggyPodiums:tally.podiums};
    });
  }
  function formatFinish(place){
    const n=validPlace(place);
    if(n===null)return '—';
    const suffix=n%100>=11&&n%100<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');
    return n+suffix;
  }
  const api=Object.freeze({rankRows,bestFinishes,placementHistory,careerPodiums,formatFinish,MIN_AVENGERS_IN_LOBBY,MIN_AV2_IN_LOBBY});
  if(root)root.AVENGERS_ROSTER_PIGGY_PB_RANK=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?null:window);
