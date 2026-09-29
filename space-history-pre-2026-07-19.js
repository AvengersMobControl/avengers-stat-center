(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D||!D.space) return;

  const events={
    '2026-07-09':[
      {group:1,rank:1,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:145.5,stars:704405,sparks:70440,share:.25},
      {group:1,rank:2,name:'AV-INTEN',username:'AV-INTEN',yearsB:104.1,stars:563524,sparks:56352,share:.20},
      {group:1,rank:3,name:'AV-J',username:'AV-J',yearsB:72.1,stars:507172,sparks:50717,share:.18},
      {group:1,rank:4,name:'AV-COCO',username:'AV-COCO',yearsB:71.2,stars:338114,sparks:33811,share:.12},
      {group:1,rank:5,name:'AV-FrenchieUSA',username:'AV-Frenchie(-4)',yearsB:55.9,stars:281762,sparks:28176,share:.10},
      {group:1,rank:6,name:'AV-Deviantdan',username:'AV-DeviantDan',yearsB:43.1,stars:225410,sparks:22541,share:.08},
      {group:1,rank:7,name:'AV-Abu//npjp',username:'AV-Abu//npjp',yearsB:39.1,stars:112705,sparks:11270,share:.04},
      {group:1,rank:8,name:'AV-JIM',username:'AV-JIM',yearsB:37.7,stars:56352,sparks:5635,share:.02},
      {group:1,rank:9,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:33.2,stars:28176,sparks:2818,share:.01},

      {group:2,rank:1,name:'AV-HarryBallsagna',username:'AV-HarryBallso…',yearsB:90.0,stars:449592,sparks:44850,share:.25},
      {group:2,rank:2,name:'AV-KitKat',username:'AV-KitKat',yearsB:70.6,stars:359674,sparks:35968,share:.20},
      {group:2,rank:3,name:'AV-8!l...Bil',username:'AV-8!l…Bil',yearsB:66.5,stars:323507,sparks:32371,share:.18},
      {group:2,rank:4,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:64.0,stars:215804,sparks:21581,share:.12},
      {group:2,rank:5,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:41.4,stars:179837,sparks:17984,share:.10},
      {group:2,rank:6,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:19.0,stars:143870,sparks:14387,share:.08},
      {group:2,rank:7,name:'AV<STAR-LORD>',username:'AV/<STAR-LOR…',yearsB:17.7,stars:71935,sparks:7194,share:.04},
      {group:2,rank:8,name:'AV-DaG',username:'AV-DaG',yearsB:17.1,stars:35967,sparks:3597,share:.02},
      {group:2,rank:9,name:'AV-Nicefellow',username:'AV-Nicefellow',yearsB:11.7,stars:17984,sparks:1798,share:.01},

      {group:3,rank:2,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:71.4,stars:176758,sparks:17680,share:.20},

      {group:4,rank:1,name:'AV-SweetiePL',username:'AV-SweetiePL',yearsB:180.0,stars:512176,sparks:51219,share:.253},
      {group:4,rank:2,name:'AV-ZolikaLoveKira',username:'AV-ZolikaLoveK…',yearsB:65.7,stars:409741,sparks:40975,share:.202},
      {group:4,rank:3,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:64.6,stars:368767,sparks:36877,share:.182},
      {group:4,rank:4,name:'AV-JeffKintz05',username:'AV-JefhKintz05',yearsB:42.3,stars:245845,sparks:24585,share:.121},
      {group:4,rank:5,name:'AV-Witch-king',username:'AV-Witch-king',yearsB:40.0,stars:204870,sparks:20487,share:.101},
      {group:4,rank:6,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:22.1,stars:163896,sparks:16390,share:.08},
      {group:4,rank:7,name:'AV-jacko',username:'AV-jacko',yearsB:15.0,stars:81948,sparks:8195,share:.04},
      {group:4,rank:8,name:'AV-no',username:'AV-no',yearsB:9.8,stars:40974,sparks:4097,share:.02}
    ],

    '2026-06-19':[
      {group:1,rank:1,name:'AV-Abu//npjp',username:'AV-Abu//npjp',yearsB:79.6,stars:376452,sparks:37646,share:.25},
      {group:1,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:52.9,stars:301162,sparks:30117,share:.20},
      {group:1,rank:3,name:'AV-Deviantdan',username:'AV-DeviantDan',yearsB:46.1,stars:271046,sparks:27105,share:.18},
      {group:1,rank:4,name:'AV-Nicefellow',username:'AV-Nicefellow',yearsB:42.6,stars:180697,sparks:18070,share:.12},
      {group:1,rank:5,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:34.1,stars:150581,sparks:15058,share:.10},
      {group:1,rank:6,name:'AV-no',username:'AV-no',yearsB:33.2,stars:120465,sparks:12047,share:.08},
      {group:1,rank:7,name:'AV-Starred',username:'AV-Starred',yearsB:22.0,stars:60232,sparks:6023,share:.04},
      {group:1,rank:8,name:'AV-jacko',username:'AV-jacko',yearsB:17.1,stars:30116,sparks:3012,share:.02},
      {group:1,rank:9,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:11.9,stars:15058,sparks:1506,share:.01},

      {group:2,rank:1,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:80.4,stars:255978,sparks:25598,share:.25},
      {group:2,rank:2,name:'AV-ColdCreeps',username:'AV-take.them.out',yearsB:37.7,stars:204782,sparks:20479,share:.20},
      {group:2,rank:3,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:27.1,stars:184304,sparks:18431,share:.18},
      {group:2,rank:4,name:'AV-Animosity',username:'AV-Animosity',yearsB:23.6,stars:122869,sparks:12287,share:.12},
      {group:2,rank:5,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:20.0,stars:102391,sparks:10239,share:.10},
      {group:2,rank:6,name:'AV-Raj',username:'AV-Raj',yearsB:17.0,stars:81913,sparks:8192,share:.08},
      {group:2,rank:7,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:16.9,stars:40956,sparks:4096,share:.04},
      {group:2,rank:8,name:'AV-Anamiko',username:'AV-Anamiko',yearsB:15.6,stars:20478,sparks:2048,share:.02},

      {group:3,rank:1,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:90.4,stars:472780,sparks:47278,share:.25},
      {group:3,rank:2,name:'AV-INTEN',username:'AV-INTEN',yearsB:63.6,stars:378224,sparks:37822,share:.20},
      {group:3,rank:3,name:'AV-8!l...Bil',username:'AV-8!l…Bil',yearsB:60.0,stars:340402,sparks:34040,share:.18},
      {group:3,rank:4,name:'AV-J',username:'AV-J',yearsB:59.3,stars:226934,sparks:22693,share:.12},
      {group:3,rank:5,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:47.4,stars:189112,sparks:18911,share:.10},
      {group:3,rank:6,name:'AV-Suwako',username:'AV-Suwako',yearsB:43.0,stars:151290,sparks:15129,share:.08},
      {group:3,rank:7,name:'AV-DaG',username:'AV-DaG',yearsB:22.9,stars:75645,sparks:7564,share:.04},
      {group:3,rank:8,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:16.1,stars:37822,sparks:3782,share:.02},
      {group:3,rank:9,name:'AV-FIREN',username:'AV-FIREN',yearsB:13.9,stars:18911,sparks:1891,share:.01},

      {group:4,rank:1,name:'AV-HarryBallsagna',username:'AV-HarryBallso…',yearsB:87.2,stars:356405,sparks:35640,share:.25},
      {group:4,rank:2,name:'AV<STAR-LORD>',username:'AV/<STAR-LOR…',yearsB:49.3,stars:285124,sparks:28512,share:.20},
      {group:4,rank:3,name:'AV-OblivX',username:'AV-OblivX',yearsB:37.7,stars:256612,sparks:25661,share:.18},
      {group:4,rank:4,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:31.2,stars:171074,sparks:17107,share:.12},
      {group:4,rank:5,name:'AV-SMILINGBANDIT',username:'AV-SmiLiNgBaN…',yearsB:29.1,stars:142562,sparks:14256,share:.10},
      {group:4,rank:6,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:28.6,stars:114050,sparks:11405,share:.08},
      {group:4,rank:7,name:'AV-Finnie',username:'AV-Finnie',yearsB:23.0,stars:57025,sparks:5702,share:.04},
      {group:4,rank:8,name:'AV-RkHendrix',username:'AV-RkHendrix-…',yearsB:19.9,stars:28512,sparks:2851,share:.02},
      {group:4,rank:9,name:'AV-Tornado',username:'AV-Tornado',yearsB:17.5,stars:14256,sparks:1426,share:.01},

      {group:5,rank:1,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:71.0,stars:409155,sparks:40916,share:.25},
      {group:5,rank:2,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berr…',yearsB:63.5,stars:327324,sparks:32732,share:.20},
      {group:5,rank:3,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:47.3,stars:294592,sparks:29459,share:.18},
      {group:5,rank:4,name:'AV-JeffKintz05',username:'AV-JefhKintz05',yearsB:36.4,stars:196394,sparks:19639,share:.12},
      {group:5,rank:5,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:34.1,stars:163662,sparks:16366,share:.10},
      {group:5,rank:6,name:'AV-GNSK',username:'AV-GNSK',yearsB:33.6,stars:130930,sparks:13093,share:.08},
      {group:5,rank:7,name:'AV-FrenchieUSA',username:'AV-Frenchie(-4)',yearsB:31.6,stars:65465,sparks:6546,share:.04},
      {group:5,rank:8,name:'AV-JIM',username:'AV-JIM',yearsB:26.1,stars:32732,sparks:3273,share:.02},
      {group:5,rank:9,name:'AV-KitKat',username:'AV-KitKat',yearsB:22.1,stars:16366,sparks:1637,share:.01}
    ],

    '2026-06-24':[
      {group:1,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:13.8,stars:54444,sparks:5449,share:.253},

      {group:2,rank:1,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:70.0,stars:213552,sparks:21357,share:.258},
      {group:2,rank:2,name:'AV-ZolikaLoveKira',username:'AV-ZolikaLoveK…',yearsB:40.6,stars:170842,sparks:17085,share:.206},
      {group:2,rank:3,name:'AV-Animosity',username:'AV-Animosity',yearsB:34.9,stars:153758,sparks:15377,share:.185},
      {group:2,rank:4,name:'AV-jacko-mini',username:'AV-jacko-mini',yearsB:30.2,stars:102505,sparks:10251,share:.124},

      {group:3,rank:1,name:'AV-Deviantdan',username:'AV-DeviantDan',yearsB:70.2,stars:361068,sparks:36110,share:.25},
      {group:3,rank:2,name:'AV<STAR-LORD>',username:'AV/<STAR-LOR…',yearsB:69.0,stars:288854,sparks:28888,share:.20},
      {group:3,rank:3,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:48.7,stars:259969,sparks:25999,share:.18},
      {group:3,rank:4,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:37.4,stars:173312,sparks:17333,share:.12},
      {group:3,rank:5,name:'AV-ColdCreeps',username:'AV-take.them.out',yearsB:36.4,stars:144427,sparks:14444,share:.10},
      {group:3,rank:6,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:30.8,stars:115542,sparks:11555,share:.08},

      {group:4,rank:1,name:'AV-DaG',username:'AV-DaG',yearsB:21.4,stars:null,sparks:9075,share:.25,sourceNote:'star reward cropped in source screenshot'},
      {group:4,rank:2,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:20.8,stars:72544,sparks:7260,share:.20},
      {group:4,rank:3,name:'AV-Finnie',username:'AV-Finnie',yearsB:13.2,stars:65290,sparks:6534,share:.18},
      {group:4,rank:4,name:'AV-OblivX',username:'AV-OblivX',yearsB:10.8,stars:43526,sparks:4356,share:.12},
      {group:4,rank:5,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:10.5,stars:36272,sparks:3630,share:.10},
      {group:4,rank:6,name:'AV-RkHendrix',username:'AV-RkHendrix-…',yearsB:9.7,stars:29018,sparks:2904,share:.08},
      {group:4,rank:7,name:'AV-jacko',username:'AV-jacko',yearsB:9.4,stars:14509,sparks:1452,share:.04},
      {group:4,rank:8,name:'AV-Raj',username:'AV-Raj',yearsB:5.7,stars:7254,sparks:726,share:.02},
      {group:4,rank:9,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:5.3,stars:3627,sparks:363,share:.01},

      {group:5,rank:1,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:64.2,stars:313942,sparks:31394,share:.25},
      {group:5,rank:2,name:'AV-8!l...Bil',username:'AV-8!l…Bil',yearsB:64.3,stars:251154,sparks:25115,share:.20},
      {group:5,rank:3,name:'AV-Starred',username:'AV-Starred',yearsB:36.1,stars:226039,sparks:22604,share:.18},
      {group:5,rank:4,name:'AV-Nicefellow',username:'AV-Nicefellow',yearsB:34.1,stars:150692,sparks:15069,share:.12},
      {group:5,rank:5,name:'AV-no',username:'AV-no',yearsB:33.3,stars:125577,sparks:12558,share:.10},
      {group:5,rank:6,name:'AV-BeerMan',username:'AV-BeerMan',yearsB:27.6,stars:100462,sparks:10046,share:.08},
      {group:5,rank:7,name:'AV-HarryBallsagna',username:'AV-HarryBallso…',yearsB:23.1,stars:50231,sparks:5023,share:.04},
      {group:5,rank:8,name:'AV-GNSK',username:'AV-GNSK',yearsB:18.6,stars:25115,sparks:2512,share:.02},
      {group:5,rank:9,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:7.3,stars:12558,sparks:1256,share:.01},

      {group:6,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:57.8,stars:262300,sparks:26232,share:.25},
      {group:6,rank:2,name:'AV-JeffKintz05',username:'AV-JefhKintz05',yearsB:40.6,stars:209840,sparks:20985,share:.20},
      {group:6,rank:3,name:'AV-Suwako',username:'AV-Suwako',yearsB:40.0,stars:188856,sparks:18887,share:.18},
      {group:6,rank:4,name:'AV-Abu//npjp',username:'AV-Abu//npjp',yearsB:37.4,stars:125904,sparks:12591,share:.12},
      {group:6,rank:5,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:20.5,stars:104920,sparks:10493,share:.10},
      {group:6,rank:6,name:'AV-J',username:'AV-J',yearsB:20.2,stars:83936,sparks:8394,share:.08},
      {group:6,rank:7,name:'AV-JIM',username:'AV-JIM',yearsB:16.8,stars:41968,sparks:4197,share:.04},
      {group:6,rank:8,name:'AV-Anamiko',username:'AV-Anamiko',yearsB:8.8,stars:20984,sparks:2099,share:.02},
      {group:6,rank:9,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:3.0,stars:10492,sparks:1049,share:.01}
    ]
  };

  const addHistoricalMember=name=>{
    if((D.members||[]).some(m=>m.name===name)) return;
    D.members.push({
      name,status:'Inactive',piggyPB:0,spacePB:0,krakenPB:0,
      piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,
      rankingScore:0,krakenPBMonth:'',ratingPB:0,ratingAvg:0,
      ratingTotal:0,eventsPlayed:0,totalSparks:0
    });
  };

  Object.values(events).flat().forEach(r=>addHistoricalMember(r.name));

  Object.entries(events).forEach(([date,rows])=>{
    rows.forEach(r=>{
      r.clan='AVENGERS';
      r.status='';
      r.years=Math.round((Number(r.yearsB)||0)*1e9);
    });
    D.space.events[date]=rows;

    rows.forEach(r=>{
      const arr=D.space.history[r.name] || (D.space.history[r.name]=[]);
      const code=date.replace(/-/g,'').slice(2);
      const prior=arr.filter(x=>x.date!==date);
      prior.push({date,code,yearsB:r.yearsB,stars:r.stars,sparks:r.sparks,sourceNote:r.sourceNote||''});
      prior.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      D.space.history[r.name]=prior;
    });
  });

  D.space.historicalSourceNotes=Object.assign({},D.space.historicalSourceNotes||{},{
    '2026-07-09':'Recovered from Discord final-result screenshots; 27 AVENGERS rows.',
    '2026-06-19':'Recovered from Discord final-result screenshots; 44 AVENGERS rows.',
    '2026-06-24':'Recovered from Discord final-result screenshots; one AV-Tornado row is visibly present but its score is cropped, so it was not entered. AV-DaG score/sparks are entered but the star reward is cropped and left unknown.'
  });
})();
