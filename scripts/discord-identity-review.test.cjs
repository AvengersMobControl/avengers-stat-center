'use strict';
const assert=require('node:assert/strict'),test=require('node:test'),crypto=require('node:crypto');
const review=require('../server/discord-identity-review.cjs');
const now=Math.floor(Date.now()/1000);
function sign(p,key){
 const b=Buffer.from(JSON.stringify(p)).toString('base64url');
 return b+'.'+crypto.createHmac('sha256',key).update(b).digest('base64url');
}
const key='unit-test-only';
const base={sub:'123456789012345678',username:'Member',exp:now+3600};
const req=p=>({headers:{cookie:'avengers_session='+sign(p,key)}});
test('reject guests, forged and expired sessions',()=>{
 for(const p of [{...base,guest:true},{...base,permanentGuest:true},{...base,exp:now-1}])
  assert.equal(review.signedSession(req(p),{AUTH_SECRET:key}),null);
 assert.equal(review.signedSession(req(base),{AUTH_SECRET:'wrong'}),null);
 assert.equal(review.signedSession(req(base),{AUTH_SECRET:key}).id,base.sub);
});
test('admin guard checks owner, explicit reviewer and real guild permission role',()=>{
 const guild={id:'1403361698177618081',owner_id:'111111111111111111'};
 const member={user:{id:base.sub},roles:['100000000000000000']};
 const roles=[{id:guild.id,permissions:'0'},{id:member.roles[0],permissions:'32'}];
 assert.equal(review.canReview(member,guild,roles,{}),true);
 assert.equal(review.canReview(member,guild,[{id:guild.id,permissions:'0'}],{}),false);
 assert.equal(review.canReview(member,{...guild,owner_id:base.sub},[],{}),true);
 assert.equal(review.canReview(member,guild,[],{AVENGERS_DISCORD_REVIEWER_IDS:base.sub}),true);
});
test('matches identical canonical names with AV/AV2 prefixes and parenthetical labels but never auto-confirms',()=>{
 const people=[{name:'AV-Dubai'},{name:'AV-KKD'},{name:'AV.Saberkong'}];
 const m={nick:'Dubai (Abdulla)',user:{username:'dubai2426'}};
 assert.deepEqual(review.suggest(m,people).suggestion,'AV-Dubai');
 assert.equal(review.suggest(m,people).status,'suggested');
 assert.equal(review.suggest({nick:'KKD',user:{username:'random'}},people).suggestion,'AV-KKD');
 assert.equal(review.suggest({nick:'something else',user:{username:'random'}},people).status,'unmatched');
});
test('similarly named people do not get forcibly merged',()=>{
 const people=[{name:'AV-Frenchie2'},{name:'AV-Frenchie(-4)'}];
 const m={nick:'Frenchie',user:{username:'another-user'}};
 assert.equal(review.suggest(m,people).status,'unmatched');
});
test('CSV escapes formula injection and quotes',()=>{
 const data=review.csv([['Name','Value'],['=cmd','hi,"there"']]);
 assert.match(data,/"'=cmd"/);
 assert.match(data,/"hi,""there"""/);
});
test('member roster pagination only returns complete non-bot list',async()=>{
 let calls=0;
 const fake=async()=>{calls++;return {ok:true,json:async()=>[{user:{id:'123456789012345678',username:'human'}},{user:{id:'123456789012345679',bot:true}}]};};
 const result=await review.memberRoster({DISCORD_GUILD_ID:'1403361698177618081',DISCORD_BOT_TOKEN:'stub'},fake);
 assert.equal(calls,1);assert.equal(result.length,1);
});
