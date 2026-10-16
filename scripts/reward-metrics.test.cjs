const {test}=require('node:test'),assert=require('node:assert/strict');
const {efficiency,reconcile}=require('../event-reward-metrics.js');
test('Space matches workbook Sparks / Years * 1e9; lines use their native unit',()=>{
 assert.equal(efficiency(199353,225.8),199353/(225.8e9)*1e9);
 assert.equal(efficiency(1000,500),2);
 assert.equal(efficiency(0,500),0);
 for(const args of [[null,5],[5,null],[5,0],[5,-1],[5,NaN]])assert.equal(efficiency(...args),null);
});
test('derive only missing stars; retain conflicting observed values and audit the delta',()=>{
 assert.deepEqual(reconcile({sparks:415318}),{sparks:415318,stars:4153180,starsDerived:true,ratioDelta:null});
 assert.deepEqual(reconcile({sparks:66451,stars:664207}),{sparks:66451,stars:664207,starsDerived:false,ratioDelta:-303});
 assert.equal(reconcile({}).stars,null);
});
