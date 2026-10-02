(function(){
  'use strict';
  const DATA=window.AVENGERS_PIGGY_FLASH_DATA=window.AVENGERS_PIGGY_FLASH_DATA||{events:[]};

  // AV-2 Piggy Flash rows from the AV-2 Discord review PDF.
  // Additive only: existing AVENGERS entries are preserved.
  const additions={
    'PF1-2026-09-28':[
      {name:'AV-KitKat',rank:1,lines:1207,stars:18430,sparks:1843,clan:'AV-2'}
    ],
    'PF1-2026-09-22':[
      {name:'AV-Vadik-UA',rank:1,lines:1599,stars:29640,sparks:2964,clan:'AV-2'},
      {name:'AV-KitKat',rank:2,lines:1012,stars:26676,sparks:2668,clan:'AV-2'},
      {name:'AV-HECKTO',rank:4,lines:97,stars:14620,sparks:1432,clan:'AV-2'}
    ],
    'PF2-2026-09-22':[
      {name:'AV-TigerMx',rank:1,lines:1988,stars:118034,sparks:11903,clan:'AV-2'},
      {name:'AV-Vadik-UA',rank:3,lines:1202,stars:95227,sparks:9523,clan:'AV-2'}
    ]
  };

  Object.entries(additions).forEach(([id,rows])=>{
    const ev=(DATA.events||[]).find(e=>e.id===id);
    if(!ev) return;
    ev.entries=ev.entries||[];
    rows.forEach(r=>{
      const exists=ev.entries.some(x=>x && x.name===r.name && x.clan==='AV-2' && Number(x.rank)===Number(r.rank));
      if(!exists) ev.entries.push(r);
    });
    const note='AV-2 rows appended from AV-2 Discord review PDF; existing AVENGERS entries preserved.';
    ev.coverage=ev.coverage?ev.coverage+' '+note:note;
  });
})();