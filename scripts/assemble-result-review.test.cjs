'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {assemble}=require('./assemble-result-review.cjs');
const {preview}=require('./stage-event-update.cjs');
const sha=x=>String(x).repeat(64);
const row=(player,clan,score,sparks,stars,metadata)=>({player,clan,score,sparks,stars,...(metadata?{metadata}:{})});
const event=(kind='space',date='2026-10-16',id=kind+'|'+date)=>({
  id,kind,date,unit:({space:'billion-lightyears',piggy:'lines',flash:'lines',kraken:'million-damage'})[kind]
});
const screen=(e,hash,rows,extra={})=>({
  classification:'final-claim',verifiedFinal:true,
  eventId:e.id,eventDate:e.date,eventKind:e.kind,
  imageSha256:sha(hash),rows,...extra
});
const review=(e,screens,extra={})=>({schemaVersion:1,event:e,screens,...extra});

test('assemble final AVENGERS and AV-2 lobbies, exclude progress, reposts, repeated players',()=>{
  const e=event(),a=row('AV-HarryBallsagna','AVENGERS',350.4,12000,120000,{rank:1,share:.25,discordUserId:'PRIVATE'}),
    b=row('AV-2Lin','AV-2',245.3,8700,87000,{rank:2,lobby:'B'}),
    c=row('AV-SiFra','AV-2',280.5,null,null);
  const input=review(e,[
    {classification:'progress',eventId:e.id,rows:[row('AV-HarryBallsagna','AVENGERS',3,4,40)]},
    screen(e,'a',[a,b]),screen(e,'a',[a,b]),screen(e,'b',[b,c])
  ]);
  const before=JSON.stringify(input),out=assemble(input),u=out.update;
  assert.equal(JSON.stringify(input),before,'caller data unmodified');
  assert.equal(u.approved,false);assert.equal(u.expectedRevision,0);assert.equal(u.event.status,'partial');
  assert.deepEqual(out.report,{eventId:e.id,finalImages:2,excludedPreliminary:1,repostImages:1,
    repeatedPlayerResults:1,distinctResults:3,newResults:3,existingResults:0,
    action:'review-required',approvalRequired:true,autoPublish:false});
  assert.equal(u.event.rows.length,3);assert.equal(u.event.rows.find(r=>r.player==='AV-SiFra').stars,null);
  assert.equal(u.event.rows.find(r=>r.player==='AV-SiFra').sparks,null);
  assert(u.event.sources.every(s=>s.startsWith('reviewed-image-sha256:')));
  assert(!JSON.stringify(u).includes('PRIVATE'),'never emit unapproved privacy-sensitive screenshot fields');
  assert(!JSON.stringify(u).includes('progress'),'progress images never become source data');
});
test('duplicate player across different finals must match, including rewards and event-time clan',()=>{
 const e=event(),a=row('AV-HarryBallsagna','AVENGERS',350,100,1000);
 for(const variant of [{...a,score:351},{...a,sparks:101},{...a,clan:'AV-2'}]){
   assert.throws(()=>assemble(review(e,[screen(e,'a',[a]),screen(e,'b',[variant])])),/Conflicting final screenshots/);
 }
 assert.throws(()=>assemble(review(e,[screen(e,'a',[a]),screen(e,'a',[{...a,score:5}])])),/Same image hash/);
});
test('never accept progress-only, unverified claim, unknown source hash or wrong event',()=>{
 const e=event(),a=row('AV-HarryBallsagna','AVENGERS',350,100,1000);
 assert.throws(()=>assemble(review(e,[{classification:'preliminary',rows:[a]}])),/No verified final/);
 assert.throws(()=>assemble(review(e,[screen(e,'a',[a],{verifiedFinal:false})])),/reviewer verification/);
 assert.throws(()=>assemble(review(e,[screen(e,'a',[a],{imageSha256:'discord-channel-id'})])),/SHA-256/);
 assert.throws(()=>assemble(review(e,[screen(e,'a',[a],{eventDate:'2026-10-09'})])),/identity mismatch/);
 assert.throws(()=>assemble(review(e,[screen(e,'a',[a],{eventKind:'piggy'})])),/identity mismatch/);
 assert.throws(()=>assemble(review(e,[screen(e,'a',[a],{classification:'unknown'})])),/classification/);
});
test('unknown clan and alias ambiguity require human review; metadata is strictly public',()=>{
 const e=event();
 for(const bad of [
   row('AV-Frenchie2',null,200,null,null),
   row(null,'AV-2',200,null,null),
   row('AV-Frenchie2','Other clan',200,null,null),
   {player:'AV-Frenchie2',clan:'AV-2',score:200,sparks:3}
 ])assert.throws(()=>assemble(review(e,[screen(e,'a',[bad])])),/review|clan|Missing/);
 const r=assemble(review(e,[screen(e,'a',[
   row('AV-Zolika.x.TheBoss','AVENGERS',555,415318,4153180,{group:2,rank:1,lobby:'A',discordMessageId:'PRIVATE'}),
   row('AV-Frenchie2','AV-2',123,1,10),
   row('AV-Frenchie(-4)','AV-2',124,2,20)
 ])]),{aliases:{'AV-Zolika.x.TheBoss':'AV-Zolika.x.Kira'}});
 assert.equal(r.update.event.rows.length,3);
 assert(r.update.event.rows.some(x=>x.player==='AV-Zolika.x.Kira'));
 assert(r.update.event.rows.some(x=>x.player==='AV-Frenchie2'));
 assert(r.update.event.rows.some(x=>x.player==='AV-Frenchie(-4)'));
 assert(!JSON.stringify(r.update).includes('PRIVATE'));
});
test('partial event append keeps original results/rewards, rejects corrections and revoked sources',()=>{
 const e=event(),existing={...e,status:'partial',revision:3,metadata:{coverageNote:'Original accepted rows'},
   sources:['review:old-safe'],rows:[row('AV-HarryBallsagna','AVENGERS',350.4,12,120)]};
 const newRows=[row('AV-HarryBallsagna','AVENGERS',350.4,12,120),
   row('AV-SiFra','AV-2',280.5,null,null)];
 const out=assemble(review(e,[screen(e,'a',newRows)]),{existingEvent:existing});
 assert.equal(out.update.expectedRevision,3);
 assert.equal(out.update.event.rows.length,2);
 assert.equal(out.update.event.status,'partial');
 assert.equal(out.report.newResults,1);assert(out.update.event.sources.includes('review:old-safe'));
 assert.deepEqual(out.update.event.rows.find(x=>x.player==='AV-SiFra').stars,null);
 assert.throws(()=>assemble(review(e,[screen(e,'a',[row('AV-HarryBallsagna','AVENGERS',351,12,120)])]),{existingEvent:existing}),/explicit correction/);
 assert.throws(()=>assemble(review(e,[screen(e,'a',newRows)]),{existingEvent:{...existing,status:'final'}}),/final event cannot/);
 assert.throws(()=>assemble(review(e,[screen(e,'a',newRows)]),{existingEvent:{...existing,status:'revoked'}}),/revoked event/);
});
test('same result repost is unchanged and cannot silently change event revision or public provenance',()=>{
 const e=event(),existing={...e,status:'partial',revision:2,metadata:{coverageNote:'Saved'},
   sources:['reviewed-image-sha256:'+sha('a')],rows:[row('AV-HarryBallsagna','AVENGERS',350.4,12,120)]};
 const out=assemble(review(e,[screen(e,'b',[row('AV-HarryBallsagna','AVENGERS',350.4,12,120)])]),{existingEvent:existing});
 assert.equal(out.report.action,'unchanged');
 assert.deepEqual(out.update.event.sources,existing.sources);
 assert.deepEqual(out.update.event.metadata,existing.metadata);
});
test('event type and units enforce Piggy, Flash and Kraken without fabricating Stars',()=>{
 for(const kind of ['piggy','flash','kraken']){
   const e=event(kind,'2026-10-16',kind==='flash'?'flash|2026-10-16|2':kind==='kraken'?'kraken|oct':undefined);
   const stars=kind==='kraken'?null:100;
   const out=assemble(review({...e,metadata:kind==='flash'?{flash:2}:kind==='kraken'?{monthKey:'oct',monthLabel:'October'}:{}},[screen(e,'d',[row('AV-Frenchie2','AV-2',123,10,stars)])]));
   assert.equal(out.update.event.kind,kind);
   assert.equal(out.update.event.unit,e.unit);
   assert.equal(out.update.event.rows[0].stars,stars);
   assert.equal(out.update.event.status,'partial');
 }
 const k={...event('kraken','2026-10-11','kraken|oct'),metadata:{monthKey:'oct',monthLabel:'October'}};
 assert.throws(()=>assemble(review(k,[screen(k,'a',[row('AV-Frenchie2','AV-2',123,10,100)])])),/Kraken has no Stars/);
});
test('final classification alone is not proof of complete coverage; explicit reviewed completeness required',()=>{
 const e=event(),a=row('AV-2Lin','AV-2',200,12,120);
 assert.equal(assemble(review(e,[screen(e,'a',[a])])).update.event.status,'partial');
 const out=assemble(review(e,[screen(e,'a',[a])],{coverageComplete:true}));
 assert.equal(out.update.event.status,'final');
 assert.equal(out.update.approved,false,'even full coverage cannot approve publication');
});
test('read-only candidate integrates with existing projected dry-run and cannot alter accepted file',()=>{
 const file=path.resolve(__dirname,'../data/approved-event-updates.json'),original=fs.readFileSync(file,'utf8');
 const e=event('piggy','2026-10-12'),a=row('AV-HarryBallsagna','AVENGERS',47000,100,1000);
 const candidate=assemble(review(e,[screen(e,'a',[a])])).update;
 const result=preview([],candidate);
 assert(result.reviewRequired);assert(result.changed.includes('AV-HarryBallsagna'));
 assert.notEqual(result.before.projection.version,result.after.projection.version);
 assert.throws(()=>preview([] ,candidate,{requireApproval:true}),/reviewed approval/);
 assert.equal(fs.readFileSync(file,'utf8'),original);
});

test('real Oct 16 AV-2 final Space captures replay as unchanged, including canonical aliases',()=>{
  // Nine visible final-claim rows were visually checked against the approved
  // Oct 16 screenshots. Image digests below are TEST PLACEHOLDERS, not original
  // Discord JPEG hashes: this test asserts replay/reconciliation only.
  const accepted=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/approved-event-updates.json'),'utf8')).updates;
  const {create}=require('./create-site-release.cjs');
  const {migrate}=require('./migrate-event-ledger.cjs');
  const {load}=require('./load-site-data.cjs');
  const aliases=migrate(load()).aliases;
  const baseline=create(),prior=baseline.ledger.events.find(x=>x.id==='space|2026-10-16');
  assert(prior&&prior.revision>=1&&prior.status==='partial','Oct 16 approved event exists and is partial');
  const e=event('space','2026-10-16');
  const rows=[
    row('AV-Witch-king','AV-2',65,23324,232155),
    row('AV-EventHorizon','AV-2',33.1,18659,185724),
    row('AV-Squishy','AV-2',22.3,16793,167152),
    row('AV-OblivX','AV-2',16.8,11195,111434),
    row('Punchy','AV-2',4.7,9329,92862),
    row('AV-fueravini','AV-2',1.3,7464,74290),
    row('AV-2Pipesis','AV-2',1,3732,37145),
    row('kayesie','AV-2',.2186,1866,18572),
    row('DedHed','AV-2',.1957,933,9286)
  ];
  // Simulate the two overlapping final captures, plus an identical repost.
  const captures=review(e,[screen(e,'a',rows.slice(0,8)),
    screen(e,'b',rows.slice(1)),screen(e,'a',rows.slice(0,8))]);
  const originalAccepted=fs.readFileSync(path.join(__dirname,'../data/approved-event-updates.json'),'utf8');
  const result=assemble(captures,{existingEvent:prior,aliases});
  assert.equal(result.update.approved,false);
  assert.equal(result.report.action,'unchanged');
  assert.equal(result.report.newResults,0);
  assert.equal(result.report.distinctResults,9);
  assert.equal(result.report.excludedPreliminary,0);
  assert.equal(result.report.finalImages,2);
  assert.equal(result.report.repostImages,1);
  assert(result.report.repeatedPlayerResults>0);
  assert.equal(result.update.event.rows.length,prior.rows.length,'all 66 existing results retained');
  const member=result.update.event.rows.find(r=>r.player==='AV-EXCALIBUR'&&r.clan==='AV-2');
  assert.deepEqual([member.score,member.sparks,member.stars],[65,23324,232155],
    'Witch-king source name resolves through reviewed historical alias');
  assert.equal(result.update.event.rows.filter(r=>r.player==='AV-Witch-king').length,0,
    'alias must not create a phantom extra person');
  assert.deepEqual(result.update.event.sources,prior.sources,'a repost cannot fabricate new provenance');
  const dry=preview(accepted,result.update);
  assert.equal(dry.unchanged,true,'replay must not change the accepted projection version');
  assert.equal(dry.before.projection.version,dry.after.projection.version);
  assert.deepEqual(dry.changed,[]);
  assert.equal(fs.readFileSync(path.join(__dirname,'../data/approved-event-updates.json'),'utf8'),originalAccepted,
    'review and simulation never edit accepted event scores');
});
