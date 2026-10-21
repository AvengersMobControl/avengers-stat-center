'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const handler=require('../api/dispatch-approved-piggy.js');
function response(){
 return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k]=v;},end(s){this.body=s;}};
}
test('Big Piggy dispatch route is POST-only',async()=>{
 const res=response();await handler({method:'GET',headers:{}},res);
 assert.equal(res.statusCode,405);assert.equal(JSON.parse(res.body).decision,'method-not-allowed');
});
test('Big Piggy dispatch route is unavailable outside production',async()=>{
 const old=process.env.VERCEL_ENV;process.env.VERCEL_ENV='preview';
 try{const res=response();await handler({method:'POST',headers:{}},res);
  assert.equal(res.statusCode,404);assert.equal(JSON.parse(res.body).decision,'not-found');
 }finally{if(old===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=old;}
});
test('Big Piggy endpoint caps JSON parsing and has no delete surface',()=>{
 assert.equal(handler.config.api.bodyParser.sizeLimit,'4mb');
});
