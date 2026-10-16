'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {verifyFacts}=require('./verify-live-pages.cjs');
const sha='a'.repeat(40),version='b'.repeat(64);
const local={sourceCommit:sha,version,assets:{'site.js':'site.abc.js'},
 exports:{projection:'exports/projection.v.json',ledger:'exports/ledger.v.json'},
 unattendedIngestionEnabled:false};
const manifest={...local};
const dom={version,markerVersion:version,markerCommit:sha,
 memberCount:100,uniqueMemberCount:100,spaceOct16AVENGERS:44,spaceOct16AV2:22,
 browserErrors:[],failedLocalRequests:[]};
const projectionExport={version,data:{version}};
const ledgerExport={version,data:{events:[]}};
const valid=()=>({sha,local:structuredClone(local),manifest:structuredClone(manifest),
 dom:structuredClone(dom),projectionExport:structuredClone(projectionExport),
 ledgerExport:structuredClone(ledgerExport)});
test('exact commit, export version, DOM and both-clan counts validate together',()=>{
 const result=verifyFacts(valid());
 assert.equal(result.sourceCommit,sha);
 assert.equal(result.version,version);
 assert.deepEqual(result.oct16Space,{AVENGERS:44,'AV-2':22});
});
test('a new commit with unchanged data version MUST reject stale Pages cache',()=>{
 const fixture=valid();fixture.manifest.sourceCommit='c'.repeat(40);
 assert.throws(()=>verifyFacts(fixture),/deployed commit/);
});
test('stale HTML cannot pass even when manifest is current',()=>{
 const fixture=valid();fixture.dom.markerCommit='d'.repeat(40);
 assert.throws(()=>verifyFacts(fixture),/DOM commit/);
});
test('missing export, cached JS, missing results or duplicate members fail',()=>{
 const cases=[
   [x=>{x.manifest.exports.ledger='exports/stale.json';},/Export paths differ/],
   [x=>{x.manifest.assets['site.js']='site.stale.js';},/Site assets differ/],
   [x=>{x.projectionExport.version='old';},/projection export is stale/],
   [x=>{x.ledgerExport.version='old';},/ledger export is stale/],
   [x=>{x.dom.version='old';},/browser projection is stale/],
   [x=>{x.dom.uniqueMemberCount=99;},/duplicate canonical members/],
   [x=>{x.dom.spaceOct16AVENGERS=43;},/AVENGERS results missing/],
   [x=>{x.dom.spaceOct16AV2=21;},/AV-2 results missing/],
   [x=>{x.dom.browserErrors=['boom'];},/browser JS errors/],
   [x=>{x.dom.failedLocalRequests=['/site.js'];},/assets failed/],
   [x=>{x.manifest.unattendedIngestionEnabled=true;},/remain off/],
 ];
 for(const [change,error]of cases){const f=valid();change(f);assert.throws(()=>verifyFacts(f),error);}
});
