'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const t=require('../server/discord-translate.cjs');
const fs=require('node:fs');

test('language list matches the website dropdown exactly',()=>{
 const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
 const site=[...html.matchAll(/<option value="([a-zA-Z-]+)">/g)].map(m=>m[1]).filter(v=>t.LANGUAGES.some(l=>l[0]===v)||/^(en|es|de|hu|nl|fr|pt|uk|pl|tr|ar|ar-TN|vi|ja|zh-TW)$/.test(v));
 assert.deepEqual(t.LANGUAGES.map(l=>l[0]),[...new Set(site)]);
});
test('Discord locales map to site languages, unsupported ones to English',()=>{
 assert.equal(t.languageForLocale('es-ES'),'es');assert.equal(t.languageForLocale('pt-BR'),'pt');
 assert.equal(t.languageForLocale('zh-TW'),'zh-TW');assert.equal(t.languageForLocale('zh-CN'),'en');
 assert.equal(t.languageForLocale('ko'),'en');assert.equal(t.languageForLocale('en-US'),'en');assert.equal(t.languageForLocale('uk'),'uk');
});
test('picker is private and preselects the reader language',()=>{
 const p=t.picker('1403361698177618081','1470175579058999386','hu');
 assert.equal(p.data.flags,64);const opts=p.data.components[0].components[0].options;
 assert.equal(opts.length,15);assert.equal(opts.find(o=>o.default).value,'hu');
 assert.deepEqual(t.parseCustomId(p.data.components[0].components[0].custom_id),{channelId:'1403361698177618081',messageId:'1470175579058999386'});
});
test('Translate defers privately and edits in the translation in the background',async()=>{
 const calls=[];let bg;
 const httpFetch=async(url,init)=>{calls.push([url,init]);
  if(url.includes('ai-gateway'))return {ok:true,json:async()=>({choices:[{message:{content:'Hola equipo'}}]})};
  return {ok:true,json:async()=>({})};};
 const body={type:2,application_id:'1554265799806550096',token:'tok',locale:'es-ES',channel_id:'1',
  data:{type:3,name:'Translate',target_id:'9',resolved:{messages:{9:{content:'Hello team'}}}}};
 const r=await t.handle(body,{env:{AI_GATEWAY_API_KEY:'k'},httpFetch,defer:p=>{bg=p;}});
 assert.deepEqual(r,{type:5,data:{flags:64}});await bg;
 const edit=calls.find(c=>c[0].includes('/webhooks/'));assert.ok(edit);
 const sent=JSON.parse(edit[1].body);assert.match(sent.content,/Hola equipo/);assert.deepEqual(sent.allowed_mentions,{parse:[]});
});
test('empty messages and expired menus answer privately without calling the model',async()=>{
 let called=false;const httpFetch=async()=>{called=true;return {ok:false};};
 const r=await t.handle({type:2,data:{type:3,name:'Translate',target_id:'9',resolved:{messages:{9:{content:'  '}}}}},{httpFetch,defer:()=>{}});
 assert.equal(r.data.flags,64);assert.equal(called,false);
 const e=await t.handle({type:3,data:{custom_id:'tr:bad',values:['es']}},{httpFetch,defer:()=>{}});
 assert.match(e.data.content,/expired/);
});
test('without background work it answers directly',async()=>{
 const httpFetch=async()=>({ok:true,json:async()=>({choices:[{message:{content:'Bonjour'}}]})});
 const r=await t.handle({type:2,locale:'fr',data:{type:3,name:'Translate',target_id:'9',resolved:{messages:{9:{content:'Hello'}}}}},
  {env:{AI_GATEWAY_API_KEY:'k'},httpFetch,defer:null});
 assert.equal(r.type,4);assert.equal(r.data.flags,64);assert.match(r.data.content,/Bonjour/);
});
