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
      "yearsB": 40.2
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-PanCake",
      "username": "AV-PanCake",
      "yearsB": 30
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 26.7
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-FeniXistential",
      "username": "AV-FeniXistential",
      "yearsB": 20
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 19.8
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 17.7
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-Morre",
      "username": "AV-Morre",
      "yearsB": 16.6
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 7.2
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-TiKsON$",
      "username": "TiKsON$",
      "yearsB": 6.5
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 36.6
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-Tin-VNM",
      "username": "AV-Tin-VNM",
      "yearsB": 30
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-WeaponX",
      "username": "AV-WeaponX",
      "yearsB": 27
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 18.3
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-FrenchieUSA",
      "username": "AV-Frenchie-USA",
      "yearsB": 16.6
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-LiamUSA",
      "username": "AV-Liam-USA",
      "yearsB": 16.4
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-KitKat",
      "username": "KitKat",
      "yearsB": 8.4
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-JIM",
      "username": "AV-JIM-AUS",
      "yearsB": 6.3
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 2.5
    }
  ],
  "2026-03-18": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 45.3
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 36.2
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 32.9
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 21.2
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Robcorp",
      "username": "AV-Robcorp-AUS",
      "yearsB": 100
    },
    {
      "group": 2,
      "rank": 2,
      "name": "Iam",
      "username": "Iam",
      "yearsB": 57.7
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-M-usa",
      "username": "AV-M-usa",
      "yearsB": 30.8
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 20.3
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-Vadik-UA",
      "username": "AV-Vadik-UKR",
      "yearsB": 9.1
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 8.5
    },
    {
      "group": 2,
      "rank": 9,
      "name": "Maxipad54",
      "username": "Maxipad54",
      "yearsB": 0.68
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Warrior",
      "username": "AV-Warrior",
      "yearsB": 50
    },
    {
      "group": 3,
      "rank": 2,
      "name": "tgves",
      "username": "tgves",
      "yearsB": 40.8
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-Tin-VNM",
      "username": "AV-Tin-VNM",
      "yearsB": 28.5
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 26.3
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-hoops-SCT",
      "username": "AV-hoops-SCT",
      "yearsB": 18.8
    },
    {
      "group": 3,
      "rank": 7,
      "name": "AV-TiKsON$",
      "username": "AV-TiKsON$",
      "yearsB": 7.5
    },
    {
      "group": 3,
      "rank": 8,
      "name": "AV-JIM",
      "username": "AV-JIM-AUS",
      "yearsB": 7.2
    }
  ],
  "2026-03-21": [
    {
      "group": 1,
      "rank": 2,
      "name": "AV-INTEN",
      "username": "AV-INTEN",
      "yearsB": 35.1
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-AG",
      "username": "AV-AG",
      "yearsB": 34.5
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 29.4
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-JIM80Y",
      "username": "AV-JIM80Y",
      "yearsB": 26.5
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 23.2
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-FeniXistential",
      "username": "AV-FeniXistential",
      "yearsB": 18.8
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-Robcorp",
      "username": "AV-Robcorp-AUS",
      "yearsB": 73.1
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 50.6
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-M-usa",
      "username": "AV-M-usa",
      "yearsB": 33.4
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-Warrior",
      "username": "AV-Warrior",
      "yearsB": 28.9
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-GNSK-JPN",
      "username": "AV-GNSK-JPN",
      "yearsB": 28.6
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV#Rafa#Tun",
      "username": "AV#Rafa#Tun",
      "yearsB": 23.8
    },
    {
      "group": 2,
      "rank": 7,
      "name": "tgves",
      "username": "tgves",
      "yearsB": 19.1
    }
  ],
  "2026-03-25": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-SaddamMiser",
      "yearsB": 56.7
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 38.6
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 38.2
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-Andre-DE",
      "username": "AV-Andre-DE",
      "yearsB": 35.8
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-EventHorizon",
      "username": "AV-EventHorizon",
      "yearsB": 23.9
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 17.3
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 15.5
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-Jay",
      "username": "AV-Jay",
      "yearsB": 13.1
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 3.7
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 27.6
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-7-STAR",
      "username": "AV-7-STAR",
      "yearsB": 26.8
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-JIM80Y",
      "username": "AV-JIM80Y",
      "yearsB": 15.8
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-Rocket!!!",
      "username": "AV-Rocket!!!",
      "yearsB": 15
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix",
      "yearsB": 12.8
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-KitKat",
      "username": "AV-KitKat",
      "yearsB": 11.8
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-FeniXistential",
      "username": "AV-FeniXistential",
      "yearsB": 9.4
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-Robcorp",
      "username": "AV-Robcorp-AUS",
      "yearsB": 41.5
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-FrenchieUSA",
      "username": "AV-FrenchieUSA",
      "yearsB": 15.8
    },
    {
      "group": 3,
      "rank": 3,
      "name": "tgves",
      "username": "tgves",
      "yearsB": 15.5
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-Vadik-UA",
      "username": "AV-Vadik-UKR",
      "yearsB": 11.9
    }
  ],
  "2026-03-28": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-SaddamMiser",
      "yearsB": 68.1
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-Robcorp",
      "username": "AV-Robcorp-AUS",
      "yearsB": 63.8
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-JIM",
      "username": "AV-JIM",
      "yearsB": 28.9
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-M-usa",
      "username": "AV-M-usa",
      "yearsB": 24.4
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-GNSK-JPN",
      "username": "AV-GNSK-JPN",
      "yearsB": 20.8
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-Mr.Mar.Berry",
      "username": "AV-Mr.Mar.Berry",
      "yearsB": 16.9
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-LiamUSA",
      "username": "AV-LiamUSA",
      "yearsB": 14.1
    },
    {
      "group": 1,
      "rank": 8,
      "name": "AV-RkHendrix",
      "username": "AV-RkHendrix",
      "yearsB": 8.6
    },
    {
      "group": 1,
      "rank": 9,
      "name": "AV-SMILINGBANDIT",
      "username": "AV-SMILINGBANDIT",
      "yearsB": 7.6
    },
    {
      "group": 2,
      "rank": 1,
      "name": "Iam",
      "username": "Iam",
      "yearsB": 52.1
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-Andre-DE",
      "username": "AV-Andre-DE",
      "yearsB": 36.6
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 35.5
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-jacko-TWN",
      "username": "AV-jacko-TWN",
      "yearsB": 28.1
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-I.S.O",
      "username": "AV-I.S.O",
      "yearsB": 22.8
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-Tin-VNM",
      "username": "AV-Tin-VNM",
      "yearsB": 22.1
    },
    {
      "group": 2,
      "rank": 7,
      "name": "tgves",
      "username": "tgves",
      "yearsB": 19.6
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-KitKat",
      "username": "AV-KitKat",
      "yearsB": 16.1
    },
    {
      "group": 2,
      "rank": 9,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 14.2
    }
  ],
  "2026-06-11": [
    {
      "group": 1,
      "rank": 1,
      "name": "AV-Supreeth",
      "username": "AV-Supreeth",
      "yearsB": 74.7
    },
    {
      "group": 1,
      "rank": 2,
      "name": "AV-FrenchieUSA",
      "username": "AV-FrenchieUSA",
      "yearsB": 28.5
    },
    {
      "group": 1,
      "rank": 3,
      "name": "AV-Animosity",
      "username": "AV-Animosity",
      "yearsB": 23.1
    },
    {
      "group": 1,
      "rank": 4,
      "name": "AV-SMILINGBANDIT",
      "username": "AV-SmilingBaN…",
      "yearsB": 22.4
    },
    {
      "group": 1,
      "rank": 5,
      "name": "AV-MONSTER",
      "username": "AV-MONSTER.",
      "yearsB": 18.2
    },
    {
      "group": 1,
      "rank": 6,
      "name": "AV-JAKE",
      "username": "AV-JAKE",
      "yearsB": 17.2
    },
    {
      "group": 1,
      "rank": 7,
      "name": "AV-Adigarian",
      "username": "AV-Adigarian",
      "yearsB": 11
    },
    {
      "group": 2,
      "rank": 1,
      "name": "AV-HarryBallsagna",
      "username": "AV-HarryBallso…",
      "yearsB": 50.2
    },
    {
      "group": 2,
      "rank": 2,
      "name": "AV-BLISTER",
      "username": "AV-BLISTER-USA",
      "yearsB": 27.4
    },
    {
      "group": 2,
      "rank": 3,
      "name": "AV-UANGELES",
      "username": "AV-UANGELES",
      "yearsB": 22.8
    },
    {
      "group": 2,
      "rank": 4,
      "name": "AV-ColdCreeps",
      "username": "AV-take.them.out",
      "yearsB": 20.2
    },
    {
      "group": 2,
      "rank": 5,
      "name": "AV-Nicefellow",
      "username": "AV-Nicefellow",
      "yearsB": 20.1
    },
    {
      "group": 2,
      "rank": 6,
      "name": "AV-Starred",
      "username": "AV-Starred",
      "yearsB": 17.9
    },
    {
      "group": 2,
      "rank": 7,
      "name": "AV-Anamiko",
      "username": "AV-Anamiko",
      "yearsB": 12
    },
    {
      "group": 2,
      "rank": 8,
      "name": "AV-InvisibleSpy",
      "username": "AV-InvisibleSpy",
      "yearsB": 9.6
    },
    {
      "group": 3,
      "rank": 1,
      "name": "AV-J",
      "username": "AV-J",
      "yearsB": 63.5
    },
    {
      "group": 3,
      "rank": 2,
      "name": "AV-jacko",
      "username": "AV-jacko",
      "yearsB": 30.5
    },
    {
      "group": 3,
      "rank": 3,
      "name": "AV-CHEN1972",
      "username": "AV-CHEN1972",
      "yearsB": 21.7
    },
    {
      "group": 3,
      "rank": 4,
      "name": "AV-Deviantdan",
      "username": "AV-Deviantdan",
      "yearsB": 18.6
    },
    {
      "group": 3,
      "rank": 5,
      "name": "AV-OblivX",
      "username": "AV-OblivX",
      "yearsB": 18.4
    },
    {
      "group": 3,
      "rank": 6,
      "name": "AV-GNSK",
      "username": "AV-GNSK",
      "yearsB": 17.5
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
      prior.push({date,code,yearsB:r.yearsB,stars:null,sparks:null,sourceNote:notes[date]||''});
      prior.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      D.space.history[r.name]=prior;
    });
  });
  D.space.historicalSourceNotes=Object.assign({},D.space.historicalSourceNotes||{},notes);
})();
