import test from 'node:test';
import assert from 'node:assert/strict';
import board from '../api/board.mjs';
import cron from '../api/cron.mjs';
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;}};}
test('Missing DB configuration is not fake success or a fake price',async()=>{
  const old=process.env.SUPABASE_URL;delete process.env.SUPABASE_URL;
  try{const res=response();await board({method:'GET',headers:{}},res);assert.equal(res.code,503);assert.equal(res.data.error_code,'setup_required');assert.equal(res.data.last_good,null);assert.deepEqual(res.data.daily,[]);}
  finally{if(old)process.env.SUPABASE_URL=old;}
});
test('Untrusted cross-site refresh is rejected',async()=>{
  const res=response();await board({method:'POST',headers:{'sec-fetch-site':'cross-site'}},res);assert.equal(res.code,403);
});
test('Cron without secret cannot collect or expose anything',async()=>{
  const res=response();await cron({method:'GET',headers:{}},res);assert.equal(res.code,401);assert.deepEqual(res.data,{error:'unauthorized'});
});
test('Client cannot choose a method that deletes records',async()=>{
  const res=response();await board({method:'DELETE',headers:{}},res);assert.equal(res.code,405);
});
