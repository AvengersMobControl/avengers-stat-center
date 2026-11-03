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
    const withoutGlobalRating=({ratingMetrics,ratingPoints,ratingPB,ratingAvg,ratingTotal,...rest})=>rest;
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
  assert.equal(BASE.globals.AVENGERS_KRAKEN_DATA.octEventTotals['AV-2'].sparks,8197779.9);
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
  assert.equal(active.length,48);assert.equal(av2.length,57);
  for(const name of ['AV-Lin','AV-JefhKintz05','AV-TRINITY','AV-istanbuL','AV-KKD']){
    assert.equal(R.byName[name]?.status,'Active',name+' roster');
    assert.equal(D.members.filter(m=>m.name===name&&m.status==='Active').length,1,name+' unique profile');
    assert.equal(people.find(p=>p.name===name)?.status,'Active',name+' projection');
    assert(!av2.some(r=>r.name===name),name+' no current AV-2 listing');
  }
  for(const name of ['AV#Rafa#Tun','AV-JAMO','AV-Royal','AV-SiFra','AV-KitKat','AV-Hoops'])assert.equal(R.byName[name]?.status,'AV2',name+' transferred or retained in AV-2');
  assert.equal(R.byName['AV-WolfLegend']?.status||'Inactive','Inactive','WolfLegend inactive');
  for(const name of ['AV-Nicefellow','AV-Neez'])assert.equal(R.byName[name]?.status,'Active',name+' status unchanged');
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
  assert.equal(BASE.globals.AVENGERS_SPARKS_SNAPSHOT.currentAv2.length,50,'dated AV-2 raw snapshot intact');
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
