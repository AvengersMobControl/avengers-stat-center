#!/usr/bin/env node
'use strict';
// Computes a SHA-256 ONLY of bytes explicitly attested to be the ORIGINAL
// authorized Discord attachment. Not a networking client; transformed image
// previews, thumbnail blobs, and screenshot transcriptions are never accepted
// as proof of source-image integrity.
const fs=require('node:fs'),crypto=require('node:crypto');
function signature(buf){
  if(buf.length>=8&&buf.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return 'image/png';
  if(buf.length>=3&&buf[0]===0xff&&buf[1]===0xd8&&buf[2]===0xff)return 'image/jpeg';
  if(buf.length>=12&&buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP')return 'image/webp';
  if(buf.length>=6&&['GIF87a','GIF89a'].includes(buf.toString('ascii',0,6)))return 'image/gif';
  return null;
}
function hashOriginalImage(data,{originalBytesAttested=false,expectedContentType}={}){
  if(originalBytesAttested!==true)throw Error('Original Discord attachment bytes must be explicitly attested; a preview is not enough');
  if(!Buffer.isBuffer(data)||data.length<8||data.length>25*1024*1024)
    throw Error('Original attachment must be nonempty image bytes (max 25 MiB)');
  const mime=signature(data);
  if(!mime)throw Error('Invalid image file signature');
  if(!expectedContentType||expectedContentType!==mime)
    throw Error('Original attachment content type and image signature must agree');
  return {sha256:crypto.createHash('sha256').update(data).digest('hex'),
    byteLength:data.length,contentType:mime,
    provenance:'original-attachment-bytes-attested',
    limitation:'Attestation is a reviewer assertion; independently authenticate attachment download to its Discord source.'};
}
module.exports={hashOriginalImage,signature};
if(require.main===module){
  try{
    const args=process.argv.slice(2),file=args[0],attested=args.includes('--attest-original');
    const type=args.find(a=>a.startsWith('--content-type='))?.slice('--content-type='.length);
    if(!file||args.length!==3||!attested||!type||!type.startsWith('image/'))
      throw Error('Usage: node scripts/hash-original-image.cjs source-image.jpg --content-type=image/jpeg --attest-original');
    const bytes=fs.readFileSync(file);
    console.log(JSON.stringify(hashOriginalImage(bytes,{originalBytesAttested:true,expectedContentType:type}),null,2));
  }catch(err){console.error(err.message);process.exitCode=1;}
}
