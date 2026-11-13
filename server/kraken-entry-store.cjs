'use strict';
// Generic private persistence; NO route/map data or credentials are committed.
const {stepsFor,progress,nextBattle,validateBattle,fault,safeCsv}=require('./kraken-entry-core.cjs');
const SCHEMA='avengers_kraken_private';
function connection(env=process.env){
 if(!env.AVENGERS_KRAKEN_DATABASE_URL)fault('Private Kraken database not configured',503);
 const {neon}=require('@neondatabase/serverless');
 const sql=neon(env.AVENGERS_KRAKEN_DATABASE_URL);
 return (query,params=[])=>sql.query(query,params);
}
async function audit(q,runId,user,action,details={}){
 await q('INSERT INTO '+SCHEMA+'.audit(run_id,actor_id,action,detail) VALUES ($1,$2,$3,$4::jsonb)',
  [runId,user,action,JSON.stringify(details)]);
}
function checkEvent(env){
 const k=String(env.AVENGERS_KRAKEN_ACTIVE_EVENT||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(k))fault('Kraken event is not opened for entries yet',503);
 return k;
}
async function routes(q){
 const rows=await q('SELECT route_id,title,revision FROM '+SCHEMA+'.routes WHERE active=true ORDER BY title');
 return [{id:'custom',title:'Custom Route'},...rows.map(r=>({id:r.route_id,title:r.title,revision:r.revision}))];
}
async function sequence(q){
 const rows=await q('SELECT tickets_left,map_code FROM '+SCHEMA+'.map_sequence');
 return Object.fromEntries(rows.map(r=>[String(r.tickets_left),r.map_code]));
}
async function own(q,user,event,canonicalName=null){
 const rows=await q('SELECT * FROM '+SCHEMA+'.runs WHERE event_key=$1 AND discord_user_id=$2 AND status<>$3 AND COALESCE(canonical_name,\'\')=COALESCE($4,\'\') ORDER BY created_at DESC LIMIT 1',
  [event,user,'rejected',canonicalName]);
 return rows[0]||null;
}
async function getBattles(q,runId){
 return q('SELECT id,battle_no,tickets_left,map_code,tickets_used,loadout,damage_m,notes FROM '+SCHEMA+'.battles WHERE run_id=$1 AND voided_at IS NULL ORDER BY battle_no',[runId]);
}
async function current(q,user,event,canonicalName=null){
 const run=await own(q,user,event,canonicalName);
 if(!run)return {run:null,battles:[],next:null};
 const battles=await getBattles(q,run.id);
 let next=null,lookupIssue=null;
 if(run.status==='draft'){
  try{next=nextBattle(run,battles,await sequence(q));}
  catch(e){lookupIssue=e.message;}
 }
 return {run:{id:run.id,status:run.status,routeId:run.route_id||'custom',event:run.event_key,canonicalName:run.canonical_name||null,
    submittedAt:run.submitted_at,reviewNote:run.review_note},battles,next,lookupIssue};
}
async function start(q,user,event,routeId,canonicalName=null){
 if(!/^(custom|[a-z0-9_-]{2,40})$/.test(routeId||''))fault('Select a valid route');
 let name=null,version=null,snapshot=null;
 if(routeId!=='custom'){
  const rows=await q('SELECT revision,steps FROM '+SCHEMA+'.routes WHERE route_id=$1 AND active=true',[routeId]);
  if(rows.length!==1)fault('That route is not available',404);
  name=routeId;version=Number(rows[0].revision);
  snapshot=stepsFor(rows[0].steps).map(s=>({map:s.map,ticketsUsed:s.ticketsUsed,loadout:s.loadout}));
 }
 const existing=await own(q,user.id,event,canonicalName);
 if(existing){
  if(existing.status!=='draft')return current(q,user.id,event,canonicalName);
  const old=await getBattles(q,existing.id);
  if(old.length&&existing.route_id!==name)fault('Undo existing battles before changing routes',409);
  if(!old.length){
   await q('UPDATE '+SCHEMA+'.runs SET route_id=$2,route_revision=$3,route_snapshot=$4::jsonb,updated_at=now() WHERE id=$1 AND status=$5',
    [existing.id,name,version,snapshot?JSON.stringify(snapshot):null,'draft']);
  }
  return current(q,user.id,event,canonicalName);
 }
 const inserted=await q('INSERT INTO '+SCHEMA+'.runs(event_key,discord_user_id,discord_username,canonical_name,route_id,route_revision,route_snapshot) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) ON CONFLICT DO NOTHING RETURNING id',
  [event,user.id,user.username,canonicalName,name,version,snapshot?JSON.stringify(snapshot):null]);
 if(inserted.length===1)await audit(q,inserted[0].id,user.id,'start',{routeId:routeId});
 return current(q,user.id,event,canonicalName);
}
async function save(q,user,event,canonicalName,input){
 const run=await own(q,user.id,event,canonicalName);
 if(!run||run.status!=='draft')fault('No editable Kraken draft',409);
 const battles=await getBattles(q,run.id);
 const next=nextBattle(run,battles,await sequence(q));
 const b=validateBattle(input,next);
 // The server recomputes all fields; client-supplied map, player or battle numbers are ignored.
 const rows=await q('INSERT INTO '+SCHEMA+'.battles(run_id,battle_no,tickets_left,map_code,tickets_used,loadout,damage_m,notes) SELECT $1,$2,$3,$4,$5,$6,$7,$8 WHERE EXISTS(SELECT 1 FROM '+SCHEMA+'.runs WHERE id=$1 AND discord_user_id=$9 AND status=$10) AND (SELECT count(*) FROM '+SCHEMA+'.battles WHERE run_id=$1 AND voided_at IS NULL)=$11 ON CONFLICT DO NOTHING RETURNING id',
  [run.id,b.battleNo,b.ticketsLeft,b.map,b.ticketsUsed,b.loadout,b.damage,b.notes,user.id,'draft',b.battleNo-1]);
 if(rows.length!==1)fault('Another edit was saved; reload the current battle',409);
 await audit(q,run.id,user.id,'battle_saved',{battle:b.battleNo});
 return current(q,user.id,event,canonicalName);
}
async function undo(q,user,event,canonicalName){
 const run=await own(q,user.id,event,canonicalName);
 if(!run||run.status!=='draft')fault('No editable draft',409);
 const rows=await q('UPDATE '+SCHEMA+'.battles SET voided_at=now() WHERE id=(SELECT id FROM '+SCHEMA+'.battles WHERE run_id=$1 AND voided_at IS NULL ORDER BY battle_no DESC LIMIT 1) AND voided_at IS NULL RETURNING battle_no',[run.id]);
 if(rows.length===1)await audit(q,run.id,user.id,'undo',{battle:rows[0].battle_no});
 return current(q,user.id,event,canonicalName);
}
async function submit(q,user,event,canonicalName){
 const run=await own(q,user.id,event,canonicalName);
 if(!run||run.status!=='draft')fault('No editable draft',409);
 const battles=await getBattles(q,run.id);
 if(!progress(battles).complete)fault('Use all 56 tickets before submitting',409);
 if(run.route_snapshot&&battles.length!==stepsFor(run.route_snapshot).length)
  fault('Preset route is incomplete',409);
 const rows=await q("UPDATE "+SCHEMA+".runs SET status='pending',submitted_at=now(),updated_at=now() WHERE id=$1 AND discord_user_id=$2 AND status='draft' RETURNING id",
  [run.id,user.id]);
 if(rows.length!==1)fault('Already submitted',409);
 await audit(q,run.id,user.id,'submit',{battles:battles.length});
 return current(q,user.id,event,canonicalName);
}
async function reviewList(q,event){
 const rows=await q('SELECT id,event_key,discord_user_id,discord_username,canonical_name,route_id,status,submitted_at,reviewed_at,reviewed_by,review_note FROM '+SCHEMA+'.runs WHERE event_key=$1 AND status<>$2 ORDER BY submitted_at DESC NULLS LAST LIMIT 200',[event,'draft']);
 const ids=rows.map(r=>r.id);
 const details=await Promise.all(ids.map(id=>getBattles(q,id)));
 return rows.map((run,i)=>({...run,battles:details[i]}));
}
async function reviewAction(q,reviewer,event,action,input){
 if(!/^[a-f0-9-]{36}$/.test(String(input.runId||'')))fault('Invalid review ID');
 const id=input.runId;
 const rows=await q('SELECT id,status FROM '+SCHEMA+'.runs WHERE id=$1 AND event_key=$2',[id,event]);
 if(rows.length!==1)fault('Submission not found',404);
 const status=rows[0].status;
 if(action==='edit'){
  if(status!=='pending')fault('Only pending runs may be edited',409);
  const battle=Number(input.battleNo),damage=Number(input.damage),notes=String(input.notes||'').trim();
  if(!Number.isInteger(battle)||battle<1||battle>56||input.damage===null||input.damage===undefined||
    String(input.damage).trim()===''||!Number.isFinite(damage)||damage<0||damage>999999999999||
    Math.round(damage*1000)!==damage*1000||notes.length>500)fault('Invalid correction');
  const updated=await q('UPDATE '+SCHEMA+'.battles SET damage_m=$3,notes=$4 WHERE run_id=$1 AND battle_no=$2 AND voided_at IS NULL RETURNING id',
    [id,battle,damage,notes]);
  if(updated.length!==1)fault('Battle missing',404);
  await audit(q,id,reviewer.id,'edit_damage',{battle});
 }else if(['approve','reject','exported'].includes(action)){
  if(status!==(action==='exported'?'approved':'pending'))fault('Invalid review status transition',409);
  const note=String(input.reason||'').trim().slice(0,500);
  if(action==='reject'&&!note)fault('A rejection reason is required');
  const target=action==='approve'?'approved':action==='reject'?'rejected':'exported';
  const updated=await q('UPDATE '+SCHEMA+'.runs SET status=$3,reviewed_by=$4,reviewed_at=now(),review_note=$5,updated_at=now() WHERE id=$1 AND event_key=$2 AND status=$6 RETURNING id',
    [id,event,target,reviewer.id,note,status]);
  if(updated.length!==1)fault('Review status changed; refresh',409);
  await audit(q,id,reviewer.id,action,{note});
 }else fault('Unknown review action');
 return reviewList(q,event);
}
async function exportApproved(q,event){
 const runs=await reviewList(q,event);
 const lines=[['Event','Canonical player','Discord username','Discord User ID','Run ID','Route','Battle #','Tickets Left','Map','Tickets Used','Loadout','Damage (M)','Damage/Ticket (M)','Notes']];
 for(const run of runs.filter(r=>r.status==='approved')){
  for(const b of run.battles){
   lines.push([run.event_key,run.canonical_name||'UNLINKED',run.discord_username,run.discord_user_id,run.id,
    run.route_id||'custom',b.battle_no,b.tickets_left,b.map_code,b.tickets_used,
    b.loadout,b.damage_m,Number(b.damage_m)/Number(b.tickets_used),b.notes]);
  }
 }
 return safeCsv(lines);
}
module.exports={connection,checkEvent,routes,sequence,current,start,save,undo,submit,reviewList,reviewAction,exportApproved};
