'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {compute}=require('../api/discord/kraken-member-diagnostics.js');
const g='1403361698177618081',role='123456789012345678';
const person={user:{id:'123456789012345679'},roles:[role]};
const mk=(everyone,extra='0')=>new Map([[g,{permissions:everyone}],[role,{permissions:extra}]]);
const CH=(overwrites=[])=>({type:0,permission_overwrites:overwrites});
const USE=(1n<<31n).toString(),VIEW=(1n<<10n).toString();
test('guild all-member Use Application Commands is inherited',()=>{
 const result=compute(person,CH(),mk((BigInt(USE)|BigInt(VIEW)).toString()),g);
 assert.equal(result.useApp,true);assert.equal(result.view,true);
});
test('guild allows view but not slash when Use Application Commands bit absent',()=>{
 const result=compute(person,CH(),mk(VIEW),g);
 assert.equal(result.useApp,false);assert.equal(result.view,true);
});
test('channel everyone deny overrides guild Use Application Commands',()=>{
 const ch=CH([{id:g,type:0,allow:'0',deny:USE}]);
 assert.equal(compute(person,ch,mk((BigInt(USE)|BigInt(VIEW)).toString()),g).useApp,false);
});
test('role and member channel allow can override everyone deny',()=>{
 const ch=CH([{id:g,type:0,allow:'0',deny:USE},{id:role,type:0,allow:USE,deny:'0'}]);
 assert.equal(compute(person,ch,mk(VIEW),g).useApp,true);
});
test('guild administrators bypass command permission',()=>{
 const ch=CH([{id:g,type:0,allow:'0',deny:USE}]);
 const result=compute(person,ch,mk((1n<<3n).toString()),g);
 assert.equal(result.admin,true);assert.equal(result.useApp,true);
});
