'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {READ_ONLY_SQL,evaluate,inspect}=require('./private-dispatch-readiness.cjs');

const safe=()=>({
 connectedRole:'avengers_dispatch_runtime',authenticatedRole:'avengers_dispatch_runtime',
 databaseName:'avengers_private',canLogin:true,isSuperuser:false,canCreateRole:false,
 canCreateDatabase:false,bypassesRls:false,hasInheritedMembership:false,
 canCreateObjects:false,canUsePrivateSchema:true,canCreatePrivateSchemaObjects:false,
 slotRead:true,slotInsert:true,slotUpdate:true,slotDelete:false,
 intentRead:true,intentInsert:true,intentUpdate:true,intentDelete:false,
 receiptRead:true,receiptInsert:true,receiptUpdate:true,receiptDelete:false,
 auditRead:true,auditInsert:true,auditUpdate:false,auditDelete:false,
 safetyRead:true,safetyInsert:false,safetyUpdate:false,safetyDelete:false,
 exactlyOneSafetyRow:true,automaticSendEnabled:false,automaticDeleteEnabled:false,
 publicationEndpointEnabled:false
});
test('production audit is a single fixed read-only SELECT with no data or secret export',()=>{
 assert.match(READ_ONLY_SQL,/^SELECT\s/);
 assert.equal((READ_ONLY_SQL.match(/;/g)||[]).length,1);
 assert.doesNotMatch(READ_ONLY_SQL,/\b(?:INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+\w+|ALTER\s+(?:ROLE|TABLE)|CREATE\s+\w+|DROP\s+\w+|TRUNCATE\s+\w+)\b/i);
 assert.doesNotMatch(READ_ONLY_SQL,/DATABASE_URL|PASSWORD|DISCORD_BOT_TOKEN|SECRET|http(s)?:\/\//i);
 assert(READ_ONLY_SQL.includes('pg_auth_members'),'check inherited privileges, not just explicit grants');
 assert(READ_ONLY_SQL.includes('session_user'),'reject owner login with SET ROLE');
});
test('only exact restricted runtime session can pass and does not authorize any dispatch',()=>{
 const x=evaluate(safe());
 assert.deepEqual(x,{ready:true,failedChecks:[],
  permitsAutomaticSend:false,permitsAutomaticDelete:false,permitsPublicEndpoint:false});
 for(const [key,value] of [
  ['connectedRole','avengers_dispatch_app'],['authenticatedRole','avengers_private_owner'],
  ['databaseName','neondb'],['isSuperuser',true],['canCreateRole',true],
  ['canCreateDatabase',true],['bypassesRls',true],['hasInheritedMembership',true],
  ['canCreateObjects',true],['canCreatePrivateSchemaObjects',true],
  ['slotDelete',true],['intentDelete',true],['receiptDelete',true],
  ['auditUpdate',true],['auditDelete',true],['safetyUpdate',true],
  ['safetyInsert',true],['safetyDelete',true],['exactlyOneSafetyRow',false],
  ['automaticSendEnabled',true],['automaticDeleteEnabled',true],['publicationEndpointEnabled',true]
 ]){
  const raw=safe();raw[key]=value;
  const answer=evaluate(raw);
  assert.equal(answer.ready,false,key);
  assert(answer.failedChecks.includes(key),key+' must be a blocker');
  assert.equal(answer.permitsAutomaticSend,false);
 }
});
test('all permission checks are mandatory and strict booleans (unknowns fail closed)',()=>{
 const keys=Object.keys(safe());
 for(const key of keys){
   const input=safe();delete input[key];
   assert.equal(evaluate(input).ready,false,'Missing '+key);
   const wrong=safe();wrong[key]=null;
   assert.equal(evaluate(wrong).ready,false,'Null '+key);
 }
 assert.equal(evaluate(null).ready,false);
 assert.equal(evaluate([]).ready,false);
 assert.equal(evaluate({}).ready,false);
});
test('an injected postgres-compatible client is queried once without writing or leaking rows',async()=>{
 let called=0;
 const client={query:async(sql)=>{called++;assert.equal(sql,READ_ONLY_SQL);return {rows:[safe()]};}};
 assert.equal((await inspect(client)).ready,true);
 assert.equal(called,1);
 const denied=await inspect({query:async()=>({rows:[safe(),safe()]})});
 assert.deepEqual(denied.failedChecks,['missing-database-evidence']);
});
test('query errors and absent client block without printing raw secret-bearing errors',async()=>{
 const secret='postgresql://private-user:topsecret@example.invalid/db';
 const failing=await inspect({query:async()=>{throw Error(secret)}});
 assert.equal(failing.ready,false);
 assert.deepEqual(failing.failedChecks,['database-query-failed']);
 assert(!JSON.stringify(failing).includes('topsecret'));
 assert.equal((await inspect(undefined)).ready,false);
 assert.equal((await inspect({})).ready,false);
});
test('historical Neon API-created app credential is explicitly rejected',()=>{
 const elevated={...safe(),connectedRole:'avengers_dispatch_app',
 authenticatedRole:'avengers_dispatch_app',canCreateRole:true,canCreateDatabase:true,
 hasInheritedMembership:true,slotDelete:true,safetyUpdate:true};
 const r=evaluate(elevated);
 assert.equal(r.ready,false);
 for(const item of ['connectedRole','hasInheritedMembership','slotDelete','safetyUpdate'])
  assert(r.failedChecks.includes(item));
});
