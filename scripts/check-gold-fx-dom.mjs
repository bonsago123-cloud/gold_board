import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';
import {normalize,emptyState,success} from '../public/core.mjs';import {blankBundle,normalizeRecord} from '../public/bundle-core.mjs';
const {JSDOM}=await import(pathToFileURL(process.argv[2]));const flush=()=>new Promise(r=>setTimeout(r,20));const at=new Date().toISOString(),prior=new Date(Date.now()-86400000).toISOString();
const quote=(value,t)=>normalize({symbol:'XAU',currency:'USD',price:value,updatedAt:t},t);
const gold=success(success(emptyState(),quote(3900,prior)),quote(4000,at));gold.evidence=gold.daily;
const bundle=blankBundle(),silver=normalizeRecord({symbol:'XAG',currency:'USD',price:50,updatedAt:at},'XAG',at);bundle.assets.XAG=success(emptyState(),silver);
for(const s of ['WTI','WHEAT'])bundle.assets[s]={...emptyState(),status:'error',error_code:'source_setup_required'};
const calls=[];let fxFailure=false,goldFailure=false;
globalThis.fetch=async(url,opts={})=>{calls.push([url,opts.method]);if(url==='/api/board'){if(goldFailure)throw Error('offline');return Response.json(gold);}if(url==='/api/bundle')return Response.json(bundle);if(url.startsWith('https://open.er-api.com')){if(fxFailure)throw Error('offline');return Response.json({result:'success',base_code:'USD',rates:{KRW:1350},time_last_update_unix:Math.floor(Date.now()/1000)-100,time_next_update_unix:Math.floor(Date.now()/1000)+86400});}throw Error(url);};
let tick;globalThis.setInterval=fn=>(tick=fn,0);
async function dom(file){const d=new JSDOM(await readFile('public/'+file,'utf8'),{url:'https://example.test/'+file,pretendToBeVisual:true});Object.assign(globalThis,{window:d.window,location:d.window.location,document:d.window.document,localStorage:d.window.localStorage,MutationObserver:d.window.MutationObserver});return d;}
let d=await dom('index.html');let $=id=>document.getElementById(id);
await import('../public/dashboard.mjs');await flush();assert.equal($('price').textContent,'4,000.00');assert.equal($('price-krw').textContent,'5,400,000');assert.ok(!calls.some(c=>c[0]==='/api/bundle'));
$('refresh').click();await flush();assert.ok(calls.some(c=>c[0]==='/api/board'&&c[1]==='POST'));
document.querySelector('[data-symbol="XAG"]').click();await flush();assert.equal($('price-krw').textContent,'67,500');document.querySelector('[data-symbol="WTI"]').click();await flush();assert.equal($('price-krw').textContent,'—');assert.match($('fx-price-note').textContent,/달러 원천값이 없어/);
window.dispatchEvent(new d.window.Event('pagehide'));d.window.close();
d=await dom('verify.html');calls.length=0;await import('../public/verify.mjs');await flush();assert.deepEqual(calls,[['/api/board','GET']]);assert.equal($('bundle-rows').children.length,1);assert.equal($('bundle-evidence').children.length,2);assert.match($('bundle-deltas').textContent,/100.000000/);
$('bundle-collect').click();await flush();assert.deepEqual(calls.at(-1),['/api/board','POST']);await $('bundle-suite').onclick();assert.match($('bundle-suite-status').textContent,/5\/5/);
goldFailure=true;$('bundle-read').click();await flush();assert.equal($('bundle-export').disabled,true);assert.match($('bundle-rows').textContent,/4,000.00/);assert.match($('bundle-rows').textContent,/stale/);
window.dispatchEvent(new d.window.Event('pagehide'));d.window.close();
// FX failures preserve last value or remain unavailable; mock time also verifies stale cache.
d=await dom('index.html');const {createFxClient}=await import('../public/fx.mjs');localStorage.setItem('usd-krw-v1',JSON.stringify({rate:1300,source_at:prior,next_at:prior,fetched_at:prior}));fxFailure=true;let result;let fx=createFxClient(v=>result=v);await fx.request();assert.equal(result.quote.rate,1300);assert.equal(result.stale,true);localStorage.removeItem('usd-krw-v1');fx=createFxClient(v=>result=v);await fx.request();assert.equal(result.quote,null);assert.equal(result.stale,true);d.window.close();
console.log('PASS DOM: gold-only collection/evidence, USD and KRW, tab switching, missing numeric prices, five failures, offline preservation/export guard, FX stale and unavailable handling.');
