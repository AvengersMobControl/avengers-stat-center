'use strict';
// Read-only connectivity probe. Never display tokens, message contents,
// author IDs, or encrypted private state in GitHub Actions logs.
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {onboardingPolicy}=require('./sync-discord-utc.cjs');

async function check(){
  const token=process.env.DISCORD_BOT_TOKEN||'';
  const encryptionKey=process.env.DISCORD_UTC_STATE_KEY||'';
  const channelId=process.env.DISCORD_UTC_CHANNEL_ID||'';
  const roleId=process.env.DISCORD_UTC_COUNCIL_ROLE_IDS||'';
  if(!token)throw new Error('DISCORD_BOT_TOKEN repository secret is missing');
  if(encryptionKey.length<32)throw new Error('DISCORD_UTC_STATE_KEY repository secret is missing or too short');
  crypto.createHash('sha256').update(encryptionKey).digest(); // Does not log or persist key.
  if(!/^\d{15,22}$/.test(channelId))throw new Error('Invalid Discord channel ID');
  if(!/^\d{15,22}$/.test(roleId))throw new Error('Invalid Council role ID');
  const workflow=fs.readFileSync(path.resolve(__dirname,'../.github/workflows/discord-utc-roster.yml'),'utf8');
  if(!workflow.includes("vars.DISCORD_UTC_SYNC_ENABLED == 'true'"))
    throw new Error('Safety gate is missing from scheduled workflow');
  const policy=onboardingPolicy();
  if(!policy.councilRoleIds.includes(roleId))
    throw new Error('Council role not configured correctly');
  async function read(endpoint){
    const response=await fetch('https://discord.com/api/v10'+endpoint,{
      headers:{Authorization:'Bot '+token,Accept:'application/json'}
    });
    if(!response.ok)throw new Error('Discord read-only access check failed with HTTP '+response.status);
    return response.json();
  }
  await read('/users/@me');
  console.log('Bot authentication: OK');
  const channel=await read('/channels/'+channelId);
  if(!channel || !channel.guild_id || ![0,5].includes(channel.type))
    throw new Error('Configured Discord channel is not an accessible server text channel');
  console.log('Target Discord channel: accessible');
  const messages=await read('/channels/'+channelId+'/messages?limit=1');
  if(!Array.isArray(messages))throw new Error('Discord did not return message history');
  console.log('Read Message History: OK');
  if(messages.length===0){
    console.log('Message Content Intent: not verifiable (channel has no messages)');
  } else if(messages.some(m=>typeof m.content==='string'&&m.content.length>0)){
    console.log('Most recent text message: readable');
  }else{
    console.log('Message Content Intent: not independently verified (latest message has no readable text)');
  }
  console.log('Encrypted state key: configured, no secrets exposed');
  console.log('Read-only smoke test complete; no roster changes or message content retained');
}
if(require.main===module)check().catch(e=>{
  console.error('Discord UTC smoke test failed: '+e.message);
  process.exitCode=1;
});
module.exports={check};
