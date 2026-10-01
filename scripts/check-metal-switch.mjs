import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';import {emptyState,normalize,success} from '../public/core.mjs';
const {JSDOM}=await import(pathToFileURL(process.argv[2]));const dom=new JSDOM(await readFile('public/index.html','utf8'),{url:'https://example.test',pretendToBeVisual:true});Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,MutationObserver:dom.window.MutationObserver});
const now=new Date().toISOString(),gold=success(emptyState(),normalize({symbol:'XAU',currency:'USD',price:4000,updatedAt:now},now));gold.evidence=gold.daily;
let resolveSilver;const calls=[];globalThis.fetch=async url=>{calls.push(url);if(url==='/api/board')return Response.json(gold);return new Promise(resolve=>{resolveSilver=resolve;});};let tick;globalThis.setInterval=fn=>{tick=fn;return 0;};let clock=Date.now();Date.now=()=>clock;
const flush=()=>new Promise(r=>setImmediate(r)), $=id=>document.getElementById(id),select=s=>document.querySelector(`[data-symbol="${s}"]`).click();
await import('../public/dashboard.mjs');await flush();assert.equal(document.querySelector('#proof'),null);assert.equal(document.querySelector('[data-symbol="XPT"]'),null);
select('XAG');select('XAU');resolveSilver(Response.json({quote:{symbol:'XAG',value:60,source_at:now,fetched_at:now}}));await flush();assert.equal($('price').textContent,'4,000.00');select('XAG');assert.equal($('price').textContent,'60.00');
for(const [symbol,chart] of [['WTI','OANDA:WTICOUSD'],['WHEAT','OANDA:WHEATUSD']]){select(symbol);assert.equal($('dashboard').hidden,true);assert.equal($('futures-panel').hidden,false);assert.equal(JSON.parse($('futures-quote').querySelector('script').textContent).symbol,chart);assert.equal(JSON.parse($('chart-host').querySelector('script').textContent).symbol,chart);}
assert.ok(!calls.some(u=>/symbol=(WTI|WHEAT)/.test(u)));
assert.equal(document.querySelector('[data-symbol="RHENIUM"]'),null);
assert.equal(document.querySelectorAll('#asset-tabs button').length,4);
// A manual refresh replaces both widgets; an immediate repeat is throttled.
let quote=$('futures-quote').firstChild,chart=$('chart-host').firstChild;
clock+=31000;tick(); // automatic refresh
assert.notEqual($('futures-quote').firstChild,quote);assert.notEqual($('chart-host').firstChild,chart);
$('auto-refresh').checked=false;$('auto-refresh').dispatchEvent(new dom.window.Event('change'));
quote=$('futures-quote').firstChild;chart=$('chart-host').firstChild;clock+=31000;tick();
assert.equal($('futures-quote').firstChild,quote);assert.equal($('refresh').disabled,false);
$('refresh').click();assert.notEqual($('futures-quote').firstChild,quote);assert.notEqual($('chart-host').firstChild,chart);
quote=$('futures-quote').firstChild;$('refresh').click();assert.equal($('futures-quote').firstChild,quote);
$('chart-interval').value='D';quote=$('futures-quote').firstChild;$('chart-interval').dispatchEvent(new dom.window.Event('change'));
assert.equal($('futures-quote').firstChild,quote);assert.equal(JSON.parse($('chart-host').querySelector('script').textContent).interval,'D');
$('chart-reload').click();assert.notEqual($('futures-quote').firstChild,quote);
assert.equal(JSON.parse($('chart-host').querySelector('script').textContent).interval,'D');
$('auto-refresh').checked=true;$('auto-refresh').dispatchEvent(new dom.window.Event('change'));
quote=$('futures-quote').firstChild;Object.defineProperty(document,'hidden',{configurable:true,value:true});clock+=31000;tick();assert.equal($('futures-quote').firstChild,quote);
Object.defineProperty(document,'hidden',{configurable:true,value:false});tick();assert.notEqual($('futures-quote').firstChild,quote);
assert.match($('auto-status').textContent,/가격 기준 시각 아님/);
select('XAU');assert.equal($('dashboard').hidden,false);assert.equal($('chart-interval').disabled,false);assert.equal($('gold-records').hidden,false);assert.equal($('price').textContent,'4,000.00');
window.dispatchEvent(new dom.window.Event('pagehide'));dom.window.close();console.log('PASS: four tabs; manual/auto refresh both widgets; cooldown, auto-off, hidden-tab pause, interval preservation; gold preserved.');
