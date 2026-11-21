'use strict';

const {neon}=require('@neondatabase/serverless');
const auth=require('../server/kraken-entry-auth.cjs');
const {applyChanges,operation}=require('../server/roster-changes.cjs');
const {authorizedWorker}=require('../server/roster-editor-ci.cjs');
const {normalize}=require('../scripts/event-projection-core.cjs');
const editor=require('../server/roster-editor-view.cjs');

const sites={
  production:'https://avengers-stat-center.vercel.app',
  pages:'https://avengersmobcontrol.github.io/avengers-stat-center/'
};
function owner(req,env){
  const ownerIds=String(env.AVENGERS_ROSTER_OWNER_IDS||'').split(',').map(id=>id.trim());
  if(!ownerIds.every(id=>/^\d{17,22}$/.test(id)))return null;
  const member=auth.sessionFromRequest(req,env);
  return member&&ownerIds.includes(member.id) ? member : null;
}
function revision(value){
  const number=Number(value);
  if(!Number.isSafeInteger(number)||number<0||number>=2147483647)throw Error('Invalid roster revision.');
  return number;
}
async function source(url){
  const result=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!result.ok)throw Error('Roster release is unavailable.');
  return result.json();
}
async function catalog(withLedger){
  const manifest=await source(sites.pages+'release-manifest.json');
  async function read(name){
    const file=manifest.exports?.[name];
    if(!new RegExp('^exports/'+name+'\\.[a-f0-9]{16}\\.json$').test(file||''))
      throw Error('The roster export is unavailable.');
    const result=await source(sites.pages+file);
    if(result.version!==manifest.version)throw Error('The roster release changed. Try again.');
    return result.data;
  }
  const [projection,aliases,ledger]=await Promise.all([read('projection'),read('identityAliases'),withLedger?read('ledger'):null]);
  return {published:revision(manifest.rosterRevision??0),people:projection.people,aliases,ledger};
}
async function pending(sql,after){
  return sql`SELECT revision, operation FROM avengers_identity_private.roster_editor_changes
    WHERE revision > ${after} ORDER BY revision ASC LIMIT 401`;
}
function state(cat,rows){
  if(rows.length>400||rows.some((row,i)=>row.revision!==cat.published+i+1))
    throw Error('Roster synchronization needs attention.');
  return {published:cat.published,revision:rows.at(-1)?.revision??cat.published,
    people:applyChanges(cat.people,cat.aliases,rows.map(row=>row.operation)).people};
}
module.exports=async function handler(req,res){
  auth.headers(res);
  const {view}=req.query||{};
  const env=process.env;
  if(view==='capability'&&req.method==='GET')return res.status(200).json({allowed:Boolean(owner(req,env)&&env.AVENGERS_IDENTITY_DATABASE_URL)});
  if(view==='sync'){
    if(req.method!=='GET'||!await authorizedWorker(req))return res.status(403).json({error:'Access denied.'});
    try{
      if(!env.AVENGERS_IDENTITY_DATABASE_URL)throw Error('DB not configured.');
      const rows=await pending(neon(env.AVENGERS_IDENTITY_DATABASE_URL),revision(req.query.after));
      return res.status(200).json({rows});
    }catch{return res.status(503).json({error:'Roster synchronization is temporarily unavailable.'});}
  }

  const member=owner(req,env);
  if(!member)return res.status(403).json({error:'This editor is restricted to the roster owner.'});
  if(!env.AVENGERS_IDENTITY_DATABASE_URL)return res.status(503).json({error:'Roster editing is temporarily unavailable.'});
  if(view===undefined&&req.method==='GET')return editor.page(res);
  if(view==='script'&&req.method==='GET')return editor.script(res);
  if(view==='state'&&req.method==='GET'){
    try{
      const cat=await catalog(false);
      return res.status(200).json(state(cat,await pending(neon(env.AVENGERS_IDENTITY_DATABASE_URL),cat.published)));
    }catch{return res.status(503).json({error:'The roster could not load. Try again shortly.'});}
  }
  if(view!==undefined||req.method!=='POST')return res.status(405).json({error:'Method not supported.'});
  if(!auth.guardPost(req,{AVENGERS_KRAKEN_ORIGIN:sites.production}))
    return res.status(403).json({error:'Save from the signed-in roster editor.'});

  const body=req.body;
  let change,expected;
  try{
    if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(body?.requestId||''))throw Error('Invalid save request.');
    change=operation(body);
    expected=revision(body.revision);
  }catch(e){return res.status(400).json({error:e.message});}
  const sql=neon(env.AVENGERS_IDENTITY_DATABASE_URL);
  try{
    const existing=await sql`SELECT revision, operation FROM avengers_identity_private.roster_editor_changes
      WHERE request_id=${body.requestId} AND submitted_by=${member.id}`;
    if(existing.length){
      const prior=operation(existing[0].operation);
      if(JSON.stringify(prior)!==JSON.stringify(change))return res.status(409).json({error:'Reload before trying a different change.'});
      return res.status(200).json({revision:existing[0].revision});
    }
    const cat=await catalog(change.kind==='link');
    const rows=await pending(sql,cat.published);
    if(state(cat,rows).revision!==expected)
      return res.status(409).json({error:'The roster changed. Reload and try again.'});
    const current=applyChanges(cat.people,cat.aliases,rows.map(row=>row.operation));
    try{
      const next=applyChanges(current.people,current.aliases,[change],{validateNew:true});
      if(change.kind==='link'){
        for(const event of cat.ledger.events){
          try{normalize(event,next.aliases);}
          catch{return res.status(422).json({error:'These names have conflicting results in '+event.id+'. Resolve that event before linking them.'});}
        }
      }
    }catch(e){return res.status(422).json({error:e.message});}
    const saved=await sql`INSERT INTO avengers_identity_private.roster_editor_changes
      (revision,request_id,submitted_by,operation)
      VALUES (${expected+1},${body.requestId},${member.id},${JSON.stringify(change)}::jsonb)
      ON CONFLICT DO NOTHING RETURNING revision`;
    if(!saved.length)return res.status(409).json({error:'Another change was saved. Reload and try again.'});
    return res.status(202).json({revision:saved[0].revision});
  }catch{
    return res.status(503).json({error:'The save could not be confirmed. Try again.'});
  }
};
module.exports.owner=owner;
