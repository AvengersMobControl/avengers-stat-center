#!/usr/bin/env node
'use strict';
// One-off, source-byte-verified, commissioner-approved Oct 20/21 four-Flash import.
// No Discord sends, no network, no Vercel writes. By default: read-only.
// `--apply` writes only data/approved-event-updates.json after exact 105-row checks.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {root}=require('./load-site-data.cjs');
const {hashOriginalImage}=require('./hash-original-image.cjs');
const {bindOriginalProofs}=require('./verify-result-image-proofs.cjs');
const {assemble}=require('./assemble-result-review.cjs');
const {proposedReviewDigest,preview}=require('./stage-event-update.cjs');
const {create}=require('./create-site-release.cjs');
const source=require('../data/flash-2026-10-20-21-reviewed.json');
const hashes=require('../data/flash-2026-10-20-21-image-proofs.json');
const updatesPath=path.join(root,'data/approved-event-updates.json');
const expected=[25,28,28,24];
function prepare(proofDirectory){
  assert.equal(source.schemaVersion,1);assert.equal(hashes.schemaVersion,1);
  assert.equal(source.events.length,4);assert.equal(source.events.reduce((s,e)=>s+e.rows.length,0),105);
  const receipts={schemaVersion:1,receipts:[]},seen=new Set();
  const allKeys=Object.keys(hashes.images).sort();
  assert.equal(allKeys.length,24,'All 24 source attachments must be independently recorded');
  for(const key of allKeys){
    const h=hashes.images[key],extension=h.type==='image/png'?'png':'jpg';
    const filename=path.join(proofDirectory,key+'.'+extension);
    const bytes=fs.readFileSync(filename);
    const digest=hashOriginalImage(bytes,{originalBytesAttested:true,expectedContentType:h.type});
    assert.equal(digest.sha256,h.sha256,key+' wrong original SHA');
    assert.equal(digest.byteLength,h.bytes,key+' wrong original byte length');
  }
  const baseline=create(),aliases=baseline.globals.AVENGERS_DATA.aliasMap;
  const candidates=[];
  for(const [i,e]of source.events.entries()){
    assert.equal(e.flash,i+1);assert.equal(e.rows.length,expected[i]);
    assert.equal(e.setId,'2026-10-20-A');
    assert.equal(e.date,i===3?'2026-10-21':'2026-10-20');
    const eventId='flash|'+e.date+'|'+e.flash;
    assert(!baseline.ledger.events.some(x=>x.id===eventId),'Event already imported; do not double-count '+eventId);
    const groups=new Map();
    for(const [rank,name,lines,stars,sparks,lobby,imageIndex] of e.rows){
      assert(Number.isInteger(rank)&&rank>=1&&rank<=50,'Bad rank');
      assert(name.startsWith('AV')&&typeof name==='string','Unresolved/foreign participant');
      assert(Number.isInteger(lines)&&lines>=1,'Bad score');
      assert(stars===null||Number.isSafeInteger(stars)&&stars>=0,'Bad stars');
      assert(sparks===null||Number.isSafeInteger(sparks)&&sparks>=0,'Bad sparks');
      assert.equal(stars===null,sparks===null,'Missing rewards must both remain unknown');
      assert(['main','secondary'].includes(lobby),'Unknown lobby');
      const unique=eventId+'|'+name;assert(!seen.has(unique),'Duplicate participant '+unique);seen.add(unique);
      const key='pf'+e.flash+'_'+imageIndex;
      assert(hashes.images[key], 'Missing image receipt for '+key);
      const row={player:name,clan:'AVENGERS',score:lines,stars,sparks,metadata:{rank,lobby}};
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);
    }
    const review={schemaVersion:1,event:{id:eventId,kind:'flash',date:e.date,unit:'lines',metadata:{flash:e.flash}},coverageComplete:false,
      screens:[...groups].map(([reviewKey,rows])=>({reviewKey,classification:'final-claim',verifiedFinal:true,
        eventId,eventDate:e.date,eventKind:'flash',rows}))};
    const manifest={schemaVersion:1,receipts:[...groups.keys()].map(reviewKey=>{
      const h=hashes.images[reviewKey];return {reviewKey,proof:{imageSha256:h.sha256,byteLength:h.bytes,contentType:h.type,
        provenance:'authorized-original-discord-cdn-response',verifiedFinal:false,approved:false}};
    })};
    const bound=bindOriginalProofs(review,manifest);
    const result=assemble(bound,{aliases});
    assert.equal(result.report.distinctResults,e.rows.length);
    const update=result.update;
    update.event.metadata={...update.event.metadata,
      setId:e.setId,clan:'AVENGERS',potStars:e.mainPotStars,potStarsDisplay:e.mainPotDisplay,
      secondaryPotStars:e.secondaryPotStars,secondaryPotStarsDisplay:e.secondaryPotDisplay,
      channelId:e.channelId,messageIds:e.messageIds,
      source:'Original Discord final-claim screenshots Oct 20-21, 2026; exact SHA-256 receipt archive',
      coverageNote:'Only source-visible AVENGERS members imported; absent rows remain unknown; secondary lobbies tagged distinctly.'};
    update.event.sources.push(...allKeys.filter(key=>key.startsWith('pf'+e.flash+'_')&&!groups.has(key))
      .map(key=>'corroborating-original-image-sha256:'+hashes.images[key].sha256));
    update.event.sources.sort();
    candidates.push({update,result:result.report});
  }
  assert.equal(seen.size,105);
  return candidates;
}
function run({proofDirectory,apply=false}={}){
  assert(proofDirectory&&path.isAbsolute(proofDirectory),'Pass absolute --proof-dir=...');
  const candidates=prepare(proofDirectory);
  const accepted=JSON.parse(fs.readFileSync(updatesPath,'utf8'));
  let current=accepted.updates.slice();const packets=[];
  for(const {update,result} of candidates){
    const digest=proposedReviewDigest(current,update);
    const check=preview(current,update);
    assert(!check.unchanged,'A new approved event must change projection');
    assert(!check.after.projection.coverage.unassignedRows.some(r=>r.eventId===update.event.id),'No unresolved identity allowed');
    if(apply){
      const verify=proposedReviewDigest(current,update);
      assert.equal(verify,digest,'Stale review digest');
      update.approved=true;
    }
    current.push({...update,approved:true});
    const rows=update.event.rows;
    packets.push({eventId:update.event.id,rows:rows.length,knownStars:rows.reduce((s,r)=>s+(r.stars||0),0),
      knownSparks:rows.reduce((s,r)=>s+(r.sparks||0),0),unknownRewards:rows.filter(r=>r.sparks===null).length,
      sourceImages:result.finalImages,reviewDigest:digest});
  }
  if(apply){
    const total=current.slice(accepted.updates.length).reduce((s,u)=>s+u.event.rows.length,0);
    assert.equal(total,105);assert.equal(current.length-accepted.updates.length,4);
    const next={...accepted,updates:current};
    const temporary=updatesPath+'.tmp';fs.writeFileSync(temporary,JSON.stringify(next,null,2)+'\n');fs.renameSync(temporary,updatesPath);
  }
  return {mode:apply?'commissioner-approved-applied':'read-only-review',events:packets,
    totalRows:packets.reduce((s,p)=>s+p.rows,0),discordSent:false,unloggedSparksUntouched:true};
}
module.exports={prepare,run};
if(require.main===module){
  try{
    const args=process.argv.slice(2),proofDirectory=args.find(a=>a.startsWith('--proof-dir='))?.slice(12);
    assert(args.every(a=>a==='--apply'||a.startsWith('--proof-dir=')),'Unknown argument');
    console.log(JSON.stringify(run({proofDirectory,apply:args.includes('--apply')}),null,2));
  }catch(e){console.error(e.stack||e.message);process.exitCode=1;}
}
