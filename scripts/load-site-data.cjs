'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function load({onStep}={}){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),context=vm.createContext({window:{},console});
  for(const [i,m]of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries()){
    const src=m[1].match(/\bsrc="([^"]+)"/)?.[1];
    if(src==='community-highlights.js')continue;
    vm.runInContext(src?fs.readFileSync(path.join(root,src),'utf8'):m[2],context,{filename:src||'inline-'+i,timeout:20000});
    onStep?.(context.window,src||'inline-'+i);
    if(src==='roster-stars-snapshot-2026-10-15.js')return context.window;
  }
  throw Error('Legacy data boundary missing');
}
module.exports={load,root};
