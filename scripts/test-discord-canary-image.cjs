'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const zlib=require('node:zlib');
const {image,WIDTH,HEIGHT}=require('../server/discord-canary-image.cjs');

function chunks(data) {
 let pos=8,parts=[];
 while(pos<data.length){
   const len=data.readUInt32BE(pos),tag=data.toString('ascii',pos+4,pos+8);
   parts.push({len,tag,payload:data.subarray(pos+8,pos+8+len)});
   pos+=12+len;if(tag==='IEND')break;
 }
 assert.equal(pos,data.length);
 return parts;
}
test('synthetic canary is a valid deterministic PNG with expected dimensions',()=>{
 const a=image(),b=image();
 assert.deepEqual(a,b);
 assert.equal(a.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const pieces=chunks(a);assert.deepEqual(pieces.map(x=>x.tag),['IHDR','IDAT','IEND']);
 assert.equal(pieces[0].payload.readUInt32BE(0),WIDTH);
 assert.equal(pieces[0].payload.readUInt32BE(4),HEIGHT);
 assert.equal(pieces[0].payload[8],8);
 assert.equal(pieces[0].payload[9],2);
 const rows=zlib.inflateSync(pieces[1].payload);
 assert.equal(rows.length,HEIGHT*(1+WIDTH*3));
 const distinct=new Set();
 for(let i=0;i<rows.length;i++)if((i%(1+WIDTH*3))!==0)distinct.add(rows[i]);
 assert.ok(distinct.size>=5,'image is not a blank single-color pixel');
 assert.ok(a.length<1024*1024);
});
test('test-only image source does not require event data or original character imports',()=>{
 const script=require('../server/discord-canary-image.cjs');
 assert.equal(typeof script.image,'function');
 assert.equal(script.WIDTH,600);
 assert.equal(script.HEIGHT,180);
});
