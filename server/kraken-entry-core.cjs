'use strict';
// Generic validation only. All proprietary map positions / routes live in private Neon.
const ALLOWED_TICKETS=Object.freeze([1,3,5,10]);
const LOADOUTS=Object.freeze(['SR','GC']);
function fault(message,code=400){const e=new Error(message);e.status=code;throw e;}
function stepsFor(route){
 if(route===null||route===undefined)return null;
 if(!Array.isArray(route)||route.length<1||route.length>56)fault('Private preset route is incomplete',503);
 let remaining=56;
 const steps=[];
 for(const s of route){
  if(!s||!ALLOWED_TICKETS.includes(Number(s.ticketsUsed))||!LOADOUTS.includes(s.loadout)||
    !/^M([1-9]|10)$/.test(s.map||'')||Number(s.ticketsUsed)>remaining)fault('Invalid private preset route',503);
  steps.push({ticketsLeft:remaining,map:s.map,ticketsUsed:Number(s.ticketsUsed),loadout:s.loadout});
  remaining-=Number(s.ticketsUsed);
 }
 if(remaining!==0)fault('Private preset does not consume all tickets',503);
 return steps;
}
function progress(battles){
 let remaining=56;
 for(let i=0;i<battles.length;i++){
  const b=battles[i],used=Number(b.tickets_used??b.ticketsUsed);
  if(i>=56||Number(b.battle_no??b.number)!==i+1||
    Number(b.tickets_left??b.ticketsLeft)!==remaining||
    !ALLOWED_TICKETS.includes(used)||used>remaining)fault('Stored battle sequence is inconsistent',409);
  remaining-=used;
 }
 return {remaining,nextNumber:battles.length+1,complete:remaining===0};
}
function nextBattle(run,battles,mapSequence){
 const p=progress(battles);
 if(p.complete)return {complete:true,remaining:0,nextNumber:p.nextNumber};
 let auto=null;
 if(run.route_snapshot&&!run.customized){
  const s=stepsFor(run.route_snapshot);
  auto=s[battles.length]||null;
  if(!auto||auto.ticketsLeft!==p.remaining)fault('Preset and prior battles disagree',409);
 }
 const map=auto?.map||mapSequence[String(p.remaining)];
 if(!/^M([1-9]|10)$/.test(map||''))fault('Map sequence not yet configured for this ticket count',503);
 return {...p,map,autoTickets:auto?.ticketsUsed||null,autoLoadout:auto?.loadout||null};
}
function validateBattle(input,next){
 if(next.complete)fault('All tickets are already accounted for',409);
 // Preset entries are initial suggestions, not locked input values. An
 // explicit ticket override promotes the whole run to Custom Route.
 const used=input.ticketsUsed===undefined||input.ticketsUsed===null?
  next.autoTickets:Number(input.ticketsUsed);
 const loadout=input.loadout??next.autoLoadout;
 const rawDamage=String(input.damage??'').trim();
 const damage=Number(rawDamage);
 if(!ALLOWED_TICKETS.includes(used)||used>next.remaining)fault('Invalid tickets used');
 if(!LOADOUTS.includes(loadout))fault('Choose SR or GC');
 if(!/^(?:\d+|\d*\.\d{1,3})$/.test(rawDamage)||
   !Number.isFinite(damage)||damage<0||damage>999999999999)
   fault('Enter a valid damage amount in millions, up to 3 decimals');
 const notes=String(input.notes||'').trim();
 if(notes.length>500)fault('Notes cannot exceed 500 characters');
 return {battleNo:next.nextNumber,ticketsLeft:next.remaining,map:next.map,
  ticketsUsed:used,loadout,damage,notes};
}
function safeCsv(rows){
 const escape=v=>{let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return rows.map(r=>r.map(escape).join(',')).join('\r\n')+'\r\n';
}
module.exports={ALLOWED_TICKETS,LOADOUTS,stepsFor,progress,nextBattle,validateBattle,safeCsv,fault};
