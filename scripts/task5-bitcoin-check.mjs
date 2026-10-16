// Frozen before implementation. Synthetic tests; NEVER evidence of live success.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const contract=JSON.parse(await readFile('docs/task5/bitcoin/fixed-tests.json','utf8'));
const t0='2026-10-14T00:00:00Z', t1='2026-10-14T00:00:01Z';
const good={symbol:'BTC',currency:'USD',price:65000,updatedAt:t0};
let core,client,loadError;
try{core=await import('../public/bitcoin-core.mjs');client=await import('../public/bitcoin-client.mjs');}catch(e){loadError=e;}
const response=(raw=good)=>new Response(JSON.stringify(raw));
const code=c=>e=>e.code===c;
function scenario(sequence){let ms=Date.parse(t1),calls=0;const now=()=>new Date(ms).toISOString();const c=client.createBitcoinClient(()=>{},{now,fetcher:async()=>{calls++;const x=sequence.shift();if(x instanceof Error)throw x;return response(x);}});return {c,advance:n=>{ms+=n;},calls:()=>calls};}
const tests=[
()=>assert.deepEqual(core.normalizeBitcoin(good,t1),{symbol:'BTC',value:65000,unit:'USD/BTC',source_url:'https://api.gold-api.com/price/BTC',source_at:t0,fetched_at:t1,timezone:'Asia/Seoul'}),
()=>{for(const raw of [null,[],...[0,-1,'65000',NaN,Infinity].map(price=>({...good,price})),{...good,symbol:'XAU'},{...good,currency:'KRW'},{...good,updatedAt:'bad'}])assert.throws(()=>core.normalizeBitcoin(raw,t1),code('schema_changed'));assert.throws(()=>core.normalizeBitcoin(good,'bad'),code('schema_changed'));},
async()=>{let called=false;const q=await core.fetchBitcoinQuote({now:()=>t1,fetcher:async(url,options)=>{called=true;assert.equal(url,'https://api.gold-api.com/price/BTC');assert.equal(options.method,'GET');assert.ok(options.signal instanceof AbortSignal);assert.equal(new Headers(options.headers).get('authorization'),null);assert.equal(new Headers(options.headers).get('x-api-key'),null);return response();}});assert.ok(called);assert.equal(q.value,65000);},
async()=>assert.rejects(core.fetchBitcoinQuote({fetcher:async()=>new Response('',{status:429,headers:{'Retry-After':'60'}})}),e=>e.code==='rate_limited'&&e.retryAfterMs===60000),
async()=>assert.rejects(core.fetchBitcoinQuote({timeoutMs:5,fetcher:async(url,{signal})=>new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true});})}),code('timeout')),
async()=>{for(const [fetcher,c] of [[async()=>{throw new TypeError('network');},'offline'],[async()=>new Response('<html>bad</html>'),'schema_changed'],[async()=>new Response('',{status:500}),'server_error']])await assert.rejects(core.fetchBitcoinQuote({fetcher}),code(c));},
async()=>{const s=scenario([new TypeError('network')]);await s.c.request();const v=s.c.view();assert.equal(v.last_good,null);assert.equal(v.status,'error');assert.equal(v.error_code,'offline');},
async()=>{const s=scenario([good,new TypeError('network')]);await s.c.request();const before=s.c.view().last_good;assert.equal(before.value,65000);s.advance(30000);await s.c.request();assert.deepEqual(s.c.view().last_good,before);assert.equal(s.c.view().status,'stale');assert.equal(s.c.view().error_code,'offline');},
async()=>{const s=scenario([good,new TypeError('network'),{...good,price:66000}]);await s.c.request();s.advance(30000);await s.c.request();s.advance(30000);await s.c.request();const v=s.c.view();assert.equal(v.status,'fresh');assert.equal(v.error_code,'none');assert.equal(v.last_good.value,66000);assert.equal(v.last_good.fetched_at,'2026-10-14T00:01:01.000Z');},
async()=>{const s=scenario([good,good]);await s.c.request();assert.equal(s.calls(),1);await s.c.request();assert.equal(s.calls(),1);s.advance(30000);await s.c.request();assert.equal(s.calls(),2);}
];
const rows=[];
for(let i=0;i<10;i++){let status='PASS',reason='';try{if(loadError)throw loadError;await tests[i]();}catch(e){status='FAIL';reason=e.message;}rows.push({...contract.tests[i],status,reason});console.log(`${status} ${contract.tests[i].id}`);if(reason)console.log(reason);}
await mkdir('test-output',{recursive:true});await writeFile('test-output/bitcoin-fixed.json',JSON.stringify({kind:'synthetic',at:new Date().toISOString(),rows},null,2)+'\n');
console.log(`RESULT ${rows.filter(x=>x.status==='PASS').length}/10`);process.exitCode=rows.every(x=>x.status==='PASS')?0:1;
