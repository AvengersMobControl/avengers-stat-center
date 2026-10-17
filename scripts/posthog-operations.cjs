'use strict';
// Server/CI-only operational telemetry. No SDK, browser capture, chat content,
// private URLs, raw errors, person profiles, retries, or business API calls.
const {createHash,randomUUID}=require('node:crypto');
const PROJECT_ID='670043';
const KEY_HASH='bbe1a38e8827dd021ddf112fd4d0c811868125e284fa6d1497482e6cbe305240';
const EVENT='avengers_pages_release';
const CODES=new Set(["verified","verification_failed","smoke_test"]);
function buildEvent(input={}){
 if(!['success','failure'].includes(input.outcome)||!CODES.has(input.code))return null;
 if(typeof input.release!=='string'||!(/^[a-f0-9]{40}$/).test(input.release))return null;
 return {event:EVENT,distinct_id:randomUUID(),properties:{
  project:'avengers',environment:input.code==='smoke_test'?'verification':'production',
  outcome:input.outcome,code:input.code,release:input.release,
  $process_person_profile:false,$geoip_disable:true}};
}
async function postEvent(event,token,fetchFn=globalThis.fetch){
 try{
  const r=await fetchFn('https://us.i.posthog.com/i/v0/e/',{
   method:'POST',redirect:'error',headers:{'content-type':'application/json'},
   signal:AbortSignal.timeout(3000),body:JSON.stringify({...event,api_key:token})});
  // An accepted HTTP response is not independent ingestion evidence.
  return {status:r.ok?'accepted':'rejected'};
 }catch{return {status:'unavailable'};}
}
async function capture(input,{env=process.env,fetchFn=globalThis.fetch}={}){
 if(env.AVENGERS_POSTHOG_ENABLED!=='true')return {status:'disabled'};
 const key=env.AVENGERS_POSTHOG_PROJECT_TOKEN;
 if(env.AVENGERS_POSTHOG_PROJECT_ID!==PROJECT_ID||typeof key!=='string'||
  createHash('sha256').update(key).digest('hex')!==KEY_HASH)
  return {status:'scope_mismatch'};
 const payload=buildEvent(input);
 if(!payload)return {status:'invalid_event'};
 return postEvent(payload,key,fetchFn);
}
module.exports={buildEvent,capture,postEvent,PROJECT_ID};
if(require.main===module){
 const env=process.env,verified=env.AVENGERS_TELEMETRY_OUTCOME==='success';
 capture({outcome:verified?'success':'failure',
  code:env.AVENGERS_TELEMETRY_CODE||(verified?"verified":"verification_failed"),
  release:env.GITHUB_SHA}).then(r=>console.log('AVENGERS_TELEMETRY '+r.status))
 .catch(()=>console.log('AVENGERS_TELEMETRY unavailable'));
}
