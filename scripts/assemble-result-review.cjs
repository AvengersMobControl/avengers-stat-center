#!/usr/bin/env node
'use strict';
// Build an UNAPPROVED event candidate from independently reviewed FINAL images.
// This module does not access Discord, interpret images, approve results or publish.
const fs=require('node:fs'),path=require('node:path');
const {normalize,canonical,stable,UNITS}=require('./event-projection-core.cjs');
const {root}=require('./load-site-data.cjs');

function check(condition,message){if(!condition)throw Error(message);}
function safeMetadata(raw){
  const data=raw&&typeof raw==='object'?raw:{},out={};
  for(const key of ['rank','group','share','lobby']){
    if(data[key]===undefined)continue;
    const value=data[key];
    if(key==='rank'||key==='group')check(Number.isInteger(value)&&value>=1&&value<=1000,'Invalid public '+key);
    if(key==='share')check(typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1,'Invalid public share');
    if(key==='lobby')check(typeof value==='string'&&/^[A-Za-z0-9-]{1,12}$/.test(value),'Invalid public lobby label');
    out[key]=value;
  }
  return Object.keys(out).length?out:null;
}
function publicRow(raw,aliases){
  check(raw&&typeof raw==='object'&&!Array.isArray(raw),'Invalid parsed result');
  // Unknown or ambiguous identities go to human review, never silently become
  // an invented member, a Discord user ID, or a different Frenchie account.
  check(typeof raw.player==='string'&&raw.player.trim(),'Unresolved player identity requires review');
  const player=canonical(raw.player,aliases);
  check(raw.clan==='AVENGERS'||raw.clan==='AV-2','Unknown EVENT-TIME clan for '+player);
  for(const field of ['score','sparks','stars']){
    check(Object.hasOwn(raw,field),'Missing '+field+' for '+player+'; use null if unknown');
    check(raw[field]===null||(typeof raw[field]==='number'&&Number.isFinite(raw[field])&&raw[field]>=0),
      'Invalid '+field+' for '+player);
  }
  const metadata=safeMetadata(raw.metadata);
  return {player,clan:raw.clan,score:raw.score,sparks:raw.sparks,stars:raw.stars,
    ...(metadata?{metadata}:{})};
}
function fingerprint(row){
  return stable({player:row.player,clan:row.clan,score:row.score,sparks:row.sparks,stars:row.stars});
}
function assemble(review,{existingEvent=null,aliases={}}={}){
  check(review?.schemaVersion===1,'Expected parsed-review schemaVersion 1');
  const e=review.event;
  check(e&&typeof e==='object'&&typeof e.id==='string'&&e.id.startsWith(e.kind+'|'),'Missing stable event identity');
  check(Object.hasOwn(UNITS,e.kind),'Unrecognized event type');
  check(e.unit===UNITS[e.kind],'Incorrect event score unit');
  if(e.kind==='piggy'||e.kind==='space')check(e.id===e.kind+'|'+e.date,'Event id must match kind and date');
  if(e.kind==='flash'){
    check(Number.isInteger(e.metadata?.flash)&&e.metadata.flash>=1&&e.metadata.flash<=20,'Flash number required');
    check(e.id==='flash|'+e.date+'|'+e.metadata.flash,'Flash identity mismatch');
  }
  if(e.kind==='kraken'){
    check(typeof e.metadata?.monthKey==='string'&&/^[a-z0-9-]{2,24}$/.test(e.metadata.monthKey),'Kraken month key required');
    check(e.id==='kraken|'+e.metadata.monthKey,'Kraken identity mismatch');
    check(typeof e.metadata?.monthLabel==='string'&&/^[A-Za-z0-9 -]{1,40}$/.test(e.metadata.monthLabel),'Kraken month label required');
  }
  check(typeof e.date==='string','Missing event date');
  check(review.coverageComplete===undefined||typeof review.coverageComplete==='boolean',
    'coverageComplete must be an explicit boolean');
  check(Array.isArray(review.screens)&&review.screens.length>0,'No reviewed screenshot entries');
  const prior=existingEvent?normalize(existingEvent,aliases):null;
  if(prior){
    check(prior.id===e.id&&prior.kind===e.kind&&prior.date===e.date&&prior.unit===e.unit,
      'Existing event identity/date/unit mismatch');
    check(prior.status!=='revoked','A revoked event requires a separate explicit correction review');
  }
  const seenImages=new Map(),accepted=new Map();
  let preliminary=0,reposts=0,repeatedPlayers=0,finalImages=0;
  for(const screen of review.screens){
    check(screen&&typeof screen==='object','Invalid screenshot review entry');
    check(['final-claim','preliminary','progress'].includes(screen.classification),
      'Unreviewed screenshot classification: final-claim required');
    if(screen.classification!=='final-claim'){preliminary++;continue;}
    check(screen.verifiedFinal===true,'Final screenshot requires explicit reviewer verification');
    check(screen.eventId===e.id&&screen.eventDate===e.date&&screen.eventKind===e.kind,
      'Screenshot/event identity mismatch');
    check(typeof screen.imageSha256==='string'&&/^[a-f0-9]{64}$/i.test(screen.imageSha256),
      'Final screenshot requires SHA-256 of image bytes');
    check(Array.isArray(screen.rows)&&screen.rows.length>0,'Final screenshot has no parsed rows');
    // Hash is an evidence reference, not a replacement for visual inspection.
    const key=screen.imageSha256.toLowerCase();
    const sanitized=screen.rows.map(row=>publicRow(row,aliases));
    if(e.kind==='kraken')check(sanitized.every(r=>r.stars===null),'Kraken has no Stars');
    const signatures=sanitized.map(fingerprint).sort();
    const previous=seenImages.get(key);
    if(previous){
      check(stable(previous)===stable(signatures),'Same image hash has conflicting extracted values');
      reposts++;continue;
    }
    seenImages.set(key,signatures);finalImages++;
    for(const row of sanitized){
      const old=accepted.get(row.player);
      if(old){
        check(fingerprint(old)===fingerprint(row),'Conflicting final screenshots for '+row.player);
        repeatedPlayers++;continue;
      }
      accepted.set(row.player,row);
    }
  }
  check(finalImages>0,'No verified final-claim screenshots; progress images excluded');
  const oldRows=new Map((prior?.rows||[]).filter(r=>r.player).map(r=>[r.player,r]));
  let inserted=0;
  for(const row of accepted.values()){
    const old=oldRows.get(row.player);
    if(old){
      check(fingerprint(old)===fingerprint(row),
        'Existing result for '+row.player+' differs; requires explicit correction/revision review');
    }else inserted++;
  }
  check(!(prior?.status==='final'&&inserted),'Existing final event cannot be silently extended');
  const unchanged=!!prior&&inserted===0&&(!review.coverageComplete||prior.status==='final');
  const oldMetadata=prior?.metadata||{};
  const eventMetadata={...oldMetadata};
  if(!prior){
    for(const key of ['flash','monthKey','monthLabel']){
      if(e.metadata?.[key]!==undefined)eventMetadata[key]=e.metadata[key];
    }
  }
  const metadata=unchanged?eventMetadata:{
    ...eventMetadata,
    complete:review.coverageComplete===true,
    coverageNote:review.coverageComplete===true?
      'Reviewer marked complete final-result coverage; publication still requires explicit approval.':
      'Partial final screenshot coverage; absent or cropped results remain unknown.'
  };
  const sources=unchanged?prior.sources:
    [...new Set([...(prior?.sources||[]),...[...seenImages.keys()].map(h=>'reviewed-image-sha256:'+h)])].sort();
  const status=unchanged?prior.status:review.coverageComplete===true?'final':'partial';
  const event=normalize({
    id:e.id,kind:e.kind,date:e.date,unit:e.unit,status,
    metadata,sources,
    rows:unchanged?prior.rows:[...(prior?.rows||[]),...[...accepted.values()].filter(r=>!oldRows.has(r.player))]
  },aliases);
  return {update:{approved:false,expectedRevision:existingEvent?.revision||0,event},
    report:{eventId:e.id,finalImages,excludedPreliminary:preliminary,repostImages:reposts,
      repeatedPlayerResults:repeatedPlayers,distinctResults:accepted.size,newResults:inserted,
      existingResults:prior?.rows.length||0,action:unchanged?'unchanged':'review-required',
      approvalRequired:true,autoPublish:false}};
}
module.exports={assemble,publicRow};
if(require.main===module){
  try{
    const args=process.argv.slice(2);
    check(args.length===1||(args.length===3&&args[1]==='--out'),
      'Usage: node scripts/assemble-result-review.cjs parsed-review.json [--out safe-file.json]');
    const review=JSON.parse(fs.readFileSync(args[0],'utf8'));
    const {create}=require('./create-site-release.cjs');
    const {migrate}=require('./migrate-event-ledger.cjs');
    const {load}=require('./load-site-data.cjs');
    const aliases=migrate(load()).aliases,baseline=create();
    const existing=baseline.ledger.events.find(e=>e.id===review.event?.id)||null;
    const result=assemble(review,{existingEvent:existing,aliases});
    const accepted=JSON.parse(fs.readFileSync(path.join(root,'data/approved-event-updates.json'),'utf8')).updates;
    const {preview}=require('./stage-event-update.cjs');
    const dry=preview(accepted,result.update);
    let output=null;
    if(args.length===3){
      const name=args[2];
      check(/^[A-Za-z0-9_-][A-Za-z0-9_.-]*\.json$/.test(name),'Output must be a safe .json filename (reports/ only)');
      const folder=path.join(root,'reports');fs.mkdirSync(folder,{recursive:true});
      output=path.join(folder,name);fs.writeFileSync(output,JSON.stringify(result.update,null,2)+'\n');
    }
    console.log(JSON.stringify({mode:'read-only-candidate',...result.report,
      changedMembers:dry.changed,beforeVersion:dry.before.projection.version,
      afterVersion:dry.after.projection.version,projectionUnchanged:dry.unchanged,
      output, ...(output?{}:{candidate:result.update})},null,2));
  }catch(e){console.error(e.message);process.exitCode=1;}
}
