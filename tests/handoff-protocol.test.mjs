import test from 'node:test';
import assert from 'node:assert/strict';
import {decide,isFresh,REQUIRED_GATES,inspectLive,fixedResult} from '../scripts/handoff-core.mjs';
import {normalizeCopper} from '../public/copper-core.mjs';
const all=()=>REQUIRED_GATES.map(id=>({id,status:'PASS'}));
test('Every required gate must pass; mocks alone never complete',()=>{
 assert.equal(decide(all()).phase,'COMPLETE');
 for(const id of REQUIRED_GATES)for(const status of ['FAIL','UNVERIFIED','NOT_RUN']){
  const gates=all();gates.find(g=>g.id===id).status=status;
  assert.equal(decide(gates).phase,'BLOCKED');assert.ok(decide(gates).blockers.includes(id));
 }
 assert.equal(decide([{id:'fixed_tests',status:'PASS'}]).phase,'BLOCKED');
 assert.equal(decide([]).phase,'BLOCKED');
});
test('Different source, stale/future time and unfinished evidence are rejected',()=>{
 const now=Date.parse('2026-10-13T06:00:00Z');
 const r={source_digest:'abc',finished_at:new Date(now).toISOString()};
 assert.equal(isFresh(r,'abc',now),true);
 assert.equal(isFresh(r,'changed',now),false);
 assert.equal(isFresh(r,'abc',now+3600001),false);
 assert.equal(isFresh(r,'abc',now-1),false);
 assert.equal(isFresh({...r,finished_at:null},'abc',now),false);
});
test('Fixed result must contain all ten unique PASS IDs and no FAIL',()=>{
 const ids=Array.from({length:10},(_,i)=>`T05-CU${String(i+1).padStart(2,'0')}`);
 const output=ids.map(id=>'PASS '+id).join('\n')+'\nRESULT 10/10\n';
 assert.equal(fixedResult(output,ids),true);
 assert.equal(fixedResult(output.replace('T05-CU10','T05-CU01'),ids),false);
 assert.equal(fixedResult(output+'FAIL T05-CU10\n',ids),false);
});
const endpoint='https://example.test/copper',origin='https://example.test';
const inspect=fetcher=>inspectLive({fetcher,endpoint,origin,normalize:normalizeCopper});
test('HTTP 404 blocks completion even with all simulated checks PASS',async()=>{
 const live=await inspect(async()=>new Response('Not found',{status:404}));
 assert.equal(live.http_status,404);assert.equal(live.status,'FAIL');
 const gates=all();Object.assign(gates.find(g=>g.id==='live_api'),live);
 assert.equal(decide(gates).phase,'BLOCKED');
});
test('Network denial is UNVERIFIED rather than HTTP 404 or PASS',async()=>{
 const live=await inspect(async()=>{throw new TypeError('network');});
 assert.equal(live.status,'UNVERIFIED');assert.equal(live.http_status,undefined);
});
test('Real check rejects HTML, invalid schema and missing CORS',async()=>{
 const good={id:'copper',symbol:'CU',price:9876.5,unit:'USD/t'};
 for(const [body,headers] of [['<html>no</html>',{}],[JSON.stringify({...good,price:0}),{}],[JSON.stringify(good),{}]]){
  assert.equal((await inspect(async()=>new Response(body,{headers}))).status,'FAIL');
 }
 assert.equal((await inspect(async()=>new Response(JSON.stringify(good),{headers:{'Access-Control-Allow-Origin':'*'}}))).status,'PASS');
});
