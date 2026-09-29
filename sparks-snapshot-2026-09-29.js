window.AVENGERS_SPARKS_SNAPSHOT = {
  date: '2026-09-29',
  label: 'AVENGERS clan All time Sparks screenshot',
  currentAvengers: [
    {rank:1,name:'AV-INTEN',allTimeSparks:34293810},
    {rank:2,name:'AV-JM',allTimeSparks:27972631},
    {rank:3,name:'AV-HarryBallsagna',allTimeSparks:24881705},
    {rank:4,name:'AV-CHEN1972',allTimeSparks:20944638},
    {rank:5,name:'AV-UANGELES',allTimeSparks:20762947},
    {rank:6,name:'AV-Adigarian',allTimeSparks:16851260},
    {rank:6,name:'AV-Supreeth',allTimeSparks:16850619},
    {rank:7,name:'AV#Rafa#Tun',allTimeSparks:16432398},
    {rank:8,name:'AV.Saberkong',allTimeSparks:14304898},
    {rank:9,name:'AV-Abu//npjp',allTimeSparks:13050009},
    {rank:10,name:'AV-I.S.O',allTimeSparks:12718566},
    {rank:11,name:'AV-ZolikaLoveKira',allTimeSparks:12519264},
    {rank:12,name:'AV-Hoops',allTimeSparks:12416538},
    {rank:13,name:'AV-Finnie',allTimeSparks:12379292},
    {rank:14,name:'AV-SMILINGBANDIT',allTimeSparks:12326164},
    {rank:15,name:'AV-Mr.Mar.Berry',allTimeSparks:12018523},
    {rank:16,name:'AV<STAR-LORD>',allTimeSparks:10854712},
    {rank:17,name:'AV-8!l...Bil',allTimeSparks:10508568},
    {rank:18,name:'AV-Animosity',allTimeSparks:9759116},
    {rank:19,name:'AV-MONSTER',allTimeSparks:9627559},
    {rank:20,name:'AV-Nicefellow',allTimeSparks:8458781},
    {rank:21,name:'AV-Deviantdan',allTimeSparks:8179905},
    {rank:22,name:'AV-RkHendrix',allTimeSparks:7604393},
    {rank:23,name:'AV-no',allTimeSparks:7352045},
    {rank:24,name:'AV-DaG',allTimeSparks:6545132},
    {rank:25,name:'AV-ColdCreeps',allTimeSparks:5676859},
    {rank:26,name:'AV-MotherboardBeans',allTimeSparks:5549626},
    {rank:27,name:'AV-JeffKintz05',allTimeSparks:5307842},
    {rank:28,name:'AV-7-STAR',allTimeSparks:3857403},
    {rank:29,name:'AV-ZIBBY',allTimeSparks:3382230},
    {rank:30,name:'AV-WolfLegend',allTimeSparks:2112753},
    {rank:31,name:'AV-Obajoba',allTimeSparks:1576300},
    {rank:32,name:'AV-Bubba0816',allTimeSparks:1300650},
    {rank:33,name:'AV-Chuck',allTimeSparks:1206064},
    {rank:34,name:'AV-SB',allTimeSparks:1195542},
    {rank:35,name:'AV-Addicted',allTimeSparks:1140565},
    {rank:36,name:'AV-Mendoria',allTimeSparks:838488},
    {rank:37,name:'AV-HN',allTimeSparks:760898},
    {rank:38,name:'AV-Pablin',allTimeSparks:735332},
    {rank:39,name:'AV-Vadik-UA',allTimeSparks:512280},
    {rank:40,name:'AV-BigPapi',allTimeSparks:441761},
    {rank:41,name:'AV-TheOli',allTimeSparks:348658},
    {rank:42,name:'AV-Megalodon',allTimeSparks:329774},
    {rank:43,name:'AV-J',allTimeSparks:320054},
    {rank:44,name:'AV-EXCALIBUR',allTimeSparks:174987},
    {rank:45,name:'AV-Brisket',allTimeSparks:119675},
    {rank:46,name:'AV-23',allTimeSparks:117995},
    {rank:47,name:'AV-EventHorizon',allTimeSparks:76613},
    {rank:48,name:'AV-neez',allTimeSparks:1376},
    {rank:49,name:'AV-JAMO',allTimeSparks:0}
  ]
};

(function(){
  const D=window.AVENGERS_DATA;
  if(!D) return;
  if(!(D.members||[]).some(m=>m.name==='AV-JAMO')){
    D.members.push({
      name:'AV-JAMO',status:'Active',
      piggyPB:0,spacePB:0,krakenPB:0,
      piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,
      rankingScore:0,krakenPBMonth:0,
      ratingPB:0,ratingAvg:0,ratingTotal:0,
      eventsPlayed:0,totalSparks:0
    });
  }
})();
