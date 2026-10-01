(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D||!D.space) return;

  const events={
  "2026-07-09": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-Supreeth",
      "username": "AV-Supreeth",
      "yearsB": 145.5,
      "stars": 704405,
      "sparks": 70440,
      "share": 0.25
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 104.1,
      "stars": 563524,
      "sparks": 56352,
      "share": 0.2
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-J",
      "username": "AV-J",
      "yearsB": 72.1,
      "stars": 507172,
      "sparks": 50717,
      "share": 0.18
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-COCO",
      "username": "AV-COCO",
      "yearsB": 71.2,
      "stars": 338114,
      "sparks": 33811,
      "share": 0.12
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-FrenchieUSA",
      "username": "AV-Frenchie(-4)",
      "yearsB": 55.9,
      "stars": 281762,
      "sparks": 28176,
      "share": 0.1
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-Deviantdan",
      "username": "AV-DeviantDan",
      "yearsB": 43.1,
      "stars": 225410,
      "sparks": 22541,
      "share": 0.08
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-Abu//npjp",
      "username": "AV-Abu//npjp",
      "yearsB": 39.1,
      "stars": 112705,
      "sparks": 11270,
      "share": 0.04
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 37.7,
      "stars": 56352,
      "sparks": 5635,
      "share": 0.02
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 33.2,
      "stars": 28176,
      "sparks": 2818,
      "share": 0.01
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-HarryBallso…",
      "yearsB": 90,
      "stars": 449592,
      "sparks": 44850,
      "share": 0.25
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-KitKat",
      "username": "AV-KitKat",
      "yearsB": 70.6,
      "stars": 359674,
      "sparks": 35968,
      "share": 0.2
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-8!l...Bil",
      "username": "AV-8!l…Bil",
      "yearsB": 66.5,
      "stars": 323507,
      "sparks": 32371,
      "share": 0.18
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 64,
      "stars": 215804,
      "sparks": 21581,
      "share": 0.12
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 41.4,
      "stars": 179837,
      "sparks": 17984,
      "share": 0.1
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-DrDetroit",
      "username": "AV-DrDetroit-U…",
      "yearsB": 19,
      "stars": 143870,
      "sparks": 14387,
      "share": 0.08
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV<STAR-LORD>",
      "username": "AV/<STAR-LOR…",
      "yearsB": 17.7,
      "stars": 71935,
      "sparks": 7194,
      "share": 0.04
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-DaG",
      "username": "AV-DaG",
      "yearsB": 17.1,
      "stars": 35967,
      "sparks": 3597,
      "share": 0.02
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-Nicefellow",
      "username": "AV-Nicefellow",
      "yearsB": 11.7,
      "stars": 17984,
      "sparks": 1798,
      "share": 0.01
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-Jess-PT",
      "username": "AV-Jess-PT",
      "yearsB": 71.4,
      "stars": 176758,
      "sparks": 17680,
      "share": 0.2
    },
    {
      "group": 4,
      "rank": 1,
      "name": "AV-SweetiePL",
      "username": "AV-SweetiePL",
      "yearsB": 180,
      "stars": 512176,
      "sparks": 51219,
      "share": 0.253
    },
    {
      "group": 4,
      "rank": 2,
      "name": "AV-ZolikaLoveKira",
      "username": "AV-ZolikaLoveK…",
      "yearsB": 65.7,
      "stars": 409741,
      "sparks": 40975,
      "share": 0.202
    },
    {
      "group": 4,
      "rank": 3,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 64.6,
      "stars": 368767,
      "sparks": 36877,
      "share": 0.182
    },
    {
      "group": 4,
      "rank": 4,
      "name": "AV-JeffKintz05",
      "username": "AV-JefhKintz05",
      "yearsB": 42.3,
      "stars": 245845,
      "sparks": 24585,
      "share": 0.121
    },
    {
      "group": 4,
      "rank": 5,
      "name": "AV-Witch-king",
      "username": "AV-Witch-king",
      "yearsB": 40,
      "stars": 204870,
      "sparks": 20487,
      "share": 0.101
    },
    {
      "group": 4,
      "rank": 6,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 22.1,
      "stars": 163896,
      "sparks": 16390,
      "share": 0.08
    },
    {
      "group": 4,
      "rank": 7,
      "name": "AV-jacko",
      "username": "AV-jacko",
      "yearsB": 15,
      "stars": 81948,
      "sparks": 8195,
      "share": 0.04
    },
    {
      "group": 4,
      "rank": 8,
      "name": "AV-no",
      "username": "AV-no",
      "yearsB": 9.8,
      "stars": 40974,
      "sparks": 4097,
      "share": 0.02
    }
  ],
  "2026-04-01": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-SaddamMiser",
      "yearsB": 71.5,
      "sourceNote": "Highlighted owner row from HarryBallsagna Discord post."
    }
  ],
  "2026-04-02": [
    {
      "group": 1,
      "rank": 5,
      "name": "AV-Phoenix",
      "username": "AV-Phoenix",
      "yearsB": 19.4,
      "sourceNote": "Highlighted owner row from Phoenix Discord post; historical display name is truncated in the screenshot."
    }
  ],
  "2026-04-03": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-SaddamMiser",
      "yearsB": 56.3,
      "sourceNote": "Highlighted owner row from HarryBallsagna Discord post."
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-M-usa",
      "username": "AV-M-usa",
      "yearsB": 22.6,
      "sourceNote": "Highlighted owner row from M-usa Discord post."
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 6.6,
      "sourceNote": "Highlighted owner row from Rafa Discord post."
    }
  ],
  "2026-04-08": [
    {
      "group": 1,
      "rank": 4,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 19.9,
      "sourceNote": "Highlighted owner row from JIM Discord post. Rafa post on 4/8 is an exact repost of the 4/3 leaderboard and was not duplicated."
    }
  ],
  "2026-04-11": [
    {
      "group": 0,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-SaddamMiser",
      "yearsB": 114.1,
      "sourceNote": "Highlighted owner row from HarryBallsagna Discord post."
    },
    {
      "group": 1,
      "rank": 1,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 49.2
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 48.7
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 47.5
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-BLISTER",
      "username": "AV-BLISTER-USA",
      "yearsB": 36.9
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV<STAR-LORD>",
      "username": "AV<STAR-LORD>",
      "yearsB": 29.4
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix…",
      "yearsB": 28.4
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 27
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-VoDoS",
      "username": "AV-VoDoS",
      "yearsB": 15.4
    },
    {
      "group": 1,
      "rank": 9,
      "name": "JOKER",
      "username": "JOKER",
      "yearsB": 13.4
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Andre-DE",
      "username": "AV-Andre-DE",
      "yearsB": 75.6
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 67.6
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-Tin-VNM",
      "username": "AV-Tin-VNM",
      "yearsB": 57.1
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-Attila-AZE",
      "username": "AV-Atilla-AZE",
      "yearsB": 36.7
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 27.7
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-67",
      "username": "AV-67",
      "yearsB": 25.9
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-Ajnabi",
      "username": "AV-Ajnabi",
      "yearsB": 25.7
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 23.7
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 21.9
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Vadik-UA",
      "username": "AV-Vadik-UA",
      "yearsB": 34.7
    },
    {
      "group": 4,
      "rank": 1,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 108.7
    },
    {
      "group": 4,
      "rank": 2,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 65.8
    },
    {
      "group": 4,
      "rank": 3,
      "name": "AV-Jess-PT",
      "username": "AV-Jess-PT",
      "yearsB": 44.9
    },
    {
      "group": 4,
      "rank": 4,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 41.1
    },
    {
      "group": 4,
      "rank": 5,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 34.8
    },
    {
      "group": 4,
      "rank": 6,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 24.1
    },
    {
      "group": 4,
      "rank": 7,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 19.7
    },
    {
      "group": 4,
      "rank": 8,
      "name": "AV-LiamUSA",
      "username": "AV-LiamUSA",
      "yearsB": 19.5
    }
  ],
  "2026-04-19": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-CRISPIN.97",
      "username": "AV-CRISPIN.97…",
      "yearsB": 60.5
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-BlackPearl",
      "username": "AV-BlackPearl…",
      "yearsB": 18.6
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-DrDetroit",
      "username": "AV-DrDetroit-U…",
      "yearsB": 10.1
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 70
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-Tin",
      "username": "AV-Tin",
      "yearsB": 56
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 38.7
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-M-usa",
      "username": "AV-M-usa",
      "yearsB": 31.5
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 30.6
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 27.8
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 25
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 18.2
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-InvisibleSpy",
      "username": "AV-InvisibleSpy",
      "yearsB": 14.6
    },
    {
      "group": 3,
      "rank": 1,
      "name": "Iam",
      "username": "Iam",
      "yearsB": 57.8
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 43.1
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-GNSK-JPN",
      "username": "AV-GNSK-JPN",
      "yearsB": 40.4
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV<STAR-LORD>",
      "username": "AV<STAR-LORD>",
      "yearsB": 20
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-BLISTER",
      "username": "AV-BLISTER-USA",
      "yearsB": 18.8
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-KitKat",
      "username": "AV-KitKat",
      "yearsB": 16
    },
    {
      "group": 3,
      "rank": 8,
      "name": "AV-Vadik-UA",
      "username": "AV-Vadik-UA",
      "yearsB": 2.2
    }
  ],
  "2026-04-29": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 80.3
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 39.2
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-Attila-AZE",
      "username": "AV-Atilla-AZE",
      "yearsB": 38.7
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 37.7
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-GNSK",
      "username": "AV-GNSK",
      "yearsB": 29.1
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-DaG",
      "username": "AV-DaG",
      "yearsB": 24.6
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 71.2
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV<STAR-LORD>",
      "username": "AV<STAR-LORD>",
      "yearsB": 29.4
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 24.2
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-BaBaVooS",
      "username": "AV-BaBaVooS…",
      "yearsB": 23.5
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-CRISPIN.97",
      "username": "AV-CRISPIN.97…",
      "yearsB": 21.4
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 19.8
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-EvolvedEclipse",
      "username": "AV-EvolvedEcli…",
      "yearsB": 19
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 6
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Tin",
      "username": "AV-Tin",
      "yearsB": 70.6
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 57.7
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 38.2
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-LiamUSA",
      "username": "AV-LiamUSA",
      "yearsB": 21
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-BLISTER",
      "username": "AV-BLISTER-USA",
      "yearsB": 20.5
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 18.2
    },
    {
      "group": 4,
      "rank": 1,
      "name": "AV-JustSomeGuy",
      "username": "AV-JustSomeGuy",
      "yearsB": 64.7
    },
    {
      "group": 4,
      "rank": 4,
      "name": "BabyZerO",
      "username": "BabyZerO",
      "yearsB": 11.4
    },
    {
      "group": 4,
      "rank": 7,
      "name": "AV-Ratman",
      "username": "AV-Ratman",
      "yearsB": 2.7
    }
  ],
  "2026-05-06": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV<STAR-LORD>",
      "username": "AV<STAR-LOR…",
      "yearsB": 50
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-Shells.Ani",
      "username": "AV-Shells.Ani",
      "yearsB": 40
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 33.5
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-BaBaVooS",
      "username": "AV-BaBaVooS…",
      "yearsB": 28
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-SMILINGBANDIT",
      "username": "AV-SMILINGBA…",
      "yearsB": 19.5
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 18
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-DrDetroit",
      "username": "AV-DrDetroit-U…",
      "yearsB": 14.6
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berr…",
      "yearsB": 11.7
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Jess-PT",
      "username": "AV-Jess-PT",
      "yearsB": 49.6
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-BlackPearl",
      "username": "AV-BlackPearl…",
      "yearsB": 34.5
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 29.4
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-KitKat",
      "username": "AV-KitKat",
      "yearsB": 24.7
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-BLISTER",
      "username": "AV-BLISTER-USA",
      "yearsB": 22.9
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-GNSK",
      "username": "AV-GNSK",
      "yearsB": 12.1
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-InvisibleSpy",
      "username": "AV-InvisibleSpy",
      "yearsB": 11.8
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-LiamUSA",
      "username": "AV-LiamUSA",
      "yearsB": 10.9
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 71
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-HarryBallsagna",
      "username": "AV-HarryBalls…",
      "yearsB": 57.5
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 56.3
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-JACK",
      "username": "AV-JACK",
      "yearsB": 30.4
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 26.3
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-J",
      "username": "AV-J",
      "yearsB": 23.4
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV-Starred",
      "username": "AV-Starred",
      "yearsB": 15.7
    },
    {
      "group": 3,
      "rank": 8,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix-…",
      "yearsB": 13.2
    },
    {
      "group": 3,
      "rank": 9,
      "name": "AV-jacko",
      "username": "AV-jacko",
      "yearsB": 5
    },
    {
      "group": 4,
      "rank": 1,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 76.2
    },
    {
      "group": 4,
      "rank": 2,
      "name": "AV-Supreeth",
      "username": "AV-Supreeth",
      "yearsB": 75.1
    },
    {
      "group": 4,
      "rank": 3,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 33.5
    },
    {
      "group": 4,
      "rank": 4,
      "name": "AV-DaG",
      "username": "AV-DaG",
      "yearsB": 29.1
    },
    {
      "group": 4,
      "rank": 5,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 27.7
    },
    {
      "group": 4,
      "rank": 6,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 27.3
    },
    {
      "group": 4,
      "rank": 7,
      "name": "AV-Attila-AZE",
      "username": "AV-Atilla-AZE",
      "yearsB": 19
    },
    {
      "group": 4,
      "rank": 8,
      "name": "AV-Caklet",
      "username": "AV-Caklet",
      "yearsB": 8.4
    },
    {
      "group": 4,
      "rank": 9,
      "name": "JOKER",
      "username": "JOKER",
      "yearsB": 5.4
    },
    {
      "group": 5,
      "rank": 1,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 10.1
    }
  ],
  "2026-05-14": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 57.8
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV.Saberkong",
      "username": "AV.Saberkong",
      "yearsB": 45.8
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 36.5
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV<STAR-LORD>",
      "username": "AV<STAR-LOR…",
      "yearsB": 32.5
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 24.1
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-SMILINGBANDIT",
      "username": "AV-SMILINGBA…",
      "yearsB": 21.6
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 11.5
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 11.4
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 3.4
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-HarryBallsa…",
      "yearsB": 75.2
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 69
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-Deviantdan",
      "username": "AV-DeviantDan",
      "yearsB": 32.8
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-BaBaVooS",
      "username": "AV-BaBaVooS…",
      "yearsB": 32.5
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-CowPoke",
      "username": "AV-CowPoke",
      "yearsB": 31.6
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-LiamUSA",
      "username": "AV-LiamUSA",
      "yearsB": 26.7
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Supreeth",
      "username": "AV-Supreeth",
      "yearsB": 92.1
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 49.7
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-Jess-PT",
      "username": "AV-Jess-PT",
      "yearsB": 42.2
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 34.4
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-J",
      "username": "AV-J",
      "yearsB": 32.2
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-Starred",
      "username": "AV-Starred",
      "yearsB": 31.5
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV-InvisibleSpy",
      "username": "AV-InvisibleSpy",
      "yearsB": 28.8
    },
    {
      "group": 3,
      "rank": 8,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 21.7
    },
    {
      "group": 4,
      "rank": 1,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 66.4
    },
    {
      "group": 4,
      "rank": 2,
      "name": "AV-HarveySpecter",
      "username": "AV-HarveySpec…",
      "yearsB": 46.6
    },
    {
      "group": 4,
      "rank": 3,
      "name": "AV-Attila-AZE",
      "username": "AV-Atilla-AZE",
      "yearsB": 27.8
    },
    {
      "group": 4,
      "rank": 4,
      "name": "AV-DaG",
      "username": "AV-DaG",
      "yearsB": 21.2
    },
    {
      "group": 4,
      "rank": 5,
      "name": "AV-BLISTER",
      "username": "AV-BLISTER-USA",
      "yearsB": 20.4
    },
    {
      "group": 4,
      "rank": 6,
      "name": "AV-JACK",
      "username": "AV-JACK",
      "yearsB": 11.5
    },
    {
      "group": 4,
      "rank": 7,
      "name": "AV-CC",
      "username": "AV-CC",
      "yearsB": 6.5
    },
    {
      "group": 4,
      "rank": 8,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 6.4
    },
    {
      "group": 4,
      "rank": 9,
      "name": "AV-jacko",
      "username": "AV-jacko",
      "yearsB": 6
    }
  ],
  "2026-05-20": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-HarryBallsa…",
      "yearsB": 82.9
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 47
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-TwirpSlayer",
      "username": "AV-TwirpSlayer",
      "yearsB": 20.4
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 18.7
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 18.2
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-CowPoke",
      "username": "AV-CowPoke",
      "yearsB": 16.8
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Jess-PT",
      "username": "AV-Jess-PT",
      "yearsB": 100
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 30.5
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-KitKat",
      "username": "AV-KitKat",
      "yearsB": 21.3
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 19.2
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix-…",
      "yearsB": 14.6
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-jacko",
      "username": "AV-jacko",
      "yearsB": 12.2
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-CC",
      "username": "AV-CC",
      "yearsB": 5.4
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 3.8
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 0.28
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 33.5
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-BaBaVooS",
      "username": "AV-BaBaVooS…",
      "yearsB": 24.8
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV-HarveySpecter",
      "username": "AV-HarveySpec…",
      "yearsB": 21.1
    },
    {
      "group": 3,
      "rank": 9,
      "name": "AV-DrDetroit",
      "username": "AV-DrDetroit-U…",
      "yearsB": 5.5
    },
    {
      "group": 4,
      "rank": 1,
      "name": "AV-Supreeth",
      "username": "AV-Supreeth",
      "yearsB": 101.3
    },
    {
      "group": 4,
      "rank": 2,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 54
    },
    {
      "group": 4,
      "rank": 3,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 37.4
    },
    {
      "group": 4,
      "rank": 4,
      "name": "AV-BEEN",
      "username": "AV-BEEN",
      "yearsB": 33.9
    },
    {
      "group": 4,
      "rank": 5,
      "name": "AV-Attila-AZE",
      "username": "AV-Atilla-AZE",
      "yearsB": 21.3
    },
    {
      "group": 4,
      "rank": 6,
      "name": "AV-JIMForWes",
      "username": "AV-JIMForWes",
      "yearsB": 19.8
    },
    {
      "group": 4,
      "rank": 7,
      "name": "AV-DaG",
      "username": "AV-DaG",
      "yearsB": 17.5
    },
    {
      "group": 4,
      "rank": 8,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 7
    },
    {
      "group": 4,
      "rank": 9,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 5.5
    }
  ],
  "2026-05-27": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 42.3
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-Jess-PT",
      "username": "AV-Jess-PT",
      "yearsB": 42.3
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-HarryBallsagna",
      "username": "AV-HarryBalls…",
      "yearsB": 37.8
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-J",
      "username": "AV-J",
      "yearsB": 22.9
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-Attila-AZE",
      "username": "AV-Atilla-AZE",
      "yearsB": 16.1
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-DaG",
      "username": "AV-DaG",
      "yearsB": 14.2
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-CC",
      "username": "AV-CC",
      "yearsB": 5.3
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-DrDetroit",
      "username": "AV-DrDetroit-U…",
      "yearsB": 3
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 45.7
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 43.2
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-BLISTER",
      "username": "AV-BLISTER-USA",
      "yearsB": 27.3
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV<STAR-LORD>",
      "username": "AV<STAR-LOR…",
      "yearsB": 17.3
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-Starred",
      "username": "AV-Starred",
      "yearsB": 10.1
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 9.2
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-GNSK",
      "username": "AV-GNSK",
      "yearsB": 3.3
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berr…",
      "yearsB": 0.1416
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-InvisibleSpy",
      "username": "AV-InvisibleSpy",
      "yearsB": 0.1248
    }
  ],
  "2026-06-07": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-Abu//npjp",
      "username": "AV-Abu//npjp",
      "yearsB": 171,
      "stars": 273202,
      "sparks": 27322,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-BeerMan",
      "username": "AV-BeerMan",
      "yearsB": 101.9,
      "stars": 218562,
      "sparks": 21857,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-J",
      "username": "AV-J",
      "yearsB": 64,
      "stars": 196706,
      "sparks": 19671,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-8!l...Bil",
      "username": "AV-8!l…Bil",
      "yearsB": 43.8,
      "stars": 131137,
      "sparks": 13114,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 38,
      "stars": 109281,
      "sparks": 10929,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-Suwair",
      "username": "AV-Suwair",
      "yearsB": 29.2,
      "stars": 87425,
      "sparks": 8743,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 105,
      "stars": 267904,
      "sparks": 26791,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 82.2,
      "stars": 214323,
      "sparks": 21433,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-ColdCreeps",
      "username": "AV-take.them.out",
      "yearsB": 72.2,
      "stars": 192891,
      "sparks": 19290,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-Supreeth",
      "username": "AV-Supreeth",
      "yearsB": 66.4,
      "stars": 128594,
      "sparks": 12860,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 47.9,
      "stars": 107162,
      "sparks": 10717,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-Starred",
      "username": "AV-Starred",
      "yearsB": 37.1,
      "stars": 85729,
      "sparks": 8573,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Nicefellow",
      "username": "AV-Nicefellow",
      "yearsB": 120.9,
      "stars": 281244,
      "sparks": 28124,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 88.8,
      "stars": 224995,
      "sparks": 22500,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-HarryBallsagna",
      "username": "AV-HarryBallsa…",
      "yearsB": 84.5,
      "stars": 202496,
      "sparks": 20250,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-Jess-PT",
      "username": "AV-Jess-PT",
      "yearsB": 63.2,
      "stars": 134997,
      "sparks": 13500,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-Deviantdan",
      "username": "AV-DeviantDan",
      "yearsB": 50.9,
      "stars": 112498,
      "sparks": 11250,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-DaG",
      "username": "AV-DaG",
      "yearsB": 30,
      "stars": 89998,
      "sparks": 9000,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV<STAR-LORD>",
      "username": "AV<STAR-LOR…",
      "yearsB": 19.2,
      "stars": 44999,
      "sparks": 4500,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 8,
      "name": "AV-Raj",
      "username": "AV-Raj",
      "yearsB": 14.9,
      "stars": 22500,
      "sparks": 2250,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 9,
      "name": "AV-Finnie",
      "username": "AV-Finnie",
      "yearsB": 11.4,
      "stars": 11250,
      "sparks": 1125,
      "rewardSource": "Discord final claim screenshot"
    }
  ],
  "2026-06-19": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-Abu//npjp",
      "username": "AV-Abu//npjp",
      "yearsB": 79.6,
      "stars": 376452,
      "sparks": 37646,
      "share": 0.25
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 52.9,
      "stars": 301162,
      "sparks": 30117,
      "share": 0.2
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-Deviantdan",
      "username": "AV-DeviantDan",
      "yearsB": 46.1,
      "stars": 271046,
      "sparks": 27105,
      "share": 0.18
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-Nicefellow",
      "username": "AV-Nicefellow",
      "yearsB": 42.6,
      "stars": 180697,
      "sparks": 18070,
      "share": 0.12
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 34.1,
      "stars": 150581,
      "sparks": 15058,
      "share": 0.1
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-no",
      "username": "AV-no",
      "yearsB": 33.2,
      "stars": 120465,
      "sparks": 12047,
      "share": 0.08
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-Starred",
      "username": "AV-Starred",
      "yearsB": 22,
      "stars": 60232,
      "sparks": 6023,
      "share": 0.04
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-jacko",
      "username": "AV-jacko",
      "yearsB": 17.1,
      "stars": 30116,
      "sparks": 3012,
      "share": 0.02
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 11.9,
      "stars": 15058,
      "sparks": 1506,
      "share": 0.01
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Jess-PT",
      "username": "AV-Jess-PT",
      "yearsB": 80.4,
      "stars": 255978,
      "sparks": 25598,
      "share": 0.25
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-ColdCreeps",
      "username": "AV-take.them.out",
      "yearsB": 37.7,
      "stars": 204782,
      "sparks": 20479,
      "share": 0.2
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-BLISTER",
      "username": "AV-BLISTER-USA",
      "yearsB": 27.1,
      "stars": 184304,
      "sparks": 18431,
      "share": 0.18
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-Animosity",
      "username": "AV-Animosity",
      "yearsB": 23.6,
      "stars": 122869,
      "sparks": 12287,
      "share": 0.12
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 20,
      "stars": 102391,
      "sparks": 10239,
      "share": 0.1
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-Raj",
      "username": "AV-Raj",
      "yearsB": 17,
      "stars": 81913,
      "sparks": 8192,
      "share": 0.08
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-BaBaVooS",
      "username": "AV-BaBaVooS…",
      "yearsB": 16.9,
      "stars": 40956,
      "sparks": 4096,
      "share": 0.04
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-Anamiko",
      "username": "AV-Anamiko",
      "yearsB": 15.6,
      "stars": 20478,
      "sparks": 2048,
      "share": 0.02
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Supreeth",
      "username": "AV-Supreeth",
      "yearsB": 90.4,
      "stars": 472780,
      "sparks": 47278,
      "share": 0.25
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 63.6,
      "stars": 378224,
      "sparks": 37822,
      "share": 0.2
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-8!l...Bil",
      "username": "AV-8!l…Bil",
      "yearsB": 60,
      "stars": 340402,
      "sparks": 34040,
      "share": 0.18
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-J",
      "username": "AV-J",
      "yearsB": 59.3,
      "stars": 226934,
      "sparks": 22693,
      "share": 0.12
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-Attila-AZE",
      "username": "AV-Atilla-AZE",
      "yearsB": 47.4,
      "stars": 189112,
      "sparks": 18911,
      "share": 0.1
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-Suwako",
      "username": "AV-Suwako",
      "yearsB": 43,
      "stars": 151290,
      "sparks": 15129,
      "share": 0.08
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV-DaG",
      "username": "AV-DaG",
      "yearsB": 22.9,
      "stars": 75645,
      "sparks": 7564,
      "share": 0.04
    },
    {
      "group": 3,
      "rank": 8,
      "name": "AV-InvisibleSpy",
      "username": "AV-InvisibleSpy",
      "yearsB": 16.1,
      "stars": 37822,
      "sparks": 3782,
      "share": 0.02
    },
    {
      "group": 3,
      "rank": 9,
      "name": "AV-FIREN",
      "username": "AV-FIREN",
      "yearsB": 13.9,
      "stars": 18911,
      "sparks": 1891,
      "share": 0.01
    },
    {
      "group": 4,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-HarryBallso…",
      "yearsB": 87.2,
      "stars": 356405,
      "sparks": 35640,
      "share": 0.25
    },
    {
      "group": 4,
      "rank": 2,
      "name": "AV<STAR-LORD>",
      "username": "AV/<STAR-LOR…",
      "yearsB": 49.3,
      "stars": 285124,
      "sparks": 28512,
      "share": 0.2
    },
    {
      "group": 4,
      "rank": 3,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 37.7,
      "stars": 256612,
      "sparks": 25661,
      "share": 0.18
    },
    {
      "group": 4,
      "rank": 4,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 31.2,
      "stars": 171074,
      "sparks": 17107,
      "share": 0.12
    },
    {
      "group": 4,
      "rank": 5,
      "name": "AV-SMILINGBANDIT",
      "username": "AV-SmiLiNgBaN…",
      "yearsB": 29.1,
      "stars": 142562,
      "sparks": 14256,
      "share": 0.1
    },
    {
      "group": 4,
      "rank": 6,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 28.6,
      "stars": 114050,
      "sparks": 11405,
      "share": 0.08
    },
    {
      "group": 4,
      "rank": 7,
      "name": "AV-Finnie",
      "username": "AV-Finnie",
      "yearsB": 23,
      "stars": 57025,
      "sparks": 5702,
      "share": 0.04
    },
    {
      "group": 4,
      "rank": 8,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix-…",
      "yearsB": 19.9,
      "stars": 28512,
      "sparks": 2851,
      "share": 0.02
    },
    {
      "group": 4,
      "rank": 9,
      "name": "AV-Tornado",
      "username": "AV-Tornado",
      "yearsB": 17.5,
      "stars": 14256,
      "sparks": 1426,
      "share": 0.01
    },
    {
      "group": 5,
      "rank": 1,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 71,
      "stars": 409155,
      "sparks": 40916,
      "share": 0.25
    },
    {
      "group": 5,
      "rank": 2,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berr…",
      "yearsB": 63.5,
      "stars": 327324,
      "sparks": 32732,
      "share": 0.2
    },
    {
      "group": 5,
      "rank": 3,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 47.3,
      "stars": 294592,
      "sparks": 29459,
      "share": 0.18
    },
    {
      "group": 5,
      "rank": 4,
      "name": "AV-JeffKintz05",
      "username": "AV-JefhKintz05",
      "yearsB": 36.4,
      "stars": 196394,
      "sparks": 19639,
      "share": 0.12
    },
    {
      "group": 5,
      "rank": 5,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 34.1,
      "stars": 163662,
      "sparks": 16366,
      "share": 0.1
    },
    {
      "group": 5,
      "rank": 6,
      "name": "AV-GNSK",
      "username": "AV-GNSK",
      "yearsB": 33.6,
      "stars": 130930,
      "sparks": 13093,
      "share": 0.08
    },
    {
      "group": 5,
      "rank": 7,
      "name": "AV-FrenchieUSA",
      "username": "AV-Frenchie(-4)",
      "yearsB": 31.6,
      "stars": 65465,
      "sparks": 6546,
      "share": 0.04
    },
    {
      "group": 5,
      "rank": 8,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 26.1,
      "stars": 32732,
      "sparks": 3273,
      "share": 0.02
    },
    {
      "group": 5,
      "rank": 9,
      "name": "AV-KitKat",
      "username": "AV-KitKat",
      "yearsB": 22.1,
      "stars": 16366,
      "sparks": 1637,
      "share": 0.01
    }
  ],
  "2026-06-24": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 13.8,
      "stars": 54444,
      "sparks": 5449,
      "share": 0.253
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Jess-PT",
      "username": "AV-Jess-PT",
      "yearsB": 70,
      "stars": 213552,
      "sparks": 21357,
      "share": 0.258
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-ZolikaLoveKira",
      "username": "AV-ZolikaLoveK…",
      "yearsB": 40.6,
      "stars": 170842,
      "sparks": 17085,
      "share": 0.206
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-Animosity",
      "username": "AV-Animosity",
      "yearsB": 34.9,
      "stars": 153758,
      "sparks": 15377,
      "share": 0.185
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-jacko-mini",
      "username": "AV-jacko-mini",
      "yearsB": 30.2,
      "stars": 102505,
      "sparks": 10251,
      "share": 0.124
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Deviantdan",
      "username": "AV-DeviantDan",
      "yearsB": 70.2,
      "stars": 361068,
      "sparks": 36110,
      "share": 0.25
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV<STAR-LORD>",
      "username": "AV/<STAR-LOR…",
      "yearsB": 69,
      "stars": 288854,
      "sparks": 28888,
      "share": 0.2
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 48.7,
      "stars": 259969,
      "sparks": 25999,
      "share": 0.18
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 37.4,
      "stars": 173312,
      "sparks": 17333,
      "share": 0.12
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-ColdCreeps",
      "username": "AV-take.them.out",
      "yearsB": 36.4,
      "stars": 144427,
      "sparks": 14444,
      "share": 0.1
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-Attila-AZE",
      "username": "AV-Atilla-AZE",
      "yearsB": 30.8,
      "stars": 115542,
      "sparks": 11555,
      "share": 0.08
    },
    {
      "group": 4,
      "rank": 1,
      "name": "AV-DaG",
      "username": "AV-DaG",
      "yearsB": 21.4,
      "stars": null,
      "sparks": 9075,
      "share": 0.25,
      "sourceNote": "star reward cropped in source screenshot"
    },
    {
      "group": 4,
      "rank": 2,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 20.8,
      "stars": 72544,
      "sparks": 7260,
      "share": 0.2
    },
    {
      "group": 4,
      "rank": 3,
      "name": "AV-Finnie",
      "username": "AV-Finnie",
      "yearsB": 13.2,
      "stars": 65290,
      "sparks": 6534,
      "share": 0.18
    },
    {
      "group": 4,
      "rank": 4,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 10.8,
      "stars": 43526,
      "sparks": 4356,
      "share": 0.12
    },
    {
      "group": 4,
      "rank": 5,
      "name": "AV-InvisibleSpy",
      "username": "AV-InvisibleSpy",
      "yearsB": 10.5,
      "stars": 36272,
      "sparks": 3630,
      "share": 0.1
    },
    {
      "group": 4,
      "rank": 6,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix-…",
      "yearsB": 9.7,
      "stars": 29018,
      "sparks": 2904,
      "share": 0.08
    },
    {
      "group": 4,
      "rank": 7,
      "name": "AV-jacko",
      "username": "AV-jacko",
      "yearsB": 9.4,
      "stars": 14509,
      "sparks": 1452,
      "share": 0.04
    },
    {
      "group": 4,
      "rank": 8,
      "name": "AV-Raj",
      "username": "AV-Raj",
      "yearsB": 5.7,
      "stars": 7254,
      "sparks": 726,
      "share": 0.02
    },
    {
      "group": 4,
      "rank": 9,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 5.3,
      "stars": 3627,
      "sparks": 363,
      "share": 0.01
    },
    {
      "group": 5,
      "rank": 1,
      "name": "AV-Supreeth",
      "username": "AV-Supreeth",
      "yearsB": 64.2,
      "stars": 313942,
      "sparks": 31394,
      "share": 0.25
    },
    {
      "group": 5,
      "rank": 2,
      "name": "AV-8!l...Bil",
      "username": "AV-8!l…Bil",
      "yearsB": 64.3,
      "stars": 251154,
      "sparks": 25115,
      "share": 0.2
    },
    {
      "group": 5,
      "rank": 3,
      "name": "AV-Starred",
      "username": "AV-Starred",
      "yearsB": 36.1,
      "stars": 226039,
      "sparks": 22604,
      "share": 0.18
    },
    {
      "group": 5,
      "rank": 4,
      "name": "AV-Nicefellow",
      "username": "AV-Nicefellow",
      "yearsB": 34.1,
      "stars": 150692,
      "sparks": 15069,
      "share": 0.12
    },
    {
      "group": 5,
      "rank": 5,
      "name": "AV-no",
      "username": "AV-no",
      "yearsB": 33.3,
      "stars": 125577,
      "sparks": 12558,
      "share": 0.1
    },
    {
      "group": 5,
      "rank": 6,
      "name": "AV-BeerMan",
      "username": "AV-BeerMan",
      "yearsB": 27.6,
      "stars": 100462,
      "sparks": 10046,
      "share": 0.08
    },
    {
      "group": 5,
      "rank": 7,
      "name": "AV-HarryBallsagna",
      "username": "AV-HarryBallso…",
      "yearsB": 23.1,
      "stars": 50231,
      "sparks": 5023,
      "share": 0.04
    },
    {
      "group": 5,
      "rank": 8,
      "name": "AV-GNSK",
      "username": "AV-GNSK",
      "yearsB": 18.6,
      "stars": 25115,
      "sparks": 2512,
      "share": 0.02
    },
    {
      "group": 5,
      "rank": 9,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 7.3,
      "stars": 12558,
      "sparks": 1256,
      "share": 0.01
    },
    {
      "group": 6,
      "rank": 1,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 57.8,
      "stars": 262300,
      "sparks": 26232,
      "share": 0.25
    },
    {
      "group": 6,
      "rank": 2,
      "name": "AV-JeffKintz05",
      "username": "AV-JefhKintz05",
      "yearsB": 40.6,
      "stars": 209840,
      "sparks": 20985,
      "share": 0.2
    },
    {
      "group": 6,
      "rank": 3,
      "name": "AV-Suwako",
      "username": "AV-Suwako",
      "yearsB": 40,
      "stars": 188856,
      "sparks": 18887,
      "share": 0.18
    },
    {
      "group": 6,
      "rank": 4,
      "name": "AV-Abu//npjp",
      "username": "AV-Abu//npjp",
      "yearsB": 37.4,
      "stars": 125904,
      "sparks": 12591,
      "share": 0.12
    },
    {
      "group": 6,
      "rank": 5,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 20.5,
      "stars": 104920,
      "sparks": 10493,
      "share": 0.1
    },
    {
      "group": 6,
      "rank": 6,
      "name": "AV-J",
      "username": "AV-J",
      "yearsB": 20.2,
      "stars": 83936,
      "sparks": 8394,
      "share": 0.08
    },
    {
      "group": 6,
      "rank": 7,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 16.8,
      "stars": 41968,
      "sparks": 4197,
      "share": 0.04
    },
    {
      "group": 6,
      "rank": 8,
      "name": "AV-Anamiko",
      "username": "AV-Anamiko",
      "yearsB": 8.8,
      "stars": 20984,
      "sparks": 2099,
      "share": 0.02
    },
    {
      "group": 6,
      "rank": 9,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 3,
      "stars": 10492,
      "sparks": 1049,
      "share": 0.01
    }
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

  D.space.historicalRewardTotals=Object.assign({},D.space.historicalRewardTotals||{},{"2026-06-07":{"stars":3137893,"sparks":313799,"source":"Discord final claim screenshots"},"2026-05-06":{"stars":4409006,"sparks":440935,"source":"Discord final claim screenshots; includes clearly visible AVENGERS rows omitted from the earlier lightyear-only transcription"},"2026-05-14":{"stars":4716264,"sparks":471649,"source":"Discord final claim screenshots; preliminary-results post excluded"},"2026-05-20":{"stars":3565217,"sparks":356564,"source":"Discord final claim screenshots"},"2026-05-27":{"stars":1417491,"sparks":141749.1,"source":"Discord final claim screenshots; Sparks reconstructed as Stars / 10 where the historical UI did not display them"},"2026-04-29":{"stars":3495341,"sparks":349550,"source":"Discord final claim screenshots; four final posts, summing all clearly visible AVENGERS rewards"}});

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
