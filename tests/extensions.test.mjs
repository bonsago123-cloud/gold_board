import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {CHART_INTERVALS,chartConfig,NEWS_CONFIG} from '../public/market.mjs';
import {canPoll,nextPollTime} from '../public/poll-policy.mjs';
import {OFFICIAL_FILES,officialSuite} from '../public/official-checks.mjs';
const root=new URL('../public/assets/studio-task-assets/t04-real-information-board/',import.meta.url);
test('Chart changes real data interval and keeps XAUUSD/KST for every option',()=>{
  for(const interval of Object.keys(CHART_INTERVALS)){const config=chartConfig(interval);assert.equal(config.interval,interval);assert.equal(config.symbol,'OANDA:XAUUSD');assert.equal(config.timezone,'Asia/Seoul');assert.equal(config.allow_symbol_change,false);}
  assert.throws(()=>chartConfig('bad'));assert.equal(NEWS_CONFIG.feedMode,'symbol');assert.equal(NEWS_CONFIG.symbol,'OANDA:XAUUSD');
});
test('Polling obeys 30 seconds, upstream Retry-After and failure backoff',()=>{
  const now=Date.now();assert.equal(nextPollTime(now,null,0),now+30000);
  assert.equal(nextPollTime(now,new Date(now+120000).toISOString(),0),now+120000);
  assert.equal(nextPollTime(now,null,8),now+300000);
  const base={enabled:true,hidden:false,mode:'live',busy:false,now:100,due:99};assert.equal(canPoll(base),true);
  for(const update of [{enabled:false},{hidden:true},{mode:'lab'},{busy:true},{due:101}])assert.equal(canPoll({...base,...update}),false);
});
test('Official package ID and all 17 publisher manifest file hashes/lengths match',async()=>{
  const manifest=JSON.parse(await readFile(new URL('asset-manifest.json',root),'utf8'));
  assert.equal(manifest.package_id,'aleph-t04-real-information-board-public-contract-v2');assert.equal(manifest.files.length,17);
  for(const f of manifest.files){const b=await readFile(new URL(f.path,root));assert.equal(b.byteLength,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256,f.path);}
});
test('All original official fixtures: same-ID daily update, 5 failures, last good, recovery once',async()=>{
  const fixtures=await Promise.all(OFFICIAL_FILES.map(name=>readFile(new URL(`fixtures/${name}.json`,root),'utf8').then(JSON.parse)));
  const result=officialSuite(fixtures);assert.equal(result.results.length,6);assert.ok(result.results.every(r=>r.ok),JSON.stringify(result.results));
  assert.equal(result.state.daily_readings.length,2);assert.equal(result.state.current_reading.normalized_value,120);
  assert.deepEqual(result.state.status,{freshness:'fresh',error_code:'none'});assert.equal(result.state.last_delta,15);
});
