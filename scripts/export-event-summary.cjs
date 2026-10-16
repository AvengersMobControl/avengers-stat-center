#!/usr/bin/env node
'use strict';
// Reproducible, approved-ledger-only input for the Space (existing) and new
// Piggy/Flash/Kraken review PNG renderers. Never reads staging candidates,
// touches result records, publishes scores or posts to Discord.
const fs=require('node:fs'),path=require('node:path');
const {create}=require('./create-site-release.cjs');
const {root}=require('./load-site-data.cjs');
function exportRelease(){
 const release=create();
 if(!release?.projection?.version||!Array.isArray(release.projection.events))throw Error('Canonical projection unavailable');
 return {schemaVersion:1,source:'approved-event-ledger',projection:release.projection};
}
function writeApprovedRelease(name){
 if(!/^[A-Za-z0-9][A-Za-z0-9_.-]*\.json$/.test(name||''))throw Error('Output must be a local JSON filename');
 const dir=path.join(root,'reports');fs.mkdirSync(dir,{recursive:true});
 const dest=path.join(dir,name);
 fs.writeFileSync(dest,JSON.stringify(exportRelease())+'\n','utf8');
 return dest;
}
module.exports={exportRelease,writeApprovedRelease};
if(require.main===module){
 try{
  if(process.argv.length!==3)throw Error('Usage: node scripts/export-event-summary.cjs summary-release.json');
  const file=writeApprovedRelease(process.argv[2]);
  console.log(JSON.stringify({output:file,approvedSourceOnly:true,discordPostingEnabled:false}));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
