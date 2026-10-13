// Real browser only: no route mocks, no fake price injection, no session/cookies reused.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const url=process.argv[2];
let browser;
try{
  const {chromium}=require('playwright');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
  await page.locator('#copper-refresh').click({timeout:10000});
  await page.waitForFunction(()=>document.querySelector('#copper-status')?.textContent==='정상',{},{timeout:15000});
  const result=await page.locator('#copper-live').innerText();
  if(!result.includes('USD/t')||!result.includes('MetalMarket.cash'))throw new Error('Missing unit/source');
  const price=Number((await page.locator('#copper-price').innerText()).replaceAll(',',''));
  if(!Number.isFinite(price)||price<=0)throw new Error('No positive real price');
  if((await page.locator('#copper-fetched-at').innerText()).trim()==='—')throw new Error('No fetched time');
  const report=await page.goto(new URL('/task5.html',url).href,{waitUntil:'domcontentloaded',timeout:25000});
  if(!report?.ok()||!(await page.locator('h1').innerText()).includes('구리'))throw new Error('Public report unavailable');
  console.log('REAL BROWSER PASS: anonymous deployed page, real price, unit, time, source, public report');
}catch(error){
  console.error(`REAL BROWSER NOT VERIFIED: ${error.name}. Check browser install and deployed copper error notice.`);
  process.exitCode=1;
}finally{await browser?.close();}
