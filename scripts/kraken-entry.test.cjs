'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const core=require('../server/kraken-entry-core.cjs');
const auth=require('../server/kraken-entry-auth.cjs');
const identity=require('../server/kraken-entry-identity.cjs');
const gateway=require('../api/discord/kraken-interactions.js');
const example=()=>Array.from({length:56},()=>({map:'M1',ticketsUsed:1,loadout:'GC'})); // synthetic only.
test('presets must use exactly 56 tickets with allowed map, ticket and loadout fields',()=>{
 const p=core.stepsFor(example());
 assert.equal(p.length,56);assert.deepEqual(p[0],{ticketsLeft:56,map:'M1',ticketsUsed:1,loadout:'GC'});
 assert.equal(p.at(-1).ticketsLeft,1);
 assert.throws(()=>core.stepsFor(example().slice(1)),/does not consume/);
 assert.throws(()=>core.stepsFor([{map:'M1',ticketsUsed:2,loadout:'GC'}]),/Invalid/);
});
test('custom route derives next battle and map from tickets actually spent',()=>{
 const p=core.nextBattle({route_snapshot:null},[],{'56':'M10','55':'M2'});
 assert.equal(p.remaining,56);assert.equal(p.map,'M10');
 const b=core.validateBattle({ticketsUsed:1,loadout:'SR',damage:'0',notes:'initial'},p);
 assert.equal(b.ticketsUsed,1);assert.equal(b.damage,0);
 const next=core.nextBattle({route_snapshot:null},[{battle_no:1,tickets_left:56,tickets_used:1}],{'55':'M2'});
 assert.deepEqual([next.nextNumber,next.remaining,next.map],[2,55,'M2']);
 assert.throws(()=>core.nextBattle({route_snapshot:null},[],{}),/not yet configured/);
});
test('preset steps override client-supplied tickets and loadout',()=>{
 const p=core.nextBattle({route_snapshot:example()},[],{});
 const b=core.validateBattle({ticketsUsed:10,loadout:'SR',damage:'20.125',notes:'all good'},p);
 assert.equal(b.ticketsUsed,1);assert.equal(b.loadout,'GC');assert.equal(b.damage,20.125);
});
test('reject invalid damage, notes, tickets, and incomplete sequences',()=>{
 const next={nextNumber:1,remaining:56,map:'M10'};
 for(const damage of ['',null,-1,'Infinity','1.0009'])
  assert.throws(()=>core.validateBattle({ticketsUsed:1,loadout:'GC',damage},next),/damage/);
 assert.throws(()=>core.validateBattle({ticketsUsed:2,loadout:'GC',damage:4},next),/tickets/);
 assert.throws(()=>core.validateBattle({ticketsUsed:1,loadout:'GC',damage:4,notes:'x'.repeat(501)},next),/Notes/);
 assert.throws(()=>core.validateBattle({ticketsUsed:1,loadout:'wrong',damage:4},next),/SR or GC/);
 assert.throws(()=>core.progress([{battle_no:1,tickets_left:55,tickets_used:1}]),/inconsistent/);
});
test('CSV output neutralizes spreadsheet formulas',()=>{
 const csv=core.safeCsv([['Name','Notes'],['=HYPERLINK(1)','+cmd']]);
 assert.match(csv,/"'=HYPERLINK\(1\)"/);assert.match(csv,/"'\+cmd"/);
});
function session(p,key){
 const body=Buffer.from(JSON.stringify(p)).toString('base64url');
 return body+'.'+crypto.createHmac('sha256',key).update(body).digest('base64url');
}
const secret='test-hmac-secret',member={sub:'123456789012345678',username:'Tester',exp:Math.floor(Date.now()/1000)+3600};
const req=p=>({headers:{cookie:'avengers_session='+session(p,secret)}});
test('guests, permanent guests, expired, forged, and anonymous sessions denied',()=>{
 for(const p of [{...member,guest:true},{...member,permanentGuest:true},{...member,exp:1}])
  assert.equal(auth.sessionFromRequest(req(p),{AUTH_SECRET:secret}),null);
 assert.equal(auth.sessionFromRequest(req(member),{AUTH_SECRET:'other'}),null);
 assert.equal(auth.sessionFromRequest({headers:{}},{AUTH_SECRET:secret}),null);
 assert.equal(auth.sessionFromRequest(req(member),{AUTH_SECRET:secret}).id,member.sub);
});
test('members must still belong to the target Discord guild',async()=>{
 const env={AUTH_SECRET:secret,DISCORD_GUILD_ID:'1403361698177618081',DISCORD_BOT_TOKEN:'dummy'};
 assert.equal(await auth.authenticate(req(member),env,async()=>({status:404})),null);
 const valid=await auth.authenticate(req(member),env,async()=>({status:200,json:async()=>({user:{id:member.sub},roles:['123456789012345679']})}));
 assert.equal(valid.id,member.sub);assert.equal(valid.roles.length,1);
});
test('reviewer access checks guild ownership or manage-guild permission',async()=>{
 const guildId='1403361698177618081',env={DISCORD_GUILD_ID:guildId,DISCORD_BOT_TOKEN:'dummy'};
 const user={id:member.sub,roles:['123456789012345679']};
 const fake=async url=>({ok:true,json:async()=>{
  if(url.endsWith('/roles'))return [{id:guildId,permissions:'0'},{id:user.roles[0],permissions:'32'}];
  return {id:guildId,owner_id:'111111111111111111'};
 }});
 assert.equal(await auth.isReviewer(user,env,fake),true);
 const deny=async url=>({ok:true,json:async()=>{
  if(url.endsWith('/roles'))return [{id:guildId,permissions:'0'}];
  return {id:guildId,owner_id:'111111111111111111'};
 }});
 assert.equal(await auth.isReviewer(user,env,deny),false);
});
test('only matching origin and JSON POST content type accepted',()=>{
 const env={AVENGERS_KRAKEN_ORIGIN:'https://avengers-stat-center.vercel.app'};
 assert.equal(auth.guardPost({headers:{origin:env.AVENGERS_KRAKEN_ORIGIN,'content-type':'application/json'}},env),true);
 assert.equal(auth.guardPost({headers:{origin:'https://attacker.example','content-type':'application/json'}},env),false);
});
test('two canonical game accounts can share one verified Discord user',()=>{
 const opts=['AV-Frenchie(-4)','AV-Frenchie2'];
 assert.equal(identity.selectProfile(opts,'AV-Frenchie2',true),'AV-Frenchie2');
 assert.equal(identity.selectProfile(opts,'',false),null);
 assert.throws(()=>identity.selectProfile(opts,'',true),/Choose/);
 assert.throws(()=>identity.selectProfile(opts,'AV-Other',true),/not linked/);
 assert.equal(identity.selectProfile([],undefined,true),null);
});
test('Discord interaction signatures use the original raw request bytes',async()=>{
 const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');
 const pk=publicKey.export({type:'spki',format:'der'}).subarray(-32).toString('hex');
 const ts=Math.floor(Date.now()/1000).toString(),body=Buffer.from('{"type":1}');
 const sig=crypto.sign(null,Buffer.concat([Buffer.from(ts),body]),privateKey).toString('hex');
 const h={'x-signature-timestamp':ts,'x-signature-ed25519':sig};
 assert.equal(gateway.verify(body,h,pk),true);
 assert.equal(gateway.verify(Buffer.from('{"type":2}'),h,pk),false);
 assert.equal(gateway.verify(body,h,pk,Date.now()+360000),false);
 const raw=await gateway.readRaw({async *[Symbol.asyncIterator](){yield body.subarray(0,3);yield body.subarray(3);}});
 assert.deepEqual(raw,body);
});
test('public site builder does not copy the private API/server or route data',()=>{
 const build=fs.readFileSync(path.join(__dirname,'build-site.cjs'),'utf8');
 assert.match(build,/entry\.isDirectory\(\)&&entry\.name!=='assets'/);
 assert.equal(fs.existsSync(path.join(__dirname,'..','data','kraken-private-routes.json')),false);
});
