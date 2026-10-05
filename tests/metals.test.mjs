import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMetal} from '../public/metals.mjs';
import {chartConfig} from '../public/market.mjs';
import handler from '../api/metals.mjs';
test('Metal quotes keep symbol, unit and source; reject wrong symbol/currency and invalid values',()=>{
 const now='2026-10-01T00:00:00Z',raw={symbol:'XAG',currency:'USD',price:60,updatedAt:now};
 const q=normalizeMetal(raw,'XAG',now);assert.equal(q.symbol,'XAG');assert.equal(q.source_url,'https://api.gold-api.com/price/XAG');assert.equal(q.unit,'USD / 트로이온스');
 for(const delta of [{symbol:'XAU'},{currency:'KRW'},{price:-1},{price:'60'},{updatedAt:'2027-01-01T00:00:00Z'}])assert.throws(()=>normalizeMetal({...raw,...delta},'XAG',now));
 for(const symbol of ['XAU','XAG'])for(const interval of ['1','5','15','60','240','D','W','M'])assert.equal(chartConfig(interval,symbol).symbol,`OANDA:${symbol}USD`);
 assert.throws(()=>chartConfig('60','BAD'));assert.throws(()=>chartConfig('60','RHENIUM'));assert.throws(()=>chartConfig('D','WTI'));assert.throws(()=>chartConfig('D','WHEAT'));
});
test('Metal endpoint allowlists symbols, uses no DB/key, and preserves upstream rate limit',async()=>{
 const original=globalThis.fetch;let calls=0;
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(data){this.body=data;return this;}};
 try{
  globalThis.fetch=async url=>{calls++;assert.equal(url,'https://api.gold-api.com/price/XAG');return Response.json({symbol:'XAG',currency:'USD',price:60,updatedAt:new Date().toISOString()});};
  await handler({method:'GET',url:'/api/metals?symbol=https://bad.test'},res);assert.equal(res.code,400);assert.equal(calls,0);
  await handler({method:'GET',url:'/api/metals?symbol=XAG'},res);assert.equal(res.code,200);assert.equal(res.body.quote.symbol,'XAG');assert.equal(res.headers['Cache-Control'],'public, s-maxage=30');
  globalThis.fetch=async()=>new Response('',{status:429,headers:{'retry-after':'120'}});
  await handler({method:'GET',url:'/api/metals?symbol=XAG'},res);assert.equal(res.body.error,'rate_limited');assert.equal(res.body.retry_after,120);assert.equal(res.headers['Cache-Control'],'no-store');
 }finally{globalThis.fetch=original;}
});
