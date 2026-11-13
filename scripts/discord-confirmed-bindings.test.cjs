'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {plan,synchronize,confirmedById}=require('../server/discord-confirmed-bindings.cjs');
const joined='2026-10-01T23:32:31.836Z';
const member={user:{id:'1536029122407571547',username:'sampleuser'},joined_at:joined};
const row=canonical=>({discord_username:'sampleuser',canonical_name:canonical,
 expected_joined_at:joined,discord_user_id:null});
test('one Discord account can hold two separate game identities',()=>{
 const out=plan([row('AV-A'),row('AV-B')],[member]);
 assert.equal(out.length,2);
 assert.ok(out.every(r=>r.state==='ready-to-link'&&r.candidateId===member.user.id));
 const confirmed=out.map(r=>({...r,state:'verified'}));
 assert.deepEqual(confirmedById(confirmed).get(member.user.id),['AV-A','AV-B']);
});
test('rounded IDs are never used; only verified original Discord snowflakes',()=>{
 const out=plan([row('AV-A')],[{...member,user:{...member.user,id:'2E+18'}}]);
 assert.equal(out[0].state,'not-in-guild');
 const unknown=plan([row('AV-A')],[]);assert.equal(unknown[0].state,'not-in-guild');
});
test('date changes, ambiguous usernames, and existing mismatched IDs fail closed',()=>{
 const changed=plan([row('AV-A')],[{...member,joined_at:'2026-11-01T00:00:00.000Z'}]);
 assert.equal(changed[0].state,'joined-date-mismatch');
 const duplicate=plan([row('AV-A')],[member,member]);assert.equal(duplicate[0].state,'ambiguous-username');
 const prior=plan([{...row('AV-A'),discord_user_id:'1536029122407571548'}],[member]);
 assert.equal(prior[0].state,'identity-conflict');
});
test('only confirmed username/date pairs receive tightly scoped ID updates',async()=>{
 const audit=[];
 const q=async(sql,args)=>{audit.push([sql,args]);return sql.startsWith('SELECT')?
 [row('AV-A'),row('AV-B')]:[{discord_user_id:member.user.id}];};
 const results=await synchronize(q,[member]);
 assert.equal(results.length,2);assert.deepEqual(results.map(r=>r.state),['verified','verified']);
 assert.equal(audit.filter(x=>x[0].startsWith('UPDATE')).length,2);
 assert.ok(audit.every(([sql])=>!/\bDELETE\b|\bINSERT\b/.test(sql)));
});
