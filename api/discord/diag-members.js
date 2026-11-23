'use strict';
/**
 * TEMP read-only diagnostic: returns the non-bot Discord guild member list
 * (permanent Discord ID, username, global name, server nickname, joined-at)
 * so a stale canonical<->Discord identity mapping can be re-checked by hand.
 *
 * Never writes anything (no Neon, no Discord writes), and returns nothing
 * beyond the plain member fields already visible to anyone in the server.
 * Added 2026-11-23 to look up AV-AnotherRound / AV-Robcorp / AV-V8 / AV-Megalodon
 * against the current member list after the 2026-11-12 identity snapshot went
 * stale. Revert once that lookup is done -- see server/discord-identity-review.cjs
 * for the shared memberRoster() pagination this reuses.
 */
const crypto=require('node:crypto');
const {memberRoster}=require('../../server/discord-identity-review.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

function answer(res,code,data){
 res.statusCode=code;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.end(JSON.stringify(data));
}
function tokenOkay(given,env){
 const expected=env.AVENGERS_MEMBERS_DIAG_TOKEN_SHA256;
 if(!/^[a-f0-9]{64}$/.test(given||'')||!/^[a-f0-9]{64}$/.test(expected||''))return false;
 return crypto.timingSafeEqual(Buffer.from(sha(given),'hex'),Buffer.from(expected,'hex'));
}

async function handler(req,res){
 if(req.method!=='GET')return answer(res,405,{ok:false});
 const env=process.env;
 if(env.VERCEL_ENV!=='production')return answer(res,404,{ok:false});
 const url=new URL(req.url,'https://avengers-stat-center.vercel.app');
 if(!tokenOkay(url.searchParams.get('token'),env))return answer(res,404,{ok:false});
 if(!env.DISCORD_BOT_TOKEN||!/^\d{17,22}$/.test(env.DISCORD_GUILD_ID||''))
  return answer(res,503,{ok:false,reason:'not-configured'});
 try{
  const members=await memberRoster(env);
  const rows=members.map(m=>({
   discordId:String(m.user.id),
   username:m.user.username||'',
   globalName:m.user.global_name||'',
   nickname:m.nick||'',
   joinedAt:m.joined_at||''
  }));
  return answer(res,200,{ok:true,count:rows.length,members:rows});
 }catch(e){
  return answer(res,503,{ok:false,reason:String(e?.message||'member lookup failed').slice(0,140)});
 }
}
module.exports=handler;
module.exports._test={tokenOkay};
