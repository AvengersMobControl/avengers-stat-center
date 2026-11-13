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
test('preset suggestions allow SR/GC and ticket overrides; revised tickets use custom map sequence',()=>{
 const p=core.nextBattle({route_snapshot:example(),customized:false},[],{});
 assert.equal(p.autoTickets,1);assert.equal(p.autoLoadout,'GC');
 const loadoutOnly=core.validateBattle({ticketsUsed:1,loadout:'SR',damage:'20.125'},p);
 assert.equal(loadoutOnly.ticketsUsed,1);assert.equal(loadoutOnly.loadout,'SR');
 const changed=core.validateBattle({ticketsUsed:10,loadout:'SR',damage:'20.125',notes:'changed plan'},p);
 assert.equal(changed.ticketsUsed,10);assert.equal(changed.loadout,'SR');
 assert.equal(changed.damage,20.125);
 const custom=core.nextBattle({route_snapshot:example(),customized:true},
   [{battle_no:1,tickets_left:56,tickets_used:10}],{'46':'M5'});
 assert.equal(custom.map,'M5');assert.equal(custom.remaining,46);
 assert.equal(custom.autoTickets,null);assert.equal(custom.autoLoadout,null);
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
test('only explicitly listed leader Discord ID can review or export, not arbitrary guild administrators',async()=>{
 const leader={id:member.sub,roles:[]};
 const admin={id:'123456789012345679',roles:['987654321098765432']};
 const env={AVENGERS_KRAKEN_REVIEWER_IDS:member.sub};
 assert.equal(await auth.isReviewer(leader,env),true);
 assert.equal(await auth.isReviewer(admin,env),false);
 assert.equal(await auth.isReviewer(leader,{}),false);
 assert.equal(await auth.isReviewer(admin,{AVENGERS_KRAKEN_REVIEWER_IDS:admin.id}),true);
 assert.equal(await auth.isReviewer(null,env),false);
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
test('Discord app key is retrieved from the authenticated bot application and identity checked',async()=>{
 const key='a'.repeat(64),id='1554265799806550096';
 const env={DISCORD_CLIENT_ID:id,DISCORD_BOT_TOKEN:'dummy'};
 const ok=await gateway.applicationPublicKey(env,async()=>({ok:true,json:async()=>({id,verify_key:key})}));
 assert.equal(ok,key);
 const explicit=await gateway.applicationPublicKey({...env,DISCORD_PUBLIC_KEY:'b'.repeat(64)},async()=>{throw Error('should not fetch');});
 assert.equal(explicit,'b'.repeat(64));
});
test('review CSV contains pending data while approved-only export does not',async()=>{
 const store=require('../server/kraken-entry-store.cjs');
 const run=(id,status)=>({
  id,event_key:'2026-11-12',discord_user_id:'123456789012345678',
  discord_username:'discord-user',canonical_name:'AV-TestPlayer',
  route_id:'test-quickrun',customized:false,status,submitted_at:'2026-11-12T23:00:00Z'});
 const records=[run('pending-id','pending'),run('approved-id','approved')];
 const q=async(sql,params)=>{
  if(sql.includes('FROM avengers_kraken_private.runs WHERE'))return records;
  if(sql.includes('FROM avengers_kraken_private.battles WHERE')){
   return [{battle_no:1,tickets_left:56,map_code:'M10',tickets_used:10,
    loadout:'SR',damage_m:'22.5',notes:'test only'}];
  }
  throw Error('Unexpected DB query in review export');
 };
 const review=await store.exportReview(q,'2026-11-12');
 const approved=await store.exportApproved(q,'2026-11-12');
 assert.match(review,/Status/);
 assert.match(review,/"pending"/);
 assert.match(review,/"approved"/);
 assert.match(review,/"22.5"/);
 assert.doesNotMatch(approved,/pending-id/);
 assert.match(approved,/approved-id/);
});
test('member UI compiles and exposes visible edit, reopen, and leader-only review exports',()=>{
 const text=fs.readFileSync(path.join(__dirname,'..','api','kraken','form.js'),'utf8');
 const match=text.match(/const PAGE=([\s\S]*?);\nmodule\.exports/);
 assert.ok(match,'private form markup is embedded in guarded Vercel API');
 const html=JSON.parse(match[1]);
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script,'private page includes browser code');
 assert.doesNotThrow(()=>new Function(script[1]));
 for(const id of ['id="editPanel"','id="reopen"','id="reviewShortcut"',
  'mode=review-csv','mode=csv','id="saveEdit"','id="ticketOverrideHint"'])
  assert.ok(html.includes(id),'Missing private UI: '+id);
});
test('public site builder does not copy the private API/server or route data',()=>{
 const build=fs.readFileSync(path.join(__dirname,'build-site.cjs'),'utf8');
 assert.match(build,/entry\.isDirectory\(\)&&entry\.name!=='assets'/);
 assert.equal(fs.existsSync(path.join(__dirname,'..','data','kraken-private-routes.json')),false);
});
