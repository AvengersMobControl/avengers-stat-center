'use strict';
// Safe, read-only diagnostic: never print pending names, Discord IDs,
// messages, timestamps, countries, or the secret key to public CI logs.
const fs=require('node:fs');
const path=require('node:path');
const {decryptState}=require('./sync-discord-utc.cjs');
const dataPath=path.resolve(__dirname,'../discord-utc-roster.json');
function summarize(){
  const payload=JSON.parse(fs.readFileSync(dataPath,'utf8'));
  if(payload.version!==1||payload.algorithm!=='aes-256-gcm')
    throw new Error('Discord roster state is not encrypted');
  const state=decryptState(payload,process.env.DISCORD_UTC_STATE_KEY);
  const pending=state.pending||[];
  const counts=new Map();
  const SAFE_REASONS=new Set([
    'requires_exactly_one_tagged_member','council_role_required',
    'council_role_not_configured','tagged_member_not_in_active_roster',
    'tagged_identity_conflict','name_already_linked_to_another_discord_account',
    'country_missing','verified_link_not_in_roster','linked_identity_mismatch',
    'nickname_identity_conflict','existing_identity_requires_nickname_match',
    'explicit_game_name_required','missing_or_inactive_clan'
  ]);
  for(const record of pending){
    const reason=SAFE_REASONS.has(record.reason)?record.reason:'other';
    counts.set(reason,(counts.get(reason)||0)+1);
  }
  console.log('Encrypted roster state: readable');
  console.log('Approved member count: '+state.members.length);
  console.log('Pending review count: '+pending.length);
  for(const [reason,count] of [...counts].sort((a,b)=>a[0].localeCompare(b[0])))
    console.log('Pending reason: '+reason+' ('+count+')');
}
if(require.main===module){
  try{summarize()}catch(e){
    console.error('Pending review audit failed; verify encrypted state and key');
    process.exitCode=1;
  }
}
module.exports={summarize};
