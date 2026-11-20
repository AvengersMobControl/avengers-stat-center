'use strict';
const {createPublicKey,verify}=require('node:crypto');
const issuer='https://token.actions.githubusercontent.com';
const audience='avengers-roster-editor';
const repository='AvengersMobControl/avengers-stat-center';
const ref='refs/heads/main';
const workflow=repository+'/.github/workflows/roster-editor-sync.yml@'+ref;

async function authorizedWorker(req,httpFetch=fetch){
  const match=/^Bearer ([A-Za-z0-9_.-]{1,7000})$/.exec(req.headers.authorization||'');
  if(!match)return false;
  const parts=match[1].split('.');
  if(parts.length!==3)return false;
  const [head,body,signature]=parts;
  try{
    const parse=value=>JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
    const header=parse(head),claims=parse(body),now=Date.now()/1000;
    if(header.alg!=='RS256'||typeof header.kid!=='string'||claims.iss!==issuer||
      claims.aud!==audience||claims.repository_id!=='1393506638'||claims.repository!==repository||
      claims.ref!==ref||claims.workflow_ref!==workflow||
      !['schedule','workflow_dispatch','push'].includes(claims.event_name)||
      !Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.nbf)||claims.nbf>now+10)return false;
    const response=await httpFetch(issuer+'/.well-known/jwks',{signal:AbortSignal.timeout(5000)});
    if(!response.ok)return false;
    const {keys}=await response.json();
    const jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA');
    return Boolean(jwk&&verify('RSA-SHA256',Buffer.from(head+'.'+body),
      createPublicKey({key:jwk,format:'jwk'}),Buffer.from(signature,'base64url')));
  }catch{return false;}
}
module.exports={authorizedWorker,audience};
