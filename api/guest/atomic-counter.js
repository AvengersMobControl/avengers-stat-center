'use strict';
// Private AVENGERS-only guest-pass ledger. Never stores raw signed tokens,
// Discord client credentials, IP addresses or roster data.
const crypto=require('node:crypto');
const digest=jti=>crypto.createHash('sha256').update(String(jti)).digest('hex');
const REGISTRATION=`INSERT INTO avengers_guest_private.passes
 (pass_hash, creator_id, expires_at, allowed_uses, used_count)
 VALUES ($1, $2, to_timestamp($3), $4, 0)
 ON CONFLICT (pass_hash) DO NOTHING RETURNING pass_hash`;
const RESERVATION=`UPDATE avengers_guest_private.passes
 SET used_count=used_count+1, updated_at=NOW()
 WHERE pass_hash=$1 AND creator_id=$2
 AND expires_at=to_timestamp($3) AND allowed_uses=$4
 AND used_count < allowed_uses AND expires_at > NOW()
 RETURNING used_count`;
function checked(p){
  if(!p||!/^[-_a-zA-Z0-9]{16,80}$/.test(String(p.jti||'')))throw Error('Invalid pass identity');
  if(!/^\d{2,22}$/.test(String(p.creator||'')))throw Error('Invalid creator identity');
  if(!Number.isSafeInteger(Number(p.exp))||Number(p.exp)<=0)throw Error('Invalid expiry');
  if(!Number.isSafeInteger(Number(p.maxUses))||Number(p.maxUses)<1||Number(p.maxUses)>10)throw Error('Invalid use limit');
  return [digest(p.jti),String(p.creator),Number(p.exp),Number(p.maxUses)];
}
function makeStore(query){
  if(typeof query!=='function')throw Error('Query function required');
  return {
    async register(p){
      const rows=await query(REGISTRATION,checked(p));
      if(!Array.isArray(rows)||rows.length!==1)throw Error('Invite registration did not succeed');
      return true;
    },
    async reserve(p){
      const rows=await query(RESERVATION,checked(p));
      if(!Array.isArray(rows))throw Error('Invalid guest ledger response');
      if(!rows.length)return null;
      if(rows.length!==1||!Number.isSafeInteger(Number(rows[0].used_count)))throw Error('Invalid reservation result');
      return Number(rows[0].used_count);
    }
  };
}
function productionStore(){
  const url=process.env.AVENGERS_GUEST_DATABASE_URL;
  if(!url)throw Error('AVENGERS guest ledger is not configured');
  const {neon}=require('@neondatabase/serverless');
  const sql=neon(url);
  return makeStore((q,params)=>sql.query(q,params));
}
module.exports={makeStore,productionStore};
