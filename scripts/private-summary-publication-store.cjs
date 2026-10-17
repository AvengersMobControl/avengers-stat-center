'use strict';
// Local PRIVATE JSON state, atomic replace + fsync + no stale-lock auto-breaking.
// The public site and CI never initialize a production registry.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {initial,validateState}=require('./private-summary-publication-state.cjs');
const repoRoot=path.resolve(__dirname,'..');
const nope=m=>{throw Error(m)};
function target(file){
 if(!file||typeof file!=='string'||path.extname(file)!=='.json'||!path.isAbsolute(file))
  nope('Choose absolute private .json registry path outside the repository');
 const resolved=path.resolve(file);
 if(resolved===repoRoot||resolved.startsWith(repoRoot+path.sep))
  nope('A private Discord registry must NEVER reside in the public git repository');
 const folder=path.dirname(resolved);
 if(!fs.existsSync(folder))nope('Create a protected private directory (0700) before use');
 const st=fs.lstatSync(folder);
 if(st.isSymbolicLink()||!st.isDirectory()||(st.mode&0o077)!==0)
  nope('Private registry parent must be an actual directory with owner-only permissions (0700)');
 const real=fs.realpathSync(folder);
 if(real===repoRoot||real.startsWith(repoRoot+path.sep))
  nope('Private registry directory resolves into the public repository');
 if(fs.existsSync(resolved)){
  const fileSt=fs.lstatSync(resolved);
  if(!fileSt.isFile()||fileSt.isSymbolicLink()||(fileSt.mode&0o077)!==0)
    nope('Private registry must be an owner-only regular file (0600)');
 }
 return resolved;
}
function load(file){
 const dest=target(file);
 if(!fs.existsSync(dest))return initial();
 const src=fs.readFileSync(dest,'utf8');
 return validateState(JSON.parse(src));
}
function atomicWrite(file,value,options={}){
 const dest=target(file),dir=path.dirname(dest);
 const tmp=path.join(dir,'.avengers-dispatch-'+crypto.randomBytes(12).toString('hex')+'.tmp');
 let fd=null;
 try{
  fd=fs.openSync(tmp,'wx',0o600);
  const bytes=Buffer.from(JSON.stringify(validateState(value),null,2)+'\n','utf8');
  fs.writeSync(fd,bytes,0,bytes.length,0);
  fs.fsyncSync(fd);fs.closeSync(fd);fd=null;
  if(options.simulateCrashBeforeRename)throw Error('SIMULATED CRASH BEFORE DURABLE RENAME');
  fs.renameSync(tmp,dest);
  const dfd=fs.openSync(dir,'r');
  try{fs.fsyncSync(dfd);}finally{fs.closeSync(dfd);}
 }finally{
  if(fd!==null)fs.closeSync(fd);
  try{fs.unlinkSync(tmp);}catch(e){if(e.code!=='ENOENT')throw e;}
 }
}
function transact(file,mutator,options={}){
 const dest=target(file),lock=dest+'.lock';
 let lockFd;
 try{lockFd=fs.openSync(lock,'wx',0o600);}catch(e){
  if(e.code==='EEXIST')nope('Private registry LOCKED. Manually investigate before removing stale lock; NEVER auto-retry.');
  throw e;
 }
 try{
  const state=load(dest),result=mutator(structuredClone(state));
  if(!result||typeof result!=='object'||!result.state)nope('Invalid registry transition');
  if(result.changed){
   validateState(result.state);
   atomicWrite(dest,result.state,options);
  }
  return {decision:result.decision,changed:!!result.changed,state:load(dest)};
 }finally{
  fs.closeSync(lockFd);
  fs.unlinkSync(lock);
 }
}
module.exports={target,load,atomicWrite,transact};
