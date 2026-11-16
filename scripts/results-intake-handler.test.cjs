'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const handler=require('../api/discord/results-intake.js');
const config=require('../discord-ingest-config.json');
function response(){
  return {
    code:0,body:null,setHeader(){return this;},
    status(n){this.code=n;return this;},
    json(x){this.body=x;return this;}
  };
}
function context(failChannel){
  const state={run:null,checkpoints:[],lease:null};
  const store={
    async acquireLease(){state.lease='test-lease';return state.lease;},
    async releaseLease(){state.lease=null;},
    async beginRun(){return 'run-id';},
    async finishRun(id,status,summary){state.run={id,status,summary};},
    async getCheckpoint(){return null;},
    async putCheckpoint(key,s){state.checkpoints.push({key,...s});},
    async listPending(){return [];},
    async status(){return {attachmentStatus:{},channels:{total:8,complete:8,continuing:0}};}
  };
  const discord={async listMessages(id){
    if(id===failChannel)throw Error('discord_http_403');
    return [];
  }};
  return {state,store,discord,env:{
    CRON_SECRET:'test-cron-key',DISCORD_BOT_TOKEN:'test-bot',
    AVENGERS_DISPATCH_DATABASE_URL:'test-connection'
  }};
}
test('untrusted callers are rejected before touching private state',async()=>{
  const c=context(),res=response();
  await handler({method:'GET',headers:{},query:{}},res,c);
  assert.equal(res.code,401);
  assert.equal(c.state.lease,null);
});
test('source scan is verified only after ¶»§q«^