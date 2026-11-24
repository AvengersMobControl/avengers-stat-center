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
test('the menu offers all 15 languages, preselected, and round-trips its message reference',()=>{
 const m=t.menu('1403361698177618081','1470175579058999386','hu','Change my language');
 const sel=m[0].components[0];
 assert.equal(sel.options.length,15);assert.equal(sel.options.find(o=>o.default).value,'hu');
 assert.deepEqual(t.parseCustomId(sel.custom_id),{channelId:'1403361698177618081',messageId:'1470175579058999386'});
});
test('only the single Translate command is registered',()=>{assert.deepEqual(t.COMMANDS.map(c=>c.name),['Translate']);});
test('Translate defers privately and edits in the translation in the background',async()=>{
 const calls=[];let bg;
 const httpFetch=async(url,init)=>{calls.push([url,init]);
  if(url.includes('ai-gateway'))return {ok:true,json:async()=>({choices:[{message:{content:'Hola equipo'}}]})};
  return {ok:true,json:async()=>({})};};
 const body={type:2,application_id:'1554265799806550096',token:'tok',locale:'es-ES',channel_id:'1',
  data:{type:3,name:'Translate',target_id:'9',resolved:{messages:{9:{content:'Hello team'}}}}};
 const r=await t.handle(body,{env:{AI_GATEWAY_API_KEY:'k'},httpFetch,defer:p=>{bg=p;},store:null});
 assert.deepEqual(r,{type:5,data:{flags:64}});await bg;
 const edit=calls.find(c=>c[0].includes('/webhooks/'));assert.ok(edit);
 const sent=JSON.parse(edit[1].body);assert.match(sent.content,/Hola equipo/);assert.deepEqual(sent.allowed_mentions,{parse:[]});
});
test('empty messages and expired menus answer privately without calling the model',async()=>{
 let called=false;const httpFetch=async()=>{called=true;return {ok:false};};
 const r=await t.handle({type:2,data:{type:3,name:'Translate',target_id:'9',resolved:{messages:{9:{content:'  '}}}}},{httpFetch,defer:()=>{},store:null});
 assert.equal(r.data.flags,64);assert.equal(called,false);
 const e=await t.handle({type:3,data:{custom_id:'tr:bad',values:['es']}},{httpFetch,defer:()=>{},store:null});
 assert.match(e.data.content,/expired/);
});
test('without background work it answers directly',async()=>{
 const httpFetch=async()=>({ok:true,json:async()=>({choices:[{message:{content:'Bonjour'}}]})});
 const r=await t.handle({type:2,locale:'fr',data:{type:3,name:'Translate',target_id:'9',resolved:{messages:{9:{content:'Hello'}}}}},
  {env:{AI_GATEWAY_API_KEY:'k'},httpFetch,defer:null,store:null});
 assert.equal(r.type,4);assert.equal(r.data.flags,64);assert.match(r.data.content,/Bonjour/);
});

function memStore(){const m=new Map();return {m,get:async u=>m.get(u)||null,set:async(u,c)=>{m.set(u,c);}};}
const ok=content=>async url=>url.includes('ai-gateway')?{ok:true,json:async()=>({choices:[{message:{content}}]})}:
 url.includes('/messages/')&&!url.includes('webhooks')?{ok:true,json:async()=>({content:'Hello team'})}:{ok:true,json:async()=>({})};
const U='123456789012345678';
test('picking a language saves it, and Translate then uses the saved language',async()=>{
 const store=memStore();
 await t.handle({type:3,member:{user:{id:U}},data:{custom_id:'tr:1403361698177618081:1470175579058999386',values:['ar']}},
  {env:{AI_GATEWAY_API_KEY:'k',DISCORD_BOT_TOKEN:'b'},httpFetch:ok('مرحبا'),defer:null,store});
 assert.equal(store.m.get(U),'ar');
 const r=await t.handle({type:2,locale:'en-US',member:{user:{id:U}},data:{type:3,name:'Translate',target_id:'9',resolved:{messages:{9:{content:'Hello'}}}}},
  {env:{AI_GATEWAY_API_KEY:'k'},httpFetch:ok('مرحبا'),defer:null,store});
 assert.match(r.data.content,/العربية/);
 const sel=r.data.components[0].components[0];
 assert.equal(sel.options.find(o=>o.default).value,'ar');assert.equal(sel.placeholder,'Change my language');
});
test('a database outage never blocks translation',async()=>{
 const broken={get:async()=>{throw Error('down');},set:async()=>{throw Error('down');}};
 const r=await t.handle({type:2,locale:'fr',member:{user:{id:U}},data:{type:3,name:'Translate',target_id:'9',resolved:{messages:{9:{content:'Hello'}}}}},
  {env:{AI_GATEWAY_API_KEY:'k'},httpFetch:ok('Bonjour'),defer:null,store:broken});
 assert.match(r.data.content,/Bonjour/);
});
