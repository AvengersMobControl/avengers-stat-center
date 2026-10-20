'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const redeem=require('../api/guest/redeem.js');
const SECRET='isolated-guest-test-secret';
const now=()=>Math.floor(Date.now()/1000);
const token=(props={})=>{
  const p={typ:'avengers-guest-invite',jti:'TEST-INVITE-ABC123',creator:'000111222333',iat:now()-50,exp:now()+3600,maxUses:3,label:'Recruit Alice',...props};
  const body=Buffer.from(JSON.stringify(p)).toString('base64url');
  return {p,t:body+'.'+crypto.createHmac('sha256',SECRET).update(body).digest('base64url')};
};
const response=()=>({
  statusCode:200,headers:{},status(n){this.statusCode=n;return this},
  setHeader(k,v){this.headers[k]=v},send(v){this.body=v;return this},
  redirect(n,v){this.statusCode=n;this.location=v;return this}
});
const req=(t,ua='Mozilla/5.0')=>({method:'GET',query:{t},headers:{'user-agent':ua,'x-forwarded-for':'127.0.0.1'}});
function message(id,p,ageSeconds=10,content){
  return {id:String(id),timestamp:new Date((now()-ageSeconds)*1000).toISOString(),
    content:content??('✅ AVENGERS guest pass opened ||AV_GUEST_USE:'+p.jti+' AV_GUEST_INVITE:'+p.jti+'||')};
}
async function withDiscord(mock,fn){
  const priorFetch=global.fetch,priorSecret=process.env.AUTH_SECRET,priorBot=process.env.DISCORD_BOT_TOKEN;
  process.env.AUTH_SECRET=SECRET;process.env.DISCORD_BOT_TOKEN='test-bot-token';
  const calls=[];
  global.fetch=async(url,opts={})=>{
    calls.push({url:String(url),opts});
    if(url.endsWith('/users/@me/channels'))return {ok:true,json:async()=>({id:'dm-creator-1'})};
    if(url.includes('/channels/dm-creator-1/messages?'))return {ok:true,json:async()=>mock.list(String(url),calls)};
    if(url.endsWith('/channels/dm-creator-1/messages'))return {ok:true,json:async()=>({id:'sent'})};
    throw Error('Unexpected Discord API request: '+url);
  };
  try{return await fn(calls)}finally{
    global.fetch=priorFetch;
    if(priorSecret===undefined)delete process.env.AUTH_SECRET;else process.env.AUTH_SECRET=priorSecret;
    if(priorBot===undefined)delete process.env.DISCORD_BOT_TOKEN;else process.env.DISCORD_BOT_TOKEN=priorBot;
  }
}
test('expired/tampered tokens fail before opening a creator DM',async()=>{
  await withDiscord({list:()=>[]},async calls=>{
    const expired=token({exp:now()});
    const r=response();await redeem(req(expired.t),r);
    assert.equal(r.statusCode,410);assert.equal(calls.length,0);
    const forged=response();await redeem(req(expired.t+'wrong'),forged);
    assert.equal(forged.statusCode,410);assert.equal(calls.length,0);
  });
});
test('Discord preview consumes no click and sends no DM',async()=>{
  const inv=token();
  await withDiscord({list:()=>[]},async calls=>{
    const r=response();await redeem(req(inv.t,'Discordbot/2.0'),r);
    assert.equal(r.statusCode,200);assert.equal(calls.length,0);
    assert.equal(r.headers['Set-Cookie'],undefined);
  });
});
test('tagged redemption records a success before session and attributes creator',async()=>{
  const inv=token({label:'Recruit @everyone'});
  await withDiscord({list:()=>[]},async calls=>{
    const r=response();await redeem(req(inv.t),r);
    assert.equal(r.statusCode,302);assert.equal(r.location,'/');
    assert.match(r.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Lax/);
    const send=calls.find(c=>c.opts.method==='POST'&&c.url.endsWith('/messages'));
    assert(send,'creator receives success notification');
    const body=JSON.parse(send.opts.body);
    assert(body.content.includes('Recruit @\u200beveryone'),'tag is attributed and mention safely escaped');
    assert(body.content.includes('Use:** 1/3'));
    const session=decodeURIComponent(r.headers['Set-Cookie'].split(';')[0].split('=')[1]).split('.')[0];
    const p=JSON.parse(Buffer.from(session,'base64url').toString('utf8'));
    assert.equal(p.createdBy,inv.p.creator);assert.equal(p.guest,true);assert.equal(p.exp,inv.p.exp);
  });
});
test('click cap blocks after recorded uses; no guest cookie is granted',async()=>{
  const inv=token({maxUses:2});
  await withDiscord({list:()=>[message('102',inv.p),message('101',inv.p)]},async calls=>{
    const r=response();await redeem(req(inv.t),r);
    assert.equal(r.statusCode,410);assert.match(r.body,/allowed number of uses/);
    assert.equal(r.headers['Set-Cookie'],undefined);
    const send=calls.find(c=>c.opts.method==='POST'&&c.url.endsWith('/messages'));
    assert(JSON.parse(send.opts.body).content.includes('2/2 times'));
  });
});
test('counts redemptions beyond the most recent 100 messages, exact marker only',async()=>{
  const inv=token({maxUses:5});
  const newest=Array.from({length:100},(_,i)=>message(5000-i,inv.p,1+i/100,'Unrelated message'));
  const older=[message('4900',inv.p,12),message('4899',inv.p,13),
    message('4898',inv.p,14,'AV_GUEST_USE:'+inv.p.jti+'-SOMETHING AV_GUEST_INVITE'),
    message('4897',inv.p,60,'Other old pass')];
  await withDiscord({list:u=>u.includes('&before=')?older:newest},async calls=>{
    const r=response();await redeem(req(inv.t),r);
    assert.equal(r.statusCode,302);
    assert.equal(calls.filter(c=>c.url.includes('/messages?')).length,2);
    const notice=JSON.parse(calls.find(c=>c.opts.method==='POST'&&c.url.endsWith('/messages')).opts.body).content;
    assert(notice.includes('3/5'),'two genuine earlier redemptions counted beyond page 1');
  });
});
test('malformed or overlong Discord history fails closed without awarding a session',async()=>{
  const inv=token();
  await withDiscord({list:()=>[{content:'no timestamp or id'}]},async()=>{
    const r=response();await redeem(req(inv.t),r);assert.equal(r.statusCode,503);
    assert.equal(r.headers['Set-Cookie'],undefined);
  });
  const full=Array.from({length:100},(_,i)=>message(10000-i,inv.p,1,'Unrelated'));
  await withDiscord({list:()=>full},async calls=>{
    const r=response();await redeem(req(inv.t),r);assert.equal(r.statusCode,503);
    assert.equal(r.headers['Set-Cookie'],undefined);
    assert.equal(calls.filter(c=>c.url.includes('/messages?')).length,30);
  });
});
test('permanent links are still attributed and DM logged, but not capped',async()=>{
  const inv=token({permanent:true,exp:undefined,maxUses:undefined});
  await withDiscord({list:()=>{throw Error('not called')}},async calls=>{
    const r=response();await redeem(req(inv.t),r);
    assert.equal(r.statusCode,302);
    assert(r.headers['Set-Cookie'].includes('Max-Age=315360000'));
    assert.equal(calls.filter(c=>c.url.includes('/messages?')).length,0);
    const notice=JSON.parse(calls.find(c=>c.opts.method==='POST'&&c.url.endsWith('/messages')).opts.body).content;
    assert(notice.includes('Permanent / unlimited'));
    assert(notice.includes('AV_GUEST_USE:'+inv.p.jti));
  });
});

test('v2 atomic reservations cap successful sessions without scanning Discord history',async()=>{
  const atomic=require('../api/guest/atomic-counter'),old=atomic.productionStore;
  let used=0;
  atomic.productionStore=()=>({reserve:async()=>used<2?++used:null});
  try{
    const invite=token({counterVersion:2,maxUses:2});
    await withDiscord({list:()=>{throw Error('v2 must not scan legacy DM history')}},async calls=>{
      const got=[];
      for(let i=0;i<4;i++){const res=response();await redeem(req(invite.t),res);got.push(res);}
      assert.deepEqual(got.map(x=>x.statusCode),[302,302,410,410]);
      assert.equal(got.filter(x=>!!x.headers['Set-Cookie']).length,2);
      assert.equal(calls.filter(c=>c.url.includes('/messages?')).length,0);
      const messages=calls.filter(c=>c.opts.method==='POST'&&c.url.endsWith('/messages')).map(c=>JSON.parse(c.opts.body).content);
      assert(messages.some(s=>s.includes('**Use:** 2/2')));
      assert(messages.some(s=>s.includes('All 2 uses taken')));
    });
  }finally{atomic.productionStore=old}
});
test('unavailable v2 database never grants a cookie',async()=>{
  const atomic=require('../api/guest/atomic-counter'),old=atomic.productionStore;
  atomic.productionStore=()=>{throw Error('database offline')};
  try{
    await withDiscord({list:()=>[]},async()=>{
      const res=response();await redeem(req(token({counterVersion:2}).t),res);
      assert.equal(res.statusCode,503);assert.equal(res.headers['Set-Cookie'],undefined);
    });
  }finally{atomic.productionStore=old}
});
