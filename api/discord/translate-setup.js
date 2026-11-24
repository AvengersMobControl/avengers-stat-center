'use strict';
// One-shot registration of the translate message commands, run server-side so the
// bot token never leaves Vercel. Guarded by a single-use token whose SHA-256 is in
// AVENGERS_TRANSLATE_SETUP_SHA256 and an expiry in AVENGERS_TRANSLATE_SETUP_EXPIRES_UTC.
const crypto=require('node:crypto');
const {register}=require('../../scripts/register-translate-commands.cjs');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const env=process.env,token=String(req.query?.token||'');
 const want=String(env.AVENGERS_TRANSLATE_SETUP_SHA256||''),exp=Date.parse(env.AVENGERS_TRANSLATE_SETUP_EXPIRES_UTC||'');
 const got=crypto.createHash('sha256').update(token).digest('hex');
 if(req.method!=='GET'||!/^[a-f0-9]{64}$/.test(token)||!/^[a-f0-9]{64}$/.test(want)||!Number.isFinite(exp)||Date.now()>exp||
  !crypto.timingSafeEqual(Buffer.from(got),Buffer.from(want)))return res.status(404).json({ok:false});
 try{return res.status(200).json({ok:true,registered:await register(env)});}
 catch(e){return res.status(502).json({ok:false,reason:String(e.message).slice(0,160)});}
};
