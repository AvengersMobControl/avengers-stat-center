(function(){
  'use strict';

  const rows=[
    ['AV#Rafa#Tun',1,'Tunisia'],
    ['AV<STAR-LORD>',-5,'USA-Central DST'],
    ['AV-7-STAR',5,'Pakistan'],
    ['AV-Adigarian',2,'Israel'],
    ['AV-Attila-AZE',4,'Azerbaijan'],
    ['AV-BaBaVooS-BRA',-3,'Brazil'],
    ['AV-BabyZero',5.5,'India'],
    ['AV-BLISTER-USA',-4,'USA-Eastern DST'],
    ['AV-CC',8,'Malaysia'],
    ['AV-CHEN1972',8,'Taiwan'],
    ['AV-CRISPIN.97-MEX',-6,'Mexico'],
    ['AV-DaG',2,'Switzerland'],
    ['AV-DrDetroit-USA',-4,'USA-Eastern DST'],
    ['AV-EventHorizon',-4,'USA-Eastern DST'],
    ['AV-EvolvedEclipse',-4,'USA-Eastern DST'],
    ['AV-FeniXistential',-4,'USA-Eastern DST'],
    ['AV-Finnie',1,'England'],
    ['AV-FrenchieUSA',-4,'USA-Atlantic'],
    ['AV-GNSK-JPN',9,'Japan'],
    ['AV-hoops-SCT',1,'Scotland'],
    ['AV-I.S.O',3,'Saudi Arabia'],
    ['AV-INTEN',8,'Taiwan'],
    ['AV-InvincibleSpy',5.5,'India'],
    ['AV-jacko-TWN',8,'Taiwan'],
    ['AV-Jess-PT',0,'Portugal'],
    ['AV-JIM',10,'Australia'],
    ['AV-KitKat',1,'Netherlands'],
    ['AV-LiamUSA',-4,'USA-Eastern DST'],
    ['AV-MONSTER',5.5,'India'],
    ['AV-Mr.Mar.Berry',-6,'USA-Mountain'],
    ['AV-OblivX',8,'Singapore'],
    ['AV-Punisher',3,'Saudi Arabia'],
    ['AV-Ratman',1,'England'],
    ['AV-RkHendrix-MX',-6,'Mexico'],
    ['AV-Robcorp-AUS',10,'Australia'],
    ['AV-Rocket!!!',-7,'USA-Pacific DST'],
    ['AV-Shadow',-4,'USA-Eastern DST'],
    ['AV-SaddamMiser',-5,'USA-Central DST'],
    ['AV-SMILINGBANDIT',-4,'USA-Eastern DST'],
    ['AV-Supreeth',5.5,'India'],
    ['AV-Tin-VNM',7,'Vietnam'],
    ['AV-UANGELES',-6,'USA-Mountain'],
    ['AV-Vadik-UA',2,'Ukraine'],
    ['JACK...RK',5.5,'India'],
    ['JOKER',5,'Pakistan'],
    ['SM-JustSomeGuy',-5,'USA-Central DST']
  ];

  const aliases=new Map([
    ['AV-SaddamMiser','AV-HarryBallsagna'],
    ['AV-JIM','AV-J1M'],
    ['AV-hoops-SCT','AV-Hoops'],
    ['AV-GNSK-JPN','AV-GNSK'],
    ['AV-RkHendrix-MX','AV-RkHendrix'],
    ['AV-Robcorp-AUS','AV-Robcorp'],
    ['AV-DrDetroit-USA','AV-DrDetroit'],
    ['AV-CRISPIN.97-MEX','AV-CRISPIN.97'],
    ['AV-BLISTER-USA','AV-BLISTER'],
    ['AV-Tin-VNM','AV-TiN'],
    ['AV-jacko-TWN','AV-jacko'],
    ['AV-MONSTER','AV-MONSTER.'],
    ['AV-LiamUSA','AV-Liam'],
    ['AV-Vadik-UA','AV-Vadik'],
    ['AV-Attila-AZE','AV-Atilla'],
    ['AV-InvincibleSpy','AV-InvinsibleSpy']
  ]);

  const formatUtc=value=>{
    const n=Number(value);
    if(!Number.isFinite(n))return '';
    if(n===0)return 'UTC±0';
    const sign=n>0?'+':'−';
    const abs=Math.abs(n);
    const h=Math.floor(abs);
    const mins=Math.round((abs-h)*60);
    return 'UTC'+sign+h+(mins?':'+String(mins).padStart(2,'0'):'');
  };

  const byName={};
  rows.forEach(([sourceName,utc,location])=>{
    const canonical=aliases.get(sourceName)||sourceName;
    const item={
      sourceName,
      canonicalName:canonical,
      utc:Number(utc),
      utcLabel:formatUtc(utc),
      timeZoneGroup:formatUtc(utc),
      location
    };
    byName[sourceName]=item;
    byName[canonical]=item;
  });

  // Keep a few known current-name spellings pointed to the same source row.
  [
    ['AV<STAR-LORD>','AV<STAR-LORD>'],
    ['AV-MONSTER','AV-MONSTER.'],
    ['AV-LiamUSA','AV-Liam'],
    ['AV-Vadik-UA','AV-Vadik'],
    ['AV-Attila-AZE','AV-Atilla'],
    ['AV-DrDetroit-USA','AV-DrDetroit'],
    ['AV-CRISPIN.97-MEX','AV-CRISPIN.97'],
    ['AV-BLISTER-USA','AV-BLISTER']
  ].forEach(([from,to])=>{
    if(byName[from])byName[to]=byName[from];
  });

  window.AVENGERS_MEMBER_TIMEZONES={
    source:'Avengers Scorelog_added_3_races.xlsx — Avengers Members',
    byName,
    formatUtc
  };
})();
