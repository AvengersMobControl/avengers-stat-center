(function(){
  'use strict';

  // Authoritative location source = the 2026 roster columns (K:N) in
  // Avengers Scorelog_added_3_races.xlsx / Avengers Members.
  // Legacy A:D values are intentionally NOT used as fallback because the
  // 2026 roster data supersedes them.
  const rows=[
    ['AV#Rafa#Tun',1,'Tunisia'],
    ['AV<STAR-LORD>',-5,'USA-Central DST'],
    ['AV-7-STAR',5,'Pakistan'],
    ['AV-Adigarian',2,'Israel'],
    ['AV-Atilla',4,'Azerbaijan'],
    ['AV-BaBaVooS-BRA',-3,'Brazil'],
    ['AV-BabyZero',5.5,'India'],
    ['AV-BLISTER-USA',-4,'USA-Eastern DST'],
    ['AV-CC',8,'Malaysia'],
    ['AV-CHEN1972',8,'Taiwan'],
    ['AV-CRISPIN',-6,'Mexico'],
    ['AV-DaG',2,'Switzerland'],
    ['AV-DrDetroit-USA',-4,'USA-Eastern DST'],
    ['AV-EventHorizon',-4,'USA-Eastern DST'],
    ['AV-EvolvedEclipse',-4,'USA-Eastern DST'],
    ['AV-FeniXistential',-4,'USA-Eastern DST'],
    ['AV-Finnie',1,'England'],
    ['AV-FrenchieUSA',-4,'USA-Atlantic'],
    ['AV-GNSK',9,'Japan'],
    ['AV-hoops-SCT',1,'Scotland'],
    ['AV-I.S.O',3,'Saudi Arabia'],
    ['AV-INTEN',8,'Taiwan'],
    ['AV-InvincibleSpy',5.5,'India'],
    ['AV-jacko',8,'Taiwan'],
    ['AV-Jess-PT',0,'Portugal'],
    ['AV-JIM',10,'Australia'],
    ['AV-KitKat',1,'Netherlands'],
    ['AV-Liam',-4,'USA-Eastern DST'],
    ['AV-MONSTER.',5.5,'India'],
    ['AV-Mr.Mar.Berry',-6,'USA-Mountain'],
    ['AV-OblivX',8,'Singapore'],
    ['AV-Punisher',3,'Saudi Arabia'],
    ['AV-Ratman',1,'England'],
    ['AV-RkHendrix',-6,'Mexico'],
    ['AV-Robcorp',10,'Australia'],
    ['AV-Rocket!!!',-7,'USA-Pacific DST'],
    ['AV-Shadow',-4,'USA-Eastern DST'],
    ['AV-SMILINGBANDIT',-4,'USA-Eastern DST'],
    ['AV-Supreeth',5.5,'India'],
    ['AV-TiN',7,'Vietnam'],
    ['AV-UANGELES',-6,'USA-Mountain'],
    ['AV-Vadik',2,'Ukraine'],
    ['JACK...RK',5.5,'India'],
    ['JOKER',5,'Pakistan'],
    ['SM-JustSomeGuy',-5,'USA-Central DST']
  ];

  // Website naming differs from the 2026 spreadsheet for a few people.
  // These are name translations only; UTC/location always comes from the
  // 2026 row above.
  const siteAliases=new Map([
    ['AV-JIM','AV-J1M'],
    ['AV-hoops-SCT','AV-Hoops'],
    ['AV-MONSTER.','AV-MONSTER'],
    ['AV-Vadik','AV-Vadik-UA'],
    ['AV-CRISPIN','AV-CRISPIN.97'],
    ['AV-DrDetroit-USA','AV-DrDetroit'],
    ['AV-BLISTER-USA','AV-BLISTER'],
    ['AV-Atilla','AV-Attila-AZE'],
    ['AV-Liam','AV-LiamUSA'],
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
    const item={
      sourceName,
      canonicalName:sourceName,
      utc:Number(utc),
      utcLabel:formatUtc(utc),
      timeZoneGroup:formatUtc(utc),
      location
    };
    byName[sourceName]=item;
    const siteName=siteAliases.get(sourceName);
    if(siteName)byName[siteName]=item;
  });

  window.AVENGERS_MEMBER_TIMEZONES={
    source:'Avengers Scorelog_added_3_races.xlsx — Avengers Members K:N (2026 roster source)',
    precedence:'2026 roster values only; legacy A:D is not used as fallback',
    byName,
    formatUtc
  };
})();
