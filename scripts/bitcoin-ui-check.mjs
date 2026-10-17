// Additional UI tests for the user's tab/KRW requirement. Frozen chart tests are unchanged.
// External prices and chart scripts are mocked: this is not live-market evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';
const rows=[],started_at=new Date().toISOString();let browser,server,page,setupError;
let priceFail=false,fxFail=false,widgetFail=false,btcCalls=0,apiWrites=0;
const price=82138.65625,rate=1400;
const errors=[];
async function check(id,fn){try{if(setupError)throw Error(setupError);await fn();rows.push({id,status:'PASS'});}catch(e){rows.push({id,status:setupError?'UNVERIFIED':'FAIL',reason:e.message});}console.log(rows.at(-1).status+' '+id);}
async function newPage({cached=false}={}){
 const p=await browser.newPage({viewport:{width:1280,height:960}});p.setDefaultTimeout(5000);
 p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install();
 if(cached)await p.addInitScript(()=>localStorage.setItem('usd-krw-v1',JSON.stringify({rate:1300,source_at:new Date(Date.now()-3*86400000).toISOString(),next_at:new Date(Date.now()-2*86400000).toISOString(),fetched_at:new Date(Date.now()-3*86400000).toISOString()})));
 await p.route('**/*',async r=>{
  const u=r.request().url();
  if(u.includes('s3.tradingview.com/'))return widgetFail?r.abort():r.fulfill({contentType:'text/javascript',body:`(()=>{const s=document.currentScript,c=JSON.parse(s.textContent);const f=document.createElement('iframe');f.title=c.symbol;f.dataset.interval=c.interval;f.src='about:blank';s.parentNode.append(f);})();`});
  if(u.includes('api.gold-api.com/price/BTC')){btcCalls++;return priceFail?r.abort():r.fulfill({json:{symbol:'BTC',currency:'USD',price,updatedAt:new Date(await p.evaluate(()=>Date.now())).toISOString()}});}
  if(u.includes('open.er-api.com'))return fxFail?r.abort():r.fulfill({json:{result:'success',base_code:'USD',rates:{KRW:rate},time_last_update_unix:Math.floor(Date.now()/1000),time_next_update_unix:Math.floor(Date.now()/1000)+86400}});
  if(u.includes('/api/')){if(r.request().method()!=='GET')apiWrites++;return r.abort();}
  if(u.startsWith(base))return r.continue();return r.abort();
 });
 return p;
}
let base;
try{
 server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const f=path.resolve('public','.'+(name==='/'?'/index.html':name));if(!f.startsWith(path.resolve('public')+path.sep))throw Error();res.setHeader('content-type',f.endsWith('.mjs')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'text/html');res.end(await readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}: {})});
 page=await newPage();await page.goto(base);await page.locator('#tab-BTC').waitFor();
}catch(e){setupError=e.message;}
await check('BTC-UI01-tabs',async()=>{
 assert.equal(await page.locator('#metal-panel').isVisible(),true);assert.equal(await page.locator('#bitcoin-live').isVisible(),false);
 await page.click('#tab-XAG');assert.match(await page.locator('#board-title').innerText(),/은/);
 await page.click('#tab-BTC');assert.equal(await page.locator('#metal-panel').isVisible(),false);assert.equal(await page.locator('#bitcoin-live').isVisible(),true);assert.equal(await page.locator('#tab-BTC').getAttribute('aria-pressed'),'true');
});
await check('BTC-UI02-matching-layout-and-KRW',async()=>{
 await page.click('#bitcoin-refresh');await page.waitForFunction(()=>document.querySelector('#bitcoin-price-krw').textContent==='114,994,119');
 assert.equal(await page.locator('#bitcoin-unit').innerText(),'USD/BTC');
 const values=await page.evaluate(()=>{const style=s=>getComputedStyle(document.querySelector(s));return [style('#dashboard .quote').backgroundColor,style('#bitcoin-live .quote').backgroundColor,style('#price').fontSize,style('#bitcoin-price').fontSize,style('#price-krw').fontSize,style('#bitcoin-price-krw').fontSize];});
 assert.equal(values[0],values[1]);assert.equal(values[2],values[3]);assert.equal(values[4],values[5]);
});
await check('BTC-UI03-chart-isolation-and-intervals',async()=>{
 const before=await page.locator('#bitcoin-source-at').innerText(),calls=btcCalls,writes=apiWrites;
 for(const interval of ['1','5','15','60','240','D','W','M']){
  await page.selectOption('#bitcoin-chart-interval',interval);await page.waitForFunction(v=>document.querySelector('#bitcoin-chart-host iframe')?.dataset.interval===v,interval);
 }
 await page.click('#bitcoin-chart-reload');await page.locator('#bitcoin-chart-host iframe').waitFor();
 assert.equal(await page.locator('#bitcoin-chart-host iframe').count(),1);assert.equal(btcCalls,calls);assert.equal(apiWrites,writes);assert.equal(await page.locator('#bitcoin-source-at').innerText(),before);
});
await check('BTC-UI04-chart-failure-and-recovery',async()=>{
 widgetFail=true;await page.click('#bitcoin-chart-reload');await page.waitForFunction(()=>document.querySelector('#bitcoin-chart-status').textContent.includes('못했습니다'));
 widgetFail=false;await page.click('#bitcoin-chart-reload');await page.locator('#bitcoin-chart-host iframe').waitFor();assert.doesNotMatch(await page.locator('#bitcoin-chart-status').innerText(),/못했습니다/);
});
await check('BTC-UI05-price-failure-preserves-KRW',async()=>{
 priceFail=true;await page.clock.fastForward(31000);await page.click('#bitcoin-refresh');await page.waitForFunction(()=>document.querySelector('#bitcoin-status').textContent==='오래된 값');
 assert.equal(await page.locator('#bitcoin-price-krw').innerText(),'114,994,119');assert.match(await page.locator('#bitcoin-fx-price-note').innerText(),/오래된/);priceFail=false;
});
await check('BTC-UI06-auto-query-and-tab-stop',async()=>{
 await page.check('#bitcoin-auto-refresh');const n=btcCalls;await page.clock.fastForward(31000);await page.waitForFunction(()=>document.querySelector('#bitcoin-status').textContent==='정상');assert.equal(btcCalls,n+1);
 await page.click('#tab-XAU');const after=btcCalls;await page.clock.fastForward(31000);assert.equal(btcCalls,after);assert.equal(await page.locator('#bitcoin-auto-refresh').isChecked(),false);
 await page.click('#tab-BTC');
});
await check('BTC-UI07-mobile',async()=>{
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const a=await page.locator('#bitcoin-live .quote').boundingBox(),b=await page.locator('#bitcoin-live .context').boundingBox();assert.ok(b.y>=a.y+a.height);
 await page.screenshot({path:'test-output/bitcoin-ui-mobile.png',fullPage:true});await page.setViewportSize({width:1280,height:960});
 await page.screenshot({path:'test-output/bitcoin-ui-desktop.png',fullPage:true});
});
await check('BTC-UI08-missing-FX',async()=>{
 fxFail=true;const p=await newPage();try{await p.goto(base+'/?asset=BTC');await p.click('#bitcoin-refresh');await p.waitForFunction(()=>document.querySelector('#bitcoin-status').textContent==='정상');assert.equal(await p.locator('#bitcoin-price-krw').innerText(),'—');assert.match(await p.locator('#bitcoin-fx-price-note').innerText(),/換算|환율/);}finally{await p.close();}
});
await check('BTC-UI09-stale-FX',async()=>{
 const p=await newPage({cached:true});try{await p.goto(base+'/?asset=BTC');await p.click('#bitcoin-refresh');await p.waitForFunction(()=>document.querySelector('#bitcoin-status').textContent==='정상');assert.equal(await p.locator('#bitcoin-price-krw').innerText(),new Intl.NumberFormat('ko-KR',{maximumFractionDigits:0}).format(price*1300));assert.match(await p.locator('#bitcoin-fx-status').innerText(),/이전 환율/);}finally{await p.close();fxFail=false;}
});
await check('BTC-UI10-no-runtime-errors',async()=>assert.deepEqual(errors,[]));
const version=browser?await browser.version():null;await browser?.close();await new Promise(r=>server?server.close(r):r());
await mkdir('test-output',{recursive:true});await writeFile('test-output/bitcoin-ui.json',JSON.stringify({kind:'synthetic-browser',started_at,finished_at:new Date().toISOString(),browser:version,rows},null,2)+'\n');
process.exitCode=rows.every(r=>r.status==='PASS')?0:1;
