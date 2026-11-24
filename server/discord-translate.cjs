'use strict';
// Private, on-demand Discord message translation (leader request 2026-11-23).
// One message command (right-click / long-press a message -> Apps -> Translate):
// translates into the reader's saved language, else their Discord language, else
// English. Every reply has a "Change my language" dropdown of the 17
// languages (leader 2026-11-23 trimmed the separate "Translate to…" command).
// Replies are always ephemeral (only the person who asked sees them). The only thing
// stored is each member's chosen language (Discord user ID + language code, private
// Neon table avengers_translate_private.language_preferences). Picking a language in
// the menu saves it; "Translate" then uses it. Message text goes only to the
// Vercel AI Gateway for the translation and is never stored.
// Languages: the website's language dropdown (index.html) plus Swedish and Hindi
// (leader 2026-11-24). Discord locales sv-SE and hi map to them.
const LANGUAGES=[
 ['en','English','English'],['es','Español','Spanish'],['de','Deutsch','German'],
 ['hu','Magyar','Hungarian'],['nl','Nederlands','Dutch'],['fr','Français','French'],
 ['pt','Português','Portuguese'],['uk','Українська','Ukrainian'],['pl','Polski','Polish'],
 ['tr','Türkçe','Turkish'],['ar','العربية','Arabic (Modern Standard Arabic)'],
 ['ar-TN','تونسي — Tunisian Arabic','Tunisian Arabic (Derja), written in Arabic script'],
 ['vi','Tiếng Việt','Vietnamese'],['ja','日本語','Japanese'],
 ['zh-TW','繁體中文（台灣）','Traditional Chinese as used in Taiwan'],
 ['sv','Svenska','Swedish'],['hi','हिन्दी','Hindi (Devanagari script)']];
const BY_CODE=new Map(LANGUAGES.map(l=>[l[0],l]));
const COMMANDS=[{name:'Translate',type:3,dm_permission:false}];
const MODEL='anthropic/claude-haiku-5.5';
const GATEWAY='https://ai-gateway.vercel.sh/v1/chat/completions';
const API='https://discord.com/api/v10';

// Discord client locale (en-US, es-ES, pt-BR, sv-SE, hi, zh-TW, …) -> language code.
function languageForLocale(locale){
 const l=String(locale||'');
 if(BY_CODE.has(l))return l;
 if(l==='zh-TW')return 'zh-TW';
 const base=l.split('-')[0];
 if(base!=='zh'&&BY_CODE.has(base))return base;
 return 'en';
}
function menu(channelId,messageId,preset,placeholder='Choose a language'){
 return [{type:1,components:[{type:3,custom_id:'tr:'+channelId+':'+messageId,placeholder,
  options:LANGUAGES.map(([value,label])=>({label,value,default:value===preset}))}]}];
}

// ---- saved language preference (private Neon) ----
function prefStore(env=process.env){
 const url=env.AVENGERS_TRANSLATE_DATABASE_URL||env.AVENGERS_KRAKEN_DATABASE_URL;
 if(!url)return null;
 const {neon}=require('@neondatabase/serverless');
 const sql=neon(url,{fullResults:false});
 return {
  async get(userId){
   const rows=await sql.query('SELECT language_code FROM avengers_translate_private.language_preferences WHERE discord_user_id=$1',[userId]);
   return BY_CODE.has(rows[0]?.language_code)?rows[0].language_code:null;
  },
  async set(userId,code){
   await sql.query('INSERT INTO avengers_translate_private.language_preferences(discord_user_id,language_code) VALUES($1,$2) '+
    'ON CONFLICT (discord_user_id) DO UPDATE SET language_code=EXCLUDED.language_code,updated_at=now()',[userId,code]);
  }};
}
async function savedLanguage(store,userId){
 if(!store||!/^\d{17,22}$/.test(userId||''))return null;
 try{return await store.get(userId);}catch{return null;}
}
async function saveLanguage(store,userId,code){
 if(!store||!/^\d{17,22}$/.test(userId||'')||!BY_CODE.has(code))return false;
 try{await store.set(userId,code);return true;}catch{return false;}
}
function parseCustomId(id){
 const m=/^tr:(\d{17,22}):(\d{17,22})$/.exec(String(id||''));
 return m?{channelId:m[1],messageId:m[2]}:null;
}
function clip(text,max=1900){return text.length>max?text.slice(0,max-1)+'…':text;}

async function translate(text,code,{env=process.env,oidc,httpFetch=fetch,timeoutMs=20000}={}){
 const lang=BY_CODE.get(code)||BY_CODE.get('en');
 const key=env.AI_GATEWAY_API_KEY||oidc||env.VERCEL_OIDC_TOKEN;
 if(!key)throw Error('Translation service is not configured');
 const r=await httpFetch(GATEWAY,{method:'POST',signal:AbortSignal.timeout(timeoutMs),
  headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
  body:JSON.stringify({model:MODEL,max_tokens:1500,temperature:0,messages:[
   {role:'system',content:'You translate Discord messages for a mobile-game clan (Mob Control). '+
    'Translate the user\'s message into '+lang[2]+'. Output ONLY the translation, nothing else. '+
    'Keep Discord formatting, @mentions, links, numbers and custom emoji codes like <:name:123> exactly as they are. '+
    'Keep player names and game terms (Big Pig, Piggy Flash, Space Race, Kraken, Sparks, Stars, PB) untranslated. '+
    'If the message is already in that language, return it unchanged.'},
   {role:'user',content:text}]})});
 if(!r.ok)throw Error('Translation service HTTP '+r.status);
 const j=await r.json();
 const out=String(j?.choices?.[0]?.message?.content||'').trim();
 if(!out)throw Error('Empty translation');
 return out;
}
function render(code,translated){
 const lang=BY_CODE.get(code)||BY_CODE.get('en');
 return clip('**'+lang[1]+'**\n'+translated,1850)+'\n-# Wrong language? Pick yours below; it is saved for next time.';
}
async function fetchMessage(channelId,messageId,env=process.env,httpFetch=fetch){
 const r=await httpFetch(API+'/channels/'+channelId+'/messages/'+messageId,{
  headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN},signal:AbortSignal.timeout(5000)});
 if(!r.ok)throw Error('Message unavailable');
 const m=await r.json();
 return String(m.content||'');
}
async function editOriginal(appId,token,content,components,httpFetch=fetch){
 await httpFetch(API+'/webhooks/'+appId+'/'+token+'/messages/@original',{method:'PATCH',
  headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(8000),
  body:JSON.stringify({content,components,allowed_mentions:{parse:[]}})});
}
// Vercel's background-work hook (the same one @vercel/functions' waitUntil uses).
function waitUntil(){
 const ctx=globalThis[Symbol.for('@vercel/request-context')]?.get?.();
 return typeof ctx?.waitUntil==='function'?p=>ctx.waitUntil(p):null;
}

// Returns the immediate interaction response; schedules the slow part in the background.
async function handle(body,{env=process.env,oidc,httpFetch=fetch,defer=waitUntil(),store=prefStore(env)}={}){
 const appId=String(body.application_id||''),token=String(body.token||'');
 const userId=String(body.member?.user?.id||body.user?.id||'');
 const nothing={type:4,data:{flags:64,content:'There is no text in that message to translate.'}};
 async function work(text,code){
  try{return render(code,await translate(text,code,{env,oidc,httpFetch}));}
  catch{return 'Sorry, the translation did not work this time. Please try again in a minute.';}
 }
 function respond(deferredType,text,code,ref){
  const components=menu(ref.channelId,ref.messageId,code,'Change my language');
  if(defer){
   defer(work(text,code).then(c=>editOriginal(appId,token,c,components,httpFetch)).catch(()=>{}));
   return deferredType===6?{type:6}:{type:5,data:{flags:64}};
  }
  return work(text,code).then(content=>deferredType===6?
   {type:7,data:{content,components,allowed_mentions:{parse:[]}}}:
   {type:4,data:{flags:64,content,components,allowed_mentions:{parse:[]}}});
 }
 if(body.type===2&&body.data?.type===3){
  const id=String(body.data.target_id||'');
  const msg=body.data.resolved?.messages?.[id];
  const ref={channelId:String(body.channel_id||msg?.channel_id||''),messageId:id};
  const code=(await savedLanguage(store,userId))||languageForLocale(body.locale);
  const text=String(msg?.content||'').trim();
  if(!text)return nothing;
  return respond(5,text,code,ref);
 }
 if(body.type===3){
  const ref=parseCustomId(body.data?.custom_id),code=body.data?.values?.[0];
  if(!ref||!BY_CODE.has(code))return {type:4,data:{flags:64,content:'That translation menu has expired.'}};
  await saveLanguage(store,userId,code);
  let text='';
  try{text=(await fetchMessage(ref.channelId,ref.messageId,env,httpFetch)).trim();}catch{}
  if(!text)return {type:7,data:{content:'Saved your language. That message is no longer available, or has no text.',components:[]}};
  return respond(6,text,code,ref);
 }
 return null;
}
const isTranslate=body=>(body.type===2&&body.data?.type===3&&COMMANDS.some(c=>c.name===body.data?.name))||
 (body.type===3&&String(body.data?.custom_id||'').startsWith('tr:'));

module.exports={LANGUAGES,COMMANDS,MODEL,languageForLocale,menu,prefStore,parseCustomId,translate,handle,isTranslate,render};
