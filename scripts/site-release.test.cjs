'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),os=require('node:os'),path=require('node:path');
const {create}=require('./create-site-release.cjs'),{build,browserSource}=require('./build-site.cjs'),{UNITS}=require('./event-projection-core.cjs');
function boot(r){
  const sandbox={window:{},console};vm.createContext(sandbox);vm.runInContext(browserSource(r),sandbox);
  for(const file of ['community-highlights.js','clan-league-rewards.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),sandbox);
  return sandbox.window;
}
const APPROVED=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/approved-event-updates.json'))).updates;
const BASE=create(),BASEW=boot(BASE),member=(r,name)=>r.globals.AVENGERS_DATA.members.find(m=>m.name===name);
for(const kind of Object.keys(UNITS))for(const clan of ['AVENGERS','AV-2'])test(kind+' / '+clan+' reaches histories, summary, PB/achievements, rewards, leagues and recap after correction/revocation',()=>{
  const name='AV-HarryBallsagna',id=kind+'|fixture',field=kind==='space'?'yearsB':'lines';
  const event={id,kind,date:'2026-10-10',status:'final',unit:UNITS[kind],sources:['fixture:source'],metadata:kind==='flash'?{flash:1}:kind==='kraken'?{monthKey:'fixture',monthLabel:'Fixture'}:{},rows:[{player:name,clan,score:90000,sparks:50,stars:kind==='kraken'?null:500}]};
  const update={approved:true,expectedRevision:0,event};
  function verify(r,score,sparks){
    const w=boot(r),p=r.projection.people.find(p=>p.name===name),b=w.AVENGERS_ROSTER_EVENT_BREAKDOWN.forMember(name),before=BASE.breakdowns[name];
    assert.equal(p.kinds[kind].pb,score===90000?90000:BASE.projection.people.find(p=>p.name===name).kinds[kind].pb);
    assert.equal(b[kind+'Sparks'],before[kind+'Sparks']+sparks);
    assert.equal(member(r,name).status,member(BASE,name).status,'historical clan cannot transfer current roster');
    assert.deepEqual(member(r,'AV-INTEN'),member(BASE,'AV-INTEN'));
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
  const corrected={approved:true,expectedRevision:1,event:{...event,rows:[{...event.rows[0],score:1,sparks:7}]}};
  const lower=create({updates:[...APPROVED,update,corrected]});verify(lower,1,7);
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
  const clan=p.clans.AVENGERS.sparks+p.clans['AV-2'].sparks+p.coverage.unknownClanRewards.sparks;
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
  assert.equal(active.length,49);assert.equal(av2.length,50);
  for(const name of ['AV-Lin','AV-JefhKintz05','AV-SiFra']){
    assert.equal(R.byName[name]?.status,'Active',name+' roster');
    assert.equal(D.members.filter(m=>m.name===name&&m.status==='Active').length,1,name+' unique profile');
    assert.equal(people.find(p=>p.name===name)?.status,'Active',name+' projection');
    assert(!av2.some(r=>r.name===name),name+' no current AV-2 listing');
  }
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
  assert.equal(lin.history.length,11,'one player: ten earlier AV-2 events and one AVENGERS');
  assert.equal(lin.history.filter(r=>r.clan==='AV-2').length,10);
  assert.equal(lin.history.filter(r=>r.clan==='AVENGERS').length,1);
  assert(lin.snapshotBreakdown.some(r=>r.sourceName==='AV-2Lin'&&r.clan==='AV-2'));
  const linTransition=lin.kinds.piggy.pbs.find(p=>p.eventId==='piggy|2026-10-18');
  assert.equal(linTransition.firstRecorded,false,'previous AV-2 result retained');
  assert.equal(linTransition.firstClanRecorded,true,'AVENGERS first race still new member');
  assert(D.piggy.latestNewMembers.some(r=>r.name==='AV-Lin'&&r.clan==='AVENGERS'));
  const jeff=people.find(p=>p.name==='AV-JefhKintz05');
  assert.equal(jeff.screenshotGap,17269,'frozen pre-logging gap survives canonical rename');
  assert(jeff.snapshotBreakdown.some(r=>r.clan==='AV-2'&&r.sourceName==='AV-JefhKintz05'));
  assert(jeff.snapshotBreakdown.some(r=>r.clan==='AVENGERS'&&r.amount===5307842),'historic AVENGERS screenshot total unchanged');
  assert(people.find(p=>p.name==='AV-SiFra').snapshotBreakdown.some(r=>r.clan==='AV-2'));
  assert.equal(BASE.globals.AVENGERS_SPARKS_SNAPSHOT.currentAv2.length,50,'dated AV-2 raw snapshot intact');
  assert.equal(BASE.globals.AVENGERS_SPARKS_SNAPSHOT.currentAvengersStars.length,47,'removed LT not published');
});
test('current roster and every materialized PB/reward agree with independent canonical source sums',()=>{
  const D=BASE.globals.AVENGERS_DATA,R=BASE.globals.AVENGERS_MEMBER_TIMEZONES;
  assert.equal(R.rows.filter(r=>r.status==='Active').length,49);assert.equal(R.rows.filter(r=>r.status==='AV2').length,50);
  const events=BASE.ledger.events.filter(e=>e.status!=='revoked');
  for(const m of D.members){
    // Approved overlays may retain their original source alias; compare canonically.
    const rows=events.flatMap(e=>e.rows.filter(r=>r.player&&D.resolvePlayerName(r.player)===m.name).map(r=>({...r,kind:e.kind})));
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
 assert(hoop.totalSparks>=12416538+post-0.001);
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
 assert(Math.abs(p.screenshotGap-Math.max(0,...p.snapshotBreakdown.map(s=>s.gap)))<=0.5);
 assert.equal(p.totalSparks,p.earned.sparks+p.screenshotGap);
});

const {audit:transferAudit}=require('./audit-transfer-restorations.cjs');
test('transfer restoration reconciles every current member, not only Hoops',()=>{
 const result=transferAudit(BASE);
 assert.equal(result.summary.roster,99);
 assert.equal(result.rows.length,99);
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
 assert(hoops.total>=12416538+after-0.001,
  'Hoops preserves screenshot plus every approved later reward');
 assert(result.rows.find(r=>r.name==='AV-Adigarian').screenshots>=2);
});

test('frozen historical Sparks are whole numbers, while event rewards retain original precision',()=>{
 const fixed=require('../data/sparks-prior-to-logging-2026-10-16.json');
 const amounts=fixed.amounts;
 assert.equal(Object.keys(amounts).length,41);
 for(const [name,prior] of Object.entries(amounts)){
   assert(Number.isSafeInteger(prior)&&prior>=1000,'not a rounded historical amount: '+name);
   const p=BASE.projection.people.find(x=>x.name===name);
   assert(p,'missing account '+name);
   assert.equal(p.screenshotGap,prior);
   assert.equal(p.totalSparks,p.earned.sparks+prior);
 }
 for(const [name,raw] of Object.entries(fixed.originalFractionalGaps)){
   assert.equal(amounts[name],Math.round(raw),'rounded source must match screenshot evidence '+name);
 }
 for(const name of Object.keys(fixed.roundingReview)){
   const p=BASE.projection.people.find(x=>x.name===name);
   assert(p&&p.screenshotGap===0,'excluded small discrepancy should remain zero: '+name);
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
  assert(Math.abs(p.screenshotGap-Math.max(e[0].gap,e[1].gap))<=0.5);
 }
});
