'use strict';
// One-time server-side execution of a leader-approved, pre-existing batch.
// No public Discord identity mappings, route strategies, credentials or scores.
const crypto=require('node:crypto');
const review=require('../../server/discord-identity-review.cjs');
const {neon}=require('@neondatabase/serverless');
const APPROVAL='2026-11-12-all-proposed-discord-matches';
const ORIGIN='https://avengersmobcontrol.github.io/avengers-stat-center/';
function reply(res,status,value){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 return res.status(status).json(value);
}
async function canonicalCatalog(httpFetch=fetch){
 const manifestResponse=await httpFetch(ORIGIN+'release-manifest.json',{cache:'no-store',signal:AbortSignal.timeout(9000)});
 if(!manifestResponse.ok)throw Error('Live canonical manifest is unavailable');
 const manifest=await manifestResponse.json(),target=String(manifest.exports?.projection||'');
 if(!/^exports\/projection\.[a-f0-9]{8,64}\.json$/.test(target))throw Error('Invalid canonical release path');
 const projectionResponse=await httpFetch(ORIGIN+target,{cache:'no-store',signal:AbortSignal.timeout(9000)});
 if(!projectionResponse.ok)throw Error('Live canonical roster is unavailable');
 const projection=await projectionResponse.json();
 if(!Array.isArray(projection.data?.people))throw Error('Unexpected canonical roster format');
 let aliases={};
 const aliasPath=String(manifest.exports?.identityAliases||'');
 if(/^exports\/identityAliases\.[a-f0-9]{8,64}\.json$/.test(aliasPath)){
  const resp=await httpFetch(ORIGIN+aliasPath,{cache:'no-store',signal:AbortSignal.timeout(9000)});
  if(resp.ok){
   const content=await resp.json();
   if(content.data&&typeof content.data==='object'&&!Array.isArray(content.data))
    aliases=content.data;
  }
 }
 return {people:projection.data.people.map(p=>({name:p.name,status:p.status})),aliases};
}
async function handler(req,res){
 if(req.method!=='GET')return reply(res,405,{error:'GET required'});
 const candidate=String(req.query?.token||'');
 if(!/^[a-f0-9]{64}$/.test(candidate))return reply(res,403,{error:'Unauthorized'});
 if(!process.env.AVENGERS_IDENTITY_DATABASE_URL||!process.env.DISCORD_BOT_TOKEN||
    !/^\d{17,22}$/.test(process.env.DISCORD_GUILD_ID||''))
  return reply(res,503,{error:'Private identity service unavailable'});
 const q=neon(process.env.AVENGERS_IDENTITY_DATABASE_URL);
 try{
  const approved=await q.query(
   'SELECT auth_nonce,consumed_at FROM avengers_identity_private.leader_approvals WHERE approval_key=$1',
   [APPROVAL]);
  const row=approved[0],expected=String(row?.auth_nonce||'');
  if(!row||row.consumed_at||expected.length!==candidate.length||
      !crypto.timingSafeEqual(Buffer.from(candidate),Buffer.from(expected)))
   return reply(res,403,{error:'Expired or invalid authorization'});
  const [members,{people,aliases},existing]=await Promise.all([
   review.memberRoster(process.env),
   canonicalCatalog(),
   q.query('SELECT discord_username,canonical_name,discord_user_id,expected_joined_at FROM avengers_identity_private.discord_bindings')
  ]);
  if(!Array.isArray(members)||members.length<1||members.length>20000)
   throw Error('Member list is incomplete');
  const byUsername=new Map();
  for(const m of members){
   const key=String(m.user?.username||'');
   if(!byUsername.has(key))byUsername.set(key,[]);
   byUsername.get(key).push(m);
  }
  const reserved=new Set(existing.map(r=>r.discord_username));
  let verifiedExisting=0,created=0,notGuessed=0;
  // Confirm the seven separately supplied accounts from their server join
  // date and original Discord snowflake. Respect both Frenchie game accounts.
  for(const r of existing){
   const arr=byUsername.get(r.discord_username)||[],m=arr.length===1?arr[0]:null;
   if(!m||new Date(m.joined_at).getTime()!==new Date(r.expected_joined_at).getTime())continue;
   const id=String(m.user.id);
   if(!/^\d{17,22}$/.test(id))continue;
   if(r.discord_user_id&&r.discord_user_id!==id)continue;
   if(!r.discord_user_id){
    const updated=await q.query('UPDATE avengers_identity_private.discord_bindings '+
     'SET discord_user_id=$1,verified_at=now() WHERE discord_username=$2 AND canonical_name=$3 '+
     'AND discord_user_id IS NULL AND expected_joined_at=$4::timestamptz RETURNING discord_user_id',
     [id,r.discord_username,r.canonical_name,r.expected_joined_at]);
    verifiedExisting+=updated.length;
   }
  }
  // Every other BEST-GUESS matching suggestion shown to the leader was
  // explicitly confirmed. Do not invent a match for any unmatched account.
  for(const m of members){
   const username=String(m.user.username||'');
   if(reserved.has(username))continue;
   if(!/^[a-z0-9._]{2,32}$/.test(username)||!/^\d{17,22}$/.test(String(m.user.id))||!m.joined_at)
    continue;
   if((byUsername.get(username)||[]).length!==1)continue;
   const guess=review.suggest(m,people,aliases);
   if(!guess.suggestion){notGuessed++;continue;}
   const rows=await q.query('INSERT INTO avengers_identity_private.discord_bindings '+
    '(discord_username,canonical_name,discord_user_id,expected_joined_at,source,verified_at) '+
    'VALUES ($1,$2,$3,$4,$5,now()) ON CONFLICT (discord_username,canonical_name) DO NOTHING RETURNING discord_username',
    [username,guess.suggestion,String(m.user.id),m.joined_at,'leader-approved-all-suggestions-2026-11-12']);
   created+=rows.length;
  }
  // Never repeat this blanket approval automatically when the roster changes.
  const consumed=await q.query('UPDATE avengers_identity_private.leader_approvals '+
   'SET consumed_at=now(),auth_nonce=NULL WHERE approval_key=$1 AND auth_nonce=$2 AND consumed_at IS NULL RETURNING approval_key',
   [APPROVAL,candidate]);
  if(consumed.length!==1)throw Error('One-time approval already processed');
  return reply(res,200,{ok:true,approvedGuessLinksAdded:created,
   previouslyExplicitLinksVerified:verifiedExisting,unmatchedWithoutGuess:notGuessed,
   oneTimeAuthorizationConsumed:true});
 }catch(e){
  console.error('Private approved identity batch failed:',e.message);
  return reply(res,503,{error:'Private approval batch failed; no new automatic approvals will be attempted'});
 }
}
module.exports=handler;
module.exports.canonicalCatalog=canonicalCatalog;
