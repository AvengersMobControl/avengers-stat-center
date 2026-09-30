(function(){
  'use strict';

  // Authoritative AVENGERS roster supplied 2026-09-29.
  // Columns: Member, A/I, UTC, TZG, State, Location.
  // TZG is explicitly defined by the clan as one of three groups (1/2/3);
  // do not derive TZG from UTC.
  const tsv=`Member\tA / I\tUTC\tTZG\tState\tLocation
AV#Rafa#Tun\tActive\t1\t2\t\tTunisia
AV.Saberkong\tActive\t-4\t1\tIN\tUSA-Eastern DST
AV<STAR-LORD>\tActive\t-5\t1\tLA\tUSA-Central DST
AV-7-STAR\tActive\t5\t3\t\tPakistan
AV-8!l...Bil\tActive\t3\t2\t\tLebanon
AV-Abu//npjp\tActive\t9\t3\t\tJapan
AV-Addicted\tActive\t-4\t1\t\tCanada - Ontario
AV-Animosity\tActive\t-4\t1\tNJ\tUSA-Eastern DST
AV-BigPapi\tActive\t-4\t1\t\tUSA-Eastern DST
AV-Bubba0816\tActive\t-4\t1\tVA\tUSA-Eastern DST
AV-CHEN1972\tActive\t8\t3\t\tTaiwan
AV-Chuck\tActive\t-5\t1\t\tUSA-Central DST
AV-ColdCreeps\tActive\t-4\t1\t\tUSA-Eastern DST
AV-DaG\tActive\t2\t2\t\tSwitzerland
AV-Derya\tActive\t2\t2\t\tGermany
AV-Deviantdan\tActive\t-7\t1\t\tUSA-Pacific DST
AV-EXCALIBUR\tActive\t-4\t1\t\tCanada - Ontario
AV-Finnie\tActive\t1\t2\t\tEngland
AV-GreenZombie\tActive\t2\t2\t\tGermany
AV-HarryBallsagna\tActive\t-5\t1\tNE\tUSA-Central DST
AV-HN\tActive\t-3\t1\t\tBrazil
AV-hoops-SCT\tActive\t1\t2\t\tScotland
AV-I.S.O\tActive\t3\t2\t\tSaudi Arabia
AV-INTEN\tActive\t8\t3\t\tTaiwan
AV-J\tActive\t7\t3\t\tVietnam
AV-JeffKintz05\tActive\t8\t3\t\tPhilippines
AV-JIM\tActive\t10\t3\t\tAustralia
AV-Megalodon\tActive\t-4\t1\t\tCanada - Ontario
AV-Mendoria\tActive\t2\t2\t\tGermany
AV-MONSTER\tActive\t5.5\t3\t\tIndia
AV-MotherboardBeans\tActive\t-5\t1\tMO\tUSA-Central DST
AV-Mr.Mar.Berry\tActive\t-6\t1\tMI\tUSA-Mountain
AV-neez\tActive\t-6\t1\tAZ\tUSA-Mountain
AV-Nicefellow\tActive\t-5\t1\t\tUSA-Central DST
AV-no\tActive\t-4\t1\t\tUSA-Eastern DST
AV-Obajoba\tActive\t0\t2\t\tIceland
AV-Pablin\tActive\t-3\t1\t\tArgentina
AV-RkHendrix\tActive\t-6\t1\t\tMexico
AV-SB\tActive\t-5\t1\tTX\tUSA-Central DST
AV-SiFra\tActive\t5.5\t3\t\tIndia
AV-SMILINGBANDIT\tActive\t-4\t1\t\tUSA-Eastern DST
AV-Supreeth\tActive\t5.5\t3\t\tIndia
AV-TheOli\tActive\t-6\t1\tTX\tUSA-Mountain
AV-UANGELES\tActive\t-7\t1\t\tUSA-Pacific DST
AV-WolfLegend\tActive\t5.5\t3\t\tIndia
AV-ZIBBY\tActive\t-4\t1\t\tUSA-Eastern DST
AV-ZolikaLoveKira\tActive\t2\t2\t\tNetherlands
AngelDoll\tAV2\t\t\t\t
AV-Adigarian\tAV2\t3\t2\t\tIsrael
AV-Caklet\tAV2\t7\t3\t\tIndonesia
AV-CLJM\tAV2\t-6\t1\t\tMexico
AV-CRISPIN.97\tAV2\t-6\t1\t\tMexico
AV-DrDetroit\tAV2\t-4\t1\t\tUSA-Eastern DST
AV-EventHorizon\tAV2\t-4\t1\t\tUSA-Eastern DST
AV-GNSK\tAV2\t9\t3\t\tJapan
AV-HECKTO\tAV2\t9\t3\t\tKorea
AV-Jess-PT\tAV2\t1\t2\t\tPortugal
AV-JOKER\tAV2\t5\t3\t\tPakistan
AV-KiraLoveZolika\tAV2\t1\t2\t\tNetherlands
AV-KitKat\tAV2\t2\t2\t\tNetherlands
AV-KO\tAV2\t\t\t\t
AV-LEO\tAV2\t5.5\t3\t\tIndia
AV-LittleZ\tAV2\t\t\t\t
AV-OblivX\tAV2\t8\t3\t\tSingapore
AV-Starred\tAV2\t-4\t1\t\tUSA-Eastern DST
AV-TigerMx\tAV2\t-4\t1\t\tUSA-Eastern DST
AV-Vadik-UA\tAV2\t2\t2\t\tUkraine
Basecreature\tAV2\t\t\t\t
DedHed\tAV2\t\t\t\t
Foot Slammed\tAV2\t\t\t\t
AV-(SP)gaby\tInactive\t\t\t\t
AV-67\tInactive\t\t\t\t
AV-AG\tInactive\t4\t2\t\tUAE
AV-Ajnabi\tInactive\t5.5\t3\t\tIndia
AV-Anamiko\tInactive\t5\t3\t\tRussia
AV-Andre-DE\tInactive\t2\t2\t\tGermany
AV-ANITTAfan\tInactive\t-3\t1\t\tBrazil
AV-AP\tInactive\t\t\t\t
AV-AresS\tInactive\t3\t2\t\tEgypt
AV-Attila-AZE\tInactive\t4\t2\t\tAzerbaijan
AV-BaBaVooS\tInactive\t-3\t1\t\tBrazil
AV-BEEN\tInactive\t9\t3\t\tKorea
AV-BeerMan\tInactive\t-5\t1\t\tUSA-Central DST
AV-BlackPearl\tInactive\t1\t2\t\tNetherlands
AV-BLISTER\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-BudzyQ\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-BX1\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-CC\tInactive\t8\t3\t\tMalaysia
AV-COCO\tInactive\t8\t3\t\tPhilippines
AV-CR7\tInactive\t7\t3\t\tIndonesia
AV-Dareyou!\tInactive\t-5\t1\t\tUSA-Central DST
AV-Dih\tInactive\t5.75\t3\t\tNepal
AV-DuluDaniels\tInactive\t\t\t\t
AV-EatSleepPlay\tInactive\t8\t3\t\tSingapore
AV-ELMINKYA\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-EvolvedEclipse\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-Fatman.69\tInactive\t\t\t\t
AV-FeniXistential\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-FrenchieUSA\tInactive\t-4\t1\tGA\tUSA-Eastern DST
AV-Garou\tInactive\t-3\t1\t\tChile
AV-HarleyBob\tInactive\t\t\t\t
AV-HarveySpecter\tInactive\t2\t2\t\tGermany
AV-INDIA-VIVEK\tInactive\t5.5\t3\t\tIndia
AV-INFINITY\tInactive\t5.5\t3\t\tIndia
AV-InvincibleSpy\tInactive\t5.5\t3\t\tIndia
AV-Ironeagle\tInactive\t-5\t1\t\tUSA-Central DST
AV-JACK\tInactive\t5.5\t3\t\tIndia
AV-jacko\tInactive\t8\t3\t\tTaiwan
AV-jacko-mini\tInactive\t8\t3\t\tTaiwan
AV-JAKE\tInactive\t-10\t1\t\tUSA-Hawaii ST
AV-Jay\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-kent\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-Kerowyn\tInactive\t-6\t1\t\tUSA-Pacific DST
AV-KNAVEN\tInactive\t\t\t\t
AV-KnightRider\tInactive\t-6\t1\t\tUSA-Pacific DST
AV-LeoMessi10\tInactive\t\t\t\t
AV-Leon\tInactive\t1\t2\t\tSwitzerland
AV-LiamUSA\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-LuckY\tInactive\t5.5\t3\t\tIndia
AV-ManChan\tInactive\t5.5\t3\t\tIndia
AV-March\tInactive\t\t\t\t
AV-MARCO\tInactive\t\t\t\t
AV-Marlon\tInactive\t-3\t1\t\tBrazil
AV-Morikila\tInactive\t1\t2\t\tAlgeria
AV-Morre\tInactive\t1\t2\t\tSweden
AV-MTBlue\tInactive\t\t\t\t
AV-M-usa\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-PanCake\tInactive\t1\t2\t\tNetherlands
AV-Perhaps\tInactive\t\t\t\t
AV-PuffyMufflin\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-Punisher\tInactive\t3\t2\t\tSaudi Arabia
AV-Push-Ups\tInactive\t\t\t\t
AV-Raj\tInactive\t5.5\t3\t\tIndia
AV-Ratman\tInactive\t1\t2\t\tEngland
AV-ReMit\tInactive\t5.5\t3\t\tIndia
AV-Rex\tInactive\t3\t2\t\tQatar
AV-Robcorp\tInactive\t10\t3\t\tAustralia
AV-Rocket!!!\tInactive\t-7\t1\t\tUSA-Pacific DST
AV-Rojotonyo\tInactive\t1\t2\t\tSpain
AV-SHAH-G\tInactive\t5\t3\t\tPakistan
AV-Shekab\tInactive\t5.5\t3\t\tIndia
AV-Spectris\tInactive\t2\t2\t\tCyprus
AV-SPP\tInactive\t5.5\t3\t\tIndia
AV-STI44ERS\tInactive\t-5\t1\t\tUSA-Central DST
AV-SupperMan\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-Suwair\tInactive\t3\t2\t\tQatar
AV-Suwako\tInactive\t9\t3\t\tKorea
AV-SweetiePL\tInactive\t2\t2\t\tPoland
AV-TheGreatCor\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-TiK$oN$\tInactive\t2\t2\t\tPoland
AV-Tornado\tInactive\t1\t2\t\tEngland
AV-TwirpSlayer\tInactive\t-4\t1\t\tCanada - Ontario
AV-tyranitatay\tInactive\t\t\t\t
AV-VaDoS\tInactive\t2\t2\t\tUkraine
AV-Warrior\tInactive\t5.75\t3\t\tNepal
AV-WeaponX\tInactive\t-4\t1\t\tUSA-Eastern DST
AV-ZongXi\tInactive\t8\t3\t\tTaiwan
Iam\tInactive\t-5\t1\t\tUSA-Central DST
IrmaFerkengerd\tInactive\t-4\t1\t\tUSA-Eastern DST
Malik\tInactive\t3\t2\t\tSaudi Arabia
Noob\tInactive\t\t\t\t
SOLOLEVEL\tInactive\t\t\t\t
tgves\tInactive\t2\t2\t\tRomania`;

  const lines=tsv.split(/\r?\n/);
  const rows=lines.slice(1).filter(Boolean).map(line=>{
    const [name,status,utcRaw,tzgRaw,state='',location='']=line.split('\t');
    const utc=utcRaw===''?null:Number(utcRaw);
    const tzg=tzgRaw===''?null:Number(tzgRaw);
    return {name,status,utc,tzg,state,location};
  });

  const formatUtc=value=>{
    if(value==null||value==='')return '';
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
  rows.forEach(row=>{
    const item={
      sourceName:row.name,
      canonicalName:row.name,
      status:row.status,
      utc:row.utc,
      utcLabel:formatUtc(row.utc),
      timeZoneGroup:row.tzg==null?'':String(row.tzg),
      state:row.state||'',
      location:row.location||''
    };
    byName[row.name]=item;
  });

  // Historical/stat-center aliases that should resolve back to the roster name above.
  const aliases={
    'AV-J1M':'AV-JIM',
    'AV-Hoops':'AV-hoops-SCT',
    'AV-BlueWave':'AV-GreenZombie',
    'AV-Zolika.x.Kira':'AV-ZolikaLoveKira',
    'AV-Atilla':'AV-Attila-AZE',
    'AV-InvinsibleSpy':'AV-InvincibleSpy'
  };
  Object.entries(aliases).forEach(([alias,source])=>{
    if(byName[source]) byName[alias]=byName[source];
  });

  window.AVENGERS_MEMBER_TIMEZONES={
    source:'Authoritative AVENGERS roster supplied 2026-09-29',
    precedence:'This roster controls current status, UTC, TZG, State, and Location. TZG is never derived from UTC.',
    rows,
    byName,
    formatUtc
  };
})();
