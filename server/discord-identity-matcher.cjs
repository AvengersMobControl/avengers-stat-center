'use strict';
// Ranked *suggestions* only. Never automatically assert Discord identity.
// Uses public canonical names/aliases, not private member data or Kraken strategy.
function normalized(raw) {
 return String(raw||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[\u200b-\u200d\ufe0f]/g,'')
  .replace(/^\s*av(?:[\s_.-]?2)?[\s_.:#-]+/,'')
  .replace(/[^a-z0-9]/g,'');
}
function forms(raw) {
 const text=String(raw||'').trim();
 const options=[{value:normalized(text),reason:'full name',penalty:0}];
 const add=(s,reason,penalty)=>{
  const value=normalized(s);
  if(value.length>=3&&!options.some(o=>o.value===value))
   options.push({value,reason,penalty});
 };
 // Name plus human description, e.g. "Dubai (Abdulla)".
 // A numeric suffix in parentheses can be part of a distinct player ID:
 // "Frenchie(-4)" is not simply "Frenchie". Never strip it.
 const suffix=text.match(/[\[(（]([^)^\]）]{1,70})[)\]）]\s*$/u);
 if(!suffix||!/^\s*-\d+\s*$/.test(suffix[1]))
  add(text.replace(/\s*[\[(（][^)\]）]{1,70}[)\]）]\s*$/u,''),'parenthetical description',5);
 // Decorated nicknames are frequent in the AVENGERS Discord.
 add(text.replace(/(?:\s+|[-_|])(?:xx|xxx|s9|avengers)\s*$/i,''),'trailing clan decoration',5);
 // Prefixes like "Mr.Knaven"; never strip a genuine canonical "Mr" exact hit.
 add(text.replace(/^\s*(?:mr|mrs|ms|dr)[.\s_-]+/i,''),'display honorific',7);
 // Discord usernames sometimes append numeric discriminator-like digits.
 add(text.replace(/[0-9]{2,6}$/,''),'username numeric suffix',12);
 return options.filter(o=>o.value.length>=2);
}
function distance(a,b) {
 const n=a.length,m=b.length,prev=Array.from({length:m+1},(_,i)=>i),curr=[];
 for(let i=1;i<=n;i++){
  curr[0]=i;
  for(let j=1;j<=m;j++) curr[j]=Math.min(
   prev[j]+1,curr[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
  for(let j=0;j<=m;j++)prev[j]=curr[j];
 }
 return prev[m];
}
function dice(a,b) {
 if(a.length<3||b.length<3)return 0;
 const grams=s=>{const out=new Map();for(let i=0;i<s.length-2;i++){const g=s.slice(i,i+3);out.set(g,(out.get(g)||0)+1);}return out;};
 const A=grams(a),B=grams(b);let intersection=0;
 for(const [k,n] of A)intersection+=Math.min(n,B.get(k)||0);
 return 2*intersection/(a.length+b.length-4);
}
function similarity(a,b) {
 if(!a||!b)return {value:0,why:'no shared name'};
 if(a===b)return {value:100,why:'identical normalized name'};
 if(Math.min(a.length,b.length)<3)return {value:0,why:'name too short'};
 const longer=Math.max(a.length,b.length),shorter=Math.min(a.length,b.length);
 const edit=1-distance(a,b)/longer;
 // Word truncations and appended username digits are common, but a generic
 // 2- or 3-character prefix is never enough to infer an identity.
 const prefix=a.startsWith(b)||b.startsWith(a);
 const suffix=a.endsWith(b)||b.endsWith(a);
 const contain=a.includes(b)||b.includes(a);
 let score=0,why='weak resemblance';
 if(prefix&&shorter>=4&&shorter/longer>=0.5){
  score=70+15*shorter/longer;why='shared distinctive beginning';
 }else if(suffix&&shorter>=5&&shorter/longer>=0.6){
  score=66+14*shorter/longer;why='shared distinctive ending';
 }else if(contain&&shorter>=5&&shorter/longer>=0.6){
  score=64+12*shorter/longer;why='one name appears in the other';
 }
 const editScore=edit>=0.55?Math.max(0,55+36*(edit-0.55)/0.45):0;
 if(editScore>score){score=editScore;why='similar spelling';}
 const overlap=dice(a,b);
 const ngramScore=overlap>=0.48?52+27*(overlap-0.48)/0.52:0;
 if(ngramScore>score){score=ngramScore;why='shared character pattern';}
 return {value:Math.max(0,Math.min(94,Math.round(score))),why};
}
function rank(member,canonicals,aliases={}) {
 const profiles=new Map();
 for(const p of canonicals||[])if(p?.name)profiles.set(String(p.name),{name:String(p.name),status:p.status||'Unknown',names:[{raw:p.name,alias:false}]});
 for(const [alias,canonical] of Object.entries(aliases||{}))if(profiles.has(canonical))
  profiles.get(canonical).names.push({raw:alias,alias:true});
 const inputs=[['server nickname',member?.nick,0],['Discord display',member?.user?.global_name,2],['Discord username',member?.user?.username,4]]
  .filter(x=>x[1]).flatMap(([field,text,penalty])=>forms(text).map(f=>({...f,field,text,penalty:f.penalty+penalty})));
 const candidates=[];
 for(const p of profiles.values()){
  let best={score:0,reason:'no distinctive resemblance',source:'',matchedName:''};
  for(const input of inputs)for(const name of p.names)for(const reference of forms(name.raw)){
   const sim=similarity(input.value,reference.value);
   let strength=sim.value-input.penalty-reference.penalty-(name.alias?2:0);
   // Non-current historical accounts are valid candidates, but a weaker
   // historical guess should not beat a comparably strong live roster match.
   if(p.status==='Inactive')strength-=3;
   // Identity suffixes are NOT removed from canonical forms, so
   // "Frenchie" remains ambiguous between "Frenchie2" and "Frenchie(-4)".
   if(strength>best.score)best={score:Math.round(strength),
    reason:(name.alias?'established alias; ':'')+sim.why+(input.reason!=='full name'?'; '+input.reason:''),
    source:input.field,matchedName:name.raw};
  }
  if(best.score>=52)candidates.push({canonical:p.name,rosterStatus:p.status,score:best.score,
   reason:best.reason,source:best.source,matchedName:best.matchedName});
 }
 candidates.sort((a,b)=>b.score-a.score||
  (a.rosterStatus==='Active'||a.rosterStatus==='AV2'?-1:1)-
  (b.rosterStatus==='Active'||b.rosterStatus==='AV2'?-1:1)||
  a.canonical.localeCompare(b.canonical));
 const top=candidates[0]||null,second=candidates[1]||null;
 const margin=top?top.score-(second?.score||0):0;
 const status=!top||top.score<58?'unmatched'
  :top.score>=95&&margin>=5?'suggested'
  :top.score>=78&&margin>=9?'likely'
  :margin<=5?'ambiguous':'possible';
 return {
  suggestion:status==='unmatched'?'':top.canonical,
  status,score:top?.score||0,reason:top?.reason||'',
  source:top?.source||'',margin,
  choices:candidates.slice(0,3).map(c=>c.canonical),
  candidates:candidates.slice(0,3),
  evidence:top?[top.source+': '+top.matchedName]:[]
 };
}
module.exports={normalized,forms,distance,dice,similarity,rank};
