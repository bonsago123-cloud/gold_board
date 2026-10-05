import test from 'node:test';import assert from 'node:assert/strict';
import {fetchOutcomes} from '../server/bundle-sources.mjs';
import {recordMatches,SYMBOLS} from '../public/bundle-core.mjs';
import {runBundleChecks} from '../public/bundle-checks.mjs';
import {METALS} from '../public/metals.mjs';
test('only gold and silver remain; neither oil API nor secret required',async()=>{const urls=[],at=new Date().toISOString();const outcomes=await fetchOutcomes({now:()=>at,fetcher:async url=>{urls.push(url);return Response.json({symbol:url.split('/').at(-1),currency:'USD',price:100,updatedAt:at});}});assert.deepEqual(SYMBOLS,['XAU','XAG']);assert.deepEqual(Object.keys(METALS),SYMBOLS);assert.deepEqual(urls,['https://api.gold-api.com/price/XAU','https://api.gold-api.com/price/XAG']);assert.ok(outcomes.every(o=>o.error==='none'&&recordMatches(o.record)));});
test('silver failure does not discard gold success',async()=>{const at=new Date().toISOString();const r=await fetchOutcomes({now:()=>at,fetcher:async url=>url.endsWith('XAG')?new Response('',{status:429,headers:{'Retry-After':'120'}}):Response.json({symbol:'XAU',currency:'USD',price:4000,updatedAt:at})});assert.equal(r[0].error,'none');assert.equal(r[1].error,'rate_limited');assert.equal(r[1].wait,120);});
test('metal synthetic checks preserve values and recover',()=>assert.ok(runBundleChecks().results.every(r=>r.passed)));
