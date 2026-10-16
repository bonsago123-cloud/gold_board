import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchBitcoinQuote} from '../public/bitcoin-core.mjs';
import {createBitcoinClient} from '../public/bitcoin-client.mjs';
const good={symbol:'BTC',currency:'USD',price:65000,updatedAt:'2026-10-14T00:00:00Z'};
test('BTC deadline aborts a stalled body even when fetch ignores cancellation',async()=>{
 let signal;
 await assert.rejects(fetchBitcoinQuote({timeoutMs:5,fetcher:async(_,o)=>{signal=o.signal;return {ok:true,status:200,json:()=>new Promise(()=>{})};}}),e=>e.code==='timeout');
 assert.equal(signal.aborted,true);
});
test('BTC concurrent clicks share one request and views cannot mutate the saved quote',async()=>{
 let resolve,calls=0;const c=createBitcoinClient(()=>{},{fetcher:()=>{calls++;return new Promise(r=>resolve=r);}});
 const first=c.request();assert.equal(await c.request(),false);resolve(new Response(JSON.stringify(good)));assert.equal(await first,true);
 const copy=c.view();copy.last_good.value=1;assert.equal(c.view().last_good.value,65000);assert.equal(calls,1);
});
test('BTC Retry-After HTTP date sets the retry boundary after failure',async()=>{
 let ms=Date.parse('2026-10-14T00:00:00Z'),calls=0;
 const c=createBitcoinClient(()=>{},{now:()=>new Date(ms).toISOString(),fetcher:async()=>{calls++;return new Response('',{status:429,headers:{'Retry-After':'Wed, 14 Oct 2026 00:02:00 GMT'}});}});
 await c.request();assert.equal(c.view().due,ms+120000);ms+=119999;await c.request();assert.equal(calls,1);ms++;await c.request();assert.equal(calls,2);
});
