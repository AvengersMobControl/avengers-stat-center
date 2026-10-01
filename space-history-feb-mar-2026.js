(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D||!D.space)return;
  const events={
  "2026-02-04": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 36.9
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 31.4
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-Andre-DE",
      "username": "AV-Andre<DE>",
      "yearsB": 23.6
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-Push-Ups",
      "username": "AV-Push-Ups",
      "yearsB": 22.2
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-AG",
      "username": "AV-AG",
      "yearsB": 19.8
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-Attila-AZE",
      "username": "AV-Attila",
      "yearsB": 15
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-Morre",
      "username": "AV-Morre",
      "yearsB": 14.1
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#",
      "yearsB": 11
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-MTBlue",
      "username": "AV-MTBlue",
      "yearsB": 6.9
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 37.2
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-Caklet",
      "username": "AV-Caklet",
      "yearsB": 36.5
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-Ironeagle",
      "username": "AV-Ironeagle",
      "yearsB": 26.5
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix",
      "yearsB": 18
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-LiamUSA",
      "username": "AV-Liam",
      "yearsB": 17.2
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-GNSK",
      "username": "AV-GNSK",
      "yearsB": 16.5
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-M",
      "username": "AV-M",
      "yearsB": 53.8
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-Robcorp",
      "username": "AV-Robcorp",
      "yearsB": 38.4
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 31.9
    },
    {
      "group": 3,
      "rank": 4,
      "name": "Iam",
      "username": "Iam",
      "yearsB": 21.7
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV<STAR-LORD>",
      "username": "AV<STAR-LORD>",
      "yearsB": 16.5
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-DrDetroit",
      "username": "AV-DrDetroit",
      "yearsB": 15.1
    }
  ],
  "2026-02-11": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-Caklet",
      "username": "AV-Caklet",
      "yearsB": 78.2
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 54.5
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-M",
      "username": "AV-M",
      "yearsB": 52
    },
    {
      "group": 1,
      "rank": 4,
      "name": "Iam",
      "username": "Iam",
      "yearsB": 46.4
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 27.6
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-tyranitatay",
      "username": "AV-tyranitatay",
      "yearsB": 25.4
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-CRISPIN.97",
      "username": "AV-CRISPIN.27…",
      "yearsB": 25.1
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-KitKat",
      "username": "AV-KitKat",
      "yearsB": 14.5
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-Push-Ups",
      "username": "AV-Push-Ups",
      "yearsB": 3.8
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-WeaponX",
      "username": "AV-WeaponX",
      "yearsB": 38.1
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-AP",
      "username": "AV-AP",
      "yearsB": 23.5
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-JIM80Y",
      "username": "AV-JIM80Y",
      "yearsB": 22.4
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix",
      "yearsB": 17.9
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-DrDetroit",
      "username": "AV-DrDetroit",
      "yearsB": 12.5
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-HiddenFrenchie",
      "username": "(AV)HiddenFren…",
      "yearsB": 12.3
    },
    {
      "group": 4,
      "rank": 2,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#",
      "yearsB": 11.4
    },
    {
      "group": 5,
      "rank": 2,
      "name": "AV-Warrior",
      "username": "AV-Warrior",
      "yearsB": 20.7
    },
    {
      "group": 5,
      "rank": 3,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 16
    },
    {
      "group": 6,
      "rank": 1,
      "name": "AV-PanCake",
      "username": "AV-PanCake",
      "yearsB": 33.4
    },
    {
      "group": 6,
      "rank": 2,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 30.3
    }
  ],
  "2026-02-22": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV<STAR-LORD>",
      "username": "AV<STAR-LORD>",
      "yearsB": 28.1
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-AG",
      "username": "AV-AG",
      "yearsB": 112.3
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 75.6
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 49.6
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-PanCake",
      "username": "AV-PanCake",
      "yearsB": 45
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-JIM80Y",
      "username": "AV-JIM80Y",
      "yearsB": 32.8
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-Spectris",
      "username": "AV-Spectris",
      "yearsB": 24.3
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-LiamUSA",
      "username": "AV-Liam",
      "yearsB": 75.7
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-Andre-DE",
      "username": "AV-Andre<DE>",
      "yearsB": 63.2
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-Warrior",
      "username": "AV-Warrior",
      "yearsB": 45
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-Morre",
      "username": "AV-Morre",
      "yearsB": 40.8
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 31.5
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix",
      "yearsB": 24.1
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 14.5
    },
    {
      "group": 3,
      "rank": 9,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 11.3
    }
  ],
  "2026-02-24": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 62.3
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-WeaponX",
      "username": "AV-WeaponX",
      "yearsB": 44.7
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 37.6
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-Attila-AZE",
      "username": "AV-Attila",
      "yearsB": 29.1
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-Vadik-UA",
      "username": "AV-Vadik",
      "yearsB": 29.1
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-TiN",
      "username": "AV-TIN",
      "yearsB": 23.2
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-CRISPIN.97",
      "username": "AV-CRISPIN.27…",
      "yearsB": 10.8
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-MTBlue",
      "username": "AV-MTBlue",
      "yearsB": 9.5
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-JIM80Y",
      "username": "AV-Jim80y",
      "yearsB": 9.4
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Caklet",
      "username": "AV-Caklet",
      "yearsB": 20.3
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-Jay",
      "username": "AV-Jay",
      "yearsB": 18.8
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 10.9
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#",
      "yearsB": 10.3
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 9.2
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-SaddamMiser",
      "yearsB": 40.5
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-Andre-DE",
      "username": "AV-Andre<DE>",
      "yearsB": 30.9
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-PanCake",
      "username": "AV-PanCake",
      "yearsB": 28.1
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-Warrior",
      "username": "AV-Warrior",
      "yearsB": 24
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-Blister2",
      "username": "AV-Blister2",
      "yearsB": 19.5
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-Spectris",
      "username": "AV-Spectris",
      "yearsB": 13.2
    },
    {
      "group": 3,
      "rank": 7,
      "name": "tgves",
      "username": "tgves",
      "yearsB": 12.2
    },
    {
      "group": 3,
      "rank": 8,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix",
      "yearsB": 12.1
    }
  ],
  "2026-02-25": [
    {
      "group": 1,
      "rank": 1,
      "name": "Iam",
      "username": "Iam",
      "yearsB": 44.9
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-M",
      "username": "AV-M",
      "yearsB": 33.9
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 30.7
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-DrDetroit",
      "username": "AV-DrDetroit",
      "yearsB": 14
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 13.5
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-Morre",
      "username": "AV-Morre",
      "yearsB": 13.4
    }
  ],
  "2026-03-03": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-FeniXistential",
      "username": "AV-FeniXistential",
      "yearsB": 32.1
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-Andre-DE",
      "username": "AV-Andre",
      "yearsB": 28.2
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-Morre",
      "username": "AV-Morre",
      "yearsB": 17.5
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 13.7
    },
    {
      "group": 1,
      "rank": 5,
      "name": "Malik",
      "username": "Malik",
      "yearsB": 13
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-KitKat",
      "username": "KitKat",
      "yearsB": 7.5
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 7.4
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 44.3
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 42.5
    },
    {
      "group": 2,
      "rank": 3,
      "name": "Iam",
      "username": "Iam",
      "yearsB": 40.1
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-Tin-VNM",
      "username": "AV-TIN-VNM",
      "yearsB": 35.4
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-M-usa",
      "username": "AV-M-usa",
      "yearsB": 30.5
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 27.9
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-Jay",
      "username": "AV-Jay",
      "yearsB": 21.8
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-CRISPIN.97",
      "username": "AV-CRISPIN.27…",
      "yearsB": 9.7
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 1.2
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Robcorp",
      "username": "AV-Robcorp-AUS",
      "yearsB": 51
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 35.3
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 33
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-Attila-AZE",
      "username": "AV-Atilla-AZE",
      "yearsB": 30.3
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-Warrior",
      "username": "AV-Warrior",
      "yearsB": 19.7
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 10.9
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV-MTBlue",
      "username": "AV-MTBlue",
      "yearsB": 10.7
    }
  ],
  "2026-03-06": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 40.2
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix",
      "yearsB": 26.4
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 20.6
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 20.6
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-PanCake",
      "username": "AV-PanCake",
      "yearsB": 17.3
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-Attila-AZE",
      "username": "AV-Atilla-AZE",
      "yearsB": 16.2
    },
    {
      "group": 1,
      "rank": 7,
      "name": "tgves",
      "username": "tgves",
      "yearsB": 16.1
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-DrDetroit",
      "username": "AV-DrDetroit-U…",
      "yearsB": 14.3
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 0.068
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Andre-DE",
      "username": "AV-Andre-DE",
      "yearsB": 31.9
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 24.6
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-FeniXistential",
      "username": "AV-FeniXistential",
      "yearsB": 16
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 14.9
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-Morre",
      "username": "AV-Morre",
      "yearsB": 13.9
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 11.3
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-WeaponX",
      "username": "AV-WeaponX",
      "yearsB": 45.1
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-Leon",
      "username": "AV-Leon-CHE",
      "yearsB": 29.9
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-Warrior",
      "username": "AV-Warrior",
      "yearsB": 28.9
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-LiamUSA",
      "username": "AV-Liam-USA",
      "yearsB": 27.8
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-BLISTER",
      "username": "AV-BLISTER-USA",
      "yearsB": 19.5
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-GNSK-JPN",
      "username": "AV-GNSK-JPN",
      "yearsB": 12.9
    },
    {
      "group": 4,
      "rank": 1,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 44.3
    },
    {
      "group": 4,
      "rank": 2,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 43.1
    },
    {
      "group": 4,
      "rank": 3,
      "name": "AV-HarryBallsagna",
      "username": "AV-SaddamMiser",
      "yearsB": 41.7
    },
    {
      "group": 4,
      "rank": 4,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 41.6
    },
    {
      "group": 4,
      "rank": 5,
      "name": "Iam",
      "username": "Iam",
      "yearsB": 41.6
    },
    {
      "group": 4,
      "rank": 6,
      "name": "AV-M-usa",
      "username": "AV-M-usa",
      "yearsB": 40.6
    },
    {
      "group": 5,
      "rank": 1,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 25.3
    }
  ],
  "2026-03-11": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-SaddamMiser",
      "yearsB": 40.2,
      "stars": 92811,
      "sparks": 9282,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-PanCake",
      "username": "AV-PanCake",
      "yearsB": 30,
      "stars": 74249,
      "sparks": 7426,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 26.7,
      "stars": 66825,
      "sparks": 6683,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-FeniXistential",
      "username": "AV-FeniXistential",
      "yearsB": 20,
      "stars": 44549,
      "sparks": 4455,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 19.8,
      "stars": 37124,
      "sparks": 3713,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 17.7,
      "stars": 29700,
      "sparks": 2970,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-Morre",
      "username": "AV-Morre",
      "yearsB": 16.6,
      "stars": 14850,
      "sparks": 1485,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 7.2,
      "stars": 7425,
      "sparks": 743,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-TiKsON$",
      "username": "TiKsON$",
      "yearsB": 6.5,
      "stars": 3712,
      "sparks": 371,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 36.6,
      "stars": 80314,
      "sparks": 8032,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-Tin-VNM",
      "username": "AV-Tin-VNM",
      "yearsB": 30,
      "stars": 64251,
      "sparks": 6426,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-WeaponX",
      "username": "AV-WeaponX",
      "yearsB": 27,
      "stars": 57826,
      "sparks": 5783,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 18.3,
      "stars": 38551,
      "sparks": 3855,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-FrenchieUSA",
      "username": "AV-Frenchie-USA",
      "yearsB": 16.6,
      "stars": 32126,
      "sparks": 3213,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-LiamUSA",
      "username": "AV-Liam-USA",
      "yearsB": 16.4,
      "stars": 25700,
      "sparks": 2570,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-KitKat",
      "username": "KitKat",
      "yearsB": 8.4,
      "stars": 12850,
      "sparks": 1285,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-JIM",
      "username": "AV-JIM-AUS",
      "yearsB": 6.3,
      "stars": 6425,
      "sparks": 643,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 2.5,
      "stars": 3213,
      "sparks": 321,
      "rewardSource": "Discord final claim screenshot"
    }
  ],
  "2026-03-18": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 45.3,
      "stars": 260280,
      "sparks": 26028,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 36.2,
      "stars": 208224,
      "sparks": 20822,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 32.9,
      "stars": 187402,
      "sparks": 18740,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 21.2,
      "stars": 83290,
      "sparks": 8329,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Robcorp",
      "username": "AV-Robcorp-AUS",
      "yearsB": 100,
      "stars": 258792,
      "sparks": 25879,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 2,
      "name": "Iam",
      "username": "Iam",
      "yearsB": 57.7,
      "stars": 207034,
      "sparks": 20703,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-M-usa",
      "username": "AV-M-usa",
      "yearsB": 30.8,
      "stars": 186331,
      "sparks": 18633,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 20.3,
      "stars": 124220,
      "sparks": 12422,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-Vadik-UA",
      "username": "AV-Vadik-UKR",
      "yearsB": 9.1,
      "stars": 103517,
      "sparks": 10352,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 8.5,
      "stars": 82814,
      "sparks": 8281,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 9,
      "name": "Maxipad54",
      "username": "Maxipad54",
      "yearsB": 0.68,
      "stars": 10352,
      "sparks": 1035,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Warrior",
      "username": "AV-Warrior",
      "yearsB": 50,
      "stars": 218056,
      "sparks": 21806,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 2,
      "name": "tgves",
      "username": "tgves",
      "yearsB": 40.8,
      "stars": 174445,
      "sparks": 17445,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-Tin-VNM",
      "username": "AV-Tin-VNM",
      "yearsB": 28.5,
      "stars": 157001,
      "sparks": 15700,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 26.3,
      "stars": 104667,
      "sparks": 10467,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 18.8,
      "stars": 69778,
      "sparks": 6978,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV-TiKsON$",
      "username": "AV-TiKsON$",
      "yearsB": 7.5,
      "stars": 34889,
      "sparks": 3489,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 8,
      "name": "AV-JIM",
      "username": "AV-JIM-AUS",
      "yearsB": 7.2,
      "stars": 17445,
      "sparks": 1745,
      "sparksEstimated": true,
      "rewardSource": "Discord final claim screenshot"
    }
  ],
  "2026-03-21": [
    {
      "group": 1,
      "rank": 2,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 35.1,
      "stars": 200762,
      "sparks": 20077,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-AG",
      "username": "AV-AG",
      "yearsB": 34.5,
      "stars": 180686,
      "sparks": 18069,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 29.4,
      "stars": 120457,
      "sparks": 12044,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-JIM80Y",
      "username": "AV-JIM80Y",
      "yearsB": 26.5,
      "stars": 100381,
      "sparks": 10038,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 23.2,
      "stars": 80305,
      "sparks": 8031,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-FeniXistential",
      "username": "AV-FeniXistential",
      "yearsB": 18.8,
      "stars": 40152,
      "sparks": 4015,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Robcorp",
      "username": "AV-Robcorp-AUS",
      "yearsB": 73.1,
      "stars": 313280,
      "sparks": 31328,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 50.6,
      "stars": 250624,
      "sparks": 25062,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-M-usa",
      "username": "AV-M-usa",
      "yearsB": 33.4,
      "stars": 225562,
      "sparks": 22556,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-Warrior",
      "username": "AV-Warrior",
      "yearsB": 28.9,
      "stars": 150374,
      "sparks": 15037,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-GNSK-JPN",
      "username": "AV-GNSK-JPN",
      "yearsB": 28.6,
      "stars": 125312,
      "sparks": 12531,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 23.8,
      "stars": 100250,
      "sparks": 10025,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 7,
      "name": "tgves",
      "username": "tgves",
      "yearsB": 19.1,
      "stars": 50125,
      "sparks": 5012,
      "rewardSource": "Discord final claim screenshot"
    }
  ],
  "2026-03-25": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-SaddamMiser",
      "yearsB": 56.7,
      "stars": 129168,
      "sparks": 12917,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 38.6,
      "stars": 103334,
      "sparks": 10333,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 38.2,
      "stars": 93001,
      "sparks": 9300,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-Andre-DE",
      "username": "AV-Andre-DE",
      "yearsB": 35.8,
      "stars": 62000,
      "sparks": 6200,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 23.9,
      "stars": 51667,
      "sparks": 5167,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 17.3,
      "stars": 41334,
      "sparks": 4133,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 15.5,
      "stars": 20667,
      "sparks": 2067,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-Jay",
      "username": "AV-Jay",
      "yearsB": 13.1,
      "stars": 10333,
      "sparks": 1033,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 3.7,
      "stars": 5167,
      "sparks": 517,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 27.6,
      "stars": 63003,
      "sparks": 6301,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 26.8,
      "stars": 56703,
      "sparks": 5671,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-JIM80Y",
      "username": "AV-JIM80Y",
      "yearsB": 15.8,
      "stars": 37802,
      "sparks": 3781,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 15,
      "stars": 31502,
      "sparks": 3151,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix",
      "yearsB": 12.8,
      "stars": 25201,
      "sparks": 2521,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-KitKat",
      "username": "AV-KitKat",
      "yearsB": 11.8,
      "stars": 12601,
      "sparks": 1260,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-FeniXistential",
      "username": "AV-FeniXistential",
      "yearsB": 9.4,
      "stars": 6300,
      "sparks": 630,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Robcorp",
      "username": "AV-Robcorp-AUS",
      "yearsB": 41.5,
      "stars": 46282,
      "sparks": 4629,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-FrenchieUSA",
      "username": "AV-FrenchieUSA",
      "yearsB": 15.8,
      "stars": 37025,
      "sparks": 3703,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 3,
      "name": "tgves",
      "username": "tgves",
      "yearsB": 15.5,
      "stars": 33323,
      "sparks": 3333,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-Vadik-UA",
      "username": "AV-Vadik-UKR",
      "yearsB": 11.9,
      "stars": 22215,
      "sparks": 2222,
      "rewardSource": "Discord final claim screenshot"
    }
  ],
  "2026-03-28": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-SaddamMiser",
      "yearsB": 68.1,
      "stars": 135135,
      "sparks": 13514,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-Robcorp",
      "username": "AV-Robcorp-AUS",
      "yearsB": 63.8,
      "stars": 108108,
      "sparks": 10811,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 28.9,
      "stars": 97297,
      "sparks": 9730,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-M-usa",
      "username": "AV-M-usa",
      "yearsB": 24.4,
      "stars": 64865,
      "sparks": 6487,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-GNSK-JPN",
      "username": "AV-GNSK-JPN",
      "yearsB": 20.8,
      "stars": 54054,
      "sparks": 5406,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 16.9,
      "stars": 43243,
      "sparks": 4324,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-LiamUSA",
      "username": "AV-LiamUSA",
      "yearsB": 14.1,
      "stars": 21622,
      "sparks": 2162,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix",
      "yearsB": 8.6,
      "stars": 10811,
      "sparks": 1081,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-SMILINGBANDIT",
      "username": "AV-SMILINGBANDIT",
      "yearsB": 7.6,
      "stars": 5405,
      "sparks": 541,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 1,
      "name": "Iam",
      "username": "Iam",
      "yearsB": 52.1,
      "stars": 130452,
      "sparks": 13045,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-Andre-DE",
      "username": "AV-Andre-DE",
      "yearsB": 36.6,
      "stars": 104362,
      "sparks": 10436,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 35.5,
      "stars": 93926,
      "sparks": 9393,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 28.1,
      "stars": 62617,
      "sparks": 6262,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 22.8,
      "stars": 52181,
      "sparks": 5218,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-Tin-VNM",
      "username": "AV-Tin-VNM",
      "yearsB": 22.1,
      "stars": 41745,
      "sparks": 4174,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 7,
      "name": "tgves",
      "username": "tgves",
      "yearsB": 19.6,
      "stars": 20872,
      "sparks": 2087,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-KitKat",
      "username": "AV-KitKat",
      "yearsB": 16.1,
      "stars": 10436,
      "sparks": 1044,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 14.2,
      "stars": 5218,
      "sparks": 522,
      "rewardSource": "Discord final claim screenshot"
    }
  ],
  "2026-06-11": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-Supreeth",
      "username": "AV-Supreeth",
      "yearsB": 74.7,
      "stars": 215600,
      "sparks": 21564,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-FrenchieUSA",
      "username": "AV-FrenchieUSA",
      "yearsB": 28.5,
      "stars": 172480,
      "sparks": 17252,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-Animosity",
      "username": "AV-Animosity",
      "yearsB": 23.1,
      "stars": 155232,
      "sparks": 15526,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-SMILINGBANDIT",
      "username": "AV-SmilingBaN…",
      "yearsB": 22.4,
      "stars": 103488,
      "sparks": 10351,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 18.2,
      "stars": 86240,
      "sparks": 8626,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-JAKE",
      "username": "AV-JAKE",
      "yearsB": 17.2,
      "stars": 68992,
      "sparks": 6901,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 11,
      "stars": 34496,
      "sparks": 3450,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-HarryBallso…",
      "yearsB": 50.2,
      "stars": 186410,
      "sparks": 18645,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-BLISTER",
      "username": "AV-BLISTER-USA",
      "yearsB": 27.4,
      "stars": 149128,
      "sparks": 14916,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 22.8,
      "stars": 134215,
      "sparks": 13424,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-ColdCreeps",
      "username": "AV-take.them.out",
      "yearsB": 20.2,
      "stars": 89477,
      "sparks": 8950,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-Nicefellow",
      "username": "AV-Nicefellow",
      "yearsB": 20.1,
      "stars": 74564,
      "sparks": 7458,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-Starred",
      "username": "AV-Starred",
      "yearsB": 17.9,
      "stars": 59651,
      "sparks": 5966,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-Anamiko",
      "username": "AV-Anamiko",
      "yearsB": 12,
      "stars": 29826,
      "sparks": 2983,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-InvisibleSpy",
      "username": "AV-InvisibleSpy",
      "yearsB": 9.6,
      "stars": 14913,
      "sparks": 1492,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-J",
      "username": "AV-J",
      "yearsB": 63.5,
      "stars": 192385,
      "sparks": 19240,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-jacko",
      "username": "AV-jacko",
      "yearsB": 30.5,
      "stars": 153908,
      "sparks": 15392,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 21.7,
      "stars": 138517,
      "sparks": 13853,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-Deviantdan",
      "username": "AV-Deviantdan",
      "yearsB": 18.6,
      "stars": 92345,
      "sparks": 9235,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 18.4,
      "stars": 76954,
      "sparks": 7696,
      "rewardSource": "Discord final claim screenshot"
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-GNSK",
      "username": "AV-GNSK",
      "yearsB": 17.5,
      "stars": 61563,
      "sparks": 6157,
      "rewardSource": "Discord final claim screenshot"
    }
  ]
};
  const notes={
  "2026-02-04": "Recovered from three unique final Discord leaderboards; duplicate reposts and non-result gameplay images were ignored.",
  "2026-02-11": "Recovered from final Discord posts; lower duplicate AV-Caklet result omitted in favor of the clearly final 78.2B result.",
  "2026-02-22": "Recovered from unique final leaderboards; one exact repost of the earlier AV-Caklet leaderboard was intentionally not duplicated.",
  "2026-02-24": "Recovered from three unique final leaderboards; duplicate owner reposts deduplicated and minimum-not-reached rows omitted.",
  "2026-02-25": "Recovered from one final Discord leaderboard; only clearly readable rows entered.",
  "2026-03-03": "Recovered from three final Discord lobbies; only clearly readable AVENGERS rows entered.",
  "2026-03-06": "Recovered from five unique final Discord lobbies; duplicate reposts deduplicated and unreadable lower rows omitted.",
  "2026-03-11": "Recovered from two unique final Discord lobbies; duplicate reposts deduplicated.",
  "2026-03-18": "Recovered from three final Discord lobbies; non-AVENGERS and minimum-not-reached rows omitted.",
  "2026-03-21": "Recovered from two final Discord lobbies; one cropped rank-1 row omitted.",
  "2026-03-25": "Recovered from three final Discord lobbies; one cropped rank-1 row omitted and duplicate owner posts deduplicated.",
  "2026-03-28": "Recovered from two final Discord lobbies.",
  "2026-06-11": "Recovered from three final Discord leaderboards; exact duplicate repost of the first lobby was deduplicated. One truncated historical username and cropped lower rows were omitted rather than guessed."
};
  const add=name=>{
    if((D.members||[]).some(m=>m.name===name))return;
    D.members.push({
      name,status:'Inactive',piggyPB:0,spacePB:0,krakenPB:0,
      piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,
      rankingScore:0,krakenPBMonth:'',ratingPB:0,ratingAvg:0,
      ratingTotal:0,eventsPlayed:0,totalSparks:0
    });
  };
  Object.values(events).flat().forEach(r=>add(r.name));
  Object.entries(events).forEach(([date,rows])=>{
    rows.forEach(r=>{
      r.username=r.username||r.name;
      r.clan='AVENGERS';
      r.status='';
      r.years=Math.round((Number(r.yearsB)||0)*1e9);
    });
    D.space.events[date]=rows;
    rows.forEach(r=>{
      const arr=D.space.history[r.name]||(D.space.history[r.name]=[]);
      const code=date.replace(/-/g,'').slice(2);
      const prior=arr.filter(x=>x.date!==date);
      prior.push({date,code,yearsB:r.yearsB,stars:r.stars??null,sparks:r.sparks??null,sourceNote:notes[date]||''});
      prior.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      D.space.history[r.name]=prior;
    });
  });
  D.space.historicalRewardTotals=Object.assign({},D.space.historicalRewardTotals||{},{"2026-03-11":{"stars":692501,"sparks":69256,"source":"Discord final claim screenshots"},"2026-03-18":{"stars":2488537,"sparks":248853.7,"source":"Discord final claim screenshots; Sparks reconstructed as Stars / 10 per scorelog convention"},"2026-03-21":{"stars":1938270,"sparks":193825,"source":"Discord final claim screenshots"},"2026-03-25":{"stars":888628,"sparks":88869,"source":"Discord final claim screenshots; totals cover the tracked AVENGERS rows present in this historical event"},"2026-03-28":{"stars":1062349,"sparks":106237,"source":"Discord final claim screenshots"},"2026-06-11":{"stars":2290384,"sparks":229077,"source":"Discord final claim screenshots"}});
  D.space.historicalSourceNotes=Object.assign({},D.space.historicalSourceNotes||{},notes);
})();
