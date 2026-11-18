'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {normalize,isAv2FlashPool}=require('./event-projection-core.cjs');
const {assemble}=require('./assemble-result-review.cjs');
const {create}=require('./create-site-release.cjs');
const {browserSource}=require('./build-site.cjs');
const APPROVED=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/approved-event-updates.json'),'utf8')).updates;
const SHA=n=>n.toString(16).padStart(64,'0');
const date='2026-10-09'; // Friday, the end of the AV-2 Flash reporting week
const eventId='flash|'+date+'|av2pool';
const fixture=(scores=[10000,20000,30000,40000])=>({
 id:eventId,kind:'flash',date,status:'partial',unit:'lines',
 metadata:{pool:'av2-week',poolWeek:date,complete:false},
 sources:scores.map((_,i)=>'reviewed-image-sha256:'+SHA(i+1)),
 rows:scores.map((score,i)=>({player:'AV-SiFra',clan:'AV-2',score,
   sparks:(i+1)*100,stars:(i+1)*1000,
   metadata:{poolSlot:i+1,sourceImageSha256:SHA(i+1),rank:2,share:.1}}))
});
const screen=(event,n,score)=>({
 classification:'final-claim',verifiedFinal:true,eventId:event.id,
 eventDate:event.date,eventKind:'flash',imageSha256:SHA(n),
 rows:[{player:'AV-SiFra',clan:'AV-2',score,sparks:n*100,
   stars:n*1000,metadata:{poolSlot:n,rank:2,share:.1}}]
});
function browser(r){const sandbox={window:{},console};vm.createContext(sandbox);vm.runInContext(browserSource(r),sandbox);
 for(const x of ['community-highlights.js','clan-league-rewards.js'])vm.runInContext(
   fs.readFileSync(path.join(__dirname,'..',x),'utf8'),sandbox);
 return sandbox.window;}
test('one independent AV-2 weekly pool holds four per-player results, no invented PF number',()=>{
 const e=normalize(fixture());
 assert.equal(isAv2FlashPool(e),true);
 assert.equal(e.id,'flash|2026-10-09|av2pool');
 assert.equal(e.metadata.flash,undefined);
 assert.deepEqual(e.rows.map(r=>r.metadata.poolSlot),[1,2,3,4]);
 assert.equal(e.rows.reduce((n,r)=>n+r.sparks,0),1000);
 assert(!e.rows.some(r=>r.clan==='AVENGERS'));
});
test('fifth AV-2 weekly Flash slot, duplicate source, wrong clan and invented PF number fail closed',()=>{
 assert.throws(()=>normalize(fixture([1,2,3,4,5])),/slot 1–4/);
 const reused=fixture();reused.rows[1].metadata.sourceImageSha256=SHA(1);
 assert.throws(()=>normalize(reused),/cannot occupy two pool slots/);
 const badClan=fixture();badClan.rows[0].clan='AVENGERS';
 assert.throws(()=>normalize(badClan),/canonical AV-2 member/);
 const badPF=fixture();badPF.metadata.flash=2;
 assert.throws(()=>normalize(badPF),/cannot have a PF1-4 number/);
 const badDate=fixture();badDate.date='2026-10-08';badDate.id='flash|2026-10-08|av2pool';
 badDate.metadata.poolWeek=badDate.date;
 assert.throws(()=>normalize(badDate),/week-ending Friday/);
});
test('four verified screenshots assemble as four results for one member, with protected original hashes',()=>{
 const e={id:eventId,kind:'flash',date,unit:'lines',metadata:{pool:'av2-week',poolWeek:date}};
 const screens=[10000,20000,30000,40000].map((n,i)=>screen(e,i+1,n));
 const output=assemble({schemaVersion:1,event:e,screens});
 assert.equal(output.update.event.rows.length,4);
 assert.equal(output.report.distinctResults,4);
 assert.equal(output.update.approved,false);
 assert.equal(output.update.event.status,'partial');
 assert.deepEqual(output.update.event.rows.map(r=>r.metadata.sourceImageSha256),
   [SHA(1),SHA(2),SHA(3),SHA(4)]);
 const duplicate=assemble({schemaVersion:1,event:e,screens:[screens[0],screens[0]]});
 assert.equal(duplicate.update.event.rows.length,1);
 assert.equal(duplicate.report.repostImages,1);
 const partial=assemble({schemaVersion:1,event:e,screens:screens.slice(0,2)});
 const existing={...partial.update.event,revision:1};
 const append=assemble({schemaVersion:1,event:e,screens:screens.slice(2)},{existingEvent:existing});
 assert.equal(append.update.event.rows.length,4);
 assert.equal(append.report.newResults,2);
 assert.equal(append.update.expectedRevision,1);
 assert.throws(()=>assemble({schemaVersion:1,event:e,screens:[
  screen(e,1,10000),screen(e,2,10000).rows[0]&&
   {...screen(e,2,10000),rows:[{...screen(e,2,10000).rows[0],metadata:{poolSlot:1}}]}
 ]}),/Conflicting final screenshots|conflicting original source/);
});
test('pooled Flash propagates four distinct results into profiles, rewards, ratings and recaps',()=>{
 const original=create(),evt=fixture();
 const r=create({updates:[...APPROVED,{approved:true,expectedRevision:0,event:evt}]});
 const base=original.projection.people.find(p=>p.name==='AV-SiFra');
 const member=r.projection.people.find(p=>p.name==='AV-SiFra');
 assert(base&&member);
 const newRows=member.history.filter(h=>h.eventId===eventId);
 assert.equal(newRows.length,4);
 assert.deepEqual(newRows.map(h=>h.metadata.poolSlot),[1,2,3,4]);
 assert.equal(member.kinds.flash.eventsRecorded,base.kinds.flash.eventsRecorded+4);
 assert.equal(member.categories.flash.sparks,base.categories.flash.sparks+1000);
 assert.equal(member.categories.flash.stars,base.categories.flash.stars+10000);
 const expectedPB=Math.max(base.ratingMetrics.flashDailyPB||0,40000);
 assert.equal(member.ratingMetrics.flashDailyPB,expectedPB,
   'four AV-2 Flash results must not be added into a fictitious single PF performance');
 assert.equal(member.ratingMetrics.flashDailyArena!==null,true);
 assert.deepEqual(r.projection.events.find(x=>x.id===eventId).rows.map(x=>x.metadata.poolSlot),[1,2,3,4]);
 const oldMain=original.projection.events.filter(x=>x.kind==='flash'&&x.metadata?.flash);
 const newMain=r.projection.events.filter(x=>x.kind==='flash'&&x.metadata?.flash);
 assert.equal(newMain.length,oldMain.length);
 const w=browser(r),baseW=browser(original);
 const rec=w.AVENGERS_COMMUNITY.records.filter(x=>x.eventId===eventId&&x.name==='AV-SiFra');
 assert.equal(rec.length,4,'community records and website keep all four entries');
 assert.deepEqual([...rec.map(x=>x.group)].sort(),[1,2,3,4]);
 assert(rec.every(x=>x.kind==='pfpool'),'never show AV-2 as numbered PF1–PF4');
 const recap=w.AVENGERS_COMMUNITY.weeklyRecap('2026-10-05','AV-2');
 const oldRecap=baseW.AVENGERS_COMMUNITY.weeklyRecap('2026-10-05','AV-2');
 assert.equal(recap.totals.sparks-oldRecap.totals.sparks,1000);
 assert.equal(recap.rows.filter(x=>x.eventId===eventId&&x.name==='AV-SiFra').length,4);
 const payout=r.breakdowns['AV-SiFra'],oldPayout=original.breakdowns['AV-SiFra'];
 assert.equal(payout.flashSparks-oldPayout.flashSparks,1000);
 const leagues=w.AVENGERS_CLAN_LEAGUE_REWARDS.build();
 const baselineLeagues=baseW.AVENGERS_CLAN_LEAGUE_REWARDS.build();
 const league=leagues.find(x=>x.end==='2026-10-11'),oldLeague=baselineLeagues.find(x=>x.end==='2026-10-11');
 assert.equal(league.rows.filter(x=>x.clan==='AV-2').reduce((n,x)=>n+x.flashSparks,0)-
   oldLeague.rows.filter(x=>x.clan==='AV-2').reduce((n,x)=>n+x.flashSparks,0),1000);
});
test('one-line Flash result is excluded from participation while one-line Big Pig remains unaffected',()=>{
 const evt=fixture([1,2,3,4]);
 const r=create({updates:[...APPROVED,{approved:true,expectedRevision:0,event:evt}]});
 const newRows=r.projection.people.find(p=>p.name==='AV-SiFra').history.filter(x=>x.eventId===eventId);
 assert.equal(newRows.length,3,'Flash one-line placeholder does not count');
 assert(!newRows.some(r=>r.score===1));
 assert.equal(r.ledger.events.find(e=>e.id===eventId).rows.length,4,
   'original final source evidence stays in the ledger');
});
