'use strict';
/** Deterministic, synthetic test PNG. Not an AVENGERS event-results graphic. */
const { deflateSync } = require('node:zlib');
const WIDTH = 600, HEIGHT = 180;
const SIG = Buffer.from('89504e470d0a1a0a','hex');
const glyphs = {
 T:['11111','00100','00100','00100','00100','00100','00100'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 S:['01111','10000','10000','01110','00001','00001','11110'],
 O:['01110','10001','10001','10001','10001','10001','01110'],
 N:['10001','11001','10101','10101','10011','10001','10001'],
 L:['10000','10000','10000','10000','10000','10000','11111'],
 Y:['10001','10001','01010','00100','00100','00100','00100']
};
const table=Array.from({length:256},(_,i)=>{
 let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;
});
function crc32(buf) {let x=0xffffffff;for(const b of buf)x=table[(x^b)&255]^(x>>>8);return (x^0xffffffff)>>>0;}
function chunk(name,payload){
 const t=Buffer.from(name,'ascii'),size=Buffer.alloc(4),crc=Buffer.alloc(4);
 size.writeUInt32BE(payload.length);crc.writeUInt32BE(crc32(Buffer.concat([t,payload])));
 return Buffer.concat([size,t,payload,crc]);
}
function image() {
 const b=Buffer.alloc(HEIGHT*(1+WIDTH*3));
 for(let y=0;y<HEIGHT;y++){
   const row=y*(1+WIDTH*3); b[row]=0;
   for(let x=0;x<WIDTH;x++){
     const p=row+1+x*3;
     const frame=x<9||x>=WIDTH-9||y<9||y>=HEIGHT-9;
     const bar=y>=113&&y<=123&&x>35&&x<WIDTH-35;
     const col=frame?[28,215,244]:bar?[207,72,237]:[12,23,49];
     b[p]=col[0];b[p+1]=col[1];b[p+2]=col[2];
   }
 }
 function writeText(str,left,top,scale,color){
   for(let i=0;i<str.length;i++){
    const g=glyphs[str[i]];if(!g)continue;
    for(let gy=0;gy<7;gy++)for(let gx=0;gx<5;gx++)if(g[gy][gx]==='1'){
      for(let sy=0;sy<scale;sy++)for(let sx=0;sx<scale;sx++){
        const x=left+i*6*scale+gx*scale+sx,y=top+gy*scale+sy;
        if(x<0||x>=WIDTH||y<0||y>=HEIGHT)continue;
        const pos=y*(1+WIDTH*3)+1+x*3;
        b[pos]=color[0];b[pos+1]=color[1];b[pos+2]=color[2];
      }
    }
   }
 }
 writeText('TEST ONLY',62,32,10,[250,250,255]);
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(WIDTH,0);ihdr.writeUInt32BE(HEIGHT,4);
 ihdr[8]=8;ihdr[9]=2; // 8-bit RGB
 return Buffer.concat([SIG,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(b,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
module.exports = {image, WIDTH, HEIGHT};
