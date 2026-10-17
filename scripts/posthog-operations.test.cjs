'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {buildEvent,capture,postEvent,PROJECT_ID}=require('./posthog-operations.cjs');
const release='a'.repeat(40),valid={outcome:'success',code:"verified",release};
test('allowlist discards all private inputs and never creates person profiles',()=>{
 const out=buildEvent({...valid,email:'private@example.test',message:'secret',url:'https://private.test?token=secret',error:new Error('secret'),$set:{name:'secret'}});
 assert.equal(out.event,"avengers_pages_release");
 assert.deepEqual(Object.keys(out.properties).sort(),['$geoip_disable','$process_person_profile','code','environment','outcome','project','release'].sort());
 assert.equal(out.properties.$process_person_profile,false);
 assert.equal(out.properties.$geoip_disable,true);
 assert(!JSON.stringify(out).includes('secret'));
});
test('unsupported outcomes/codes/releases never produce events',()=>{
 for(const x of [{outcome:'blocked'},{code:'raw exception'},{release:'https://private.test'},{release:'a'.repeat(41)}])
  assert.equal(buildEvent({...valid,...x}),null);
});
test('operational events never reuse a person identifier',()=>{
 assert.notEqual(buildEvent(valid).distinct_id,buildEvent(valid).distinct_id);
});
test('disabled transport makes no network call',async()=>{
 assert.deepEqual(await capture(valid,{env:{},fetchFn:()=>assert.fail('network')}),{status:'disabled'});
});
test('missing/wrong/cross-project key fails closed',async()=>{
 for(const id of [PROJECT_ID,'other']){
  assert.deepEqual(await capture(valid,{env:{AVENGERS_POSTHOG_ENABLED:'true',AVENGERS_POSTHOG_PROJECT_ID:id,AVENGERS_POSTHOG_PROJECT_TOKEN:'wrong-key'},fetchFn:()=>assert.fail('network')}),{status:'scope_mismatch'});
 }
});
test('transport fixes intake origin, blocks redirects, bounds runtime and never retries',async()=>{
 let calls=0;
 const r=await postEvent(buildEvent(valid),'test-only',async(url,opts)=>{
  calls++;assert.equal(url,'https://us.i.posthog.com/i/v0/e/');
  assert.equal(opts.redirect,'error');assert(opts.signal instanceof AbortSignal);
  assert.equal(JSON.parse(opts.body).api_key,'test-only');
  return {ok:true};
 });
 assert.deepEqual(r,{status:'accepted'});assert.equal(calls,1);
});
test('network failures and quota rejection remain telemetry-only',async()=>{
 let calls=0;
 assert.deepEqual(await postEvent(buildEvent(valid),'test-only',async()=>{calls++;throw Error('private token');}),{status:'unavailable'});
 assert.equal(calls,1);
 assert.deepEqual(await postEvent(buildEvent(valid),'test-only',async()=>({ok:false})),{status:'rejected'});
});
