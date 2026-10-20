'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const atomic=require('../api/guest/atomic-counter');
const create=require('../api/guest/create');
const key='fixture-only-signing-key';
const ts=()=>Math.floor(Date.now()/1000);
function signed(data){
 const body=Buffer.from(JSON.stringify(data)).toString('base64url');
 return body+'.'+crypto.createHmac('sha256',key).update(body).digest('base64url');
}
function req(){return {method:'GET',query:{label:'Recruit Alpha',hours:'1',uses:'2'},url:'/api/guest/create',headers:{cookie:'avengers_session='+signed({sub:'123456789012345678',username:'Test member',exp:ts()+3600}),host:'example.invalid'}};}
function res(){return {headers:{},status(n){this.code=n;return this},setHeader(k,v){this.headers[k]=v},send(s){this.body=s;return this},redirect(n,path){this.code=n;this.path=path;return this}};}
test('temporary link registered before issuance; signed v2 counterVersion and creator preserved',async()=>{
 const old=atomic.productionStore,oldSecret=process.env.AUTH_SECRET;process.env.AUTH_SECRET=key;
 let registered=null;
 atomic.productionStore=()=>({register:async p=>{registered=p;return true}});
 try{
  const r=res();await create(req(),r);
  assert.equal(r.code,200);assert(registered);assert.equal(registered.counterVersion,2);
  assert.equal(registered.maxUses,2);assert.equal(registered.creator,'123456789012345678');
  const match=r.body.match(/guest\/redeem\?t=([^<\s]+)/);
  assert(match,'signed invite is displayed only after DB registration');
  const encoded=match[1].replace(/&amp;/g,'&');
  const p=JSON.parse(Buffer.from(decodeURIComponent(encoded).split('.')[0],'base64url').toString('utf8'));
  assert.equal(p.jti,registered.jti);assert.equal(p.counterVersion,2);
 }finally{atomic.productionStore=old;if(oldSecret===undefined)delete process.env.AUTH_SECRET;else process.env.AUTH_SECRET=oldSecret}
});
test('guest DB registration error fails closed without creating a link',async()=>{
 const old=atomic.productionStore,oldSecret=process.env.AUTH_SECRET;process.env.AUTH_SECRET=key;
 atomic.productionStore=()=>({register:async()=>{throw Error('test-only unavailable')}});
 try{
  const r=res();await create(req(),r);
  assert.equal(r.code,503);assert.match(r.body,/No link was issued/);
  assert(!r.body.includes('guest/redeem'));
 }finally{atomic.productionStore=old;if(oldSecret===undefined)delete process.env.AUTH_SECRET;else process.env.AUTH_SECRET=oldSecret}
});
