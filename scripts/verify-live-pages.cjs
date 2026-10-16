#!/usr/bin/env node
'use strict';
// Post-deploy release verification. Run only AFTER github-pages has published
// the coherent dist artifact. The actual hosted HTML + exported JSON + public
// manifest must all agree with this checkout's exact Git SHA and projection.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
function verifyFacts({manifest,local,dom,sha,projectionExport,ledgerExport}){
 assert.match(sha,/^[0-9a-f]{40}$/i,'Expected exact 40-digit commit SHA');
 assert.equal(manifest.sourceCommit,sha.toLowerCase(),
   'Published manifest does not match deployed commit');
 assert.equal(local.sourceCommit,sha.toLowerCase(),
   'Local build manifest does not match checkout commit');
 assert.equal(manifest.version,local.version,'Published event projection is stale');
 assert.equal(manifest.unattendedIngestionEnabled,false,'Unapproved ingestion must remain off');
 assert.deepEqual(manifest.assets,local.assets,'Site assets differ from coherent staged build');
 assert.deepEqual(manifest.exports,local.exports,'Export paths differ from coherent staged build');
 assert.equal(dom.version,local.version,'Published browser projection is stale');
 assert.equal(dom.markerVersion,local.version,'Published DOM release marker is stale');
 assert.equal(dom.markerCommit,sha.toLowerCase(),'Published DOM commit marker is stale');
 assert.equal(dom.browserErrors.length,0,'Published page has browser JS errors');
 assert.equal(dom.failedLocalRequests.length,0,'Published assets failed to load');
 assert.equal(dom.memberCount,dom.uniqueMemberCount,'Public site contains duplicate canonical members');
 assert.equal(projectionExport.version,local.version,'Public projection export is stale');
 assert.equal(projectionExport.data.version,local.version,'Public projection export data is stale');
 assert.equal(ledgerExport.version,local.version,'Public ledger export is stale');
 assert.equal(dom.spaceOct16AVENGERS,44,'Approved Oct 16 AVENGERS results missing');
 assert.equal(dom.spaceOct16AV2,22,'Approved Oct 16 AV-2 results missing');
 return {sourceCommit:sha.toLowerCase(),version:local.version,
   members:dom.memberCount,oct16Space:{AVENGERS:44,'AV-2':22},browserErrors:0,missingAssets:0};
}
async function fetchPublic(url,fetchFn=globalThis.fetch){
 const response=await fetchFn(url,{cache:'no-store',redirect:'follow',
   headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('HTTP '+response.status+' for '+new URL(url).pathname);
 return response.json();
}
async function verifyOnline({base,sha,retries=15,delayMs=8000,fetchFn=globalThis.fetch}){
 assert(/^https:\/\//.test(base),'Pages must be served over HTTPS');
 const u=new URL(base),root=u.toString().replace(/\/?$/,'/');
 const local=JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/release-manifest.json'),'utf8'));
 const fromRoot=(part,i)=>new URL(part,root).toString()+'?release_check='+sha.slice(0,10)+'_'+i;
 let manifest,reason;
 for(let i=0;i<retries;i++){
   try{
     manifest=await fetchPublic(fromRoot('release-manifest.json',i),fetchFn);
     if(manifest.sourceCommit!==sha.toLowerCase())throw Error('Published Pages manifest still on a different commit');
     if(manifest.version!==local.version)throw Error('Published Pages data version is stale');
     break;
   }catch(err){reason=err.message;if(i<retries-1)await new Promise(r=>setTimeout(r,delayMs));}
 }
 if(!manifest||manifest.sourceCommit!==sha.toLowerCase()||manifest.version!==local.version)
   throw Error('Exact Pages commit not visible after '+retries+' checks: '+reason);
 const [projectionExport,ledgerExport]=await Promise.all([
   fetchPublic(fromRoot(manifest.exports.projection,'projection'),fetchFn),
   fetchPublic(fromRoot(manifest.exports.ledger,'ledger'),fetchFn)
 ]);
 const {chromium}=require('playwright');
 const browser=await chromium.launch({headless:true});
 let dom;
 try{
   const page=await browser.newPage({viewport:{width:1280,height:900}});
   const browserErrors=[],failedLocalRequests=[];
   page.on('pageerror',e=>browserErrors.push(e.message));
   page.on('requestfailed',r=>{if(r.url().startsWith(root))failedLocalRequests.push(new URL(r.url()).pathname);});
   const response=await page.goto(fromRoot('', 'html'),{waitUntil:'networkidle',timeout:45000});
   assert(response?.ok(),'Public Pages HTML returned non-200 response');
   dom=await page.evaluate(()=>({
     version:window.AVENGERS_EVENT_PROJECTION?.version,
     markerVersion:document.querySelector('[data-release-version]')?.getAttribute('data-release-version'),
     markerCommit:document.querySelector('[data-release-commit]')?.getAttribute('data-release-commit'),
     memberCount:window.AVENGERS_DATA?.members?.length,
     uniqueMemberCount:new Set((window.AVENGERS_DATA?.members||[]).map(m=>m.name)).size,
     spaceOct16AVENGERS:(window.AVENGERS_DATA?.space?.events?.['2026-10-16']||[]).filter(r=>r.clan==='AVENGERS').length,
     spaceOct16AV2:(window.AVENGERS_DATA?.space?.events?.['2026-10-16']||[]).filter(r=>r.clan==='AV-2').length
   }));
   dom.browserErrors=browserErrors;dom.failedLocalRequests=failedLocalRequests;
 }finally{await browser.close();}
 return verifyFacts({manifest,local,dom,sha,projectionExport,ledgerExport});
}
module.exports={verifyFacts,fetchPublic,verifyOnline};
if(require.main===module){
 verifyOnline({base:process.env.AVENGERS_PUBLIC_URL||'',sha:process.env.AVENGERS_EXPECTED_SHA||''})
 .then(x=>console.log('Verified published GitHub Pages release: '+JSON.stringify(x)))
 .catch(e=>{console.error('GitHub Pages deployment NOT VERIFIED: '+e.message);process.exitCode=1;});
}
