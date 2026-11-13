'use strict';
// Private leader-confirmed Discord account -> game account links.
// No member usernames, account identities or IDs are committed to GitHub.
const SELECT='SELECT discord_username,canonical_name,discord_user_id,expected_joined_at,source,verified_at '+
 'FROM avengers_identity_private.discord_bindings ORDER BY discord_username,canonical_name';
const UPDATE='UPDATE avengers_identity_private.discord_bindings SET discord_user_id=$1,verified_at=now() '+
 'WHERE discord_username=$2 AND canonical_name=$3 AND expected_joined_at=$4::timestamptz '+
 'AND discord_user_id IS NULL RETURNING discord_user_id';
const idRegex=/^[0-9]{17,22}$/;
const usernameRegex=/^[a-z0-9._]{2,32}$/;
function productionQuery(env=process.env){
 if(!env.AVENGERS_IDENTITY_DATABASE_URL)throw Error('Private Discord identity store not configured');
 const {neon}=require('@neondatabase/serverless');
 const db=neon(env.AVENGERS_IDENTITY_DATABASE_URL);
 return (sql,params=[])=>db.query(sql,params);
}
function joinDate(value){
 const ms=Date.parse(value);
 return Number.isFinite(ms)?ms:null;
}
function plan(records,members){
 if(!Array.isArray(records)||!Array.isArray(members))throw Error('Invalid identity source');
 const byUsername=new Map();
 for(const m of members){
  const username=String(m?.user?.username||'');
  const id=String(m?.user?.id||'');
  if(!usernameRegex.test(username)||!idRegex.test(id)||m.user.bot===true)continue;
  const group=byUsername.get(username)||[];
  group.push(m);byUsername.set(username,group);
 }
 return records.map(record=>{
  const matches=byUsername.get(record.discord_username)||[];
  const m=matches.length===1?matches[0]:null;
  const prior=record.discord_user_id?String(record.discord_user_id):null;
  const expected=joinDate(record.expected_joined_at);
  const actual=m?joinDate(m.joined_at):null;
  if(!m)return {...record,state:matches.length>1?'ambiguous-username':'not-in-guild',candidateId:null};
  if(expected===null||actual===null||expected!==actual)
    return {...record,state:'joined-date-mismatch',candidateId:null};
  if(prior&&prior!==String(m.user.id))
    return {...record,state:'identity-conflict',candidateId:null};
  return {...record,state:prior?'verified':'ready-to-link',candidateId:String(m.user.id)};
 });
}
async function synchronize(q,members){
 const records=await q(SELECT,[]);
 if(!Array.isArray(records)||records.length>250)throw Error('Invalid private binding rows');
 const planned=plan(records,members),results=[];
 for(const r of planned){
  if(r.state!=='ready-to-link'){results.push(r);continue;}
  const updated=await q(UPDATE,[r.candidateId,r.discord_username,r.canonical_name,r.expected_joined_at]);
  results.push({...r,state:updated.length===1?'verified':'concurrent-update'});
 }
 return results;
}
function confirmedById(rows){
 // Only use inside an already authenticated admin-only endpoint.
 const byId=new Map();
 for(const r of rows){
  if(r.state!=='verified'||!idRegex.test(String(r.candidateId||r.discord_user_id||'')))continue;
  const id=String(r.candidateId||r.discord_user_id);
  if(!byId.has(id))byId.set(id,[]);
  byId.get(id).push(r.canonical_name);
 }
 return byId;
}
module.exports={productionQuery,plan,synchronize,confirmedById,SELECT,UPDATE};
