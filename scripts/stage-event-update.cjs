#!/usr/bin/env node
'use strict';
// Review a normalized event update. No Discord reads, no messages, no git push.
const fs=require('node:fs'),path=require('node:path');
const {create}=require('./create-site-release.cjs');
const {root}=require('./load-site-data.cjs');
function preview(current,update){
  if(update?.approved!==true)throw Error('Update must carry explicit reviewed approval');
  const before=create({updates:current}),after=create({updates:current.concat(update)});
  const changed=after.projection.people.filter(p=>{
    const old=before.projection.people.find(x=>x.name===p.name);return JSON.stringify(old)!==JSON.stringify(p);
  }).map(p=>p.name);
  return {before,after,changed,unchanged:before.projection.version===after.projection.version};
}
module.exports={preview};
if(require.main===module){
  try{
    const args=process.argv.slice(2),input=args.find(x=>!x.startsWith('--'));
    if(!input||args.some(x=>x.startsWith('--')&&x!=='--apply'))throw Error('Usage: node scripts/stage-event-update.cjs update.json [--apply]');
    const target=path.join(root,'data/approved-event-updates.json'),current=JSON.parse(fs.readFileSync(target,'utf8'));
    const update=JSON.parse(fs.readFileSync(input,'utf8')),result=preview(current.updates,update);
    const apply=args.includes('--apply');
    if(apply&&!result.unchanged){
      const next={...current,updates:current.updates.concat(update)},temporary=target+'.tmp';
      fs.writeFileSync(temporary,JSON.stringify(next,null,2)+'\n');fs.renameSync(temporary,target);
    }
    console.log(JSON.stringify({mode:apply?'applied':'dry-run',action:result.unchanged?'unchanged':'updated',eventId:update.event.id,
      beforeVersion:result.before.projection.version,afterVersion:result.after.projection.version,changedMembers:result.changed,
      unknownRewards:result.after.projection.coverage.unknownRewards,unassignedRows:result.after.projection.coverage.unassignedRows.length,
      next:apply?'Run projection/browser tests, review the diff and commit for the versioned site build.':'Review this diff; --apply writes the approved source file locally only.'},null,2));
  }catch(e){console.error(e.message);process.exitCode=1;}
}
