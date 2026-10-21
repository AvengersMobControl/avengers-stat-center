// Read-only Flash WINS / PODIUMS, derived ONLY from observed source finishing positions.
// Flash placements are not Piggy Race rank-PBs; Piggy Race 30+/5+ lobby rules do not apply.
(function(root){
  'use strict';
  const validPlace=value=>{
    if(value===null||value===undefined||value==='')return null;
    const n=Number(value);
    return Number.isSafeInteger(n)&&n>=1?n:null;
  };
  const validFlash=value=>{
    const n=Number(value);
    return Number.isSafeInteger(n)&&n>=1&&n<=4?n:null;
  };
  const validClan=clan=>clan==='AVENGERS'||clan==='AV-2'?clan:null;
  function tally(rows){
    const grouped=new Map();
    const rejected={missingRank:0,invalidScope:0,ambiguousRank:0,conflictingAccount:0};
    for(const row of Array.isArray(rows)?rows:[]){
      if(!row||!row.name){rejected.invalidScope++;continue;}
      const clan=validClan(row.clan),flash=validFlash(row.flash);
      const id=String(row.eventId||'').trim();
      if(!clan||flash===null||!id){rejected.invalidScope++;continue;}
      const rank=validPlace(row.rank);
      if(rank===null){rejected.missingRank++;continue;}
      if(rank>3)continue; // A verified non-podium finish, NOT a clan-relative podium.
      const lobby=String(row.lobbyId??row.metadata?.lobbyId??row.metadata?.lobby??row.lobby??'main');
      const key=id+'|'+clan+'|'+lobby;
      const group=grouped.get(key)||[];
      group.push({player:String(row.name),clan,flash,rank,eventId:id,lobby});
      grouped.set(key,group);
    }
    const hits=[];
    for(const group of grouped.values()){
      // If multiple distinct people hold #1/#2/#3 in a lobby with no trustworthy
      // lobby distinction, the source does not prove *which* person has that place.
      const byRank=new Map(),byPlayer=new Map();
      for(const item of group){
        const atRank=byRank.get(item.rank)||new Set();atRank.add(item.player);byRank.set(item.rank,atRank);
        const atPlayer=byPlayer.get(item.player)||new Set();atPlayer.add(item.rank);byPlayer.set(item.player,atPlayer);
      }
      for(const item of group){
        if(byRank.get(item.rank).size>1){rejected.ambiguousRank++;continue;}
        if(byPlayer.get(item.player).size>1){rejected.conflictingAccount++;continue;}
        if(!hits.some(r=>r.eventId===item.eventId&&r.clan===item.clan&&r.lobby===item.lobby&&r.player===item.player))
          hits.push(item);
      }
    }
    const memberMap=new Map();
    const perFlash=[1,2,3,4].map(flash=>({flash,wins:0,secondPlaces:0,thirdPlaces:0,podiums:0}));
    const overall={wins:0,secondPlaces:0,thirdPlaces:0,podiums:0};
    for(const {player,clan,flash,rank,eventId,lobby} of hits){
      const key=clan+'|'+player;
      const item=memberMap.get(key)||{player,clan,wins:0,secondPlaces:0,thirdPlaces:0,podiums:0,
        flashes:[1,2,3,4].map(f=>({flash:f,wins:0,secondPlaces:0,thirdPlaces:0,podiums:0}))};
      const label=rank===1?'wins':rank===2?'secondPlaces':'thirdPlaces';
      for(const dst of [item,item.flashes[flash-1],perFlash[flash-1],overall]){dst[label]++;dst.podiums++;}
      memberMap.set(key,item);
    }
    const members=[...memberMap.values()].sort((a,b)=>b.podiums-a.podiums||b.wins-a.wins||
      b.secondPlaces-a.secondPlaces||b.thirdPlaces-a.thirdPlaces||a.player.localeCompare(b.player)||a.clan.localeCompare(b.clan));
    return {members,perFlash,overall,source:{verifiedPlacements:hits.length,...rejected}};
  }
  const api=Object.freeze({tally,validPlace});
  if(root)root.AVENGERS_PIGGY_FLASH_PODIUMS=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?null:window);
