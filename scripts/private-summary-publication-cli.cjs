#!/usr/bin/env node
'use strict';
// Offline/local operator workflow ONLY. Never sends/deletes Discord messages.
// Secrets/identifiers via private stdin and owner-only registry outside git.
const fs=require('node:fs');
const state=require('./private-summary-publication-state.cjs');
const store=require('./private-summary-publication-store.cjs');
const registry=require('../data/event-png-template-approvals.json');
const command=process.argv[2],file=process.env.AVENGERS_PRIVATE_DISPATCH_REGISTRY;
try{
 if(!['inspect','review','stage','receipt','retire'].includes(command)||!file||process.argv.length!==3)
   throw Error('Usage: AVENGERS_PRIVATE_DISPATCH_REGISTRY=/private/0700/path/registry.json node scripts/private-summary-publication-cli.cjs inspect|review|stage|receipt|retire');
 const readInput=()=>JSON.parse(fs.readFileSync(0,'utf8'));
 let result;
 if(command==='inspect')result=state.reconcileReport(store.load(file));
 else if(command==='review')result=state.viewPlan(store.load(file),{
   candidate:readInput(),registry});
 else{
  const input=readInput();
  const operation=command==='stage'?
   s=>state.stage(s,{candidate:input.candidate,registry,authorization:input.authorization}):
   command==='receipt'?s=>state.confirmReceipt(s,{identity:input.identity,proof:input.proof}):
   s=>state.confirmRetired(s,{identity:input.identity,proof:input.proof});
  const written=store.transact(file,operation);
  result={decision:written.decision,changed:written.changed,
   requiresManualReconciliation:written.state.entries.some(e=>e.pending||e.retirement),
   automaticSendAllowed:false,automaticDeleteAllowed:false};
 }
 console.log(JSON.stringify(result,null,2));
}catch(e){
 // Never expose source stdin, local IDs, signed URLs or stack to CI logs.
 console.error('Private Discord summary registry operation blocked: '+e.message);
 process.exitCode=1;
}
