import test from 'node:test';
import assert from 'node:assert/strict';
import {createCopperClient} from '../public/copper-client.mjs';
import {fetchCopperQuote} from '../public/copper-core.mjs';
const good=()=>({ok:true,status:200,json:async()=>({id:'copper',symbol:'CU',price:9876.5,unit:'USD/t'})});
const limited=header=>({ok:false,status:429,headers:{get:()=>header}});

test('Retry-After seconds: blocks before boundary, recovers at boundary',async()=>{
  let clock=Date.parse('2026-10-12T05:00:00Z'),calls=0;
  const client=createCopperClient(()=>{},{now:()=>new Date(clock).toISOString(),fetcher:async()=>++calls===2?limited('120'):good()});
  await client.request();
  await client.request();
  assert.equal(client.view().status,'stale');
  assert.equal(client.view().due,clock+120000);
  clock+=119999;
  assert.equal(await client.request(),false);
  assert.equal(calls,2);
  clock++;
  assert.equal(await client.request(),true);
  assert.equal(calls,3);
  assert.equal(client.view().status,'fresh');
  assert.equal(client.view().error_code,'none');
  assert.equal(client.view().due,0);
});

test('Retry-After HTTP date and missing/invalid fallback',async()=>{
  const now=()=> '2026-10-12T05:00:00Z';
  for(const [header,delay] of [['Mon, 12 Oct 2026 05:02:00 GMT',120000],[null,30000],['invalid',30000]]){
    await assert.rejects(fetchCopperQuote({now,fetcher:async()=>limited(header)}),e=>e.code==='rate_limited'&&e.retryAfterMs===delay);
  }
});

test('timeout aborts stalled request and stalled response body',async()=>{
  for(const body of [false,true]){
    let signal;
    const fetcher=async(url,init)=>{
      signal=init.signal;
      const stalled=()=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true}));
      return body?{ok:true,status:200,json:stalled}:stalled();
    };
    await assert.rejects(fetchCopperQuote({fetcher,timeoutMs:10}),e=>e.code==='timeout');
    assert.equal(signal.aborted,true);
  }
});

test('concurrent clicks send one request; first failure leaves no fabricated price',async()=>{
  let reject,calls=0;
  const client=createCopperClient(()=>{},{fetcher:()=>{calls++;return new Promise((r,j)=>{reject=j;});}});
  const pending=client.request();
  assert.equal(await client.request(),false);
  reject(new TypeError('offline'));
  await pending;
  assert.equal(calls,1);
  assert.equal(client.view().last_good,null);
  assert.equal(client.view().status,'error');
  assert.equal(client.view().error_code,'offline');
  assert.equal(await client.request(),false);
});

test('malformed JSON and interrupted body have distinct errors',async()=>{
  for(const [error,code] of [[new SyntaxError('JSON'),'schema_changed'],[new TypeError('disconnected'),'offline']]){
    await assert.rejects(fetchCopperQuote({fetcher:async()=>({ok:true,status:200,json:async()=>{throw error;}})}),e=>e.code===code);
  }
});
