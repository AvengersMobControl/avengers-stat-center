'use strict';
// Read-only account lookup; Discord identity proof is stored privately in Neon.
async function linkedProfiles(discordUserId,env=process.env){
 if(!/^\d{17,22}$/.test(String(discordUserId||'')))return [];
 if(!env.AVENGERS_IDENTITY_DATABASE_URL)return [];
 const {neon}=require('@neondatabase/serverless');
 const sql=neon(env.AVENGERS_IDENTITY_DATABASE_URL);
 const rows=await sql.query(
  'SELECT canonical_name FROM avengers_identity_private.discord_bindings '+
  'WHERE discord_user_id=$1 AND verified_at IS NOT NULL ORDER BY canonical_name',
  [discordUserId]);
 return [...new Set(rows.map(r=>String(r.canonical_name)))];
}
function selectProfile(profiles,requested,requireChoice=false){
 const name=typeof requested==='string'?requested.trim():'';
 if(name&&!profiles.includes(name)){const e=new Error('Game account is not linked to your Discord identity');e.status=403;throw e;}
 if(name)return name;
 if(profiles.length===1)return profiles[0];
 if(profiles.length>1&&requireChoice){
  const e=new Error('Choose which of your game accounts is submitting this run');e.status=400;throw e;
 }
 return null; // unlinked users remain clearly flagged for leader review.
}
module.exports={linkedProfiles,selectProfile};
