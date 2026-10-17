'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {bindOriginalProofs}=require('./verify-result-image-proofs.cjs');
const {assemble}=require('./assemble-result-review.cjs');
const hash=letter=>letter.repeat(64);
const evidence=(key,digest='a')=>({reviewKey:key,proof:{
  imageSha256:hash(digest),byteLength:2048,contentType:'image/jpeg',
  provenance:'authorized-original-discord-cdn-response',
  verifiedFinal:false,approved:false,
  warning:'Human review still required.'
}});
const row={player:'AV-HarryBallsagna',clan:'AVENGERS',score:210,
  sparks:100,stars:1000,metadata:{rank:1,privateDiscordId:'DO_NOT_COPY'}};
const evt={id:'space|2026-10-17',kind:'space',date:'2026-10-17',unit:'billion-lightyears'};
const capture=(key='a')=>({classification:'final-claim',verifiedFinal:true,
  reviewKey:key,eventId:evt.id,eventKind:evt.kind,eventDate:evt.date,rows:[row]});
const input=()=>({schemaVersion:1,event:evt,coverageComplete:false,
  screens:[{classification:'progress',eventId:evt.id,rows:[]},capture()]});
const proofs=()=>({schemaVersion:1,receipts:[evidence('a')]});

test('binds actual-byte digest receipt to separately verified final screenshot without leaking receipt keys',()=>{
  const raw=input(),manifest=proofs(),oldRaw=JSON.stringify(raw),oldProof=JSON.stringify(manifest);
  const bound=bindOriginalProofs(raw,manifest);
  assert.equal(bound.screens[1].imageSha256,hash('a'));
  assert.equal(bound.screens[1].reviewKey,undefined);
  assert.equal(bound.screens[0].imageSha256,undefined);
  assert.equal(JSON.stringify(raw),oldRaw,'review input unchanged');
  assert.equal(JSON.stringify(manifest),oldProof,'private receipts unchanged');
  const result=assemble(bound);
  assert.equal(result.update.approved,false);
  assert.equal(result.report.excludedPreliminary,1);
  assert.equal(result.update.event.sources[0],'reviewed-image-sha256:'+hash('a'));
  assert(!JSON.stringify(result.update).includes('DO_NOT_COPY'));
  assert(!JSON.stringify(result.update).includes('reviewKey'));
});
test('fails closed when original evidence is absent, unreferenced, duplicated or wrong hash',()=>{
  assert.throws(()=>bindOriginalProofs(input(),{schemaVersion:1,receipts:[]}),/manifest required/);
  assert.throws(()=>bindOriginalProofs(input(),{schemaVersion:1,receipts:[evidence('b')]}),/Missing original-byte receipt/);
  assert.throws(()=>bindOriginalProofs(input(),{schemaVersion:1,receipts:[evidence('a'),evidence('b')]}),/Unused original-image receipt/);
  assert.throws(()=>bindOriginalProofs(input(),{schemaVersion:1,receipts:[evidence('a'),evidence('a')]}),/Duplicate/);
  const mismatched=input();mismatched.screens[1].imageSha256=hash('b');
  assert.throws(()=>bindOriginalProofs(mismatched,proofs()),/does not match/);
  const double=input();double.screens.push(capture('a'));
  assert.throws(()=>bindOriginalProofs(double,proofs()),/two review entries/);
});
test('original CDN provenance is mandatory; preview hashes or manual attestation alone are insufficient',()=>{
  for(const edits of [
    {provenance:'transcoded-webp-viewer'},
    {provenance:'operator-original-byte-attestation'},
    {imageSha256:'not-a-hash'},
    {byteLength:0},
    {byteLength:25*1024*1024+1},
    {contentType:'text/html'},
    {approved:true},
    {verifiedFinal:true}
  ]){
    const m=proofs();Object.assign(m.receipts[0].proof,edits);
    assert.throws(()=>bindOriginalProofs(input(),m),/Receipt|source-image|byte count|type|cannot certify/);
  }
});
test('nonfinal screenshots cannot use receipt to sneak preliminary scores into candidate',()=>{
 const raw=input();raw.screens[0].reviewKey='a';
 assert.throws(()=>bindOriginalProofs(raw,proofs()),/Only final-claim/);
});
test('separate proof entries with same byte digest remain safe reposts after binding',()=>{
 const raw=input();raw.screens.push(capture('b'));
 const m={schemaVersion:1,receipts:[evidence('a'),evidence('b')]};
 const result=assemble(bindOriginalProofs(raw,m));
 assert.equal(result.report.finalImages,1);
 assert.equal(result.report.repostImages,1);
 assert.equal(result.update.event.rows.length,1);
});
test('original byte proof cannot substitute for independent human final-result review',()=>{
 const raw=input();raw.screens[1].verifiedFinal=false;
 assert.throws(()=>assemble(bindOriginalProofs(raw,proofs())),/reviewer verification/);
});
