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
  assert.equal(D.space.events['2026-10-02'].find(r=>r.name==='AV-Zolika.x.Kira').yearsB,480.6);
  assert.equal(D.members.find(m=>m.name==='AV-HarryBallsagna').spacePB,549.9);
  assert.equal(w.AVENGERS_COMMUNITY.achievementProfile('AV-HarryBallsagna').categories.find(c=>c.id==='space').value,549.9);
  assert.equal(D.members.find(m=>m.name==='DedHed').piggyPB,111);
  assert.equal(D.members.find(m=>m.name==='Basecreature').spacePB,9.45);
  assert.equal(D.resolvePlayerName('AV-CHUCK'),D.resolvePlayerName('AV-Chuck'));
  assert.notEqual(D.resolvePlayerName('AV-Frenchie2'),D.resolvePlayerName('AV-Frenchie(-4)'));
});
test('unassigned October reward remains in historical clan totals and is not guessed onto a Frenchie account',()=>{
  const p=BASE.projection,row=p.coverage.unassignedRows[0];assert.equal(row.clan,'AV-2');assert.equal(row.sparks,18100);assert.equal(row.player,null);
  const total=p.people.reduce((s,p)=>s+p.earned.sparks,0)+row.sparks;
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
test('current roster and every materialized PB/reward agree with independent canonical source sums',()=>{
  const D=BASE.globals.AVENGERS_DATA,R=BASE.globals.AVENGERS_MEMBER_TIMEZONES;
  assert.equal(R.rows.filter(r=>r.status==='Active').length,48);assert.equal(R.rows.filter(r=>r.status==='AV2').length,52);
  const events=BASE.ledger.events.filter(e=>e.status!=='revoked');
  for(const m of D.members){
    const rows=events.flatMap(e=>e.rows.filter(r=>r.player===m.name).map(r=>({...r,kind:e.kind})));
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
