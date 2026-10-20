'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {makeStore}=require('../api/guest/atomic-counter');
const now=()=>Math.floor(Date.now()/1000);
const pass=(count=3)=>({jti:'AVENGERS-fixture-abc123',creator:'123456789012345678',exp:now()+3600,maxUses:count});
function fakeDb(){
 const state=new Map();
 async function query(sql,params){
  const [key,creator,exp,limit]=params;
  assert.match(key,/^[a-f0-9]{64}$/);
  if(sql.startsWith('INSERT')){
   if(state.has(key))return [];
   state.set(key,{creator,exp,limit,used:0});return [{pass_hash:key}];
  }
  assert.match(sql,/UPDATE avengers_guest_private.passes/);
  assert.match(sql,/used_count < allowed_uses AND expires_at > NOW\(\)/);
  const r=state.get(key);
  if(!r||r.creator!==creator||r.exp!==exp||r.limit!==limit||r.used>=limit||exp<=now())return [];
  r.used+=1;return [{used_count:r.used}];
 }
 return {query,state};
}
test('20 concurrent claims yield exactly 3 numbered reservations',async()=>{
 const fake=fakeDb(),store=makeStore(fake.query),p=pass();
 await store.register(p);
 const claims=await Promise.all(Array.from({length:20},()=>store.reserve(p)));
 assert.deepEqual(claims.filter(Number.isInteger).sort((a,b)=>a-b),[1,2,3]);
 assert.equal(claims.filter(x=>x===null).length,17);
 assert.equal([...fake.state.values()][0].used,3);
});
test('expiry, creator, allowed-use and duplicate-registration mismatches fail closed',async()=>{
 const fake=fakeDb(),store=makeStore(fake.query),p=pass(2);
 await store.register(p);
 await assert.rejects(()=>store.register(p),/registration did not succeed/);
 assert.equal(await store.reserve({...p,creator:'999999999999999999'}),null);
 assert.equal(await store.reserve({...p,exp:p.exp+1}),null);
 assert.equal(await store.reserve({...p,maxUses:3}),null);
 assert.equal(await store.reserve({...p,exp:now()-1}),null);
 assert.equal(await store.reserve(p),1);
 assert.equal(await store.reserve(p),2);
 assert.equal(await store.reserve(p),null);
});
