'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {exportRelease,writeApprovedRelease}=require('./export-event-summary.cjs');
const {selectLatestEligiblePiggy,participatingRows,buildPiggyMessage,OIDC_AUDIENCE}=require('./automatic-piggy-dispatch-core.cjs');
const policy=require('../data/automatic-piggy-dispatch-policy.json');
const root=path.resolve(__dirname,'..');
const reports=path.join(root,'reports');
const CLANS=['AVENGERS','AV-2'];
const fail=m=>{throw Error(m)};
function parseArg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null;}
function prepareReport(release,event,clan,publish=false){
 const rows=participatingRows(event,clan);
 if(!rows.length)return {decision:'no-participating-rows',clan,eventId:event.id};
 fs.mkdirSync(reports,{recursive:true});
 const stem='automatic-piggy-v2-'+event.date+'-'+clan.toLowerCase();
 const png=path.join(reports,stem+'.png');
 const releasePath=writeApprovedRelease('automatic-piggy-release.json');
 const renderArgs=['scripts/render-big-piggy-auto.py',releasePath,png,'--kind','piggy',
   '--clan',clan,'--event-id',event.id,'--automatic-piggy-layout'];
 if(publish)renderArgs.push('--automatic-piggy-publish');
 execFileSync('python3',renderArgs,{cwd:root,stdio:'pipe'});
 const report=JSON.parse(fs.readFileSync(path.join(reports,stem+'.json'),'utf8'));
 const message=buildPiggyMessage(event,clan,report);
 fs.writeFileSync(path.join(reports,stem+'.txt'),message+'\n','utf8');
 return {decision:'prepared',eventId:event.id,date:event.date,clan,png,reportPath:path.join(reports,stem+'.json'),
   messagePath:path.join(reports,stem+'.txt'),message,report};
}
async function getOidcToken(){
 const token=await getOidcToken();
 return token;
}
async function verifyEndpoint(){
 const token=await getOidcToken();
 const endpoint=process.env.AVENGERS_PIGGY_DISPATCH_URL||'https://avengers-stat-center.vercel.app/api/dispatch-approved-piggy';
 const response=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:'{}',signal:AbortSignal.timeout(20000)});
 let answer={};try{answer=await response.json();}catch{}
 if(response.status===423&&answer.decision==='automatic-piggy-dispatch-disabled'){
  console.log(JSON.stringify({decision:'oidc-endpoint-verified-disabled',endpoint,productionSendStillOff:true}));
  return;
 }
 fail('OIDC endpoint check failed safely: HTTP '+response.status+' / '+(answer.decision||'unverified response'));
}
async function send(prepared,sourceCommit){
 const pngBytes=fs.readFileSync(prepared.png);
 const body={sourceCommit,eventId:prepared.eventId,kind:'piggy',clan:prepared.clan,
  projectionVersion:prepared.report.projectionVersion,templateVersion:prepared.report.templateVersion,
  imageSHA256:prepared.report.imageSHA256,report:prepared.report,message:prepared.message,
  imageBase64:pngBytes.toString('base64')};
 const tokenUrl=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL||'');
 if(!process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)fail('GitHub Actions OIDC token request is unavailable');
 tokenUrl.searchParams.set('audience',OIDC_AUDIENCE);
 const tokenResponse=await fetch(tokenUrl,{headers:{Authorization:'bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}});
 if(!tokenResponse.ok)fail('Could not obtain the scoped GitHub Actions OIDC token');
 const token=(await tokenResponse.json()).value;
 if(typeof token!=='string'||!token.length)fail('GitHub Actions returned an empty OIDC token');
 const endpoint=process.env.AVENGERS_PIGGY_DISPATCH_URL||'https://avengers-stat-center.vercel.app/api/dispatch-approved-piggy';
 const response=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 let answer={};
 try{answer=await response.json();}catch{}
 if(response.ok&&['sent','already-published'].includes(answer.decision)){
  console.log(JSON.stringify({eventId:prepared.eventId,clan:prepared.clan,decision:answer.decision,
   messageId:answer.messageId||null,imageSHA256:prepared.report.imageSHA256}));
  return answer;
 }
 fail('Piggy dispatch did not complete: HTTP '+response.status+' / '+(answer.decision||answer.reason||'unverified response'));
}
async function main(){
 const mode=process.argv[2]||'run';
 if(!['run','preview','verify-endpoint'].includes(mode))fail('Usage: node scripts/automatic-piggy-dispatch.cjs [run|preview|verify-endpoint] [--event-id piggy|YYYY-MM-DD]');
 if(mode==='verify-endpoint'){await verifyEndpoint();return;}
 const release=exportRelease();
 const projection=release.projection;
 if(mode==='preview'){
  const requested=parseArg('--event-id');
  const event=requested?projection.events.find(e=>e.id===requested):[...projection.events].filter(e=>e.kind==='piggy'&&e.status==='final').sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).at(-1);
  if(!event||event.kind!=='piggy'||event.status!=='final')fail('Preview requires a known final canonical Piggy event');
  const results=[];
  for(const clan of CLANS){
   const result=prepareReport(release,event,clan);
   if(result.decision==='prepared')results.push({eventId:result.eventId,date:result.date,clan:result.clan,
    png:result.png,reportPath:result.reportPath,messagePath:result.messagePath,imageSHA256:result.report.imageSHA256,
    participants:result.report.participants,lines:result.report.knownScoreSum,stars:result.report.knownStars,
    sparks:result.report.knownSparks,linePBs:result.report.linePBs,placementPBs:result.report.placementPBs,
    rakePercentDisplayedShareSum:result.report.rakePercentDisplayedShareSum});
   else results.push(result);
  }
  console.log(JSON.stringify({mode:'preview-only',source:'approved-event-ledger',projectionVersion:projection.version,
   policyEnabled:policy.enabled,results},null,2));
  return;
 }
 if(policy.enabled!==true||policy.status!=='approved'){
  console.log(JSON.stringify({decision:'automatic-piggy-policy-disabled',enabled:policy.enabled,status:policy.status}));
  return;
 }
 if(process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_REF!=='refs/heads/main'||
    !/^[a-f0-9]{40}$/i.test(process.env.GITHUB_SHA||''))fail('Automatic dispatch must run from the exact main-branch GitHub Actions workflow');
 const selected=selectLatestEligiblePiggy(projection,policy);
 if(!selected.event){console.log(JSON.stringify({decision:selected.decision,eventId:selected.eventId||null}));return;}
 for(const clan of CLANS){
  const prepared=prepareReport(release,selected.event,clan,true);
  if(prepared.decision==='no-participating-rows'){
   console.log(JSON.stringify(prepared));
   continue;
  }
  await send(prepared,process.env.GITHUB_SHA.toLowerCase());
 }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
