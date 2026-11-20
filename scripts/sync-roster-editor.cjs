'use strict';

const fs=require('node:fs'),path=require('node:path');
const {create}=require('./create-site-release.cjs');
const {root}=require('./load-site-data.cjs');
const {operation}=require('../server/roster-changes.cjs');
const {audience}=require('../server/roster-editor-ci.cjs');
const destination=path.join(root,'data/roster-changes.json');

async function main(){
  const oidc=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
  oidc.searchParams.set('audience',audience);
  const identity=await fetch(oidc,{headers:{Authorization:'Bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},signal:AbortSignal.timeout(8000)});
  if(!identity.ok)throw Error('Unable to request GitHub worker identity.');
  const {value}=await identity.json();
  const base=JSON.parse(fs.readFileSync(destination,'utf8'));
  const url=new URL('https://avengers-stat-center.vercel.app/api/roster-editor');
  url.searchParams.set('view','sync');
  url.searchParams.set('after',String(base.revision));
  const response=await fetch(url,{headers:{Authorization:'Bearer '+value},signal:AbortSignal.timeout(12000),redirect:'error'});
  if(!response.ok)throw Error('Roster sync endpoint returned HTTP '+response.status+'.');
  const {rows}=await response.json();
  if(!Array.isArray(rows)||rows.length>400)throw Error('Invalid roster queue response.');
  if(!rows.length){console.log('Roster queue is current at revision '+base.revision+'.');return;}
  const changes=rows.map((row,index)=>{
    if(row.revision!==base.revision+index+1)throw Error('Roster queue has a revision gap.');
    return operation(row.operation);
  });
  const next={revision:rows.at(-1).revision,changes:base.changes.concat(changes)};
  create({rosterChanges:next}); // No commit unless the complete canonical release validates.
  const temporary=destination+'.tmp';
  fs.writeFileSync(temporary,JSON.stringify(next,null,2)+'\n');
  fs.renameSync(temporary,destination);
  console.log('Validated '+changes.length+' owner-approved roster change(s), through revision '+next.revision+'.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
