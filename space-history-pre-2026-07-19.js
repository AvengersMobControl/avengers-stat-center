(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D||!D.space) return;

  const events={
    '2026-02-04':[
      {group:1,rank:1,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:36.9},
      {group:1,rank:2,name:'AV-INTEN',username:'AV-INTEN',yearsB:31.4},
      {group:1,rank:3,name:'AV-Andre-DE',username:'AV-Andre<DE>',yearsB:23.6},
      {group:1,rank:4,name:'AV-Push-Ups',username:'AV-Push-Ups',yearsB:22.2},
      {group:1,rank:5,name:'AV-AG',username:'AV-AG',yearsB:19.8},
      {group:1,rank:6,name:'AV-Attila-AZE',username:'AV-Attila',yearsB:15.0},
      {group:1,rank:7,name:'AV-Morre',username:'AV-Morre',yearsB:14.1},
      {group:1,rank:8,name:'AV#Rafa#Tun',username:'AV#Rafa#',yearsB:11.0},
      {group:1,rank:9,name:'AV-MTBlue',username:'AV-MTBlue',yearsB:6.9},

      {group:2,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:37.2},
      {group:2,rank:2,name:'AV-Caklet',username:'AV-Caklet',yearsB:36.5},
      {group:2,rank:3,name:'AV-Ironeagle',username:'AV-Ironeagle',yearsB:26.5},
      {group:2,rank:4,name:'AV-RkHendrix',username:'AV-RkHendrix',yearsB:18.0},
      {group:2,rank:5,name:'AV-LiamUSA',username:'AV-Liam',yearsB:17.2},
      {group:2,rank:6,name:'AV-GNSK',username:'AV-GNSK',yearsB:16.5},

      {group:3,rank:1,name:'AV-M',username:'AV-M',yearsB:53.8},
      {group:3,rank:2,name:'AV-Robcorp',username:'AV-Robcorp',yearsB:38.4},
      {group:3,rank:3,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:31.9},
      {group:3,rank:4,name:'Iam',username:'Iam',yearsB:21.7},
      {group:3,rank:5,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:16.5},
      {group:3,rank:6,name:'AV-DrDetroit',username:'AV-DrDetroit',yearsB:15.1}
    ],

    '2026-02-11':[
      {group:1,rank:1,name:'AV-Caklet',username:'AV-Caklet',yearsB:78.2},
      {group:1,rank:2,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:54.5},
      {group:1,rank:3,name:'AV-M',username:'AV-M',yearsB:52.0},
      {group:1,rank:4,name:'Iam',username:'Iam',yearsB:46.4},
      {group:1,rank:5,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:27.6},
      {group:1,rank:6,name:'AV-tyranitatay',username:'AV-tyranitatay',yearsB:25.4},
      {group:1,rank:7,name:'AV-CRISPIN.97',username:'AV-CRISPIN.27…',yearsB:25.1},
      {group:1,rank:8,name:'AV-KitKat',username:'AV-KitKat',yearsB:14.5},
      {group:1,rank:9,name:'AV-Push-Ups',username:'AV-Push-Ups',yearsB:3.8},

      {group:2,rank:1,name:'AV-WeaponX',username:'AV-WeaponX',yearsB:38.1},
      {group:2,rank:3,name:'AV-AP',username:'AV-AP',yearsB:23.5},
      {group:2,rank:4,name:'AV-JIM80Y',username:'AV-JIM80Y',yearsB:22.4},
      {group:2,rank:5,name:'AV-RkHendrix',username:'AV-RkHendrix',yearsB:17.9},
      {group:2,rank:6,name:'AV-DrDetroit',username:'AV-DrDetroit',yearsB:12.5},

      {group:3,rank:1,name:'AV-HiddenFrenchie',username:'(AV)HiddenFren…',yearsB:12.3},
      {group:4,rank:2,name:'AV#Rafa#Tun',username:'AV#Rafa#',yearsB:11.4},
      {group:5,rank:2,name:'AV-Warrior',username:'AV-Warrior',yearsB:20.7},
      {group:5,rank:3,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:16.0},
      {group:6,rank:1,name:'AV-PanCake',username:'AV-PanCake',yearsB:33.4},
      {group:6,rank:2,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:30.3}
    ],

    '2026-02-22':[
      {group:1,rank:1,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:28.1},

      {group:2,rank:1,name:'AV-AG',username:'AV-AG',yearsB:112.3},
      {group:2,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:75.6},
      {group:2,rank:3,name:'AV-INTEN',username:'AV-INTEN',yearsB:49.6},
      {group:2,rank:4,name:'AV-PanCake',username:'AV-PanCake',yearsB:45.0},
      {group:2,rank:5,name:'AV-JIM80Y',username:'AV-JIM80Y',yearsB:32.8},
      {group:2,rank:6,name:'AV-Spectris',username:'AV-Spectris',yearsB:24.3},

      {group:3,rank:1,name:'AV-LiamUSA',username:'AV-Liam',yearsB:75.7},
      {group:3,rank:2,name:'AV-Andre-DE',username:'AV-Andre<DE>',yearsB:63.2},
      {group:3,rank:3,name:'AV-Warrior',username:'AV-Warrior',yearsB:45.0},
      {group:3,rank:4,name:'AV-Morre',username:'AV-Morre',yearsB:40.8},
      {group:3,rank:5,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:31.5},
      {group:3,rank:6,name:'AV-RkHendrix',username:'AV-RkHendrix',yearsB:24.1},
      {group:3,rank:7,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:14.5},
      {group:3,rank:9,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:11.3}
    ],

    '2026-02-24':[
      {group:1,rank:1,name:'AV-OblivX',username:'AV-OblivX',yearsB:62.3},
      {group:1,rank:2,name:'AV-WeaponX',username:'AV-WeaponX',yearsB:44.7},
      {group:1,rank:3,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:37.6},
      {group:1,rank:4,name:'AV-Attila-AZE',username:'AV-Attila',yearsB:29.1},
      {group:1,rank:5,name:'AV-Vadik-UA',username:'AV-Vadik',yearsB:29.1},
      {group:1,rank:6,name:'AV-TiN',username:'AV-TIN',yearsB:23.2},
      {group:1,rank:7,name:'AV-CRISPIN.97',username:'AV-CRISPIN.27…',yearsB:10.8},
      {group:1,rank:8,name:'AV-MTBlue',username:'AV-MTBlue',yearsB:9.5},
      {group:1,rank:9,name:'AV-JIM80Y',username:'AV-Jim80y',yearsB:9.4},

      {group:2,rank:1,name:'AV-Caklet',username:'AV-Caklet',yearsB:20.3},
      {group:2,rank:2,name:'AV-Jay',username:'AV-Jay',yearsB:18.8},
      {group:2,rank:3,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:10.9},
      {group:2,rank:4,name:'AV#Rafa#Tun',username:'AV#Rafa#',yearsB:10.3},
      {group:2,rank:5,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:9.2},

      {group:3,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:40.5},
      {group:3,rank:2,name:'AV-Andre-DE',username:'AV-Andre<DE>',yearsB:30.9},
      {group:3,rank:3,name:'AV-PanCake',username:'AV-PanCake',yearsB:28.1},
      {group:3,rank:4,name:'AV-Warrior',username:'AV-Warrior',yearsB:24.0},
      {group:3,rank:5,name:'AV-Blister2',username:'AV-Blister2',yearsB:19.5},
      {group:3,rank:6,name:'AV-Spectris',username:'AV-Spectris',yearsB:13.2},
      {group:3,rank:7,name:'tgves',username:'tgves',yearsB:12.2},
      {group:3,rank:8,name:'AV-RkHendrix',username:'AV-RkHendrix',yearsB:12.1}
    ],

    '2026-02-25':[
      {group:1,rank:1,name:'Iam',username:'Iam',yearsB:44.9},
      {group:1,rank:2,name:'AV-M',username:'AV-M',yearsB:33.9},
      {group:1,rank:3,name:'AV-INTEN',username:'AV-INTEN',yearsB:30.7},
      {group:1,rank:4,name:'AV-DrDetroit',username:'AV-DrDetroit',yearsB:14.0},
      {group:1,rank:5,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:13.5},
      {group:1,rank:6,name:'AV-Morre',username:'AV-Morre',yearsB:13.4}
    ],

    '2026-03-03':[
      {group:1,rank:1,name:'AV-FeniXistential',username:'AV-FeniXistential',yearsB:32.1},
      {group:1,rank:2,name:'AV-Andre-DE',username:'AV-Andre',yearsB:28.2},
      {group:1,rank:3,name:'AV-Morre',username:'AV-Morre',yearsB:17.5},
      {group:1,rank:4,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:13.7},
      {group:1,rank:5,name:'Malik',username:'Malik',yearsB:13.0},
      {group:1,rank:6,name:'AV-KitKat',username:'KitKat',yearsB:7.5},
      {group:1,rank:7,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:7.4},

      {group:2,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:44.3},
      {group:2,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:42.5},
      {group:2,rank:3,name:'Iam',username:'Iam',yearsB:40.1},
      {group:2,rank:4,name:'AV-Tin-VNM',username:'AV-TIN-VNM',yearsB:35.4},
      {group:2,rank:5,name:'AV-M-usa',username:'AV-M-usa',yearsB:30.5},
      {group:2,rank:6,name:'AV-OblivX',username:'AV-OblivX',yearsB:27.9},
      {group:2,rank:7,name:'AV-Jay',username:'AV-Jay',yearsB:21.8},
      {group:2,rank:8,name:'AV-CRISPIN.97',username:'AV-CRISPIN.27…',yearsB:9.7},
      {group:2,rank:9,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:1.2},

      {group:3,rank:1,name:'AV-Robcorp',username:'AV-Robcorp-AUS',yearsB:51.0},
      {group:3,rank:2,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:35.3},
      {group:3,rank:3,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:33.0},
      {group:3,rank:4,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:30.3},
      {group:3,rank:5,name:'AV-Warrior',username:'AV-Warrior',yearsB:19.7},
      {group:3,rank:6,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:10.9},
      {group:3,rank:7,name:'AV-MTBlue',username:'AV-MTBlue',yearsB:10.7}
    ],

    '2026-03-06':[
      {group:1,rank:1,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:40.2},
      {group:1,rank:2,name:'AV-RkHendrix',username:'AV-RkHendrix',yearsB:26.4},
      {group:1,rank:3,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:20.6},
      {group:1,rank:4,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:20.6},
      {group:1,rank:5,name:'AV-PanCake',username:'AV-PanCake',yearsB:17.3},
      {group:1,rank:6,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:16.2},
      {group:1,rank:7,name:'tgves',username:'tgves',yearsB:16.1},
      {group:1,rank:8,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:14.3},
      {group:1,rank:9,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:.068},

      {group:2,rank:1,name:'AV-Andre-DE',username:'AV-Andre-DE',yearsB:31.9},
      {group:2,rank:2,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:24.6},
      {group:2,rank:3,name:'AV-FeniXistential',username:'AV-FeniXistential',yearsB:16.0},
      {group:2,rank:4,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:14.9},
      {group:2,rank:5,name:'AV-Morre',username:'AV-Morre',yearsB:13.9},
      {group:2,rank:6,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:11.3},

      {group:3,rank:1,name:'AV-WeaponX',username:'AV-WeaponX',yearsB:45.1},
      {group:3,rank:2,name:'AV-Leon',username:'AV-Leon-CHE',yearsB:29.9},
      {group:3,rank:3,name:'AV-Warrior',username:'AV-Warrior',yearsB:28.9},
      {group:3,rank:4,name:'AV-LiamUSA',username:'AV-Liam-USA',yearsB:27.8},
      {group:3,rank:5,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:19.5},
      {group:3,rank:6,name:'AV-GNSK-JPN',username:'AV-GNSK-JPN',yearsB:12.9},

      {group:4,rank:1,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:44.3},
      {group:4,rank:2,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:43.1},
      {group:4,rank:3,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:41.7},
      {group:4,rank:4,name:'AV-INTEN',username:'AV-INTEN',yearsB:41.6},
      {group:4,rank:5,name:'Iam',username:'Iam',yearsB:41.6},
      {group:4,rank:6,name:'AV-M-usa',username:'AV-M-usa',yearsB:40.6},

      {group:5,rank:1,name:'AV-OblivX',username:'AV-OblivX',yearsB:25.3}
    ],

    '2026-03-11':[
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:40.2},
      {group:1,rank:2,name:'AV-PanCake',username:'AV-PanCake',yearsB:30.0},
      {group:1,rank:3,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:26.7},
      {group:1,rank:4,name:'AV-FeniXistential',username:'AV-FeniXistential',yearsB:20.0},
      {group:1,rank:5,name:'AV-OblivX',username:'AV-OblivX',yearsB:19.8},
      {group:1,rank:6,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:17.7},
      {group:1,rank:7,name:'AV-Morre',username:'AV-Morre',yearsB:16.6},
      {group:1,rank:8,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:7.2},
      {group:1,rank:9,name:'AV-TiKsON
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:71.5,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'}
    ],

    '2026-04-02':[
      {group:1,rank:5,name:'AV-Phoenix',username:'AV-Phoenix',yearsB:19.4,sourceNote:'Highlighted owner row from Phoenix Discord post; historical display name is truncated in the screenshot.'}
    ],

    '2026-04-03':[
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:56.3,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'},
      {group:2,rank:1,name:'AV-M-usa',username:'AV-M-usa',yearsB:22.6,sourceNote:'Highlighted owner row from M-usa Discord post.'},
      {group:3,rank:7,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:6.6,sourceNote:'Highlighted owner row from Rafa Discord post.'}
    ],

    '2026-04-08':[
      {group:1,rank:4,name:'AV-JIM',username:'AV-JIM',yearsB:19.9,sourceNote:'Highlighted owner row from JIM Discord post. Rafa post on 4/8 is an exact repost of the 4/3 leaderboard and was not duplicated.'}
    ],

    '2026-04-11':[
      {group:0,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:114.1,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'},
      {group:1,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:49.2},
      {group:1,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:48.7},
      {group:1,rank:3,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:47.5},
      {group:1,rank:4,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:36.9},
      {group:1,rank:5,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:29.4},
      {group:1,rank:6,name:'AV-RkHendrix',username:'AV-RkHendrix…',yearsB:28.4},
      {group:1,rank:7,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:27.0},
      {group:1,rank:8,name:'AV-VoDoS',username:'AV-VoDoS',yearsB:15.4},
      {group:1,rank:9,name:'JOKER',username:'JOKER',yearsB:13.4},

      {group:2,rank:1,name:'AV-Andre-DE',username:'AV-Andre-DE',yearsB:75.6},
      {group:2,rank:2,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:67.6},
      {group:2,rank:3,name:'AV-Tin-VNM',username:'AV-Tin-VNM',yearsB:57.1},
      {group:2,rank:4,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:36.7},
      {group:2,rank:5,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:27.7},
      {group:2,rank:6,name:'AV-67',username:'AV-67',yearsB:25.9},
      {group:2,rank:7,name:'AV-Ajnabi',username:'AV-Ajnabi',yearsB:25.7},
      {group:2,rank:8,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:23.7},
      {group:2,rank:9,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:21.9},

      {group:3,rank:1,name:'AV-Vadik-UA',username:'AV-Vadik-UA',yearsB:34.7},

      {group:4,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:108.7},
      {group:4,rank:2,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:65.8},
      {group:4,rank:3,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:44.9},
      {group:4,rank:4,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:41.1},
      {group:4,rank:5,name:'AV-JIM',username:'AV-JIM',yearsB:34.8},
      {group:4,rank:6,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:24.1},
      {group:4,rank:7,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:19.7},
      {group:4,rank:8,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:19.5}
    ],

    '2026-04-19':[
      {group:1,rank:1,name:'AV-CRISPIN.97',username:'AV-CRISPIN.97…',yearsB:60.5},
      {group:1,rank:3,name:'AV-BlackPearl',username:'AV-BlackPearl…',yearsB:18.6},
      {group:1,rank:4,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:10.1},

      {group:2,rank:1,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:70.0},
      {group:2,rank:2,name:'AV-Tin',username:'AV-Tin',yearsB:56.0},
      {group:2,rank:3,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:38.7},
      {group:2,rank:4,name:'AV-M-usa',username:'AV-M-usa',yearsB:31.5},
      {group:2,rank:5,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:30.6},
      {group:2,rank:6,name:'AV-JIM',username:'AV-JIM',yearsB:27.8},
      {group:2,rank:7,name:'AV-INTEN',username:'AV-INTEN',yearsB:25.0},
      {group:2,rank:8,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:18.2},
      {group:2,rank:9,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:14.6},

      {group:3,rank:1,name:'Iam',username:'Iam',yearsB:57.8},
      {group:3,rank:2,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:43.1},
      {group:3,rank:3,name:'AV-GNSK-JPN',username:'AV-GNSK-JPN',yearsB:40.4},
      {group:3,rank:4,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:20.0},
      {group:3,rank:5,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:18.8},
      {group:3,rank:6,name:'AV-KitKat',username:'AV-KitKat',yearsB:16.0},
      {group:3,rank:8,name:'AV-Vadik-UA',username:'AV-Vadik-UA',yearsB:2.2}
    ],

    '2026-04-29':[
      {group:1,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:80.3},
      {group:1,rank:2,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:39.2},
      {group:1,rank:3,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:38.7},
      {group:1,rank:4,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:37.7},
      {group:1,rank:5,name:'AV-GNSK',username:'AV-GNSK',yearsB:29.1},
      {group:1,rank:6,name:'AV-DaG',username:'AV-DaG',yearsB:24.6},

      {group:2,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:71.2},
      {group:2,rank:3,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:29.4},
      {group:2,rank:4,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:24.2},
      {group:2,rank:5,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:23.5},
      {group:2,rank:6,name:'AV-CRISPIN.97',username:'AV-CRISPIN.97…',yearsB:21.4},
      {group:2,rank:7,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:19.8},
      {group:2,rank:8,name:'AV-EvolvedEclipse',username:'AV-EvolvedEcli…',yearsB:19.0},
      {group:2,rank:9,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:6.0},

      {group:3,rank:1,name:'AV-Tin',username:'AV-Tin',yearsB:70.6},
      {group:3,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:57.7},
      {group:3,rank:3,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:38.2},
      {group:3,rank:5,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:21.0},
      {group:3,rank:6,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:20.5},
      {group:3,rank:7,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:18.2},

      {group:4,rank:1,name:'AV-JustSomeGuy',username:'AV-JustSomeGuy',yearsB:64.7},
      {group:4,rank:4,name:'BabyZerO',username:'BabyZerO',yearsB:11.4},
      {group:4,rank:7,name:'AV-Ratman',username:'AV-Ratman',yearsB:2.7}
    ],

    '2026-05-06':[
      {group:1,rank:1,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:50.0},
      {group:1,rank:2,name:'AV-Shells.Ani',username:'AV-Shells.Ani',yearsB:40.0},
      {group:1,rank:3,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:33.5},
      {group:1,rank:4,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:28.0},
      {group:1,rank:5,name:'AV-SMILINGBANDIT',username:'AV-SMILINGBA…',yearsB:19.5},
      {group:1,rank:6,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:18.0},
      {group:1,rank:7,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:14.6},
      {group:1,rank:8,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berr…',yearsB:11.7},

      {group:2,rank:1,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:49.6},
      {group:2,rank:2,name:'AV-BlackPearl',username:'AV-BlackPearl…',yearsB:34.5},
      {group:2,rank:3,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:29.4},
      {group:2,rank:4,name:'AV-KitKat',username:'AV-KitKat',yearsB:24.7},
      {group:2,rank:5,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:22.9},
      {group:2,rank:6,name:'AV-GNSK',username:'AV-GNSK',yearsB:12.1},
      {group:2,rank:7,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:11.8},
      {group:2,rank:8,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:10.9},

      {group:3,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:71.0},
      {group:3,rank:2,name:'AV-HarryBallsagna',username:'AV-HarryBalls…',yearsB:57.5},
      {group:3,rank:3,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:56.3},
      {group:3,rank:4,name:'AV-JACK',username:'AV-JACK',yearsB:30.4},
      {group:3,rank:5,name:'AV-JIM',username:'AV-JIM',yearsB:26.3},
      {group:3,rank:6,name:'AV-J',username:'AV-J',yearsB:23.4},
      {group:3,rank:7,name:'AV-Starred',username:'AV-Starred',yearsB:15.7},
      {group:3,rank:8,name:'AV-RkHendrix',username:'AV-RkHendrix-…',yearsB:13.2},
      {group:3,rank:9,name:'AV-jacko',username:'AV-jacko',yearsB:5.0},

      {group:4,rank:1,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:76.2},
      {group:4,rank:2,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:75.1},
      {group:4,rank:3,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:33.5},
      {group:4,rank:4,name:'AV-DaG',username:'AV-DaG',yearsB:29.1},
      {group:4,rank:5,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:27.7},
      {group:4,rank:6,name:'AV-OblivX',username:'AV-OblivX',yearsB:27.3},
      {group:4,rank:7,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:19.0},
      {group:4,rank:8,name:'AV-Caklet',username:'AV-Caklet',yearsB:8.4},
      {group:4,rank:9,name:'JOKER',username:'JOKER',yearsB:5.4},

      {group:5,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:10.1}
    ],

    '2026-05-14':[
      {group:1,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:57.8},
      {group:1,rank:2,name:'AV.Saberkong',username:'AV.Saberkong',yearsB:45.8},
      {group:1,rank:3,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:36.5},
      {group:1,rank:4,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:32.5},
      {group:1,rank:5,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:24.1},
      {group:1,rank:6,name:'AV-SMILINGBANDIT',username:'AV-SMILINGBA…',yearsB:21.6},
      {group:1,rank:7,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:11.5},
      {group:1,rank:8,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:11.4},
      {group:1,rank:9,name:'AV-OblivX',username:'AV-OblivX',yearsB:3.4},

      {group:2,rank:1,name:'AV-HarryBallsagna',username:'AV-HarryBallsa…',yearsB:75.2},
      {group:2,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:69.0},
      {group:2,rank:3,name:'AV-Deviantdan',username:'AV-DeviantDan',yearsB:32.8},
      {group:2,rank:4,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:32.5},
      {group:2,rank:5,name:'AV-CowPoke',username:'AV-CowPoke',yearsB:31.6},
      {group:2,rank:6,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:26.7},

      {group:3,rank:1,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:92.1},
      {group:3,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:49.7},
      {group:3,rank:3,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:42.2},
      {group:3,rank:4,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:34.4},
      {group:3,rank:5,name:'AV-J',username:'AV-J',yearsB:32.2},
      {group:3,rank:6,name:'AV-Starred',username:'AV-Starred',yearsB:31.5},
      {group:3,rank:7,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:28.8},
      {group:3,rank:8,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:21.7},

      {group:4,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:66.4},
      {group:4,rank:2,name:'AV-HarveySpecter',username:'AV-HarveySpec…',yearsB:46.6},
      {group:4,rank:3,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:27.8},
      {group:4,rank:4,name:'AV-DaG',username:'AV-DaG',yearsB:21.2},
      {group:4,rank:5,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:20.4},
      {group:4,rank:6,name:'AV-JACK',username:'AV-JACK',yearsB:11.5},
      {group:4,rank:7,name:'AV-CC',username:'AV-CC',yearsB:6.5},
      {group:4,rank:8,name:'AV-JIM',username:'AV-JIM',yearsB:6.4},
      {group:4,rank:9,name:'AV-jacko',username:'AV-jacko',yearsB:6.0}
    ],

    '2026-05-20':[
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-HarryBallsa…',yearsB:82.9},
      {group:1,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:47.0},
      {group:1,rank:3,name:'AV-TwirpSlayer',username:'AV-TwirpSlayer',yearsB:20.4},
      {group:1,rank:4,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:18.7},
      {group:1,rank:5,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:18.2},
      {group:1,rank:6,name:'AV-CowPoke',username:'AV-CowPoke',yearsB:16.8},

      {group:2,rank:1,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:100.0},
      {group:2,rank:2,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:30.5},
      {group:2,rank:3,name:'AV-KitKat',username:'AV-KitKat',yearsB:21.3},
      {group:2,rank:4,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:19.2},
      {group:2,rank:5,name:'AV-RkHendrix',username:'AV-RkHendrix-…',yearsB:14.6},
      {group:2,rank:6,name:'AV-jacko',username:'AV-jacko',yearsB:12.2},
      {group:2,rank:7,name:'AV-CC',username:'AV-CC',yearsB:5.4},
      {group:2,rank:8,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:3.8},
      {group:2,rank:9,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:0.280},

      {group:3,rank:4,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:33.5},
      {group:3,rank:5,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:24.8},
      {group:3,rank:7,name:'AV-HarveySpecter',username:'AV-HarveySpec…',yearsB:21.1},
      {group:3,rank:9,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:5.5},

      {group:4,rank:1,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:101.3},
      {group:4,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:54.0},
      {group:4,rank:3,name:'AV-INTEN',username:'AV-INTEN',yearsB:37.4},
      {group:4,rank:4,name:'AV-BEEN',username:'AV-BEEN',yearsB:33.9},
      {group:4,rank:5,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:21.3},
      {group:4,rank:6,name:'AV-JIMForWes',username:'AV-JIMForWes',yearsB:19.8},
      {group:4,rank:7,name:'AV-DaG',username:'AV-DaG',yearsB:17.5},
      {group:4,rank:8,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:7.0},
      {group:4,rank:9,name:'AV-OblivX',username:'AV-OblivX',yearsB:5.5}
    ],

    '2026-05-27':[
      {group:1,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:42.3},
      {group:1,rank:2,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:42.3},
      {group:1,rank:3,name:'AV-HarryBallsagna',username:'AV-HarryBalls…',yearsB:37.8},
      {group:1,rank:4,name:'AV-J',username:'AV-J',yearsB:22.9},
      {group:1,rank:5,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:16.1},
      {group:1,rank:6,name:'AV-DaG',username:'AV-DaG',yearsB:14.2},
      {group:1,rank:7,name:'AV-CC',username:'AV-CC',yearsB:5.3},
      {group:1,rank:8,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:3.0},

      {group:2,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:45.7},
      {group:2,rank:2,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:43.2},
      {group:2,rank:3,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:27.3},
      {group:2,rank:4,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:17.3},
      {group:2,rank:5,name:'AV-Starred',username:'AV-Starred',yearsB:10.1},
      {group:2,rank:6,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:9.2},
      {group:2,rank:7,name:'AV-GNSK',username:'AV-GNSK',yearsB:3.3},
      {group:2,rank:8,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berr…',yearsB:0.1416},
      {group:2,rank:9,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:0.1248}
    ],

    '2026-06-07':[
      {group:1,rank:1,name:'AV-Abu//npjp',username:'AV-Abu//npjp',yearsB:171.0},
      {group:1,rank:2,name:'AV-BeerMan',username:'AV-BeerMan',yearsB:101.9},
      {group:1,rank:3,name:'AV-J',username:'AV-J',yearsB:64.0},
      {group:1,rank:4,name:'AV-8!l...Bil',username:'AV-8!l…Bil',yearsB:43.8},
      {group:1,rank:5,name:'AV-JIM',username:'AV-JIM',yearsB:38.0},
      {group:1,rank:6,name:'AV-Suwair',username:'AV-Suwair',yearsB:29.2},

      {group:2,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:105.0},
      {group:2,rank:2,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:82.2},
      {group:2,rank:3,name:'AV-ColdCreeps',username:'AV-take.them.out',yearsB:72.2},
      {group:2,rank:4,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:66.4},
      {group:2,rank:5,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:47.9},
      {group:2,rank:6,name:'AV-Starred',username:'AV-Starred',yearsB:37.1},

      {group:3,rank:1,name:'AV-Nicefellow',username:'AV-Nicefellow',yearsB:120.9},
      {group:3,rank:2,name:'AV-INTEN',username:'AV-INTEN',yearsB:88.8},
      {group:3,rank:3,name:'AV-HarryBallsagna',username:'AV-HarryBallsa…',yearsB:84.5},
      {group:3,rank:4,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:63.2},
      {group:3,rank:5,name:'AV-Deviantdan',username:'AV-DeviantDan',yearsB:50.9},
      {group:3,rank:6,name:'AV-DaG',username:'AV-DaG',yearsB:30.0},
      {group:3,rank:7,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:19.2},
      {group:3,rank:8,name:'AV-Raj',username:'AV-Raj',yearsB:14.9},
      {group:3,rank:9,name:'AV-Finnie',username:'AV-Finnie',yearsB:11.4}
    ],

    '2026-06-11':[
      {group:1,rank:1,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:74.7},
      {group:1,rank:2,name:'AV-FrenchieUSA',username:'AV-FrenchieUSA',yearsB:28.5},
      {group:1,rank:3,name:'AV-Animosity',username:'AV-Animosity',yearsB:23.1},
      {group:1,rank:4,name:'AV-SMILINGBANDIT',username:'AV-SmilingBaN…',yearsB:22.4},
      {group:1,rank:5,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:18.2},
      {group:1,rank:6,name:'AV-JAKE',username:'AV-JAKE',yearsB:17.2},
      {group:1,rank:7,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:11.0},

      {group:2,rank:1,name:'AV-HarryBallsagna',username:'AV-HarryBallso…',yearsB:50.2},
      {group:2,rank:2,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:27.4},
      {group:2,rank:3,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:22.8},
      {group:2,rank:4,name:'AV-ColdCreeps',username:'AV-take.them.out',yearsB:20.2},
      {group:2,rank:5,name:'AV-Nicefellow',username:'AV-Nicefellow',yearsB:20.1},
      {group:2,rank:6,name:'AV-Starred',username:'AV-Starred',yearsB:17.9},
      {group:2,rank:7,name:'AV-Anamiko',username:'AV-Anamiko',yearsB:12.0},
      {group:2,rank:8,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:9.6},

      {group:3,rank:1,name:'AV-J',username:'AV-J',yearsB:63.5},
      {group:3,rank:2,name:'AV-jacko',username:'AV-jacko',yearsB:30.5},
      {group:3,rank:3,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:21.7},
      {group:3,rank:4,name:'AV-Deviantdan',username:'AV-Deviantdan',yearsB:18.6},
      {group:3,rank:5,name:'AV-OblivX',username:'AV-OblivX',yearsB:18.4},
      {group:3,rank:6,name:'AV-GNSK',username:'AV-GNSK',yearsB:17.5}
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
    '2026-02-04':'Recovered from three unique final Discord leaderboards; duplicate reposts and non-result gameplay images were ignored.',
    '2026-02-11':'Recovered from six final Discord posts. Lower duplicate AV-Caklet result (33B) was omitted in favor of the clearly final 78.2B result. Non-AVENGERS rows and minimum-not-reached rows were omitted.',
    '2026-02-22':'Recovered from three unique final leaderboards. One exact repost of the 2/11 AV-Caklet leaderboard was intentionally not duplicated.',
    '2026-02-24':'Recovered from three unique final leaderboards; duplicate owner reposts were deduplicated and minimum-not-reached rows omitted.',
    '2026-02-25':'Recovered from one final Discord leaderboard; only clearly readable rows entered.',
    '2026-03-03':'Recovered from three final Discord lobbies; only clearly readable AVENGERS rows entered.',
    '2026-03-06':'Recovered from five unique final Discord lobbies; duplicate reposts were deduplicated and unreadable lower rows omitted.',
    '2026-03-11':'Recovered from two unique final Discord lobbies; duplicate reposts were deduplicated.',
    '2026-03-18':'Recovered from three final Discord lobbies; non-AVENGERS rows and minimum-not-reached rows omitted.',
    '2026-03-21':'Recovered from two final Discord lobbies; one cropped rank-1 row was omitted.',
    '2026-03-25':'Recovered from three final Discord lobbies; one cropped rank-1 row was omitted and duplicate owner posts were deduplicated.',
    '2026-03-28':'Recovered from two final Discord lobbies.',
    '2026-04-01':'Recovered from highlighted owner row in final Discord screenshot.',
    '2026-04-02':'Recovered from highlighted owner row in final Discord screenshot; historical display name is truncated, canonicalized to AV-Phoenix.',
    '2026-04-03':'Recovered from highlighted owner rows in three final Discord posts.',
    '2026-04-08':'Recovered from highlighted owner row in JIM final screenshot. A Rafa post dated 4/8 is an exact repost of the 4/3 leaderboard and was intentionally not duplicated.',
    '2026-04-11':'Recovered from five final Discord posts representing four unique lobbies; duplicate posts of the same leaderboard were deduplicated. Added HarryBallsagna from his highlighted owner row. Non-AVENGERS competitors and one unreadable historical username were omitted.',
    '2026-04-19':'Recovered from three final Discord posts. Non-AVENGERS competitors, minimum-not-reached rows, and unreadable/truncated usernames were omitted rather than guessed.',
    '2026-04-29':'Recovered from four final Discord posts. Non-AVENGERS competitors, minimum-not-reached rows, and several truncated/ambiguous historical usernames were omitted rather than guessed.',
    '2026-05-06':'Recovered from final Discord screenshots; duplicate posts of the same leaderboard were deduplicated. Minimum-not-reached and ambiguous cropped rows were omitted.',
    '2026-05-14':'Recovered from final Discord screenshots; 32 clearly readable AVENGERS rows across four lobbies. A separate preliminary-results post from the same date was intentionally ignored.',
    '2026-05-20':'Recovered from Discord final-result screenshots; 28 clearly readable AVENGERS rows across four lobbies. One historical username (AV-JIMForWes) is preserved separately pending alias confirmation.',
    '2026-05-27':'Recovered from Discord final-result screenshots; 17 scored AVENGERS rows across two lobbies. One minimum-not-reached row omitted.',
    '2026-06-07':'Recovered from Discord final-result screenshots; 21 clearly readable AVENGERS rows across three lobbies. Cropped lower rows omitted.',
    '2026-06-19':'Recovered from Discord final-result screenshots; 44 AVENGERS rows.',
    '2026-06-24':'Recovered from Discord final-result screenshots; one AV-Tornado row is visibly present but its score is cropped, so it was not entered. AV-DaG score/sparks are entered but the star reward is cropped and left unknown.'
  });
})();
,username:'TiKsON
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:71.5,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'}
    ],

    '2026-03-18':[
      {group:1,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:45.3},
      {group:1,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:36.2},
      {group:1,rank:3,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:32.9},
      {group:1,rank:6,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:21.2},

      {group:2,rank:1,name:'AV-Robcorp',username:'AV-Robcorp-AUS',yearsB:100.0},
      {group:2,rank:2,name:'Iam',username:'Iam',yearsB:57.7},
      {group:2,rank:3,name:'AV-M-usa',username:'AV-M-usa',yearsB:30.8},
      {group:2,rank:4,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:20.3},
      {group:2,rank:5,name:'AV-Vadik-UA',username:'AV-Vadik-UKR',yearsB:9.1},
      {group:2,rank:6,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:8.5},
      {group:2,rank:9,name:'Maxipad54',username:'Maxipad54',yearsB:.680},

      {group:3,rank:1,name:'AV-Warrior',username:'AV-Warrior',yearsB:50.0},
      {group:3,rank:2,name:'tgves',username:'tgves',yearsB:40.8},
      {group:3,rank:3,name:'AV-Tin-VNM',username:'AV-Tin-VNM',yearsB:28.5},
      {group:3,rank:4,name:'AV-OblivX',username:'AV-OblivX',yearsB:26.3},
      {group:3,rank:6,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:18.8},
      {group:3,rank:7,name:'AV-TiKsON
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:71.5,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'}
    ],

    '2026-04-02':[
      {group:1,rank:5,name:'AV-Phoenix',username:'AV-Phoenix',yearsB:19.4,sourceNote:'Highlighted owner row from Phoenix Discord post; historical display name is truncated in the screenshot.'}
    ],

    '2026-04-03':[
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:56.3,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'},
      {group:2,rank:1,name:'AV-M-usa',username:'AV-M-usa',yearsB:22.6,sourceNote:'Highlighted owner row from M-usa Discord post.'},
      {group:3,rank:7,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:6.6,sourceNote:'Highlighted owner row from Rafa Discord post.'}
    ],

    '2026-04-08':[
      {group:1,rank:4,name:'AV-JIM',username:'AV-JIM',yearsB:19.9,sourceNote:'Highlighted owner row from JIM Discord post. Rafa post on 4/8 is an exact repost of the 4/3 leaderboard and was not duplicated.'}
    ],

    '2026-04-11':[
      {group:0,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:114.1,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'},
      {group:1,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:49.2},
      {group:1,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:48.7},
      {group:1,rank:3,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:47.5},
      {group:1,rank:4,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:36.9},
      {group:1,rank:5,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:29.4},
      {group:1,rank:6,name:'AV-RkHendrix',username:'AV-RkHendrix…',yearsB:28.4},
      {group:1,rank:7,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:27.0},
      {group:1,rank:8,name:'AV-VoDoS',username:'AV-VoDoS',yearsB:15.4},
      {group:1,rank:9,name:'JOKER',username:'JOKER',yearsB:13.4},

      {group:2,rank:1,name:'AV-Andre-DE',username:'AV-Andre-DE',yearsB:75.6},
      {group:2,rank:2,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:67.6},
      {group:2,rank:3,name:'AV-Tin-VNM',username:'AV-Tin-VNM',yearsB:57.1},
      {group:2,rank:4,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:36.7},
      {group:2,rank:5,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:27.7},
      {group:2,rank:6,name:'AV-67',username:'AV-67',yearsB:25.9},
      {group:2,rank:7,name:'AV-Ajnabi',username:'AV-Ajnabi',yearsB:25.7},
      {group:2,rank:8,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:23.7},
      {group:2,rank:9,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:21.9},

      {group:3,rank:1,name:'AV-Vadik-UA',username:'AV-Vadik-UA',yearsB:34.7},

      {group:4,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:108.7},
      {group:4,rank:2,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:65.8},
      {group:4,rank:3,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:44.9},
      {group:4,rank:4,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:41.1},
      {group:4,rank:5,name:'AV-JIM',username:'AV-JIM',yearsB:34.8},
      {group:4,rank:6,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:24.1},
      {group:4,rank:7,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:19.7},
      {group:4,rank:8,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:19.5}
    ],

    '2026-04-19':[
      {group:1,rank:1,name:'AV-CRISPIN.97',username:'AV-CRISPIN.97…',yearsB:60.5},
      {group:1,rank:3,name:'AV-BlackPearl',username:'AV-BlackPearl…',yearsB:18.6},
      {group:1,rank:4,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:10.1},

      {group:2,rank:1,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:70.0},
      {group:2,rank:2,name:'AV-Tin',username:'AV-Tin',yearsB:56.0},
      {group:2,rank:3,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:38.7},
      {group:2,rank:4,name:'AV-M-usa',username:'AV-M-usa',yearsB:31.5},
      {group:2,rank:5,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:30.6},
      {group:2,rank:6,name:'AV-JIM',username:'AV-JIM',yearsB:27.8},
      {group:2,rank:7,name:'AV-INTEN',username:'AV-INTEN',yearsB:25.0},
      {group:2,rank:8,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:18.2},
      {group:2,rank:9,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:14.6},

      {group:3,rank:1,name:'Iam',username:'Iam',yearsB:57.8},
      {group:3,rank:2,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:43.1},
      {group:3,rank:3,name:'AV-GNSK-JPN',username:'AV-GNSK-JPN',yearsB:40.4},
      {group:3,rank:4,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:20.0},
      {group:3,rank:5,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:18.8},
      {group:3,rank:6,name:'AV-KitKat',username:'AV-KitKat',yearsB:16.0},
      {group:3,rank:8,name:'AV-Vadik-UA',username:'AV-Vadik-UA',yearsB:2.2}
    ],

    '2026-04-29':[
      {group:1,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:80.3},
      {group:1,rank:2,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:39.2},
      {group:1,rank:3,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:38.7},
      {group:1,rank:4,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:37.7},
      {group:1,rank:5,name:'AV-GNSK',username:'AV-GNSK',yearsB:29.1},
      {group:1,rank:6,name:'AV-DaG',username:'AV-DaG',yearsB:24.6},

      {group:2,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:71.2},
      {group:2,rank:3,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:29.4},
      {group:2,rank:4,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:24.2},
      {group:2,rank:5,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:23.5},
      {group:2,rank:6,name:'AV-CRISPIN.97',username:'AV-CRISPIN.97…',yearsB:21.4},
      {group:2,rank:7,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:19.8},
      {group:2,rank:8,name:'AV-EvolvedEclipse',username:'AV-EvolvedEcli…',yearsB:19.0},
      {group:2,rank:9,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:6.0},

      {group:3,rank:1,name:'AV-Tin',username:'AV-Tin',yearsB:70.6},
      {group:3,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:57.7},
      {group:3,rank:3,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:38.2},
      {group:3,rank:5,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:21.0},
      {group:3,rank:6,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:20.5},
      {group:3,rank:7,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:18.2},

      {group:4,rank:1,name:'AV-JustSomeGuy',username:'AV-JustSomeGuy',yearsB:64.7},
      {group:4,rank:4,name:'BabyZerO',username:'BabyZerO',yearsB:11.4},
      {group:4,rank:7,name:'AV-Ratman',username:'AV-Ratman',yearsB:2.7}
    ],

    '2026-05-06':[
      {group:1,rank:1,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:50.0},
      {group:1,rank:2,name:'AV-Shells.Ani',username:'AV-Shells.Ani',yearsB:40.0},
      {group:1,rank:3,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:33.5},
      {group:1,rank:4,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:28.0},
      {group:1,rank:5,name:'AV-SMILINGBANDIT',username:'AV-SMILINGBA…',yearsB:19.5},
      {group:1,rank:6,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:18.0},
      {group:1,rank:7,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:14.6},
      {group:1,rank:8,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berr…',yearsB:11.7},

      {group:2,rank:1,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:49.6},
      {group:2,rank:2,name:'AV-BlackPearl',username:'AV-BlackPearl…',yearsB:34.5},
      {group:2,rank:3,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:29.4},
      {group:2,rank:4,name:'AV-KitKat',username:'AV-KitKat',yearsB:24.7},
      {group:2,rank:5,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:22.9},
      {group:2,rank:6,name:'AV-GNSK',username:'AV-GNSK',yearsB:12.1},
      {group:2,rank:7,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:11.8},
      {group:2,rank:8,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:10.9},

      {group:3,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:71.0},
      {group:3,rank:2,name:'AV-HarryBallsagna',username:'AV-HarryBalls…',yearsB:57.5},
      {group:3,rank:3,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:56.3},
      {group:3,rank:4,name:'AV-JACK',username:'AV-JACK',yearsB:30.4},
      {group:3,rank:5,name:'AV-JIM',username:'AV-JIM',yearsB:26.3},
      {group:3,rank:6,name:'AV-J',username:'AV-J',yearsB:23.4},
      {group:3,rank:7,name:'AV-Starred',username:'AV-Starred',yearsB:15.7},
      {group:3,rank:8,name:'AV-RkHendrix',username:'AV-RkHendrix-…',yearsB:13.2},
      {group:3,rank:9,name:'AV-jacko',username:'AV-jacko',yearsB:5.0},

      {group:4,rank:1,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:76.2},
      {group:4,rank:2,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:75.1},
      {group:4,rank:3,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:33.5},
      {group:4,rank:4,name:'AV-DaG',username:'AV-DaG',yearsB:29.1},
      {group:4,rank:5,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:27.7},
      {group:4,rank:6,name:'AV-OblivX',username:'AV-OblivX',yearsB:27.3},
      {group:4,rank:7,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:19.0},
      {group:4,rank:8,name:'AV-Caklet',username:'AV-Caklet',yearsB:8.4},
      {group:4,rank:9,name:'JOKER',username:'JOKER',yearsB:5.4},

      {group:5,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:10.1}
    ],

    '2026-05-14':[
      {group:1,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:57.8},
      {group:1,rank:2,name:'AV.Saberkong',username:'AV.Saberkong',yearsB:45.8},
      {group:1,rank:3,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:36.5},
      {group:1,rank:4,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:32.5},
      {group:1,rank:5,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:24.1},
      {group:1,rank:6,name:'AV-SMILINGBANDIT',username:'AV-SMILINGBA…',yearsB:21.6},
      {group:1,rank:7,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:11.5},
      {group:1,rank:8,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:11.4},
      {group:1,rank:9,name:'AV-OblivX',username:'AV-OblivX',yearsB:3.4},

      {group:2,rank:1,name:'AV-HarryBallsagna',username:'AV-HarryBallsa…',yearsB:75.2},
      {group:2,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:69.0},
      {group:2,rank:3,name:'AV-Deviantdan',username:'AV-DeviantDan',yearsB:32.8},
      {group:2,rank:4,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:32.5},
      {group:2,rank:5,name:'AV-CowPoke',username:'AV-CowPoke',yearsB:31.6},
      {group:2,rank:6,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:26.7},

      {group:3,rank:1,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:92.1},
      {group:3,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:49.7},
      {group:3,rank:3,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:42.2},
      {group:3,rank:4,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:34.4},
      {group:3,rank:5,name:'AV-J',username:'AV-J',yearsB:32.2},
      {group:3,rank:6,name:'AV-Starred',username:'AV-Starred',yearsB:31.5},
      {group:3,rank:7,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:28.8},
      {group:3,rank:8,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:21.7},

      {group:4,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:66.4},
      {group:4,rank:2,name:'AV-HarveySpecter',username:'AV-HarveySpec…',yearsB:46.6},
      {group:4,rank:3,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:27.8},
      {group:4,rank:4,name:'AV-DaG',username:'AV-DaG',yearsB:21.2},
      {group:4,rank:5,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:20.4},
      {group:4,rank:6,name:'AV-JACK',username:'AV-JACK',yearsB:11.5},
      {group:4,rank:7,name:'AV-CC',username:'AV-CC',yearsB:6.5},
      {group:4,rank:8,name:'AV-JIM',username:'AV-JIM',yearsB:6.4},
      {group:4,rank:9,name:'AV-jacko',username:'AV-jacko',yearsB:6.0}
    ],

    '2026-05-20':[
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-HarryBallsa…',yearsB:82.9},
      {group:1,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:47.0},
      {group:1,rank:3,name:'AV-TwirpSlayer',username:'AV-TwirpSlayer',yearsB:20.4},
      {group:1,rank:4,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:18.7},
      {group:1,rank:5,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:18.2},
      {group:1,rank:6,name:'AV-CowPoke',username:'AV-CowPoke',yearsB:16.8},

      {group:2,rank:1,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:100.0},
      {group:2,rank:2,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:30.5},
      {group:2,rank:3,name:'AV-KitKat',username:'AV-KitKat',yearsB:21.3},
      {group:2,rank:4,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:19.2},
      {group:2,rank:5,name:'AV-RkHendrix',username:'AV-RkHendrix-…',yearsB:14.6},
      {group:2,rank:6,name:'AV-jacko',username:'AV-jacko',yearsB:12.2},
      {group:2,rank:7,name:'AV-CC',username:'AV-CC',yearsB:5.4},
      {group:2,rank:8,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:3.8},
      {group:2,rank:9,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:0.280},

      {group:3,rank:4,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:33.5},
      {group:3,rank:5,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:24.8},
      {group:3,rank:7,name:'AV-HarveySpecter',username:'AV-HarveySpec…',yearsB:21.1},
      {group:3,rank:9,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:5.5},

      {group:4,rank:1,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:101.3},
      {group:4,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:54.0},
      {group:4,rank:3,name:'AV-INTEN',username:'AV-INTEN',yearsB:37.4},
      {group:4,rank:4,name:'AV-BEEN',username:'AV-BEEN',yearsB:33.9},
      {group:4,rank:5,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:21.3},
      {group:4,rank:6,name:'AV-JIMForWes',username:'AV-JIMForWes',yearsB:19.8},
      {group:4,rank:7,name:'AV-DaG',username:'AV-DaG',yearsB:17.5},
      {group:4,rank:8,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:7.0},
      {group:4,rank:9,name:'AV-OblivX',username:'AV-OblivX',yearsB:5.5}
    ],

    '2026-05-27':[
      {group:1,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:42.3},
      {group:1,rank:2,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:42.3},
      {group:1,rank:3,name:'AV-HarryBallsagna',username:'AV-HarryBalls…',yearsB:37.8},
      {group:1,rank:4,name:'AV-J',username:'AV-J',yearsB:22.9},
      {group:1,rank:5,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:16.1},
      {group:1,rank:6,name:'AV-DaG',username:'AV-DaG',yearsB:14.2},
      {group:1,rank:7,name:'AV-CC',username:'AV-CC',yearsB:5.3},
      {group:1,rank:8,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:3.0},

      {group:2,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:45.7},
      {group:2,rank:2,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:43.2},
      {group:2,rank:3,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:27.3},
      {group:2,rank:4,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:17.3},
      {group:2,rank:5,name:'AV-Starred',username:'AV-Starred',yearsB:10.1},
      {group:2,rank:6,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:9.2},
      {group:2,rank:7,name:'AV-GNSK',username:'AV-GNSK',yearsB:3.3},
      {group:2,rank:8,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berr…',yearsB:0.1416},
      {group:2,rank:9,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:0.1248}
    ],

    '2026-06-07':[
      {group:1,rank:1,name:'AV-Abu//npjp',username:'AV-Abu//npjp',yearsB:171.0},
      {group:1,rank:2,name:'AV-BeerMan',username:'AV-BeerMan',yearsB:101.9},
      {group:1,rank:3,name:'AV-J',username:'AV-J',yearsB:64.0},
      {group:1,rank:4,name:'AV-8!l...Bil',username:'AV-8!l…Bil',yearsB:43.8},
      {group:1,rank:5,name:'AV-JIM',username:'AV-JIM',yearsB:38.0},
      {group:1,rank:6,name:'AV-Suwair',username:'AV-Suwair',yearsB:29.2},

      {group:2,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:105.0},
      {group:2,rank:2,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:82.2},
      {group:2,rank:3,name:'AV-ColdCreeps',username:'AV-take.them.out',yearsB:72.2},
      {group:2,rank:4,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:66.4},
      {group:2,rank:5,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:47.9},
      {group:2,rank:6,name:'AV-Starred',username:'AV-Starred',yearsB:37.1},

      {group:3,rank:1,name:'AV-Nicefellow',username:'AV-Nicefellow',yearsB:120.9},
      {group:3,rank:2,name:'AV-INTEN',username:'AV-INTEN',yearsB:88.8},
      {group:3,rank:3,name:'AV-HarryBallsagna',username:'AV-HarryBallsa…',yearsB:84.5},
      {group:3,rank:4,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:63.2},
      {group:3,rank:5,name:'AV-Deviantdan',username:'AV-DeviantDan',yearsB:50.9},
      {group:3,rank:6,name:'AV-DaG',username:'AV-DaG',yearsB:30.0},
      {group:3,rank:7,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:19.2},
      {group:3,rank:8,name:'AV-Raj',username:'AV-Raj',yearsB:14.9},
      {group:3,rank:9,name:'AV-Finnie',username:'AV-Finnie',yearsB:11.4}
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
    '2026-04-01':'Recovered from highlighted owner row in final Discord screenshot.',
    '2026-04-02':'Recovered from highlighted owner row in final Discord screenshot; historical display name is truncated, canonicalized to AV-Phoenix.',
    '2026-04-03':'Recovered from highlighted owner rows in three final Discord posts.',
    '2026-04-08':'Recovered from highlighted owner row in JIM final screenshot. A Rafa post dated 4/8 is an exact repost of the 4/3 leaderboard and was intentionally not duplicated.',
    '2026-04-11':'Recovered from five final Discord posts representing four unique lobbies; duplicate posts of the same leaderboard were deduplicated. Added HarryBallsagna from his highlighted owner row. Non-AVENGERS competitors and one unreadable historical username were omitted.',
    '2026-04-19':'Recovered from three final Discord posts. Non-AVENGERS competitors, minimum-not-reached rows, and unreadable/truncated usernames were omitted rather than guessed.',
    '2026-04-29':'Recovered from four final Discord posts. Non-AVENGERS competitors, minimum-not-reached rows, and several truncated/ambiguous historical usernames were omitted rather than guessed.',
    '2026-05-06':'Recovered from final Discord screenshots; duplicate posts of the same leaderboard were deduplicated. Minimum-not-reached and ambiguous cropped rows were omitted.',
    '2026-05-14':'Recovered from final Discord screenshots; 32 clearly readable AVENGERS rows across four lobbies. A separate preliminary-results post from the same date was intentionally ignored.',
    '2026-05-20':'Recovered from Discord final-result screenshots; 28 clearly readable AVENGERS rows across four lobbies. One historical username (AV-JIMForWes) is preserved separately pending alias confirmation.',
    '2026-05-27':'Recovered from Discord final-result screenshots; 17 scored AVENGERS rows across two lobbies. One minimum-not-reached row omitted.',
    '2026-06-07':'Recovered from Discord final-result screenshots; 21 clearly readable AVENGERS rows across three lobbies. Cropped lower rows omitted.',
    '2026-06-19':'Recovered from Discord final-result screenshots; 44 AVENGERS rows.',
    '2026-06-24':'Recovered from Discord final-result screenshots; one AV-Tornado row is visibly present but its score is cropped, so it was not entered. AV-DaG score/sparks are entered but the star reward is cropped and left unknown.'
  });
})();
,username:'AV-TiKsON
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:71.5,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'}
    ],

    '2026-03-21':[
      {group:1,rank:2,name:'AV-INTEN',username:'AV-INTEN',yearsB:35.1},
      {group:1,rank:3,name:'AV-AG',username:'AV-AG',yearsB:34.5},
      {group:1,rank:4,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:29.4},
      {group:1,rank:5,name:'AV-JIM80Y',username:'AV-JIM80Y',yearsB:26.5},
      {group:1,rank:6,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:23.2},
      {group:1,rank:7,name:'AV-FeniXistential',username:'AV-FeniXistential',yearsB:18.8},

      {group:2,rank:1,name:'AV-Robcorp',username:'AV-Robcorp-AUS',yearsB:73.1},
      {group:2,rank:2,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:50.6},
      {group:2,rank:3,name:'AV-M-usa',username:'AV-M-usa',yearsB:33.4},
      {group:2,rank:4,name:'AV-Warrior',username:'AV-Warrior',yearsB:28.9},
      {group:2,rank:5,name:'AV-GNSK-JPN',username:'AV-GNSK-JPN',yearsB:28.6},
      {group:2,rank:6,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:23.8},
      {group:2,rank:7,name:'tgves',username:'tgves',yearsB:19.1}
    ],

    '2026-03-25':[
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:56.7},
      {group:1,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:38.6},
      {group:1,rank:3,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:38.2},
      {group:1,rank:4,name:'AV-Andre-DE',username:'AV-Andre-DE',yearsB:35.8},
      {group:1,rank:5,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:23.9},
      {group:1,rank:6,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:17.3},
      {group:1,rank:7,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:15.5},
      {group:1,rank:8,name:'AV-Jay',username:'AV-Jay',yearsB:13.1},
      {group:1,rank:9,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:3.7},

      {group:2,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:27.6},
      {group:2,rank:3,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:26.8},
      {group:2,rank:4,name:'AV-JIM80Y',username:'AV-JIM80Y',yearsB:15.8},
      {group:2,rank:5,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:15.0},
      {group:2,rank:6,name:'AV-RkHendrix',username:'AV-RkHendrix',yearsB:12.8},
      {group:2,rank:7,name:'AV-KitKat',username:'AV-KitKat',yearsB:11.8},
      {group:2,rank:8,name:'AV-FeniXistential',username:'AV-FeniXistential',yearsB:9.4},

      {group:3,rank:1,name:'AV-Robcorp',username:'AV-Robcorp-AUS',yearsB:41.5},
      {group:3,rank:2,name:'AV-FrenchieUSA',username:'AV-FrenchieUSA',yearsB:15.8},
      {group:3,rank:3,name:'tgves',username:'tgves',yearsB:15.5},
      {group:3,rank:4,name:'AV-Vadik-UA',username:'AV-Vadik-UKR',yearsB:11.9}
    ],

    '2026-03-28':[
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:68.1},
      {group:1,rank:2,name:'AV-Robcorp',username:'AV-Robcorp-AUS',yearsB:63.8},
      {group:1,rank:3,name:'AV-JIM',username:'AV-JIM',yearsB:28.9},
      {group:1,rank:4,name:'AV-M-usa',username:'AV-M-usa',yearsB:24.4},
      {group:1,rank:5,name:'AV-GNSK-JPN',username:'AV-GNSK-JPN',yearsB:20.8},
      {group:1,rank:6,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:16.9},
      {group:1,rank:7,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:14.1},
      {group:1,rank:8,name:'AV-RkHendrix',username:'AV-RkHendrix',yearsB:8.6},
      {group:1,rank:9,name:'AV-SMILINGBANDIT',username:'AV-SMILINGBANDIT',yearsB:7.6},

      {group:2,rank:1,name:'Iam',username:'Iam',yearsB:52.1},
      {group:2,rank:2,name:'AV-Andre-DE',username:'AV-Andre-DE',yearsB:36.6},
      {group:2,rank:3,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:35.5},
      {group:2,rank:4,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:28.1},
      {group:2,rank:5,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:22.8},
      {group:2,rank:6,name:'AV-Tin-VNM',username:'AV-Tin-VNM',yearsB:22.1},
      {group:2,rank:7,name:'tgves',username:'tgves',yearsB:19.6},
      {group:2,rank:8,name:'AV-KitKat',username:'AV-KitKat',yearsB:16.1},
      {group:2,rank:9,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:14.2}
    ],

    '2026-04-01':[
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:71.5,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'}
    ],

    '2026-04-02':[
      {group:1,rank:5,name:'AV-Phoenix',username:'AV-Phoenix',yearsB:19.4,sourceNote:'Highlighted owner row from Phoenix Discord post; historical display name is truncated in the screenshot.'}
    ],

    '2026-04-03':[
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:56.3,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'},
      {group:2,rank:1,name:'AV-M-usa',username:'AV-M-usa',yearsB:22.6,sourceNote:'Highlighted owner row from M-usa Discord post.'},
      {group:3,rank:7,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:6.6,sourceNote:'Highlighted owner row from Rafa Discord post.'}
    ],

    '2026-04-08':[
      {group:1,rank:4,name:'AV-JIM',username:'AV-JIM',yearsB:19.9,sourceNote:'Highlighted owner row from JIM Discord post. Rafa post on 4/8 is an exact repost of the 4/3 leaderboard and was not duplicated.'}
    ],

    '2026-04-11':[
      {group:0,rank:1,name:'AV-HarryBallsagna',username:'AV-SaddamMiser',yearsB:114.1,sourceNote:'Highlighted owner row from HarryBallsagna Discord post.'},
      {group:1,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:49.2},
      {group:1,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:48.7},
      {group:1,rank:3,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:47.5},
      {group:1,rank:4,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:36.9},
      {group:1,rank:5,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:29.4},
      {group:1,rank:6,name:'AV-RkHendrix',username:'AV-RkHendrix…',yearsB:28.4},
      {group:1,rank:7,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:27.0},
      {group:1,rank:8,name:'AV-VoDoS',username:'AV-VoDoS',yearsB:15.4},
      {group:1,rank:9,name:'JOKER',username:'JOKER',yearsB:13.4},

      {group:2,rank:1,name:'AV-Andre-DE',username:'AV-Andre-DE',yearsB:75.6},
      {group:2,rank:2,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:67.6},
      {group:2,rank:3,name:'AV-Tin-VNM',username:'AV-Tin-VNM',yearsB:57.1},
      {group:2,rank:4,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:36.7},
      {group:2,rank:5,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:27.7},
      {group:2,rank:6,name:'AV-67',username:'AV-67',yearsB:25.9},
      {group:2,rank:7,name:'AV-Ajnabi',username:'AV-Ajnabi',yearsB:25.7},
      {group:2,rank:8,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:23.7},
      {group:2,rank:9,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:21.9},

      {group:3,rank:1,name:'AV-Vadik-UA',username:'AV-Vadik-UA',yearsB:34.7},

      {group:4,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:108.7},
      {group:4,rank:2,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:65.8},
      {group:4,rank:3,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:44.9},
      {group:4,rank:4,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:41.1},
      {group:4,rank:5,name:'AV-JIM',username:'AV-JIM',yearsB:34.8},
      {group:4,rank:6,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:24.1},
      {group:4,rank:7,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:19.7},
      {group:4,rank:8,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:19.5}
    ],

    '2026-04-19':[
      {group:1,rank:1,name:'AV-CRISPIN.97',username:'AV-CRISPIN.97…',yearsB:60.5},
      {group:1,rank:3,name:'AV-BlackPearl',username:'AV-BlackPearl…',yearsB:18.6},
      {group:1,rank:4,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:10.1},

      {group:2,rank:1,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:70.0},
      {group:2,rank:2,name:'AV-Tin',username:'AV-Tin',yearsB:56.0},
      {group:2,rank:3,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:38.7},
      {group:2,rank:4,name:'AV-M-usa',username:'AV-M-usa',yearsB:31.5},
      {group:2,rank:5,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:30.6},
      {group:2,rank:6,name:'AV-JIM',username:'AV-JIM',yearsB:27.8},
      {group:2,rank:7,name:'AV-INTEN',username:'AV-INTEN',yearsB:25.0},
      {group:2,rank:8,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:18.2},
      {group:2,rank:9,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:14.6},

      {group:3,rank:1,name:'Iam',username:'Iam',yearsB:57.8},
      {group:3,rank:2,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:43.1},
      {group:3,rank:3,name:'AV-GNSK-JPN',username:'AV-GNSK-JPN',yearsB:40.4},
      {group:3,rank:4,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:20.0},
      {group:3,rank:5,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:18.8},
      {group:3,rank:6,name:'AV-KitKat',username:'AV-KitKat',yearsB:16.0},
      {group:3,rank:8,name:'AV-Vadik-UA',username:'AV-Vadik-UA',yearsB:2.2}
    ],

    '2026-04-29':[
      {group:1,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:80.3},
      {group:1,rank:2,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:39.2},
      {group:1,rank:3,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:38.7},
      {group:1,rank:4,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:37.7},
      {group:1,rank:5,name:'AV-GNSK',username:'AV-GNSK',yearsB:29.1},
      {group:1,rank:6,name:'AV-DaG',username:'AV-DaG',yearsB:24.6},

      {group:2,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:71.2},
      {group:2,rank:3,name:'AV<STAR-LORD>',username:'AV<STAR-LORD>',yearsB:29.4},
      {group:2,rank:4,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:24.2},
      {group:2,rank:5,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:23.5},
      {group:2,rank:6,name:'AV-CRISPIN.97',username:'AV-CRISPIN.97…',yearsB:21.4},
      {group:2,rank:7,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:19.8},
      {group:2,rank:8,name:'AV-EvolvedEclipse',username:'AV-EvolvedEcli…',yearsB:19.0},
      {group:2,rank:9,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:6.0},

      {group:3,rank:1,name:'AV-Tin',username:'AV-Tin',yearsB:70.6},
      {group:3,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:57.7},
      {group:3,rank:3,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:38.2},
      {group:3,rank:5,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:21.0},
      {group:3,rank:6,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:20.5},
      {group:3,rank:7,name:'AV-jacko-TWN',username:'AV-jacko-TWN',yearsB:18.2},

      {group:4,rank:1,name:'AV-JustSomeGuy',username:'AV-JustSomeGuy',yearsB:64.7},
      {group:4,rank:4,name:'BabyZerO',username:'BabyZerO',yearsB:11.4},
      {group:4,rank:7,name:'AV-Ratman',username:'AV-Ratman',yearsB:2.7}
    ],

    '2026-05-06':[
      {group:1,rank:1,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:50.0},
      {group:1,rank:2,name:'AV-Shells.Ani',username:'AV-Shells.Ani',yearsB:40.0},
      {group:1,rank:3,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:33.5},
      {group:1,rank:4,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:28.0},
      {group:1,rank:5,name:'AV-SMILINGBANDIT',username:'AV-SMILINGBA…',yearsB:19.5},
      {group:1,rank:6,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:18.0},
      {group:1,rank:7,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:14.6},
      {group:1,rank:8,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berr…',yearsB:11.7},

      {group:2,rank:1,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:49.6},
      {group:2,rank:2,name:'AV-BlackPearl',username:'AV-BlackPearl…',yearsB:34.5},
      {group:2,rank:3,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:29.4},
      {group:2,rank:4,name:'AV-KitKat',username:'AV-KitKat',yearsB:24.7},
      {group:2,rank:5,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:22.9},
      {group:2,rank:6,name:'AV-GNSK',username:'AV-GNSK',yearsB:12.1},
      {group:2,rank:7,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:11.8},
      {group:2,rank:8,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:10.9},

      {group:3,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:71.0},
      {group:3,rank:2,name:'AV-HarryBallsagna',username:'AV-HarryBalls…',yearsB:57.5},
      {group:3,rank:3,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:56.3},
      {group:3,rank:4,name:'AV-JACK',username:'AV-JACK',yearsB:30.4},
      {group:3,rank:5,name:'AV-JIM',username:'AV-JIM',yearsB:26.3},
      {group:3,rank:6,name:'AV-J',username:'AV-J',yearsB:23.4},
      {group:3,rank:7,name:'AV-Starred',username:'AV-Starred',yearsB:15.7},
      {group:3,rank:8,name:'AV-RkHendrix',username:'AV-RkHendrix-…',yearsB:13.2},
      {group:3,rank:9,name:'AV-jacko',username:'AV-jacko',yearsB:5.0},

      {group:4,rank:1,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:76.2},
      {group:4,rank:2,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:75.1},
      {group:4,rank:3,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:33.5},
      {group:4,rank:4,name:'AV-DaG',username:'AV-DaG',yearsB:29.1},
      {group:4,rank:5,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:27.7},
      {group:4,rank:6,name:'AV-OblivX',username:'AV-OblivX',yearsB:27.3},
      {group:4,rank:7,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:19.0},
      {group:4,rank:8,name:'AV-Caklet',username:'AV-Caklet',yearsB:8.4},
      {group:4,rank:9,name:'JOKER',username:'JOKER',yearsB:5.4},

      {group:5,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:10.1}
    ],

    '2026-05-14':[
      {group:1,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:57.8},
      {group:1,rank:2,name:'AV.Saberkong',username:'AV.Saberkong',yearsB:45.8},
      {group:1,rank:3,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:36.5},
      {group:1,rank:4,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:32.5},
      {group:1,rank:5,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:24.1},
      {group:1,rank:6,name:'AV-SMILINGBANDIT',username:'AV-SMILINGBA…',yearsB:21.6},
      {group:1,rank:7,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:11.5},
      {group:1,rank:8,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:11.4},
      {group:1,rank:9,name:'AV-OblivX',username:'AV-OblivX',yearsB:3.4},

      {group:2,rank:1,name:'AV-HarryBallsagna',username:'AV-HarryBallsa…',yearsB:75.2},
      {group:2,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:69.0},
      {group:2,rank:3,name:'AV-Deviantdan',username:'AV-DeviantDan',yearsB:32.8},
      {group:2,rank:4,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:32.5},
      {group:2,rank:5,name:'AV-CowPoke',username:'AV-CowPoke',yearsB:31.6},
      {group:2,rank:6,name:'AV-LiamUSA',username:'AV-LiamUSA',yearsB:26.7},

      {group:3,rank:1,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:92.1},
      {group:3,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:49.7},
      {group:3,rank:3,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:42.2},
      {group:3,rank:4,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:34.4},
      {group:3,rank:5,name:'AV-J',username:'AV-J',yearsB:32.2},
      {group:3,rank:6,name:'AV-Starred',username:'AV-Starred',yearsB:31.5},
      {group:3,rank:7,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:28.8},
      {group:3,rank:8,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berry',yearsB:21.7},

      {group:4,rank:1,name:'AV-INTEN',username:'AV-INTEN',yearsB:66.4},
      {group:4,rank:2,name:'AV-HarveySpecter',username:'AV-HarveySpec…',yearsB:46.6},
      {group:4,rank:3,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:27.8},
      {group:4,rank:4,name:'AV-DaG',username:'AV-DaG',yearsB:21.2},
      {group:4,rank:5,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:20.4},
      {group:4,rank:6,name:'AV-JACK',username:'AV-JACK',yearsB:11.5},
      {group:4,rank:7,name:'AV-CC',username:'AV-CC',yearsB:6.5},
      {group:4,rank:8,name:'AV-JIM',username:'AV-JIM',yearsB:6.4},
      {group:4,rank:9,name:'AV-jacko',username:'AV-jacko',yearsB:6.0}
    ],

    '2026-05-20':[
      {group:1,rank:1,name:'AV-HarryBallsagna',username:'AV-HarryBallsa…',yearsB:82.9},
      {group:1,rank:2,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:47.0},
      {group:1,rank:3,name:'AV-TwirpSlayer',username:'AV-TwirpSlayer',yearsB:20.4},
      {group:1,rank:4,name:'AV-hoops-SCT',username:'AV-hoops-SCT',yearsB:18.7},
      {group:1,rank:5,name:'AV-Adigarian',username:'AV-Adigarian',yearsB:18.2},
      {group:1,rank:6,name:'AV-CowPoke',username:'AV-CowPoke',yearsB:16.8},

      {group:2,rank:1,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:100.0},
      {group:2,rank:2,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:30.5},
      {group:2,rank:3,name:'AV-KitKat',username:'AV-KitKat',yearsB:21.3},
      {group:2,rank:4,name:'AV#Rafa#Tun',username:'AV#Rafa#Tun',yearsB:19.2},
      {group:2,rank:5,name:'AV-RkHendrix',username:'AV-RkHendrix-…',yearsB:14.6},
      {group:2,rank:6,name:'AV-jacko',username:'AV-jacko',yearsB:12.2},
      {group:2,rank:7,name:'AV-CC',username:'AV-CC',yearsB:5.4},
      {group:2,rank:8,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:3.8},
      {group:2,rank:9,name:'AV-7-STAR',username:'AV-7-STAR',yearsB:0.280},

      {group:3,rank:4,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:33.5},
      {group:3,rank:5,name:'AV-BaBaVooS',username:'AV-BaBaVooS…',yearsB:24.8},
      {group:3,rank:7,name:'AV-HarveySpecter',username:'AV-HarveySpec…',yearsB:21.1},
      {group:3,rank:9,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:5.5},

      {group:4,rank:1,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:101.3},
      {group:4,rank:2,name:'AV-CHEN1972',username:'AV-CHEN1972',yearsB:54.0},
      {group:4,rank:3,name:'AV-INTEN',username:'AV-INTEN',yearsB:37.4},
      {group:4,rank:4,name:'AV-BEEN',username:'AV-BEEN',yearsB:33.9},
      {group:4,rank:5,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:21.3},
      {group:4,rank:6,name:'AV-JIMForWes',username:'AV-JIMForWes',yearsB:19.8},
      {group:4,rank:7,name:'AV-DaG',username:'AV-DaG',yearsB:17.5},
      {group:4,rank:8,name:'AV-Rocket!!!',username:'AV-Rocket!!!',yearsB:7.0},
      {group:4,rank:9,name:'AV-OblivX',username:'AV-OblivX',yearsB:5.5}
    ],

    '2026-05-27':[
      {group:1,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:42.3},
      {group:1,rank:2,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:42.3},
      {group:1,rank:3,name:'AV-HarryBallsagna',username:'AV-HarryBalls…',yearsB:37.8},
      {group:1,rank:4,name:'AV-J',username:'AV-J',yearsB:22.9},
      {group:1,rank:5,name:'AV-Attila-AZE',username:'AV-Atilla-AZE',yearsB:16.1},
      {group:1,rank:6,name:'AV-DaG',username:'AV-DaG',yearsB:14.2},
      {group:1,rank:7,name:'AV-CC',username:'AV-CC',yearsB:5.3},
      {group:1,rank:8,name:'AV-DrDetroit',username:'AV-DrDetroit-U…',yearsB:3.0},

      {group:2,rank:1,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:45.7},
      {group:2,rank:2,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:43.2},
      {group:2,rank:3,name:'AV-BLISTER',username:'AV-BLISTER-USA',yearsB:27.3},
      {group:2,rank:4,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:17.3},
      {group:2,rank:5,name:'AV-Starred',username:'AV-Starred',yearsB:10.1},
      {group:2,rank:6,name:'AV-I.S.O',username:'AV-I.S.O',yearsB:9.2},
      {group:2,rank:7,name:'AV-GNSK',username:'AV-GNSK',yearsB:3.3},
      {group:2,rank:8,name:'AV-Mr.Mar.Berry',username:'AV-Mr.Mar.Berr…',yearsB:0.1416},
      {group:2,rank:9,name:'AV-InvisibleSpy',username:'AV-InvisibleSpy',yearsB:0.1248}
    ],

    '2026-06-07':[
      {group:1,rank:1,name:'AV-Abu//npjp',username:'AV-Abu//npjp',yearsB:171.0},
      {group:1,rank:2,name:'AV-BeerMan',username:'AV-BeerMan',yearsB:101.9},
      {group:1,rank:3,name:'AV-J',username:'AV-J',yearsB:64.0},
      {group:1,rank:4,name:'AV-8!l...Bil',username:'AV-8!l…Bil',yearsB:43.8},
      {group:1,rank:5,name:'AV-JIM',username:'AV-JIM',yearsB:38.0},
      {group:1,rank:6,name:'AV-Suwair',username:'AV-Suwair',yearsB:29.2},

      {group:2,rank:1,name:'AV-UANGELES',username:'AV-UANGELES',yearsB:105.0},
      {group:2,rank:2,name:'AV-EventHorizon',username:'AV-EventHorizon',yearsB:82.2},
      {group:2,rank:3,name:'AV-ColdCreeps',username:'AV-take.them.out',yearsB:72.2},
      {group:2,rank:4,name:'AV-Supreeth',username:'AV-Supreeth',yearsB:66.4},
      {group:2,rank:5,name:'AV-MONSTER',username:'AV-MONSTER.',yearsB:47.9},
      {group:2,rank:6,name:'AV-Starred',username:'AV-Starred',yearsB:37.1},

      {group:3,rank:1,name:'AV-Nicefellow',username:'AV-Nicefellow',yearsB:120.9},
      {group:3,rank:2,name:'AV-INTEN',username:'AV-INTEN',yearsB:88.8},
      {group:3,rank:3,name:'AV-HarryBallsagna',username:'AV-HarryBallsa…',yearsB:84.5},
      {group:3,rank:4,name:'AV-Jess-PT',username:'AV-Jess-PT',yearsB:63.2},
      {group:3,rank:5,name:'AV-Deviantdan',username:'AV-DeviantDan',yearsB:50.9},
      {group:3,rank:6,name:'AV-DaG',username:'AV-DaG',yearsB:30.0},
      {group:3,rank:7,name:'AV<STAR-LORD>',username:'AV<STAR-LOR…',yearsB:19.2},
      {group:3,rank:8,name:'AV-Raj',username:'AV-Raj',yearsB:14.9},
      {group:3,rank:9,name:'AV-Finnie',username:'AV-Finnie',yearsB:11.4}
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
    ],

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
      r.username=r.username||r.name;
      r.clan='AVENGERS';
      r.status='';
      r.years=Math.round((Number(r.yearsB)||0)*1e9);
    });
    D.space.events[date]=rows;

    rows.forEach(r=>{
      const arr=D.space.history[r.name] || (D.space.history[r.name]=[]);
      const code=date.replace(/-/g,'').slice(2);
      const prior=arr.filter(x=>x.date!==date);
      prior.push({
        date,code,yearsB:r.yearsB,
        stars:r.stars??null,
        sparks:r.sparks??null,
        sourceNote:r.sourceNote||''
      });
      prior.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      D.space.history[r.name]=prior;
    });
  });

  D.space.historicalSourceNotes=Object.assign({},D.space.historicalSourceNotes||{},{
    '2026-02-04':"Recovered from three unique final Discord leaderboards; duplicate reposts and non-result gameplay images were ignored.",
    '2026-02-11':"Recovered from final Discord posts; lower duplicate AV-Caklet result omitted in favor of the clearly final 78.2B result.",
    '2026-02-22':"Recovered from unique final leaderboards; one exact repost of the earlier AV-Caklet leaderboard was intentionally not duplicated.",
    '2026-02-24':"Recovered from three unique final leaderboards; duplicate owner reposts deduplicated and minimum-not-reached rows omitted.",
    '2026-02-25':"Recovered from one final Discord leaderboard; only clearly readable rows entered.",
    '2026-03-03':"Recovered from three final Discord lobbies; only clearly readable AVENGERS rows entered.",
    '2026-03-06':"Recovered from five unique final Discord lobbies; duplicate reposts deduplicated and unreadable lower rows omitted.",
    '2026-03-11':"Recovered from two unique final Discord lobbies; duplicate reposts deduplicated.",
    '2026-03-18':"Recovered from three final Discord lobbies; non-AVENGERS and minimum-not-reached rows omitted.",
    '2026-03-21':"Recovered from two final Discord lobbies; one cropped rank-1 row omitted.",
    '2026-03-25':"Recovered from three final Discord lobbies; one cropped rank-1 row omitted and duplicate owner posts deduplicated.",
    '2026-03-28':"Recovered from two final Discord lobbies.",
    '2026-04-01':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted.",
    '2026-04-02':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted.",
    '2026-04-03':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted.",
    '2026-04-08':"Recovered from highlighted owner row; exact repost from 4/3 intentionally not duplicated.",
    '2026-04-11':"Recovered from final Discord posts; preliminary/duplicate material excluded.",
    '2026-04-19':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted.",
    '2026-04-29':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted.",
    '2026-05-06':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted.",
    '2026-05-14':"Recovered from final Discord screenshots; preliminary/ongoing post ignored.",
    '2026-05-20':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted.",
    '2026-05-27':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted.",
    '2026-06-07':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted.",
    '2026-06-11':"Recovered from three final Discord leaderboards; exact duplicate repost of the first lobby was deduplicated. One truncated historical username and cropped lower rows were omitted rather than guessed.",
    '2026-06-19':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted.",
    '2026-06-24':"Recovered from final Discord screenshots; AV-Tornado score cropped and omitted; AV-DaG star reward cropped and left unknown.",
    '2026-07-09':"Recovered from Discord final-result screenshots; ambiguous/cropped/non-AVENGERS rows omitted."
  });
})();
