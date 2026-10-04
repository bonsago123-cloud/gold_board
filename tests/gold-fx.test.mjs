import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeFx,toWon} from '../public/fx.mjs';
import {goldEvidence} from '../public/gold-client.mjs';
import {runGoldChecks} from '../public/gold-checks.mjs';
const now=Date.parse('2026-10-04T10:00:00Z');
const raw={result:'success',base_code:'USD',rates:{KRW:1350.25},time_last_update_unix:now/1000-100,time_next_update_unix:now/1000+86400};
test('USD to KRW multiplies the unrounded original and keeps unit quantity unchanged',()=>{const q=normalizeFx(raw,now);assert.equal(toWon(100,q),135025);assert.equal(toWon(undefined,q),null);assert.equal(toWon(100,null),null);assert.equal(toWon(Infinity,q),null);for(const delta of [{base_code:'KRW'},{rates:{KRW:0}},{rates:{KRW:'1350'}},{time_last_update_unix:now/1000+600},{time_next_update_unix:0}])assert.throws(()=>normalizeFx({...raw,...delta},now));});
test('gold evidence uses server earliest dates, independent of other assets and recent 90 days',()=>{const a={symbol:'XAU',synthetic:false,date_kst:'2026-01-01'},b={...a,date_kst:'2026-01-02'};const e=goldEvidence({daily:[{...a,date_kst:'2026-10-01'}],evidence:[a,b]});assert.equal(e.length,2);assert.equal(e[0].date_kst,'2026-01-01');assert.equal(goldEvidence({daily:[{...a,synthetic:true}]}).length,0);});
test('gold failure suite uses the gold fetch pipeline and preserves daily records',async()=>{const r=await runGoldChecks();assert.equal(r.results.length,5);assert.ok(r.results.every(r=>r.passed));});
