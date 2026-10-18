// Best finishing PLACE in a qualifying AVENGERS Piggy Race, never a lines ranking.
// A qualifying lobby has at least 30 distinct, observed AVENGERS participants.
// An AV-2 lobby, small/solo AVENGERS lobby, Piggy Flash or unverified rank does not count.
// This is a read-only derivative of the accepted, canonical event projection.
(function(root){
  'use strict';
  const MIN_AVENGERS_IN_LOBBY=30;
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
  function bestFinishes(events){
    const qualifying=new Map(),byPlayer=new Map();
    for(const event of Array.isArray(events)?events:[]){
      if(event?.kind!=='piggy'||event.status==='revoked')continue;
      const groups=new Map();
      for(const row of Array.isArray(event.rows)?event.rows:[]){
        if(row?.clan!=='AVENGERS'||!row.player)continue;
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
        if(group.size<MIN_AVENGERS_IN_LOBBY)continue;
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
  function rankRows(rows,events,aliases={}){
    const best=bestFinishes(events).byPlayer;
    const resolve=raw=>{
      let name=String(raw||''),seen=new Set();
      while(aliases[name]&&!seen.has(name)){
        seen.add(name);name=aliases[name];
      }
      return name;
    };
    return (Array.isArray(rows)?rows:[]).map(row=>({
      ...row,
      piggyPBRank:best.get(resolve(row.profileName||row.name))??null
    }));
  }
  const api=Object.freeze({rankRows,bestFinishes,MIN_AVENGERS_IN_LOBBY});
  if(root)root.AVENGERS_ROSTER_PIGGY_PB_RANK=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?null:window);
