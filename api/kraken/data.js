'use strict';
const auth=require('../../server/kraken-entry-auth.cjs');
const store=require('../../server/kraken-entry-store.cjs');
const identities=require('../../server/kraken-entry-identity.cjs');
module.exports=async function handler(req,res){
 auth.headers(res);
 if(!['GET','POST'].includes(req.method))return auth.json(res,405,{error:'Method not allowed'});
 let user;
 try{user=await auth.authenticate(req);}catch{return auth.json(res,503,{error:'Member verification unavailable'});}
 if(!user)return auth.json(res,403,{error:'Verified non-guest AVENGERS Discord membership is required'});
 if(req.method==='POST'&&!auth.guardPost(req))return auth.json(res,403,{error:'Origin or content type not accepted'});
 try{
  const event=store.checkEvent(process.env),q=store.connection();
  if(req.method==='GET'){
   const mode=String(req.query?.mode||'init');
   if(mode==='init'){
    const profiles=await identities.linkedProfiles(user.id);
    const selected=identities.selectProfile(profiles,req.query?.profile);
    return auth.json(res,200,{
     event,testMode:process.env.AVENGERS_KRAKEN_TEST_MODE==='true',who:{name:user.username,admin:await auth.isReviewer(user)},
     profiles,selectedProfile:selected,
     routes:await store.routes(q),...(await store.current(q,user.id,event,selected))});
   }
   if(!await auth.isReviewer(user))return auth.json(res,403,{error:'Reviewer access required'});
   if(mode==='review')return auth.json(res,200,{event,runs:await store.reviewList(q,event)});
   if(mode==='csv'){
    const csv=await store.exportApproved(q,event);
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="avengers-kraken-'+(process.env.AVENGERS_KRAKEN_TEST_MODE==='true'?'TEST-DO-NOT-IMPORT-':'approved-')+event+'.csv"');
    return res.status(200).send(csv);
   }
   return auth.json(res,404,{error:'Unknown mode'});
  }
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>3500)
   return auth.json(res,400,{error:'Invalid request body'});
  if(['edit','approve','reject','exported'].includes(body.action)){
   if(!await auth.isReviewer(user))return auth.json(res,403,{error:'Reviewer access required'});
   return auth.json(res,200,{runs:await store.reviewAction(q,user,event,body.action,body)});
  }
  const profiles=await identities.linkedProfiles(user.id);
  const profile=identities.selectProfile(profiles,body.profile,body.action==='start');
  let result;
  if(body.action==='start')result=await store.start(q,user,event,String(body.routeId||''),profile);
  else if(body.action==='save')result=await store.save(q,user,event,profile,body);
  else if(body.action==='undo')result=await store.undo(q,user,event,profile);
  else if(body.action==='submit')result=await store.submit(q,user,event,profile);
  else return auth.json(res,400,{error:'Unknown action'});
  return auth.json(res,200,result);
 }catch(e){
  const status=Number(e.status)||500;
  if(status>=500)console.error('Private Kraken entry action failed',e.message);
  return auth.json(res,status,{error:status>=500?'Private Kraken service unavailable':e.message});
 }
};
