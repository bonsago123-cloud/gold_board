// Corrected operational copy. Original frozen runner and its results remain unchanged.
// Synthetic provider only; not live-market or original assignment proof.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
const contract=JSON.parse(await readFile('docs/task5/bitcoin-chart/fixed-tests.json'));
const rows=[]; let browser,server,page,setupError,failed=false,configs=[],otherRequests=0;
try {
 const {chromium}=await import('playwright');
 server=http.createServer(async(req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p==='/')p='/index.html';const f=path.resolve('public','.'+p);if(!f.startsWith(path.resolve('public')+path.sep))throw Error();const data=await readFile(f);res.setHeader('content-type',p.endsWith('.mjs')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.json')?'application/json':'text/html');res.end(data);}catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({headless:true});page=await browser.newPage();page.setDefaultTimeout(2500);
 await page.exposeFunction('__recordChart',x=>configs.push(x));
 await page.route('**/*',async route=>{const u=route.request().url();if(u.includes('s3.tradingview.com/external-embedding/')){if(failed)return route.abort();return route.fulfill({contentType:'text/javascript',body:`(()=>{const s=document.currentScript;const c=JSON.parse(s.textContent);if(s.closest('#bitcoin-chart-host'))window.__recordChart(c);const f=document.createElement('iframe');f.title='fixture chart';f.src='about:blank';s.parentNode.append(f);})();`});}if(u.startsWith('http://127.0.0.1:')&&!u.includes('/api/'))return route.continue();otherRequests++;return route.abort();});
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('#tab-BTC').click();await page.waitForTimeout(300);
}catch(e){setupError=e.message;}
const el=id=>page.locator('#bitcoin-chart-'+id);
const latest=()=>configs.at(-1);
async function settled(){await page.waitForTimeout(150);}
async function need(){assert.ok(await el('host').count(),'BTC chart UI is not implemented');}
const tests=[
 async()=>{for(const id of ['title','host','interval','reload'])assert.ok(await el(id).isVisible(),id);assert.match(await el('title').innerText(),/비트코인/);},
 async()=>{await need();assert.equal(await el('interval').inputValue(),'60');assert.match(latest()?.symbol??'',/(^|:)BTCUSD$/);assert.equal(latest().interval,'60');assert.equal(latest().timezone,'Asia/Seoul');},
 async()=>{await need();for(const v of ['1','5','15','60','240','D','W','M']){await el('interval').selectOption(v);await settled();assert.equal(latest()?.interval,v);assert.match(latest()?.symbol??'',/(^|:)BTCUSD$/);}},
 async()=>{await need();const v=await el('interval').inputValue(),n=configs.length;await el('reload').click();await settled();assert.ok(configs.length>n);assert.equal(latest().interval,v);},
 async()=>{await need();const link=el('host').locator('a[href^="https://www.tradingview.com/"]');assert.ok(await link.first().isVisible());assert.match(await link.first().innerText(),/TradingView/);},
 async()=>{await need();const s=await el('note').innerText();assert.match(s,/USD\/BTC/);assert.match(s,/출처/);assert.match(s,/다를|차이/);assert.match(s,/참고/);},
 async()=>{await need();failed=true;await el('reload').click();await page.waitForFunction(()=>/실패|못했|오류/.test(document.getElementById('bitcoin-chart-status')?.textContent??''));assert.ok(await el('reload').isEnabled());},
 async()=>{await need();failed=false;await el('reload').click();await settled();assert.equal(await el('host').locator('iframe').count(),1);assert.doesNotMatch(await el('status').innerText(),/가져오지 못|조회 실패|연결 실패/);},
 async()=>{await need();for(let i=0;i<5;i++){await el('interval').selectOption(i%2?'60':'D');await el('reload').click();await settled();}assert.equal(await el('host').locator('iframe').count(),1);},
 async()=>{await need();const ids=['bitcoin-price','bitcoin-source-at','bitcoin-fetched-at'];const before=await Promise.all(ids.map(x=>page.locator('#'+x).innerText()));const n=otherRequests;await el('interval').selectOption('60');await el('reload').click();await settled();assert.deepEqual(await Promise.all(ids.map(x=>page.locator('#'+x).innerText())),before);assert.equal(otherRequests,n);}
];
for(let i=0;i<10;i++){let status='PASS',reason='';try{if(setupError)throw Error(setupError);await tests[i]();}catch(e){status=setupError?'UNVERIFIED':'FAIL';reason=e.message;}rows.push({...contract.tests[i],id:'BTC-CHART'+String(i+1).padStart(2,'0'),original_test_id:contract.tests[i].id,input:i<2?'페이지 열기 → 비트코인 탭 선택':contract.tests[i].input,status,reason});console.log(status+' '+rows.at(-1).id);}
await browser?.close();await new Promise(resolve=>server?server.close(resolve):resolve());
await mkdir('test-output',{recursive:true});await writeFile('test-output/chart-current.json',JSON.stringify({kind:'synthetic-browser-corrected',original_assignment_result:false,runner:'scripts/bitcoin-chart-check.mjs',at:new Date().toISOString(),rows},null,2)+'\n');console.log('RESULT '+rows.filter(r=>r.status==='PASS').length+'/10');process.exitCode=rows.every(r=>r.status==='PASS')?0:1;
