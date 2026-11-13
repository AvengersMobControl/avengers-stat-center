'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),os=require('node:os'),path=require('node:path');
const {create}=require('./create-site-release.cjs'),{build,browserSource}=require('./build-site.cjs'),{UNITS}=require('./event-projection-core.cjs');
const {load}=require('./load-site-data.cjs');
function boot(r){
  const sandbox={window:{},console};vm.createContext(sandbox);vm.runInContext(browserSource(r),sandbox);
  for(const file of ['community-highlights.js','clan-league-rewards.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),sandbox);
  return sandbox.window;
}
const APPROVED=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/approved-event-updates.json'))).updates;
const BASE=create(),BASEW=boot(BASE),member=(r,name)=>r.globals.AVENGERS_DATA.members.find(m=>m.name===name);
test('gold/silver rating crowns and adjusted ranking project consistently to every member',()=>{
 const P=BASE.projection;
 assert.equal(Object.keys(P.ratingLeaders).length,11,'all approved metric categories are ranked');
 assert(Object.values(P.ratingLeaders).some(rows=>rows.length>=2),'current site has silver runner-up awards');
 for(const projected of P.people){
   const {name}=projected,shown=member(BASE,name),awards=Object.values(projected.ratingCrowns);
   const bonus=Math.round(awards.reduce((s,a)=>s+a.bonus,0)*1000)/1000;
   assert.equal(projected.ratingBonus,bonus,name+' component bonuses reconcile');
   assert.equal(shown.ratingBonus,bonus,name+' site member bonus');
   assert.equal(shown.ratingAdjusted,projected.ratingAdjusted,name+' adjusted rank score');
   assert.deepEqual(shown.ratingCrowns,projected.ratingCrowns,name+' identical site crown metadata');
   assert(Math.abs(shown.ratingAdjusted-shown.ratingTotal-bonus)<1e-9,name+' base rating remains separate');
   if(projected.status==='Inactive')assert.equal(awards.length,0,name+' inactive history cannot receive a crown');
   for(const award of awards){
     assert([1,2].includes(award.rank));assert.equal(award.metal,award.rank===1?'gold':'silver');
     if(award.samples!==null)assert(award.samples>=3,name+' averaging crown requires three known appearances');
   }
 }
 const first=P.rankings.ratingAdjusted[0];
 assert(first&&Math.abs(first.value-Math.max(...P.people.map(p=>Number(p.ratingAdjusted.toFixed(3)))))<1e-9);
});
test('approved achievement thresholds are exact across all five categories',()=>{
 const expected={
  piggy:[10000,20000,30000,40000,50000,60000,70000,80000,90000,100000,111000],
  space:[100,200,300,400,500,600,700,800,900,1000,1111],
  kraken:[1000,2000,3000,4000,5000,6000,7000],
  sparks:[1000000,5000000,10000000,15000000,20000000,30000000,40000000,50000000],
  streak:[3,5,10]
 };
 const actual=Object.fromEntries(BASEW.AVENGERS_COMMUNITY.definitions.map(d=>[d.id,Array.from(d.tiers)]));
 assert.deepEqual(actual,expected);
 const profile=BASEW.AVENGERS_COMMUNITY.achievementProfile('AV-HarryBallsagna');
 assert.equal(profile.badges.length,40,'11 Piggy + 11 Space + 7 Kraken + 8 Sparks + 3 streak tiers');
});
test('approved achievement art maps to all five badges without changing scores',()=>{
 const images={piggy:'piggy.webp',space:'space.webp',kraken:'kraken.webp',sparks:'sparks.webp',streak:'streak.webp'};
 const defs=BASEW.AVENGERS_COMMUNITY.definitions;
 for(const definition of defs){
  assert.equal(definition.image,'assets/achievements/'+images[definition.id]);
  const art=path.join(__dirname,'..',definition.image);
  assert(fs.existsSync(art),'missing site achievement asset '+definition.id);
  assert(fs.statSync(art).size<100000,'optimized achievement asset should stay lightweight: '+definition.id);
 }
 const html=BASEW.AVENGERS_COMMUNITY.profileHtml('AV-HarryBallsagna');
 for(const name of Object.values(images))assert(html.includes('src="assets/achievements/'+name+'"'),'profile contains '+name);
 const badge=BASEW.AVENGERS_COMMUNITY.achievementProfile('AV-HarryBallsagna').categories[0].badges[0];
 assert.equal(badge.image,defs[0].image,'earned badge carries the parent category art');
});
for(const kind of Object.keys(UNITS))for(const clan of ['AVENGERS','AV-2'])test(kind+' / '+clan+' reaches histories, summary, PB/achievements, rewards, leagues and recap after correction/revocation',()=>{
  const name='AV-HarryBallsagna',id=kind+'|fixture',field=kind==='space'?'yearsB':'lines';
  const event={id,kind,date:'2026-10-10',status:'final',unit:UNITS[kind],sources:['fixture:source'],metadata:kind==='flash'?{flash:1}:kind==='kraken'?{monthKey:'fixture',monthLabel:'Fixture'}:{},rows:[{player:name,clan,score:90000,sparks:50,stars:kind==='kraken'?null:500}]};
  const update={approved:true,expectedRevision:0,event};
  function verify(r,score,sparks){
    const w=boot(r),p=r.projection.people.find(p=>p.name===name),b=w.AVENGERS_ROSTER_EVENT_BREAKDOWN.forMember(name),before=BASE.breakdowns[name];
    assert.equal(p.kinds[kind].pb,score===90000?90000:BASE.projection.people.find(p=>p.name===name).kinds[kind].pb);
    assert.equal(b[kind+'Sparks'],before[kind+'Sparks']+sparks);
    assert.equal(member(r,name).status,member(BASE,name).status,'historical clan cannot transfer current roster');
    // A new global last-three/last-five event can change another player's
    // rating even when their own history, membership and payouts do not change.
    const withoutGlobalRating=({ratingMetrics,ratingPoints,ratingPB,ratingAvg,ratingTotal,ratingCrowns,ratingBonus,ratingAdjusted,...rest})=>rest;
    assert.deepEqual(withoutGlobalRating(member(r,'AV-INTEN')),withoutGlobalRating(member(BASE,'AV-INTEN')));
    if(['piggy','space'].includes(kind)){
      assert.equal(member(r,name)[kind+'PB'],p.kinds[kind].pb);
      assert.equal(w.AVENGERS_DATA[kind].history[name].find(x=>x.date===event.date)[field],score);
      assert.equal(w.AVENGERS_DATA[kind].overall.find(x=>x.name===name).pb,p.kinds[kind].pb);
    }
    if(kind==='kraken')assert.equal(w.AVENGERS_KRAKEN_DATA.players.find(x=>x.name===name).fixture,score);
    if(kind==='flash')assert.equal(w.AVENGERS_PIGGY_FLASH_DATA.events.find(x=>x.id==='fixture').entries[0].lines,score);
    const recap=w.AVENGERS_COMMUNITY.weeklyRecap('2026-10-05',clan),baseRecap=BASEW.AVENGERS_COMMUNITY.weeklyRecap('2026-10-05',clan);
    assert.equal(recap.totals.sparks,baseRecap.totals.sparks+sparks);
    const league=w.AVENGERS_CLAN_LEAGUE_REWARDS.build().find(x=>x.end==='2026-10-11');
    const baseLeague=BASEW.AVENGERS_CLAN_LEAGUE_REWARDS.build().find(x=>x.end==='2026-10-11');
    const sum=p=>p.rows.filter(x=>x.clan===clan).reduce((s,r)=>s+r.sparks,0);
    assert(Math.abs(sum(league)-sum(baseLeague)-sparks)<0.001);
    if(kind!=='flash')assert.equal(w.AVENGERS_COMMUNITY.achievementProfile(name).categories.find(x=>x.id===kind).value,p.kinds[kind].pb);
    assert.equal(w.AVENGERS_COMMUNITY.records.filter(x=>x.eventId===id).length,1);
  }
  const added=create({updates:[...APPROVED,update]});verify(added,90000,50);
  const corrected={approved:true,expectedRevision:1,event:{...event,rows:[{...event.rows[0],score:2,sparks:7}]}};
  const lower=create({updates:[...APPROVED,update,corrected]});verify(lower,2,7);
  const revoked=create({updates:[...APPROVED,update,corrected,{approved:true,expectedRevision:2,event:{...corrected.event,status:'revoked'}}]});
  assert.deepEqual(member(revoked,name),member(BASE,name));
  assert.equal(boot(revoked).AVENGERS_COMMUNITY.records.filter(x=>x.eventId===id).length,0);
  const replay=create({updates:[...APPROVED,update,update]});assert.equal(replay.projection.version,added.projection.version);
});
test('verified July 30 source corrections and actual October 2 values agree across profiles/achievements',()=>{
  const w=BASEW,D=w.AVENGERS_DATA;
  for(const [name,score]of Object.entries({'AV-INTEN':129.4,'AV-Abu//npjp':128.6,'AV-GNSK':62.4,'AV-no':38.2,'AV-jacko':73.8,'AV-J1M':55.7}))assert.equal(D.space.history[name].find(r=>r.date==='2026-07-30').yearsB,score);
  assert.equal(D.space.events['2026-10-02'].find(r=>r.name==='AV-Zolika.x.TheBoss').yearsB,480.6);
  assert.equal(D.members.find(m=>m.name==='AV-HarryBallsagna').spacePB,549.9);
  assert.equal(w.AVENGERS_COMMUNITY.achievementProfile('AV-HarryBallsagna').categories.find(c=>c.id==='space').value,549.9);
  assert.equal(D.members.find(m=>m.name==='DedHed').piggyPB,111);
  assert.equal(D.members.find(m=>m.name==='Basecreature').spacePB,9.45);
  assert.equal(D.resolvePlayerName('AV-CHUCK'),D.resolvePlayerName('AV-Chuck'));
  assert.notEqual(D.resolvePlayerName('AV-Frenchie2'),D.resolvePlayerName('AV-Frenchie(-4)'));
});
test('Zolika TheBoss is one canonical profile with old Kira aliases and unmodified rewards',()=>{
  const P=BASE.projection,D=BASEW.AVENGERS_DATA,R=BASE.globals.AVENGERS_MEMBER_TIMEZONES;
  const boss='AV-Zolika.x.TheBoss';
  for(const name of [boss,'AV-Zolika.x.Kira','AV-ZolikaLoveKira','AV-Zolika.x.The...'])
    assert.equal(D.resolvePlayerName(name),boss,'old alias resolves: '+name);
  assert.equal(P.people.filter(p=>p.name===boss).length,1,'one canonical account');
  assert(!P.people.some(p=>p.name==='AV-Zolika.x.Kira'),'no obsolete second profile');
  assert.equal(D.members.filter(m=>m.name===boss).length,1,'one displayed member');
  assert.equal(R.rows.filter(r=>r.name===boss&&r.status==='Active').length,1,'current roster display name updated');
  assert.equal(R.byName[boss].canonicalName,boss,'location lookup updated');
  assert.equal(D.space.events['2026-10-02'].find(r=>r.name===boss).yearsB,480.6,'Oct 2 corrected distance retained');
  const oct16=P.events.find(e=>e.id==='space|2026-10-16');
  const reward=oct16.rows.find(r=>r.player===boss&&r.clan==='AVENGERS');
  assert(reward,'Oct 16 event-time AVENGERS attribution preserved');
  assert.equal(reward.score,555);assert.equal(reward.sparks,415318);assert.equal(reward.stars,4153180);
  const person=P.people.find(p=>p.name===boss);
  assert.equal(person.categories.space.sparks,person.history.filter(r=>r.kind==='space').reduce((v,r)=>v+(r.sparks||0),0),'no double-counted Space payout');
  assert(P.people.some(p=>p.name==='AV-KiraLoveZolika'),'separate Kira account remains distinct');
});
test('AV-2 Kraken FrenchieUSA source belongs exclusively to Frenchie2; totals and banner reconcile',()=>{
  const p=BASE.projection;
  assert.equal(p.coverage.unassignedRows.length,0);
  const event=p.events.find(e=>e.id==='kraken|oct');
  const frenchie2=event.rows.find(r=>r.player==='AV-Frenchie2'&&r.clan==='AV-2');
  assert(frenchie2);
  assert.equal(frenchie2.score,36.2);
  assert.equal(frenchie2.sparks,18100);
  assert.equal(event.rows.filter(r=>r.player==='AV-Frenchie2'&&r.clan==='AV-2').length,1);
  const person=p.people.find(x=>x.name==='AV-Frenchie2');
  assert.equal(person.history.find(r=>r.eventId==='kraken|oct').sparks,18100);
  const total=p.people.reduce((s,p)=>s+p.earned.sparks,0);
  const clan=Object.values(p.clans).reduce((s,c)=>s+c.sparks,0)+p.coverage.unknownClanRewards.sparks;
  assert(Math.abs(total-clan)<0.001);
  assert.equal(BASE.globals.AVENGERS_KRAKEN_DATA.octEventTotals['AV-2'].sparks,8193179.9);
});
test('complete staged site uses one projection bundle, immutable script/CSS references, versioned exports and deterministic output',()=>{
  const dest=fs.mkdtempSync(path.join(os.tmpdir(),'avengers-release-'));
  try{
    const r=build({destination:dest}),html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
    assert(!html.includes('window.AVENGERS_DATA = '));assert(!html.includes('src="piggy-2026-10-11.js"'));
    for(const m of html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)){assert.match(m[1],/\.[a-f0-9]{16}\.(js|css)$/);assert(fs.existsSync(path.join(dest,m[1])));}
    for(const file of Object.values(r.manifest.exports))assert.equal(JSON.parse(fs.readFileSync(path.join(dest,file))).version,r.manifest.version);
    assert.equal(r.manifest.version,BASE.projection.version);
    assert.equal(r.manifest.unattendedIngestionEnabled,false);
    const commit=(process.env.GITHUB_SHA||process.env.VERCEL_GIT_COMMIT_SHA||'');
    if(/^[0-9a-f]{40}$/i.test(commit)){
      assert.equal(r.manifest.sourceCommit,commit.toLowerCase());
      assert(html.includes('data-release-commit="'+commit.toLowerCase()+'"'));
    }else assert.equal(r.manifest.sourceCommit,null);

  }finally{fs.rmSync(dest,{recursive:true,force:true});}
});
test('linked Lin and corrected Jeff canonical history and first AVENGERS Piggy are published once',()=>{
  const R=BASE.globals.AVENGERS_MEMBER_TIMEZONES,D=BASE.globals.AVENGERS_DATA;
  const people=BASE.projection.people;
  const active=R.rows.filter(r=>r.status==='Active'),av2=R.rows.filter(r=>r.status==='AV2');
  assert.equal(active.length,49);assert.equal(av2.length,51);
  for(const name of ['AV-Lin','AV-Chuck','AV-no','AV-TRINITY','AV-istanbuL','AV-KKD','AV-KitKat','AV-Hoops','AV-JAMO','AV.ziyad','AV.atarIX','AV-Dreadrixter-UA','AV-Dubai']){
    assert.equal(R.byName[name]?.status,'Active',name+' roster');
    assert.equal(D.members.filter(m=>m.name===name&&m.status==='Active').length,1,name+' unique profile');
    assert.equal(people.find(p=>p.name===name)?.status,'Active',name+' projection');
    assert(!av2.some(r=>r.name===name),name+' no current AV-2 listing');
  }
  for(const name of ['AV#Rafa#Tun','AV-Oakcliff','AV-Royal','AV-SiFra','AV-Pablin','AV-MotherboardBeans','AV-Neez','AV-JefhKintz05'])assert.equal(R.byName[name]?.status,'AV2',name+' transferred or retained in AV-2');
  for(const name of ['AV-23','AV-Timmy']){
    assert.equal(R.byName[name]?.status,'Inactive',name+' removed from current rosters');
    assert.equal(people.find(p=>p.name===name)?.status,'Inactive');
    assert(![...active,...av2].some(r=>r.name===name),name+' not counted in a current clan');
    assert(people.find(p=>p.name===name).history.length>0,name+' historical results preserved');
  }
  for(const name of ['AV2-OlRose','AV-2.SURVIVOR','AV2-Thoszi']){
    assert.equal(R.byName[name]?.status,'AV2',name+' confirmed AV-2 roster');
    assert.equal(people.filter(p=>p.name===name&&p.status==='AV2').length,1,name+' existing event identity is current AV-2 member');
    assert.deepEqual(people.find(p=>p.name===name).history.filter(h=>h.date>='2026-11-06').map(h=>h.kind).sort(),['piggy','space'],name+' two source-verified results retained');
  }
  assert.equal(R.byName['TheHemperor']?.status,'AV2','TheHemperor is a current AV-2 participant');
  assert.equal(BASEW.AVENGERS_DATA.resolvePlayerName('AV2-TheHemperor'),'TheHemperor');
  assert.equal(BASEW.AVENGERS_DATA.resolvePlayerName('AV2-J'),'AV-J');
  assert.equal(BASEW.AVENGERS_DATA.resolvePlayerName('AV-CRISPIN.27'),'AV-CRISPIN.97');
  assert.equal(R.byName['AV-ShielDBreaker']?.status,'Active','ShieldBreaker retains main-clan membership');
  assert.equal(BASEW.AVENGERS_DATA.resolvePlayerName('AV-ShieldBreaker'),'AV-ShielDBreaker','recent capitalization resolves to existing member');
  assert(!people.some(p=>p.name==='AV-ShieldBreaker'),'no inactive duplicate ShieldBreaker profile');
  assert(people.find(p=>p.name==='AV-ShielDBreaker').history.some(h=>h.eventId==='piggy|2026-11-08'&&h.score===8556),'ShieldBreaker Big Pig result merged into existing history');
  assert.equal(R.byName['AV-WolfLegend']?.status||'Inactive','Inactive','WolfLegend inactive');
  assert.equal(R.byName['AV-Nicefellow']?.status,'Active','Nicefellow remains Active');
  assert.equal(BASEW.AVENGERS_DATA.resolvePlayerName('AV-JeffKintz05'),'AV-JefhKintz05');
  assert.equal(BASEW.AVENGERS_DATA.resolvePlayerName('AV-2Lin'),'AV-Lin');
  assert.equal(R.byName['AV-JeffKintz05'].canonicalName,'AV-JefhKintz05');
  assert.equal(R.byName['AV-2Lin'].canonicalName,'AV-Lin');
  assert(!people.some(p=>['AV-JeffKintz05','AV-2Lin','LT'].includes(p.name)),'obsolete duplicate/shell profiles excluded');
  assert(!D.members.some(m=>['AV-JeffKintz05','AV-2Lin','LT'].includes(m.name)));
  assert.equal(people.find(p=>p.name==='AV-ZIBBY').status,'AV2');
  assert.equal(R.byName['AV-ZIBBY'].status,'AV2');
  const race=BASE.ledger.events.find(e=>e.id==='piggy|2026-10-18');
  for(const [name,score]of [['AV-Lin',31749],['AV-JefhKintz05',15420],['AV-SiFra',44258]]){
    const r=race.rows.find(x=>x.player===name);
    assert(r&&r.score===score&&r.clan==='AVENGERS',name+' event-time result unchanged');
  }
  const lin=people.find(p=>p.name==='AV-Lin');
  assert.equal(lin.history.filter(r=>r.date<='2026-10-21').length,14,'historic Lin results retained before the new race');
  assert.equal(lin.history.filter(r=>r.clan==='AV-2').length,10);
  assert.equal(lin.history.filter(r=>r.clan==='AVENGERS'&&r.date<='2026-10-21').length,4);
  assert(lin.snapshotBreakdown.some(r=>r.sourceName==='AV-2Lin'&&r.clan==='AV-2'));
  const linTransition=lin.kinds.piggy.pbs.find(p=>p.eventId==='piggy|2026-10-18');
  assert.equal(linTransition.firstRecorded,false,'previous AV-2 result retained');
  assert.equal(linTransition.firstClanRecorded,true,'AVENGERS first race still new member');
  assert.equal(linTransition.firstClanRecorded,true,'historical new-member designation remains source-backed');
  const jeff=people.find(p=>p.name==='AV-JefhKintz05');
  assert.equal(jeff.screenshotGap,0,'official sub-1% exclusion supersedes earlier frozen Jeff candidate; screenshot evidence survives rename');
  assert(jeff.snapshotBreakdown.some(r=>r.clan==='AV-2'&&r.sourceName==='AV-JefhKintz05'));
  assert(jeff.snapshotBreakdown.some(r=>r.clan==='AVENGERS'&&r.amount===5307842),'historic AVENGERS screenshot total unchanged');
  assert(people.find(p=>p.name==='AV-SiFra').snapshotBreakdown.some(r=>r.clan==='AV-2'));
  assert.equal(BASE.globals.AVENGERS_SPARKS_SNAPSHOT.currentAv2.length,39,'public AV-2 snapshot excludes zero-event removed accounts');
  assert.equal(BASE.globals.AVENGERS_SPARKS_SNAPSHOT.currentAvengersStars.length,47,'removed LT not published');
});
test('Council-approved October 30 location updates retain verified identities, independent TZG and snapshots',()=>{
  const R=BASE.globals.AVENGERS_MEMBER_TIMEZONES,D=BASE.globals.AVENGERS_DATA;
  const verified=[
    ['AV-BigPapi',-4,'USA-Eastern DST','NJ'],
    ['AV-Fahad',3,'Qatar',''],
    ['AV-JAMO',null,'Philippines',''],
    ['AV-Rita',-5,'USA-Central DST','TX'],
    ['AV-McNasty',-5,'USA-Central DST',''],
    ['AV-KKD',null,'USA-Eastern Time','NY'],
    ['AV-Royal',null,'India',''],
    ['AV-ItsNospace',null,'Canada - Eastern Time',''],
    ['AV-ShielDBreaker',null,'USA-Eastern Time','FL'],
    ['AV-Timmy',null,'Germany',''],
    ['AV-Fred',null,'France',''],
    ['AV-Oakcliff',null,'USA',''],
    ['AV-istanbuL',3,'Türkiye',''],
    ['AV-TRINITY',8,'Philippines',''],
    ['AV-23',-3,'Chile',''],
    ['AV2-Brisket',null,'USA-Central Time','TX'],
    ['AV-8!l...Bil',2,'Lebanon',''],
    ['AV-SweetiePL',1,'Poland','']
  ];
  for(const [name,utc,location,state] of verified){
    const row=R.byName[name];
    assert(row,'missing current identity '+name);
    assert.equal(row.utc,utc,name+' UTC');
    assert.equal(row.location,location,name+' location');
    assert.equal(row.state,state,name+' state');
  }
  assert.equal(R.byName['AV2-Brisket'].canonicalName,'AV-Brisket','Brisket AV-2 screenshot matches existing player profile');
  assert.equal(R.byName['AV-Brisket'].location,'USA-Central Time');
  assert.equal(D.aliasMap['AV2-Brisket'],'AV-Brisket','no duplicate Brisket profile');
  assert.equal(R.byName['AV-ShielDBreaker'].city,'Riverview');
  assert.equal(R.byName['AV-Oakcliff'].timeZoneLabel,'Central Time');
  assert.equal(R.byName['AV-Oakcliff'].location,'USA','Oakcliff country confirmed by leader');
  assert.equal(R.byName['AV-Oakcliff'].utc,null,'Oakcliff UTC remains unknown');
  assert.equal(R.byName['AV-8!l...Bil'].timeZoneId,'Asia/Beirut');
  assert.equal(R.byName['AV-SweetiePL'].timeZoneId,'Europe/Warsaw');
  assert.equal(R.byName['AV-8!l...Bil'].timeZoneGroup,'2','Bil TZG is independent of UTC');
  assert.equal(R.byName['AV-SweetiePL'].timeZoneGroup,'2','Sweetie TZG is independent of UTC');
  assert.equal(R.byName['AV-BigPapi'].timeZoneGroup,'1','BigPapi TZG unchanged');
  assert.equal(R.byName['AV-23'].timeZoneGroup,'','AV-23 TZG not inferred from UTC');
  assert.equal(R.byName['AV-TRINITY'].timeZoneGroup,'','TRINITY TZG not inferred from UTC');
  assert.equal(R.byName['AV-istanbuL'].timeZoneGroup,'','istanbuL TZG not inferred from UTC');
  assert.equal(R.byName['AV-Zolika.x.TheBoss'].location,'Netherlands','Zolika residence retained; nationality not inferred');
  assert.equal(BASE.globals.AVENGERS_SPARKS_SNAPSHOT.currentAv2.length,39,'published AV-2 snapshot excludes retired zero-event players');
  for(const name of ["GirlsOnly","yooossss","Shelby","Piton","Jamaica","AV-AC3","Pro","Creatureboost"]){
    assert(!R.rows.some(r=>r.name===name),'Removed member remains in published roster: '+name);
    assert(!D.members.some(m=>m.name===name),'Removed member remains in site profile data: '+name);
    assert(!BASE.projection.people.some(p=>p.name===name),'Removed member remains in published projection: '+name);
    assert(!BASE.globals.AVENGERS_SPARKS_SNAPSHOT.currentAv2.some(p=>p.name===name),'Removed member remains in historical site snapshot: '+name);
    assert(!BASE.ledger.events.some(e=>e.rows.some(p=>p.player===name)),'Removed member had an event row: '+name);
  }
  assert.equal(BASE.globals.AVENGERS_SPARKS_SNAPSHOT.currentAvengersStars.length,47,'dated raw AVENGERS screenshot unchanged');
});
test('leader-deleted AV-2 accounts have no public profiles, roster membership or event rows',()=>{
 const gone=['Keyler','AV-Keyler','Blade','AV-2(TAMIM)'];
 const R=BASE.globals.AVENGERS_MEMBER_TIMEZONES,D=BASE.globals.AVENGERS_DATA,S=BASE.globals.AVENGERS_SPARKS_SNAPSHOT;
 for(const name of gone){
  assert(!R.rows.some(x=>x.name===name));assert(!Object.hasOwn(R.byName,name));
  assert(!D.members.some(x=>x.name===name));
  assert(!BASE.projection.people.some(x=>x.name===name));
  assert(!BASE.ledger.events.some(e=>e.rows.some(x=>x.player===name)));
  assert(!S.currentAv2.some(x=>x.name===name));
 }
 const c=BASE.ledger.events.find(e=>e.id==='kraken|oct');
 assert(c&&!c.rows.some(x=>x.player==='Blade'));
});
test('current roster and every materialized PB/reward agree with independent canonical source sums',()=>{
  const D=BASE.globals.AVENGERS_DATA,R=BASE.globals.AVENGERS_MEMBER_TIMEZONES;
  assert.equal(R.rows.filter(r=>r.status==='Active').length,49);assert.equal(R.rows.filter(r=>r.status==='AV2').length,51);
  const events=BASE.projection.events.filter(e=>e.status!=='revoked');
  for(const m of D.members){
    // Approved overlays may retain their original source alias; compare canonically.
    const rows=events.flatMap(e=>e.rows.filter(r=>r.player&&BASEW.AVENGERS_DATA.resolvePlayerName(r.player)===m.name).map(r=>({...r,kind:e.kind})));
    for(const kind of ['piggy','space','kraken']){
      const scores=rows.filter(r=>r.kind===kind&&r.score!==null).map(r=>r.score);
      assert.equal(m[kind+'PB'],scores.length?Math.max(...scores):0,m.name+' '+kind);
    }
    const earned=rows.reduce((s,r)=>s+(r.sparks||0),0);assert(Math.abs(BASE.breakdowns[m.name].eventLoggedSparks-earned)<0.001);
  }
});
test('correcting an older event-time clan recalculates dependent inferred Kraken payout',()=>{
  const source=BASE.ledger.events.find(e=>e.id==='piggy|2026-06-28');
  const event={...source,rows:source.rows.map(r=>r.player==='AV-HarryBallsagna'?{...r,clan:'AV-2'}:r)};
  const changed=create({updates:[...APPROVED,{approved:true,expectedRevision:1,event}]});
  const payout=changed.projection.events.find(e=>e.id==='kraken|june').rows.find(r=>r.player==='AV-HarryBallsagna');
  assert.equal(payout.clan,'AV-2');assert.equal(payout.sparks,4385.136*500);
  assert.equal(member(changed,'AV-HarryBallsagna').status,'Active');
});

test('real Hoops Sept 29 AVENGERS Sparks survive transfer to AV-2 on published roster',()=>{
 const hoop=BASE.projection.people.find(p=>p.name==='AV-Hoops');
 assert(hoop,'Hoops canonical profile missing');
 assert.equal(hoop.snapshotBreakdown.find(s=>s.clan==='AVENGERS'&&s.beforeDate==='2026-09-30')?.amount,12416538);
 const oct15=hoop.snapshotBreakdown.find(s=>s.clan==='AV-2'&&s.beforeDate==='2026-10-16');
 assert(oct15&&oct15.amount===0);
 const avBase=hoop.snapshotBreakdown.find(s=>s.clan==='AVENGERS'&&s.amount===12416538);
 assert(avBase.gap>0,'Hoops needs documented historical unlogged Sparks');
 const post=hoop.history.filter(r=>r.date>='2026-09-30').reduce((t,r)=>t+(r.sparks||0),0);
 // Snapshot evidence predates Spark-reward policy correction. The approved
 // historic Unlogged balance stays static rather than re-tuned to a new gap.
 assert.equal(hoop.totalSparks,hoop.earned.sparks+hoop.screenshotGap);
 assert.equal(BASE.breakdowns[hoop.name].screenshotGap,hoop.screenshotGap);
 assert.equal(BASE.breakdowns[hoop.name].eventLoggedSparks,hoop.earned.sparks);
 const trackedAfterSep29=post;
 const oldOtherClan=hoop.history.filter(r=>r.date<'2026-09-30'&&r.clan==='AV-2').reduce((t,r)=>t+(r.sparks||0),0);
 console.log('HOOPS_SPARKS_PROJECTION '+JSON.stringify({
   snapshotSep29:12416538,trackedAfterSep29,trackedBeforeSep29OtherClan:oldOtherClan,
   loggedSparks:hoop.earned.sparks,unloggedSparks:hoop.screenshotGap,totalSparks:hoop.totalSparks,
   evidence:hoop.snapshotBreakdown
 }));
});

test('Adigarian does not get artificial gap from a reset returning-clan counter',()=>{
 const p=BASE.projection.people.find(x=>x.name==='AV-Adigarian');
 assert(p);
 const earlier=p.snapshotBreakdown.find(s=>s.clan==='AVENGERS'&&s.amount===16851260);
 const later=p.snapshotBreakdown.find(s=>s.clan==='AVENGERS'&&s.amount===2228373);
 assert(earlier&&later);
 assert.equal(earlier.beforeDate,'2026-09-30');
 assert.equal(later.beforeDate,'2026-10-16');
 const {originallyObservedGap}=require('./audit-transfer-restorations.cjs');
 assert(Math.abs(p.screenshotGap-Math.max(0,...p.snapshotBreakdown.map(s=>originallyObservedGap(p,s))))<=0.5);
 assert.equal(p.totalSparks,p.earned.sparks+p.screenshotGap);
});

const {audit:transferAudit}=require('./audit-transfer-restorations.cjs');
test('transfer restoration reconciles every current member, not only Hoops',()=>{
 const result=transferAudit(BASE);
  assert.equal(result.summary.roster,100);
  assert.equal(result.rows.length,100);
 for(const r of result.rows){
  const player=BASE.projection.people.find(p=>p.name===r.name);
  assert(player,'Missing member '+r.name);
  assert.equal(r.logged,BASE.breakdowns[r.name].eventLoggedSparks);
  assert.equal(r.unlogged,player.screenshotGap||0);
  assert.equal(r.total,player.totalSparks);
  assert(Math.abs(r.total-r.logged-r.unlogged)<0.001);
  const b=BASE.breakdowns[r.name];
  assert(Math.abs(r.logged-b.piggySparks-b.spaceSparks-b.flashSparks-b.krakenSparks)<0.001);
 }
 const hoops=result.rows.find(r=>r.name==='AV-Hoops');
 assert(hoops&&hoops.unlogged>0);
 const after=BASE.projection.people.find(p=>p.name==='AV-Hoops').history
  .filter(r=>r.date>='2026-09-30').reduce((n,r)=>n+(r.sparks||0),0);
 assert.equal(hoops.total,hoops.logged+hoops.unlogged,'cannot dynamically recalculate frozen Unlogged Spark balances');
 assert.equal(hoops.unlogged,require('../data/sparks-prior-to-logging-2026-10-16.json').amounts['AV-Hoops']);
 assert(result.rows.find(r=>r.name==='AV-Adigarian').screenshots>=2);
});

test('official 28 Unlogged Sparks remain frozen after one-time 1% exclusion',()=>{
 const fixed=require('../data/sparks-prior-to-logging-2026-10-16.json');
 const amounts=fixed.amounts;
 assert.equal(Object.keys(amounts).length,28);
 assert.equal(Object.keys(fixed.excludedBelowOnePercent).length,13);
 assert.equal(Object.keys(fixed.excludedRoundingReview).length,6);
 assert.equal(Object.values(amounts).reduce((s,n)=>s+n,0),32404095);
 assert.equal(fixed.approvedTotalSparks,32404095);
 for(const [name,prior] of Object.entries(amounts)){
   assert(Number.isSafeInteger(prior)&&prior>=1000,'not a rounded historical amount: '+name);
   const p=BASE.projection.people.find(x=>x.name===name);
   if(name==='AV-Keyler'){assert(!p,'leader-removed account must be absent from public projections');continue;}
   assert(p,'missing account '+name);
   assert.equal(p.screenshotGap,prior);
   assert.equal(p.totalSparks,p.earned.sparks+prior);
 }
 for(const [name,raw] of Object.entries(fixed.originalFractionalGaps)){
   if(Object.hasOwn(amounts,name))assert.equal(amounts[name],Math.round(raw),'rounded retained source must match evidence '+name);
   else assert(Object.hasOwn(fixed.excludedBelowOnePercent,name),'excluded original fractional evidence retained: '+name);
 }
 for(const [name,ev] of Object.entries(fixed.excludedBelowOnePercent)){
   const p=BASE.projection.people.find(x=>x.name===name);
   const canonical=BASE.globals.AVENGERS_DATA.aliasMap?.[name]||name;
   const resolved=BASE.projection.people.find(x=>x.name===canonical)||p;
   assert(resolved&&resolved.screenshotGap===0,'excluded sub-1% candidate must be zero: '+name);
   assert(ev.originalUnloggedSparks>0&&ev.sharePctAtApproval<1,'retained historical screenshot and cutoff evidence');
 }
 for(const name of Object.keys(fixed.excludedRoundingReview)){
   const p=BASE.projection.people.find(x=>x.name===name);
   if(['GirlsOnly','yooossss','Shelby','Piton','Jamaica','AV-AC3','Pro','Creatureboost'].includes(name))assert(!p,'removed zero-event account must not have a public profile: '+name);
   else assert(p&&p.screenshotGap===0,'excluded small discrepancy should remain zero: '+name);
 }
});
test('near-one-million AV gaps appear in both dated photos and are not additive',()=>{
 for(const name of ['AV-I.S.O','AV<STAR-LORD>','AV-SMILINGBANDIT']){
  const p=BASE.projection.people.find(x=>x.name===name),e=p?.snapshotBreakdown||[];
  assert.equal(e.length,2,name+' two screenshot dates');
  assert.equal(e[0].beforeDate,'2026-09-30');
  assert.equal(e[1].beforeDate,'2026-10-16');
  assert(e[0].gap>900000&&e[1].gap>900000,name+' original gaps');
  assert(Math.abs(e[0].gap-e[1].gap)<30000,name+' stable over time');
  const {originallyObservedGap}=require('./audit-transfer-restorations.cjs');
  assert(Math.abs(p.screenshotGap-Math.max(...e.map(s=>originallyObservedGap(p,s))))<=0.5);
 }
});

test('Fred active independently of Frank and TheOli transfer preserves event-time clans',()=>{
  const R=BASE.globals.AVENGERS_MEMBER_TIMEZONES;
  assert.equal(BASEW.AVENGERS_DATA.resolvePlayerName('AV-FrankAbagnale'),'AV-Addicted');
  assert.equal(R.rows.filter(r=>r.name==='AV-FrankAbagnale'&&r.status==='Active').length,1);
  assert.equal(R.rows.filter(r=>r.name==='AV-Fred'&&r.status==='Active').length,1);
  assert.equal(BASE.projection.people.filter(p=>p.name==='AV-Addicted').length,1);
  const fred=BASE.projection.people.find(p=>p.name==='AV-Fred');
  assert.equal(fred.status,'Active');assert.equal(fred.history.filter(r=>r.date<'2026-10-23').length,1);
  assert.equal(R.byName['AV-TheOli'].status,'AV2');
  assert.equal(BASE.projection.people.find(p=>p.name==='AV-TheOli').status,'AV2');
  const old=BASE.projection.people.find(p=>p.name==='AV-TheOli').history;
  assert(old.length>0);
  assert(old.some(r=>r.clan==='AVENGERS'),'historical AVENGERS participation retained');
});

test('October 23 identities preserve former-member history and add only confirmed AV-2 profiles',()=>{
 const R=BASE.globals.AVENGERS_MEMBER_TIMEZONES,D=BASE.globals.AVENGERS_DATA;
 const resolve=BASEW.AVENGERS_DATA.resolvePlayerName;
 assert.equal(R.byName['AV-Animosity'].status,'Inactive');
 const former=BASE.projection.people.find(p=>p.name==='AV-Animosity');
 assert(former.history.length>0,'former member history retained');
 for(const name of ['Mickzzz','AV2-Froyo']){
   assert.equal(R.byName[name].status,'AV2');
   const matches=BASE.projection.people.filter(p=>p.name===name);
   assert.equal(matches.length,1);
   // Profiles start with the verified Oct 23 Piggy; Mickzzz later logged Oct 25 Space.
   const ids=matches[0].history.map(h=>h.eventId).sort();
   assert.deepEqual(ids,name==='Mickzzz'?['piggy|2026-10-23','space|2026-10-25']:['piggy|2026-10-23','piggy|2026-11-08','space|2026-10-30','space|2026-11-06']);
   assert.equal(matches[0].totalSparks,name==='Mickzzz'?16519+11357:5506+7601+6860+15000);
 }
 assert.equal(resolve('AVS9.Saberkong'),'AV.Saberkong');
 assert.equal(resolve('AVS9-HN'),'AV-HN');
 assert.equal(resolve('AV-FrankAbagnale'),'AV-Addicted');
});

test('October 23 partial final Piggy is coherent across source, profiles and clan totals',()=>{
 const e=BASE.ledger.events.find(e=>e.id==='piggy|2026-10-23');
 assert.equal(e.status,'partial');assert.equal(e.rows.length,69);
 assert.equal(e.rows.filter(r=>r.clan==='AVENGERS').length,49);
 assert.equal(e.rows.filter(r=>r.clan==='AV-2').length,19);
 assert.equal(e.rows.find(r=>r.player==='AV-Animosity').clan,'American 50.0');
 assert.equal(e.rows.find(r=>r.player==='AV-Timmy').sparks,243586);
 assert.equal(e.rows.find(r=>r.player==='AV-J').score,2342);
 assert(!e.rows.some(r=>r.player==='AV2-J'||r.score===1));
 const p=BASE.projection.people.find(p=>p.name==='AV-WolfLegend');
 assert.equal(p.kinds.piggy.pb,60216);
 assert.equal(p.kinds.piggy.pbs.find(r=>r.eventId===e.id).previousPB,50388);
 assert.equal(e.rows.reduce((s,r)=>s+r.sparks,0),9439482);
 assert.equal(e.rows.reduce((s,r)=>s+r.stars,0),94394836);
 assert.equal(e.sources.length,16);assert(e.sources.every(s=>/^reviewed-image-sha256:[a-f0-9]{64}$/.test(s)));
});

test('October 23 main lobby includes every original rank with both final tail scores',()=>{
 const e=BASE.ledger.events.find(e=>e.id==='piggy|2026-10-23');
 const main=e.rows.filter(r=>r.metadata?.lobby==='AV-main');
 assert.equal(main.length,50);
 assert.deepEqual(main.map(r=>r.metadata.rank).sort((a,b)=>a-b),Array.from({length:50},(_,i)=>i+1));
 assert.equal(e.metadata.mainLobbyCoverageComplete,true);
 for(const [name,rank,score]of [['AV-KNAVEN',49,2602],['AV#Rafa#Tun',50,2477]]){
   const r=main.find(r=>r.player===name);
   assert.equal(r.metadata.rank,rank);assert.equal(r.score,score);
   assert.equal(r.stars,90217);assert.equal(r.sparks,9022);
 }
});

test('legacy alias feeds and final Big Pig recognize AV-Zolika.x.TheBoss without splitting history',()=>{
  const boss='AV-Zolika.x.TheBoss',legacy=load().AVENGERS_DATA;
  const resolve=name=>{
    const seen=new Set();
    while(legacy.aliasMap[name]&&legacy.aliasMap[name]!==name){
      assert(!seen.has(name),'alias cycle: '+name);
      seen.add(name);name=legacy.aliasMap[name];
    }
    return name;
  };
  for(const alias of [boss,'AV-Zolika.x.Kira','AV-ZolikaLoveKira','ZolikaLoveKira','AV-Zolika.x.The...','AV-Zolika.x.The']){
    assert.equal(resolve(alias),boss,'historical Zolika alias: '+alias);
    assert.equal(BASEW.AVENGERS_DATA.resolvePlayerName(alias),boss,'published alias: '+alias);
  }
  assert.equal(resolve('AV-KiraLoveZolika'),'AV-KiraLoveZolika','Kira is a different account');
  assert.equal(BASEW.AVENGERS_DATA.resolvePlayerName('AV-KiraLoveZolika'),'AV-KiraLoveZolika');
  const P=BASE.projection;
  assert.equal(P.people.filter(p=>p.name===boss).length,1,'exactly one Zolika profile');
  for(const old of ['AV-Zolika.x.Kira','AV-ZolikaLoveKira'])
    assert(!P.people.some(p=>p.name===old),'no duplicate profile for '+old);
  const latest=P.events.find(e=>e.id==='piggy|2026-10-23');
  assert(latest,'October 23 Big Pig is in canonical projection');
  assert.equal(latest.rows.find(r=>r.player===boss)?.score,57487,'Oct23 lines preserved');
  const historic=P.events.find(e=>e.id==='piggy|2026-09-20');
  assert(historic,'September 20 historical Piggy preserved');
  assert.equal(historic.rows.find(r=>r.player===boss)?.score,57985,'Sep20 PB retained under boss');
  assert(57985>57487,'Oct23 must NOT be misreported as a career line PB');
  assert(P.people.some(p=>p.name==='AV-KiraLoveZolika'),'Kira separate profile retained');
});
test('leader-verified she/her pronouns attach only to the 14 canonical member profiles',()=>{
  const source=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/member-pronouns-2026-11-02.json'),'utf8'));
  const D=BASE.globals.AVENGERS_DATA;
  const expected=[...new Set(source.sheHer.map(name=>BASEW.AVENGERS_DATA.resolvePlayerName(name)))].sort();
  assert.equal(source.sheHer.length,14,'12 screenshot members plus Lin and TRINITY, without duplicate KKD');
  assert.equal(expected.length,14,'no merged or duplicate canonical members');
  const assigned=D.members.filter(m=>m.pronouns==='she/her').map(m=>m.name).sort();
  assert.deepEqual(assigned,expected,'assign only explicitly confirmed members');
  assert.equal(D.members.filter(m=>m.pronouns&&m.pronouns!=='she/her').length,0,'do not infer other pronouns');
  const {piggyLeaderTitle}=require('../member-profile-insights.js');
  for(const name of expected){
    const match=D.members.filter(m=>m.name===name);
    assert.equal(match.length,1,name+' must be a single existing canonical member');
    assert.equal(match[0].pronouns,'she/her',name+' carries leader-confirmed pronouns');
    assert.equal(match[0].status,BASE.projection.people.find(p=>p.name===name)?.status,name+' current roster status unchanged');
    assert.equal(piggyLeaderTitle(match[0].pronouns),'Piggy Queen',name+' uses Queen title when leading Piggy');
  }
  assert.equal(piggyLeaderTitle('he/him'),'Piggy King');
  assert.equal(piggyLeaderTitle(undefined),'Piggy Leader');
  assert(browserSource(BASE).includes('"pronouns":"she/her"'),'published release embeds the verified member metadata');
});

test('Nov 6 Space original screenshot tail, Zolika and AV-2 identity reconciliation preserve event clan',()=>{
  const e=BASE.ledger.events.find(x=>x.id==='space|2026-11-06');
  assert(e&&e.status==='partial');
  assert.equal(e.rows.length,63,'Original final-screen tail restores the previously held AV-2 rank 8');
  assert.equal(e.rows.filter(r=>r.clan==='AVENGERS').length,46,'46 verified main-clan Space results');
  assert.equal(e.rows.filter(r=>r.clan==='AV-2').length,17,'17 source-linked AV-2 result rows');
  for(const [clan,lobby,expectedRanks] of [
    ...['A','B','C','E'].map(lobby=>['AVENGERS',lobby,[1,2,3,4,5,6,7,8,9]]),
    ['AVENGERS','D',[1,2,3,4,5,6,7,8]],
    ['AVENGERS','F',[1]],
    ['AV-2','G',[1,2,3,4,5,6,7,9]],
    ['AV-2','H',[1,2,3,4,5,6,7,8,9]]
  ]){
    assert.deepEqual(e.rows.filter(r=>r.clan===clan&&r.metadata?.lobby===lobby)
      .map(r=>r.metadata.rank).sort((a,b)=>a-b),expectedRanks,
    clan+' lobby '+lobby+' must include every original visible clan-tagged finish; outsiders excluded');
  }
  for(const [player,clan,lobby,rank,score,stars,sparks] of [
    ['AV-HN','AVENGERS',undefined,1,42.3,78345,7882],
    ['AV-2.SURVIVOR','AV-2','G',2,97.2,561714,56312],
    ['AV2-OlRose','AV-2','H',1,90,427316,42877],
    ['AV-J','AV-2','H',5,28.8,170926,17151],
    ['AV-Brisket','AV-2','H',2,48.8,341853,34301],
    ['AV2-Thoszi','AV-2','H',3,37.2,307668,30871],
    ['AV-EventHorizon','AV-2','H',4,30.9,205112,20581],
    ['AV-KO','AV-2','H',6,12.1,136741,13721],
    ['AV2-Froyo','AV-2','H',7,9.2,68371,6860],
    ['TheHemperor','AV-2','H',8,0.43,34185,3430],
    ['AV#Rafa#Tun','AV-2','H',9,0.1248,17093,1715]
  ]){
    const matches=e.rows.filter(r=>r.player===player&&r.clan===clan);
    assert.equal(matches.length,1,player+' imported exactly once');
    const r=matches[0];
    assert.equal(r.metadata.lobby,lobby);
    assert.equal(r.metadata.rank,rank);assert.equal(r.score,score);
    assert.equal(r.stars,stars);assert.equal(r.sparks,sparks);
  }
  assert(!e.rows.some(r=>r.player==='AV2-J'||r.player==='AV2-TheHempe...'),
    'The cropped source display and AV2-J are not duplicate player identities');
  const held=e.rows.find(r=>r.player==='TheHemperor');
  assert.equal(held?.metadata.sourceDisplayName,'AV2-TheHempe...');
  assert.equal(held?.metadata.sourceDiscordMessageId,'1568324314116390953');
  assert.equal(held?.metadata.sourceAttachment,'image1.jpg');
  assert.equal(e.metadata.complete,false,'Outside-source Space lobby coverage remains unknown');
  assert(!e.rows.some(r=>r.player==='ROG'),'Outside-clan G rank 8 must not be imported');
  const confirmed=e.rows.find(r=>r.player==='AV-J'&&r.clan==='AV-2');
  assert.equal(confirmed?.metadata.sourceDisplayName,'AV2-J','display identity audit retained');
  assert.equal(e.rows.filter(r=>r.player==='AV-J').length,1,'canonical AV-J one race result');
  assert(BASE.projection.people.some(p=>p.name==='AV-J'&&p.status==='AV2'),
    'confirmed result credited to existing AV-J, without a new roster account');
  for(const sha of [
    '7293b114b3198eb67266511a02680f7c8fc96139f2e271c647c922f6a2f462c9',
    '12f6c3c1ce2d899a54970d5781c2ba2f025e6260ebf81fcc029ce2a66f5d66a3',
    '4db2b63a0a13944ecaf806a22ae8fde89d76a42ab87648680c6d084072e3d977'
  ])assert(e.sources.includes('reviewed-image-sha256:'+sha),'original source hash bound');
  const z=e.rows.filter(r=>r.player==='AV-Zolika.x.TheBoss');
  assert.equal(z.length,1);
  assert.equal(z[0].clan,'AVENGERS');
  assert.equal(z[0].score,550);
  assert.equal(z[0].sparks,669250);
  assert.equal(z[0].stars,6692500);
  assert.equal(z[0].metadata.rank,1);
  assert.equal(z[0].metadata.share,0.25);
  assert.equal(z[0].metadata.lobby,'A');
  assert(e.sources.includes('reviewed-image-sha256:83f2937f682cc76661f491d2893079e362cb7e39be441795e5a466fdd5222e9b'));
  const r=BASE.globals.AVENGERS_MEMBER_TIMEZONES.byName;
  for(const n of ['AV-Pablin','AV-MotherboardBeans','AV-Neez'])assert.equal(r[n]?.status,'AV2',n+' current AV-2');
  assert.equal(r['AV-no']?.status,'Active','AV-no returned to AVENGERS');
  for(const n of ['AV-KitKat','AV-Hoops']){
    assert.equal(r[n]?.status,'Active',n+' current AVENGERS');
    assert.equal(e.rows.find(x=>x.player===n)?.clan,'AVENGERS',n+' original event clan');
  }
  // User-confirmed new account from a previously verified original final CLAIM image.
  const dreadrix=e.rows.filter(x=>x.player==='AV-Dreadrixter-UA');
  assert.equal(dreadrix.length,1,'Dreadrixter result recorded exactly once');
  assert.equal(dreadrix[0].score,254.6);
  assert.equal(dreadrix[0].sparks,53540);
  assert.equal(dreadrix[0].stars,535249);
  assert.equal(dreadrix[0].metadata.rank,8);
  assert.equal(dreadrix[0].metadata.lobby,'A');
  assert.equal(dreadrix[0].metadata.share,0.02);
  assert.equal(dreadrix[0].clan,'AVENGERS');
  // Dubai's earlier zero-result roster shell now has exactly one verified Nov 8 Big Pig finish.
  const dubaiRows=BASE.ledger.events.flatMap(event=>event.rows.filter(row=>row.player==='AV-Dubai').map(row=>({eventId:event.id,...row})));
  assert.equal(dubaiRows.length,1,'Dubai has one verified event and no fabricated history');
  assert.equal(dubaiRows[0].eventId,'piggy|2026-11-08');
  assert.equal(dubaiRows[0].score,9960);
  assert.equal(dubaiRows[0].sparks,63224);
  assert.equal(dubaiRows[0].stars,632238);
  assert.equal(dubaiRows[0].metadata.rank,32);
  assert.equal(BASE.projection.people.find(p=>p.name==='AV-Dubai')?.earned.events,1,'Dubai one verified event');
  assert.equal(r['AV-JAMO'].status,'Active');
  assert.equal(r['AV-Oakcliff'].status,'AV2');
  assert.equal(e.rows.find(x=>x.player==='AV-Oakcliff')?.clan,'AVENGERS','Oakcliff original event-time clan retained');
  assert.equal(BASE.projection.people.find(p=>p.name==='AV-Zolika.x.TheBoss').kinds.space.pb,1030.7,'Existing Space PB remains higher');
  for(const [name,rank,score,sparks] of [
    ['AV.ziyad',2,241,268520],
    ['AV.atarIX',5,181.4,134260]
  ]){
    const row=e.rows.find(r=>r.player===name);
    assert(row,name+' must be included in source-verified B-lobby supplement');
    assert.equal(row.clan,'AVENGERS');
    assert.equal(row.metadata?.lobby,'B');
    assert.equal(row.metadata?.rank,rank);
    assert.equal(row.score,score);
    assert.equal(row.sparks,sparks);
  }
});
test('one-line Nov 8 Big Pig results count across the published event, roster and histories; Flash still excludes one line',()=>{
  const id='piggy|2026-11-08';
  const accepted=BASE.ledger.events.find(e=>e.id===id);
  const projected=BASE.projection.events.find(e=>e.id===id);
  const evidence=accepted.rows.find(r=>r.player==='AV-Finnie');
  assert.equal(evidence.score,1,'source ledger retains exact leader-confirmed result');
  assert.equal(evidence.clan,'AVENGERS');
  assert.equal(projected.rows.find(r=>r.player==='AV-Finnie')?.score,1,'published Big Pig includes the score');
  const main=projected.rows.filter(r=>r.clan==='AVENGERS');
  assert.equal(main.length,48,'47 prior participants plus Finnie');
  assert.equal(main.reduce((total,r)=>total+r.score,0),789651,'one extra line included in clan total');
  assert.equal(BASE.globals.AVENGERS_DATA.piggy.events['2026-11-08'].find(r=>r.name==='AV-Finnie')?.lines,1);
  assert(BASE.globals.AVENGERS_DATA.piggy.history['AV-Finnie'].some(r=>r.date==='2026-11-08'&&r.lines===1));
  assert(BASE.projection.people.find(p=>p.name==='AV-Finnie').history.some(r=>r.eventId===id&&r.score===1));
  const av2=projected.rows.filter(r=>r.clan==='AV-2');
  assert.equal(av2.length,18,'14 previously logged plus AV-J and three one-line players');
  const j=av2.find(r=>r.player==='AV-J');
  assert.deepEqual([j.score,j.stars,j.sparks,j.metadata.rank],[53,85714,8571,24]);
  for(const [name,rank] of [['AV-TheOli',48],['TheHemperor',49],['AV-CRISPIN.97',50]]){
    const row=av2.find(r=>r.player===name);
    assert(row,name+' imported from final AV-2 Big Pig screenshot');
    assert.equal(row.score,1);
    assert.equal(row.metadata.rank,rank);
    assert.equal(row.stars,null,'Tier 10 not reached must remain unknown payout');
    assert.equal(row.sparks,null,'Tier 10 not reached must remain unknown payout');
    assert(BASE.projection.people.find(p=>p.name===name)?.history.some(r=>r.eventId===id&&r.score===1),name+' profile retains result');
  }
  assert(!BASE.projection.people.some(p=>['AV2-J','AV2-TheHemperor','AV-CRISPIN.27'].includes(p.name)),'source aliases do not create duplicate profiles');
  assert(!BASE.projection.events.filter(e=>e.kind==='flash').some(e=>e.rows.some(r=>r.score===1)),
    'exactly-one-line Flash placeholders alone remain excluded');
});


test('2026-11-12 canonical alias mergers retain one profile and source-accurate Frenchie accounts',()=>{
  const aliases=BASE.globals.AVENGERS_DATA.aliasMap;
  const resolve=raw=>{let n=raw,seen=new Set();while(aliases[n]&&aliases[n]!==n){assert(!seen.has(n),'alias cycle '+raw);seen.add(n);n=aliases[n];}return n;};
  const pairs={
    'AV-#ZOLISTAR':'AV-7-STAR',
    'AV-Adiagrion':'AV-Adigarian',
    'AV-BXI':'AV-BX1',
    'AV-FenXistentiel':'AV-FeniXistential',
    'AV-Frenchie(-4)':'AV-FrenchieUSA',
    'AV-J-Zo':'AV-J',
    'AV-JustSomeGuy':'AV-HarryBallsagna'
  };
  const retired=new Set(Object.keys(pairs));
  for(const [from,to] of Object.entries(pairs))assert.equal(resolve(from),to);
  for(const x of BASE.projection.people)assert(!retired.has(x.name),'retired alias has standalone player profile: '+x.name);
  const roster=BASE.globals.AVENGERS_MEMBER_TIMEZONES.rows;
  assert.equal(new Set(roster.map(x=>x.name)).size,roster.length,'current roster has unique canonical names');
  assert(roster.every(x=>!retired.has(x.name)),'retired aliases cannot be separate roster rows');
  for(const event of BASE.projection.events)for(const row of event.rows)
    assert(!retired.has(row.player),'retired alias cannot be a distinct result identity');
  assert.notEqual(resolve('AV-Frenchie2'),resolve('AV-Frenchie(-4)'),'Frenchie2 is not the -4 account');
  const piggy=BASE.projection.events.find(e=>e.id==='piggy|2026-10-18');
  assert(piggy.rows.some(r=>r.player==='AV-FrenchieUSA'&&r.clan==='AV-2'&&r.score===267&&r.sparks===12946),
    'AV-2 Frenchie(-4) 267-line source must go to FrenchieUSA with original rewards');
  const oct=BASE.projection.events.find(e=>e.id==='kraken|oct');
  assert(oct.rows.some(r=>r.player==='AV-FrenchieUSA'&&r.clan==='AVENGERS'&&r.score===2558.3),
    'main-clan Frenchie October Kraken source is preserved');
  assert(oct.rows.some(r=>r.player==='AV-Frenchie2'&&r.clan==='AV-2'&&r.score===36.2),
    'separate AV-2 Frenchie2 October Kraken source is preserved');
  assert.equal(BASE.projection.people.find(p=>p.name==='AV-Royal')?.status,'AV2',
    'Royal must not be marked inactive without an explicit removal');
});
