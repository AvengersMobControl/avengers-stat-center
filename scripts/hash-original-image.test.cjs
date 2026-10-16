'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {hashOriginalImage,signature}=require('./hash-original-image.cjs');
const jpeg=Buffer.from([0xff,0xd8,0xff,0xe0,0x00,0x10,0x4a,0x46,0x49,0x46,0x00,0x00]);
const png=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00,0x00,0x00,0x00]);
const webp=Buffer.from([0x52,0x49,0x46,0x46,0x00,0x00,0x00,0x00,0x57,0x45,0x42,0x50]);
test('original JPEG/Png source hashes are actual SHA-256 of attested bytes',()=>{
 for(const [bytes,type]of [[jpeg,'image/jpeg'],[png,'image/png'],[webp,'image/webp']]){
  const actual=hashOriginalImage(bytes,{originalBytesAttested:true,expectedContentType:type});
  assert.equal(actual.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
  assert.equal(actual.byteLength,bytes.length);
  assert.equal(actual.contentType,type);
  assert.equal(actual.provenance,'original-attachment-bytes-attested');
 }
});
test('a converted preview without explicit original-source attestation is never accepted',()=>{
 assert.throws(()=>hashOriginalImage(jpeg,{expectedContentType:'image/jpeg'}),/attested/);
 assert.throws(()=>hashOriginalImage(webp,{expectedContentType:'image/webp'}),/attested/);
 assert.throws(()=>hashOriginalImage(png,{originalBytesAttested:false,expectedContentType:'image/png'}),/attested/);
});
test('original content type must match magic bytes; image mimetype alone does not qualify',()=>{
 assert.throws(()=>hashOriginalImage(webp,{originalBytesAttested:true,expectedContentType:'image/jpeg'}),/content type/);
 assert.throws(()=>hashOriginalImage(jpeg,{originalBytesAttested:true}),/content type/);
 assert.throws(()=>hashOriginalImage(Buffer.from('not even an image'),{originalBytesAttested:true,expectedContentType:'image/jpeg'}),/signature/);
 assert.throws(()=>hashOriginalImage(Buffer.alloc(7),{originalBytesAttested:true,expectedContentType:'image/jpeg'}),/nonempty image bytes/);
 assert.throws(()=>hashOriginalImage(Buffer.alloc(25*1024*1024+1),{originalBytesAttested:true,expectedContentType:'image/jpeg'}),/25 MiB/);
 assert.equal(signature(Buffer.from('fake-image')),null);
});
