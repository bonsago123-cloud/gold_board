import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,kstDate,normalize,fetchQuote,comparison,withAge} from '../public/core.mjs';
import {replay} from '../public/fixtures.mjs';
test('KST midnight changes at UTC 15:00, not UTC midnight',()=>{
  assert.equal(kstDate('2026-09-29T14:59:59Z'),'2026-09-29');
  assert.equal(kstDate('2026-09-29T15:00:00Z'),'2026-09-30');
});
test('Same day three successes stay one row, new date adds exactly one',async()=>{
  let s=await replay(emptyState(),'LOCAL-D1-A');s=await replay(s,'LOCAL-D1-B');s=await replay(s,'LOCAL-D1-B');
  assert.equal(s.daily.length,1);assert.equal(s.daily[0].value,3010);
  s=await replay(s,'LOCAL-RECOVER-D2');s=await replay(s,'LOCAL-RECOVER-D2');
  assert.equal(s.daily.length,2);assert.equal(comparison(s.daily).delta,30);
  assert.ok(comparison(s.daily).consecutive);
});
for(const [id,code] of [['LOCAL-SLOW','timeout'],['LOCAL-DENIED','access_denied'],['LOCAL-LIMIT','rate_limited'],['LOCAL-OFFLINE','offline'],['LOCAL-SCHEMA','schema_changed']]){
  test(`${id}: exact failure, last good retained, no failed day, recovery clears error`,async()=>{
    let s=await replay(emptyState(),'LOCAL-D1-A');s=await replay(s,'LOCAL-D1-B');
    const previous=structuredClone(s);s=await replay(s,id);
    assert.equal(s.status,'stale');assert.equal(s.error_code,code);
    assert.deepEqual(s.last_good,previous.last_good);assert.deepEqual(s.daily,previous.daily);
    s=await replay(s,'LOCAL-RECOVER-D2');assert.equal(s.status,'fresh');assert.equal(s.error_code,'none');assert.equal(s.daily.length,2);
    const firstFailure=await replay(emptyState(),id);assert.equal(firstFailure.status,'error');assert.equal(firstFailure.last_good,null);
  });
}
test('HTTP 401 and 403 share explicit rejection, 429 uses Retry-After',async()=>{
  for(const status of [401,403]) await assert.rejects(fetchQuote({fetcher:async()=>new Response('{}',{status})}),e=>e.code==='access_denied');
  await assert.rejects(fetchQuote({fetcher:async()=>new Response('{}',{status:429,headers:{'Retry-After':'120'}})}),e=>e.code==='rate_limited'&&e.retryAfter===120);
});
test('Broken JSON, wrong currency, string price and future source time rejected',async()=>{
  await assert.rejects(fetchQuote({fetcher:async()=>new Response('<html>no</html>')}),e=>e.code==='schema_changed');
  const raw={symbol:'XAU',currency:'USD',price:4124.100098,updatedAt:'2026-09-29T00:00:00Z'};
  for(const change of [{price:'4000'},{currency:'EUR'},{symbol:'XAG'},{updatedAt:'not a time'},{updatedAt:'2030-01-01T00:00:00Z'}]){
    assert.throws(()=>normalize({...raw,...change},'2026-09-29T00:00:10Z'),e=>e.code==='schema_changed');
  }
  const row=normalize(raw,'2026-09-29T00:00:10Z');assert.equal(row.value,row.raw.price);assert.equal(row.source_at,row.raw.updatedAt);assert.equal(row.synthetic,false);
});
test('Stale source is honestly labeled even after a successful fetch',async()=>{
  const s=await replay(emptyState(),'LOCAL-D1-A');const stale=withAge(s,Date.parse('2026-01-01T01:20:00Z'));
  assert.equal(stale.status,'stale');assert.equal(stale.error_code,'source_stale');assert.deepEqual(stale.last_good,s.last_good);
});
test('Nonconsecutive records are not called yesterday',async()=>{
  let s=await replay(emptyState(),'LOCAL-D1-A');s=await replay(s,'LOCAL-RECOVER-D2');
  s.daily[1].date_kst='2026-01-04';assert.equal(comparison(s.daily).consecutive,false);
});
