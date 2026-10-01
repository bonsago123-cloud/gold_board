import test from 'node:test';import assert from 'node:assert/strict';
import {rheniumQuote,rheniumHistory} from '../server/rhenium.mjs';import handler from '../api/rhenium.mjs';
test('Rhenium converts USD-base inverse rates, preserves timestamp and rejects invalid rates',()=>{
 const data={success:true,base:'USD',timestamp:1790812800,rates:{RHENIUM:.01}};
 assert.equal(rheniumQuote(data,'2026-10-01T00:00:00Z').value,100);
 assert.throws(()=>rheniumQuote({...data,rates:{RHENIUM:0}}));assert.throws(()=>rheniumQuote({...data,base:'EUR'}));
 assert.deepEqual(rheniumHistory({success:true,base:'USD',rates:{'2026-09-30':{RHENIUM:.02}}}),[{date:'2026-09-30',value:50}]);
});
test('Missing rhenium key is honest; upstream errors never expose secret or URL',async()=>{
 const key=process.env.METALS_API_KEY,original=globalThis.fetch;
 const res={setHeader(){},status(n){this.code=n;return this;},json(data){this.body=data;return this;}};
 try{delete process.env.METALS_API_KEY;await handler({method:'GET',url:'/api/rhenium'},res);assert.equal(res.body.error,'setup_required');
 process.env.METALS_API_KEY='synthetic-secret';globalThis.fetch=async()=>{throw new Error('https://example.test?access_key=synthetic-secret');};await handler({method:'GET',url:'/api/rhenium'},res);assert.ok(!JSON.stringify(res.body).includes('synthetic-secret'));}
 finally{globalThis.fetch=original;if(key===undefined)delete process.env.METALS_API_KEY;else process.env.METALS_API_KEY=key;}
});
