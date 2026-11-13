'use strict';
const auth=require('../../server/kraken-entry-auth.cjs');
const store=require('../../server/kraken-entry-store.cjs');
module.exports=async function handler(req,res){
 auth.headers(res);
 if(!['GET','POST'].includes(req.method))return auth.json(res,405,{error:'Method not allowed'});
 let user;
 try{user=await auth.authenticate(req);}catch{return auth.json(res,503,{error:'Member verification unavailable'});}
 if(!user)return auth.json(res,403,{error:'A verified non-guest AVENGERS Discord account is required'});
 if(req.method==='POST'&&!auth.guardPost(req))return auth.json(res,403,{error:'Origin or content type not accepted'});
 try{
  const event=store.checkEvent(process.env),q=store.connection();
  if(req.method==='GET'){
   const mode=String(req.query?.mode||'init');
   if(mode==='init')return auth.json(res,200,{
    event,who:{name:user.username,admin:user.admin},
    routes:await store.routes(q),...(await store.current(q,user.id,event))});
   if(!user.admin)return auth.json(res,403,{error:'Reviewer access required'});
   if(mode==='review')return auth.json(res,200,{event,runs:await store.reviewList(q,event)});
   if(mode==='csv'){
    const csv=await store.exportApproved(q,event);
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="avengers-kraken-approved-'+event+'.csv"');
    return res.status(200).send(csv);
   }
   return auth.json(res,404,{error:'Unknown mode'});
  }
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>3500)
   return auth.json(res,400,{error:'Invalid request body'});
  let result;
  if(body.action==='start')result=await store.start(q,user,event,String(body.routeId||''));
  else if(body.action==='save')result=await store.save(q,user,event,body);
  else if(body.action==='undo')result=await store.undo(q,user,event);
  else if(body.action==='submit')result=await store.submit(q,user,event);
  else if(['edit','approve','reject','exported'].includes(body.action)&&user.admin)
   result={runs:await store.reviewAction(q,user,event,body.action,body)};
  else return auth.json(res,403,{error:'Action not permitted'});
  return auth.json(res,200,result);
 }catch(e){
  const status=Number(e.status)||500;
  if(status>=500)console.error('Private Kraken entry action failed',e.message);
  return auth.json(res,status,{error:status>=500?'Private Kraken service unavailable':e.message});
 }
};
