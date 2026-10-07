(function(){
  'use strict';
  const DATA=window.AVENGERS_PIGGY_FLASH_DATA=window.AVENGERS_PIGGY_FLASH_DATA||{events:[]};

  // Full AV-2 Piggy Flash history pulled from the AV-2 Discord results channel.
  // Rows are appended to the matching Flash event but retain explicit AV-2 event-time clan.
  const patches={
    'PF1-2026-09-22':{
      potStars:287210,potDisplay:'287.21K',messageIds:['1551919368580108371'],
      rows:[
        {name:'AV-Vadik-UA',rank:1,lines:1599,stars:29640,sparks:2964},
        {name:'AV-KitKat',rank:2,lines:1012,stars:26676,sparks:2668},
        {name:'AV-HECKTO',rank:4,lines:97,stars:14820,sparks:1482}
      ]
    },
    'PF2-2026-09-22':{
      potStars:1180000,potDisplay:'1.18M',messageIds:['1552014728342143058'],
      rows:[
        {name:'AV-TigerMx',rank:1,lines:1988,stars:119034,sparks:11903},
        {name:'AV-Vadik-UA',rank:3,lines:1202,stars:95227,sparks:9523}
      ]
    },
    'PF1-2026-09-28':{
      potStars:178580,potDisplay:'178.58K',messageIds:['1554093192360632450'],
      rows:[{name:'AV-KitKat',rank:1,lines:1297,stars:18430,sparks:1843}]
    },
    'PF1-2026-10-06':{
      potStars:523040,potDisplay:'523.04K',messageIds:['1556992881208729712'],
      rows:[
        {name:'AV-Pablin',rank:1,lines:2274,stars:53036,sparks:5304},
        {name:'AV-SiFra',rank:2,lines:1144,stars:47732,sparks:4774},
        {name:'AV-JeffKintz05',rank:3,lines:1007,stars:42429,sparks:4243},
        {name:'AV-2Lin',rank:5,lines:661,stars:23866,sparks:2387},
        {name:'AV-Fahad',rank:7,lines:103,stars:22805,sparks:2281},
        {name:'TheHemperor',rank:16,lines:45,stars:12729,sparks:1273}
      ]
    },
    'PF2-2026-10-06':{
      potStars:656290,potDisplay:'656.29K',messageIds:['1557084715440144416','1557166707704074281'],
      rows:[
        {name:'AV-Pablin',rank:1,lines:2141,stars:66417,sparks:6642},
        {name:'AV-SiFra',rank:2,lines:1787,stars:59775,sparks:5978},
        {name:'AV-2Lin',rank:3,lines:1493,stars:53133,sparks:5314},
        {name:'AV-JeffKintz05',rank:5,lines:284,stars:29888,sparks:2989},
        {name:'AV-EXCALIBUR',rank:8,lines:229,stars:24574,sparks:2458}
      ]
    },
    'PF3-2026-10-06':{
      potStars:138040,potDisplay:'138.04K',messageIds:['1557173826289274990'],
      rows:[{name:'AV-JeffKintz05',rank:1,lines:264,stars:13914,sparks:1392}]
    },
    'PF4-2026-10-07':{
      potStars:180200,potDisplay:'180.2K',messageIds:['1557291070381891635'],
      rows:[
        {name:'AV-JeffKintz05',rank:1,lines:520,stars:18236,sparks:1824},
        {name:'AV-EXCALIBUR',rank:2,lines:513,stars:16413,sparks:1641}
      ]
    }
  };

  Object.entries(patches).forEach(([id,p])=>{
    const ev=(DATA.events||[]).find(e=>e.id===id);
    if(!ev) return;
    ev.entries=ev.entries||[];
    ev.av2PotStars=p.potStars;
    ev.av2PotStarsDisplay=p.potDisplay;
    ev.av2MessageIds=p.messageIds;
    p.rows.forEach(src=>{
      const row={...src,clan:'AV-2'};
      const existing=ev.entries.find(x=>x && x.name===row.name && String(x.clan||'')==='AV-2' && Number(x.rank)===Number(row.rank));
      if(existing) Object.assign(existing,row);
      else ev.entries.push(row);
    });
    const note='AV-2 rows and AV-2 lobby pot verified from the AV-2 Discord results channel.';
    if(!String(ev.coverage||'').includes(note)) ev.coverage=(ev.coverage?ev.coverage+' ':'')+note;
  });
})();