#!/usr/bin/env node
'use strict';
// Review a normalized event update. No Discord reads, no messages, no git push.
const fs=require('node:fs'),path=require('node:path');
const {create}=require('./create-site-release.cjs');
const {root}=require('./load-site-data.cjs');
function preview(current,update,{requireApproval=false}={}){
  if(requireApproval&&update?.approved!==true)throw Error('Update must carry explicit reviewed approval');
  const before=create({updates:current}),after=create({updates:current.concat({...update,approved:true})});
  const changed=after.projection.people.filter(p=>{
    const old=before.projection.people.find(x=>x.name===p.name);return JSON.stringify(old)!==JSON.stringify(p);
  }).map(p=>p.name);
  return {before,after,changed,reviewRequired:update.approved!==true,unchanged:before.projection.version===after.projection.version};
}
// This fingerprint ties a manual source change to the EXACT already reviewed
// before/after source version and proposed effects. A digest by itself does NOT
// establish leader consent or original-image validity; those are human gates.
function proposedReviewDigest(current,update){
  const {make}=require('./report-ingest-candidate.cjs');
  return make(current,{...update,approved:false}).reviewDigest;
}
module.exports={preview,proposedReviewDigest};
if(require.main===module){
  try{
    const args=process.argv.slice(2),input=args.find(x=>!x.startsWith('--'));
    const apply=args.includes('--apply');
    const flags=args.filter(x=>x.startsWith('--'));
    const manualDigest=flags.find(x=>x.startsWith('--approved-review-digest='))?.slice('--approved-review-digest='.length);
    if(!input||flags.some(x=>x!=='--apply'&&!x.startsWith('--approved-review-digest='))||
       flags.filter(x=>x.startsWith('--approved-review-digest=')).length>1||
       (!apply&&manualDigest))
      throw Error('Usage: node scripts/stage-event-update.cjs update.json [--apply --approved-review-digest=HEX_SHA256]');
    const target=path.join(root,'data/approved-event-updates.json'),current=JSON.parse(fs.readFileSync(target,'utf8'));
    const update=JSON.parse(fs.readFileSync(input,'utf8'));
    if(apply){
      if(update?.approved!==true)throw Error('Explicit leader-reviewed source approval required');
      const expected=proposedReviewDigest(current.updates,update);
      if(!manualDigest||!/^[a-f0-9]{64}$/i.test(manualDigest)||manualDigest.toLowerCase()!==expected)
        throw Error('Missing or stale exact approval-packet digest; review this candidate against CURRENT source first');
    }
    const result=preview(current.updates,update,{requireApproval:apply});
    if(apply&&!result.unchanged){
      const next={...current,updates:current.updates.concat(update)},temporary=target+'.tmp';
      fs.writeFileSync(temporary,JSON.stringify(next,null,2)+'\n');fs.renameSync(temporary,target);
    }
    console.log(JSON.stringify({mode:apply?'applied':'dry-run',action:result.unchanged?'unchanged':'updated',eventId:update.event.id,
      reviewRequired:result.reviewRequired,beforeVersion:result.before.projection.version,afterVersion:result.after.projection.version,changedMembers:result.changed,
      unknownRewards:result.after.projection.coverage.unknownRewards,unassignedRows:result.after.projection.coverage.unassignedRows.length,
      next:apply?'Run projection/browser tests, review the diff and commit for the versioned site build.':'Review the proposed report, seek explicit approval of exact results; --apply requires matching --approved-review-digest and writes locally only.'},null,2));
  }catch(e){console.error(e.message);process.exitCode=1;}
}
