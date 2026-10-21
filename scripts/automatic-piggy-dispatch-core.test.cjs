'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {participatingRows,selectLatestEligiblePiggy,sourceEventForDispatch,totals,buildPiggyMessage,
 verifyPngBytes,verifyGitHubOIDC,OIDC_AUDIENCE,WORKFLOW_REF,REPOSITORY_ID}=require('./automatic-piggy-dispatch-core.cjs');
const policy={enabled:true,status:'approved',minimumEventDateExclusive:'2026-10-18'};
const event=(date,status='final',rows=[])=>({id:'piggy|'+date,date,kind:'piggy',status,unit:'lines',metadata:{},rows});
test('one-line placeholders are excluded from report participants and totals',()=>{
 const e=event('2026-10-25','final',[{player:'A',clan:'AVENGERS',score:1,stars:0,sparks:0},
  {player:'B',clan:'AVENGERS',score:10,stars:20,sparks:null}]);
 assert.deepEqual(participatingRows(e,'AVENGERS').map(x=>x.player),['B']);
 assert.deepEqual(totals(participatingRows(e,'AVENGERS')),{participants:1,knownScoreSum:10,knownStars:20,knownSparks:0,unknownScoreRows:0,unknownStarRows:0,unknownSparkRows:1});
});
test('only newest event after baseline and explicitly final is eligible',()=>{
 const projection={events:[event('2026-10-18'),event('2026-10-25'),event('2026-11-01','partial')]};
 assert.equal(selectLatestEligiblePiggy(projection,policy).decision,'latest-piggy-event-not-final');
 const ready=selectLatestEligiblePiggy({events:projection.events.slice(0,2)},policy);
 assert.equal(ready.event.id,'piggy|2026-10-25');
 assert.equal(selectLatestEligiblePiggy(projection,{...policy,enabled:false}).event,null);
});
test('source must be latest approved final, not held or pre-baseline',()=>{
 const e=event('2026-10-25','final',[{player:'A',clan:'AV-2',score:500,stars:20,sparks:2}]);
 const approvedUpdates={updates:[{approved:true,event:e}]};
 assert.equal(sourceEventForDispatch({approvedUpdates,holds:{holds:[]},eventId:e.id,clan:'AV-2',minimumEventDateExclusive:'2026-10-18'}).rows.length,1);
 assert.throws(()=>sourceEventForDispatch({approvedUpdates,holds:{holds:[{eventId:e.id,clan:'AV-2'}]},eventId:e.id,clan:'AV-2',minimumEventDateExclusive:'2026-10-18'}),/hold/);
 assert.throws(()=>sourceEventForDispatch({approvedUpdates,holds:{holds:[]},eventId:'piggy|2026-10-18',clan:'AV-2',minimumEventDateExclusive:'2026-10-18'}),/approved final|baseline/);
});
test('message is source-derived, clan-specific and leaves unknown rewards explicit',()=>{
 const e=event('2026-10-25','final',[
 {player:'A',clan:'AV-2',score:900,stars:10,sparks:null,metadata:{lobby:'av2',share:.4}},
 {player:'B',clan:'AV-2',score:1,stars:0,sparks:0,metadata:{lobby:'av2',share:0}},
 {player:'C',clan:'AV-2',score:700,stars:20,sparks:2,metadata:{lobby:'av2',share:.3}}
 ]);
 e.metadata={av2DisplayedPotStars:'1.5M'};
 const report={eventId:e.id,clan:'AV-2',kind:'piggy',eventStatus:'final',participants:2,knownScoreSum:1600,knownStars:30,knownSparks:2,unknownStarRows:0,unknownSparkRows:1,linePBs:1,placementPBs:2,firstTracked:1};
 const m=buildPiggyMessage(e,'AV-2',report);
 assert.match(m,/2 participating players · 1,600 lines/);
 assert.match(m,/RAKE: \*\*70.0%\*\*/);
 assert.match(m,/A — 900 lines/);
 assert.match(m,/unknown Spark rows/);
 assert.doesNotMatch(m,/B — 1 lines/);
 assert.throws(()=>buildPiggyMessage(e,'AV-2',{...report,knownScoreSum:1}),/source mismatch/);
});
test('PNG validator requires the approved raster dimensions and a bounded payload',()=>{
 const png=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(png,0);
 png.writeUInt32BE(13,8);png.writeUInt32BE(0x49484452,12);png.writeUInt32BE(2400,16);png.writeUInt32BE(1500,20);
 assert.equal(verifyPngBytes(png).length,64);
 assert.throws(()=>verifyPngBytes(Buffer.from('nope')),/size|signature/);
 const wrong=Buffer.from(png);wrong.writeUInt32BE(100,16);
 assert.throws(()=>verifyPngBytes(wrong),/2400/);
});
test('GitHub OIDC signature, audience, repo, workflow and main-ref claims are checked',async()=>{
 const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
 const jwk=publicKey.export({format:'jwk'});jwk.kid='test-kid';jwk.use='sig';jwk.kty='RSA';
 const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const now=1700000000;
 const claims={iss:'https://token.actions.githubusercontent.com',aud:OIDC_AUDIENCE,exp:now+300,iat:now,
 repository:'AvengersMobControl/avengers-stat-center',repository_id:REPOSITORY_ID,
 ref:'refs/heads/main',workflow_ref:WORKFLOW_REF,event_name:'schedule',sha:'a'.repeat(40)};
 const h=b64({alg:'RS256',kid:'test-kid'}),p=b64(claims),input=h+'.'+p;
 const sig=crypto.sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
 const verified=await verifyGitHubOIDC(input+'.'+sig,{now,jwks:{keys:[jwk]}});
 assert.equal(verified.sha,claims.sha);
 const badClaims={...claims,ref:'refs/heads/evil'};
 const bp=b64(badClaims),badInput=h+'.'+bp;
 const badSig=crypto.sign('RSA-SHA256',Buffer.from(badInput),privateKey).toString('base64url');
 await assert.rejects(()=>verifyGitHubOIDC(badInput+'.'+badSig,{now,jwks:{keys:[jwk]}}),/not authorized/);
});
