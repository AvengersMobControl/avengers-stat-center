'use strict';

const statuses=['Active','AV2','Inactive'];
const reserved=new Set(['__proto__','constructor','prototype','keyler','av-keyler','blade','av-2(tamim)']);
const key=name=>name.toLowerCase();
function nameOf(value){
  const name=typeof value==='string'?value.trim():'';
  if(!name||name.length>80||/[\p{Cc}\p{Cf}]/u.test(name)||reserved.has(key(name)))
    throw Error('Enter a valid in-game name (1–80 characters).');
  return name;
}
function resolve(name,aliases){
  if(/olrose/i.test(name))return 'AV-OlRose';
  const path=new Set();
  while(Object.hasOwn(aliases,name)&&aliases[name]!==name){
    if(path.has(name))throw Error('This link would create a cycle.');
    path.add(name);
    name=aliases[name];
  }
  return name;
}
function operation(input){
  if(!input||typeof input!=='object')throw Error('Choose a roster action.');
  const {kind}=input,name=nameOf(input.name);
  if(kind==='link')return {kind,name,target:nameOf(input.target)};
  if(!['add','status'].includes(kind)||!statuses.includes(input.status))throw Error('Choose a valid clan status.');
  return {kind,name,status:input.status};
}
function applyChanges(people,initialAliases,changes,{validateNew=false}={}){
  const aliases=Object.assign(Object.create(null),initialAliases);
  const peopleByName=new Map();
  const overrides=new Map();
  for(const person of people){
    if(!person.name||reserved.has(key(person.name)))continue;
    const name=resolve(person.name,aliases);
    if(!peopleByName.has(key(name))||person.name===name)
      peopleByName.set(key(name),{name,status:person.status||'Inactive'});
  }
  const known=name=>{
    const exact=resolve(name,aliases);
    if(exact!==name)return peopleByName.get(key(exact));
    const found=peopleByName.get(key(name));
    if(found)return found;
    const raw=Object.keys(aliases).find(alias=>key(alias)===key(name));
    return raw?peopleByName.get(key(resolve(raw,aliases))):undefined;
  };
  for(const change of changes){
    const {kind,name,target,status}=operation(change);
    const member=known(name);
    if(kind==='add'){
      if(validateNew&&(member||Object.keys(aliases).some(alias=>key(alias)===key(name))))
        throw Error('That name is already recorded. Select the existing member or link the spelling.');
      if(/olrose/i.test(name))throw Error('All OlRose spellings belong to AV-OlRose.');
      if(member&&key(member.name)!==key(name))
        throw Error('The new name already links to a different member.');
      const canonicalName=member?.name||name;
      peopleByName.set(key(canonicalName),{name:canonicalName,status});
      overrides.set(canonicalName,status);
      continue;
    }
    if(kind==='status'){
      if(!member)throw Error('Select an existing member.');
      member.status=status;
      overrides.set(member.name,status);
      continue;
    }
    const survivor=known(target);
    if(!survivor)throw Error('Select an existing name to keep.');
    if(/olrose/i.test(name)||key(name)===key(survivor.name)||member?.name===survivor.name)
      throw Error('That name already points to the selected member or is a protected identity.');
    if(member&&key(member.name)!==key(name))throw Error('That spelling already points to a different member.');
    const candidates=new Set([name,...(member?[member.name]:[])]);
    for(const from of candidates)aliases[from]=survivor.name;
    if(member){
      peopleByName.delete(key(member.name));
      overrides.delete(member.name);
    }
    overrides.set(survivor.name,survivor.status);
  }
  return {people:[...peopleByName.values()].sort((a,b)=>a.name.localeCompare(b.name)),aliases,overrides};
}
module.exports={applyChanges,operation,resolve,statuses};
