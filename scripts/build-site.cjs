#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {create}=require('./create-site-release.cjs'),{root}=require('./load-site-data.cjs');
const digest=s=>createHash('sha256').update(s).digest('hex');
function browserSource(release){
  const P=release.projection;
  const globals=JSON.stringify(release.globals).replaceAll('<','\\u003c');
  const projection=JSON.stringify(P).replaceAll('<','\\u003c');
  const extras=JSON.stringify({version:P.version,breakdowns:release.breakdowns,leagues:release.leagues,review:release.review}).replaceAll('<','\\u003c');
  return `Object.assign(window,${globals});\nwindow.AVENGERS_EVENT_PROJECTION=${projection};\nwindow.AVENGERS_EVENT_RELEASE=${extras};\n(function(){
    const D=window.AVENGERS_DATA,R=window.AVENGERS_EVENT_RELEASE;
    const resolve=raw=>{let n=String(raw||'').trim(),seen=new Set();while(D.aliasMap[n]&&D.aliasMap[n]!==n){if(seen.has(n))throw Error('Alias cycle');seen.add(n);n=D.aliasMap[n];}return n;};
    D.resolvePlayerName=resolve;
    window.AVENGERS_ROSTER_EVENT_BREAKDOWN={version:R.version,forMember(raw,base=0){
      const b=R.breakdowns[resolve(raw)]||{eventLoggedSparks:0,piggySparks:0,spaceSparks:0,flashSparks:0,krakenSparks:0,piggyStars:0,spaceStars:0,flashStars:0,loggedStars:0,knownStars:0,totalEvents:0};
      return {...b,historicBaseSparks:base,historicalBaseDiscrepancy:base-b.eventLoggedSparks,storedBaseDifference:(b.directRewardFloor||0)-base,sparksReconciliationDelta:0,baseSupplementSparks:0};
    }};
    window.AVENGERS_ROSTER_SPARKS_LEDGER={version:R.version,forMember(raw){const b=R.breakdowns[resolve(raw)]||{};return {flashSparks:b.flashSparks||0,octKrakenSparks:b.krakenOctoberSparks||0,juneKrakenSparks:b.krakenJuneReconstructedSparks||0};}};
  })();\n`;
}
function build({destination=path.join(root,'dist'),updates}={}){
  const release=create(updates===undefined?{}:{updates}),P=release.projection;
  // Match a deployed Pages/Vercel build to its exact commit, not just the
  // data projection version (which can remain stable across code-only changes).
  const commitCandidate=process.env.GITHUB_SHA||process.env.VERCEL_GIT_COMMIT_SHA||null;
  const sourceCommit=commitCandidate&&/^[a-f0-9]{40}$/i.test(commitCandidate)?commitCandidate.toLowerCase():null;
  fs.mkdirSync(destination,{recursive:true});
  // A failed build never replaces the previously deployed Pages artifact.
  for(const entry of fs.readdirSync(root,{withFileTypes:true})){
    if(entry.name.startsWith('.')||['dist','reports','scripts','docs','data','avengers-discord-mcp-connector'].includes(entry.name))continue;
    if(entry.isDirectory()&&entry.name!=='assets')continue;
    if(entry.isFile()&&!/\.(html|css|js|json|toml)$/.test(entry.name))continue;
    // Fonts are for the offline PNG renderers only; keep them out of the public site.
    fs.cpSync(path.join(root,entry.name),path.join(destination,entry.name),{recursive:true,filter:src=>!src.startsWith(path.join(root,'assets','fonts'))});
  }
  const script=browserSource(release);
  const bundle='release-data.'+digest(script).slice(0,16)+'.js';fs.writeFileSync(path.join(destination,bundle),script);
  let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const first=html.indexOf('<script>'),boundary=html.indexOf('<script src="roster-stars-snapshot-2026-10-15.js"></script>')+'<script src="roster-stars-snapshot-2026-10-15.js"></script>'.length;
  if(first<0||boundary<first)throw Error('Missing source data boundary');
  // Show the fixed historical attribution explicitly in production, not a mutable screenshot remainder.
  html=html.replaceAll('Screenshot Gap','Unlogged Sparks')
    .replaceAll('Sparks Prior to Logging','Unlogged Sparks');
  html=html.slice(0,first)+`<script src="${bundle}"></script>\n<script src="community-highlights.js"></script>\n<script src="member-profile-insights.js"></script>\n<script src="clan-league-rewards.js"></script>\n`+html.slice(boundary);
  // Preserve an immutable release marker on every page, whether or not an
  // unresolved-identity notice is necessary. Browser/Pages checks require it.
  const releaseMain='<main class="main" data-release-version="'+P.version+'" data-release-commit="'+(sourceCommit||'unknown')+'">';
  html=html.replace('<main class="main">',releaseMain);
  if(P.coverage.unassignedRows.length){
    html=html.replace(releaseMain,releaseMain+'<div style="padding:8px 28px;color:#91a5bf;font-size:12px">'+P.coverage.unassignedRows.length+' result awaiting account identification; its known rewards remain in clan totals. Historical coverage details are included in exports.</div>');
  }
  const exportsDir=path.join(destination,'exports');fs.mkdirSync(exportsDir,{recursive:true});
  const exportFiles={};
  const metrics=require('../event-reward-metrics.js');
  const summaries=P.events.filter(e=>e.status!=='revoked').map(e=>({...e,rows:e.rows.map(r=>({...r,sparksPerEffort:e.kind==='kraken'?null:metrics.efficiency(r.sparks,r.score),effortUnit:e.kind==='space'?'billion-lightyears':e.kind==='kraken'?null:'lines',rewardCheck:e.kind==='kraken'?null:metrics.reconcile(r),pbTransition:r.player?P.people.find(p=>p.name===r.player)?.kinds[e.kind]?.pbs.find(b=>b.eventId===e.id)||null:null}))}));
  for(const [name,value]of Object.entries({eventSummaries:summaries,projection:P,ledger:release.ledger,council:P.council,leagues:release.leagues,review:release.review})){
    const file=name+'.'+P.version.slice(0,16)+'.json';fs.writeFileSync(path.join(exportsDir,file),JSON.stringify({version:P.version,data:value}));exportFiles[name]='exports/'+file;
  }
  // Every JS/CSS reference has an immutable content address. No legacy source
  // scripts are loaded beside the newly projected release data.
  const referenced=[...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)].map(m=>m[1]);
  const assets={};
  for(const file of new Set(referenced)){
    const code=fs.readFileSync(path.join(destination,file));const ext=path.extname(file),name=file.slice(0,-ext.length)+'.'+digest(code).slice(0,16)+ext;
    if(file===bundle){assets[file]=file;continue;}fs.writeFileSync(path.join(destination,name),code);assets[file]=name;html=html.replaceAll('"'+file+'"','"'+name+'"');
  }
  const manifest={version:P.version,sourceCommit,assets,exports:exportFiles,coverage:P.coverage,unattendedIngestionEnabled:false};
  fs.writeFileSync(path.join(destination,'index.html'),html);
  fs.writeFileSync(path.join(destination,'release-manifest.json'),JSON.stringify(manifest));
  return {release,manifest,destination};
}
module.exports={build,browserSource};
if(require.main===module){const r=build();console.log(JSON.stringify({version:r.manifest.version,events:r.release.ledger.events.length,people:r.release.projection.people.length,unassigned:r.release.projection.coverage.unassignedRows.length}));}
