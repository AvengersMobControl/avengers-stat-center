'use strict';
// Discord slash command gateway: verified Ed25519 signature, ephemeral link only.
// No private route definition, score, or strategy goes in a channel message.
const crypto=require('node:crypto');
const FORM='/api/kraken/form';
function verify(raw,headers,publicKey,now=Date.now()){
 const sig=String(headers['x-signature-ed25519']||'');
 const ts=String(headers['x-signature-timestamp']||'');
 if(!/^[a-f0-9]{128}$/i.test(sig)||!/^\d{10}$/.test(ts)||
  Math.abs(now-Number(ts)*1000)>300000||!/^[a-f0-9]{64}$/i.test(publicKey||''))return false;
 try{return crypto.verify(null,Buffer.concat([Buffer.from(ts),raw]),
   {key:Buffer.from('302a300506032b6570032100'+publicKey,'hex'),format:'der',type:'spki'},
   Buffer.from(sig,'hex'));}catch{return false;}
}
let verifiedPublicKey=null;
async function applicationPublicKey(env=process.env,httpFetch=fetch){
 if(/^[a-f0-9]{64}$/i.test(env.DISCORD_PUBLIC_KEY||''))return env.DISCORD_PUBLIC_KEY;
 if(verifiedPublicKey)return verifiedPublicKey;
 if(!env.DISCORD_BOT_TOKEN||!/^[0-9]{17,22}$/.test(env.DISCORD_CLIENT_ID||''))return null;
 const r=await httpFetch('https://discord.com/api/v10/applications/@me',{
  headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN},
  signal:AbortSignal.timeout(2500)});
 if(!r.ok)return null;
 const app=await r.json();
 if(String(app.id)!==env.DISCORD_CLIENT_ID||!/^[a-f0-9]{64}$/i.test(app.verify_key||''))return null;
 verifiedPublicKey=app.verify_key;
 return verifiedPublicKey;
}
function answer(res,status,value){res.setHeader('Cache-Control','no-store');return res.status(status).json(value);}
async function readRaw(req){
 // On Vercel Node.js the req.body helper is a lazy getter that parses JSON.
 // Capture the original incoming stream *before* anyone accesses req.body.
 if(Buffer.isBuffer(req.rawBody))return req.rawBody;
 if(typeof req.rawBody==='string')return Buffer.from(req.rawBody,'utf8');
 const chunks=[];let length=0;
 if(!req[Symbol.asyncIterator])throw Error('Raw request stream not available');
 for await(const chunk of req){
  const buf=Buffer.from(chunk);length+=buf.length;
  if(length>25000)throw Error('Discord interaction exceeds maximum size');
  chunks.push(buf);
 }
 return Buffer.concat(chunks);
}
async function handler(req,res){
 if(req.method!=='POST')return answer(res,405,{error:'POST required'});
 let raw;
 try{raw=await readRaw(req);}catch{return answer(res,413,{error:'Invalid interaction payload'});}
 let key=null;
 try{key=await applicationPublicKey();}catch{}
 if(!raw.length||raw.length>25000||!verify(raw,req.headers,key))
  return answer(res,401,{error:'Invalid Discord signature'});
 let body;
 try{body=JSON.parse(raw.toString('utf8'));}catch{return answer(res,400,{error:'Invalid JSON'});}
 if(body.type===1)return answer(res,200,{type:1});
 if(body.type!==2||body.data?.name!=='kraken')return answer(res,400,{error:'Unsupported interaction'});
 if(String(body.guild_id)!==process.env.DISCORD_GUILD_ID)
  return answer(res,200,{type:4,data:{flags:64,content:'This command is available only in the AVENGERS server.'}});
 const userId=body.member?.user?.id||body.user?.id;
 if(!/^\d{17,22}$/.test(String(userId||'')))
  return answer(res,200,{type:4,data:{flags:64,content:'Unable to verify your Discord identity.'}});
 const origin=String(process.env.AVENGERS_KRAKEN_ORIGIN||'');
 if(!/^https:\/\/[a-z0-9.-]+$/.test(origin))
  return answer(res,200,{type:4,data:{flags:64,content:'Kraken entry is not configured yet.'}});
 return answer(res,200,{type:4,data:{flags:64,
  content:(process.env.AVENGERS_KRAKEN_TEST_MODE==='true'?
    '**KRAKEN TEST MODE — Dummy maps and test submissions only**\n':
    '**Private Kraken battle entry**\n')+
    'Open your secure form: '+origin+FORM+
    '\nSign in with the same Discord account. Your entries are private; test data never enters the master workbook.'}});
}
module.exports=handler;
module.exports.verify=verify;
module.exports.readRaw=readRaw;
module.exports.applicationPublicKey=applicationPublicKey;
