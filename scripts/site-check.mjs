/**
 * Independent, no-mocks, fail-continuing Playwright site exercise.
 * Does NOT replace the frozen T05-CU01..10 tests or the handoff gates.
 * Evidence is written only to test-output/site-check (ignored by source digest).
 */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';

const base=process.env.SITE_URL??'https://goldboard-omega.vercel.app';
const dest='test-output/site-check';
const started=new Date().toISOString();
const rows=[];
let browser,page;
await mkdir(dest,{recursive:true});

class NotVerified extends Error {}
function expect(value,message){if(!value)throw new Error(message);}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function evidence(id){
  if(!page)return null;
  const filename=`${id.replaceAll(/[^A-Za-z0-9_-]/g,'_')}.png`;
  try{await page.screenshot({path:join(dest,filename),fullPage:true,timeout:5000});return filename;}
  catch{return null;}
}
async function test(id,screen,action,check,options={}){
  const item={id,screen,action,expect:check,status:'UNVERIFIED',observed:'Not executed',at:new Date().toISOString()};
  rows.push(item);
  try{
    if(!page)throw new NotVerified('Browser unavailable');
    const outcome=await options.run();
    item.status='PASS';item.observed=String(outcome??'Visible expected result confirmed').slice(0,500);
  }catch(error){
    item.status=error instanceof NotVerified?'UNVERIFIED':'FAIL';
    item.observed=`${error.name}: ${error.message}`.slice(0,500);
    item.screenshot=await evidence(id);
  }
  console.log(`${item.status} ${id} — ${item.observed}`);
}
async function open(path){
  const response=await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded',timeout:22000});
  expect(response?.ok(),`HTTP ${response?.status()??'no response'} at ${path}`);
  await page.locator('body').waitFor({state:'visible'});
  await page.waitForTimeout(800);
}
async function text(selector){return (await page.locator(selector).innerText({timeout:6000})).trim();}
async function click(selector){await page.locator(selector).click({timeout:7000});}
async function changed(selector,previous,timeout=18000){
  await page.waitForFunction(({selector,previous})=>document.querySelector(selector)?.textContent?.trim()!==previous,{selector,previous},{timeout});
  return text(selector);
}
async function settleStatus(selector,notYet,timeout=20000){
  await page.waitForFunction(({selector,notYet})=>{
    const e=document.querySelector(selector);
    return e&&e.textContent.trim()!==notYet&&!e.textContent.includes('중…')&&!e.textContent.includes('확인 중');
  },{selector,notYet},{timeout});
  return text(selector);
}
async function pageTest(id,route){await test(id,route,'Open anonymous page','HTTP 200 and expected page displayed',{run:async()=>{await open(route);return await page.title();}});}
async function press(id,screen,selector,outSelector,assertText=''){
  await test(id,screen,`Click ${selector}`,`Response in ${outSelector}`,{run:async()=>{
    const before=await text(outSelector);await click(selector);
    let after;
    try{after=await changed(outSelector,before,18000);}catch{after=await text(outSelector);}
    expect(after!==before,`No observable response: ${selector}`);
    if(assertText)expect(after.includes(assertText),`Expected '${assertText}', observed '${after}'`);
    return after;
  }});
}
async function linkTest(id,route,selector,expected){
  await test(id,route,`Follow ${selector}`,`Navigates to ${expected}`,{run:async()=>{
    await open(route);
    const href=await page.locator(selector).first().getAttribute('href');
    expect(!!href,`No href for ${selector}`);
    expect(new URL(href,page.url()).pathname===expected,`Unexpected href ${href}`);
    await click(selector);
    await page.waitForURL(url=>url.pathname===expected,{timeout:10000});
    return page.url();
  }});
}
async function downloadCheck(id,route,prefix){
  await test(id,route,'Download evidence JSON','Filename, parseable JSON, correct symbol',{run:async()=>{
    await open(route);
    await page.waitForTimeout(1000);
    const [file]=await Promise.all([page.waitForEvent('download',{timeout:9000}),click('#bundle-export')]);
    expect(file.suggestedFilename().startsWith(prefix),'Unexpected downloaded filename');
    const bytes=await readFile(await file.path());
    const json=JSON.parse(bytes.toString('utf8'));
    expect(json&&typeof json==='object'&&json.actual,'Downloaded JSON missing actual evidence');
    return file.suggestedFilename();
  }});
}
async function officialSuite(id,route){
  await test(id,route,'Click official complete suite','Actual fixture results appear',{run:async()=>{
    await open(route);
    await page.locator('#official-suite:not([disabled])').waitFor({timeout:26000});
    await click('#official-suite');
    const result=await text('#official-suite-result');
    expect(result.length>20,'Official results empty');
    expect(!result.includes('실패 ·'),'Official fixture returned failed result');
    return result.slice(0,280);
  }});
}
async function officialFixtures(idPrefix,route){
  await test(`${idPrefix}-fixtures-discovery`,route,'Discover all fixture buttons','At least one official fixture available',{run:async()=>{
    await open(route);
    await page.locator('#official-suite:not([disabled])').waitFor({timeout:26000});
    const buttons=await page.locator('#official-buttons button').allTextContents();
    expect(buttons.length>=6,'Fixture buttons missing');
    return buttons.join(', ');
  }});
  if(!(await page?.locator('#official-buttons button').count().catch(()=>0)))return;
  const ids=await page.locator('#official-buttons button').allTextContents();
  // Each fixture is run in its own trial; reset and establish D1 baseline for failure/recovery cases.
  for(let i=0;i<ids.length;i++){
    const fixture=ids[i].trim();
    await test(`${idPrefix}-fixture-${i+1}`,route,`Run fixture ${fixture}`,'Fixture result displayed (even an intentional failed request must preserve correct state)',{run:async()=>{
      await click('#official-reset');
      const all=await page.locator('#official-buttons button').allTextContents();
      const byId=pattern=>all.findIndex(x=>x.includes(pattern));
      if(!fixture.includes('NORMAL-D1-A')){
        const first=byId('T04-NORMAL-D1-A');
        if(first>=0)await page.locator('#official-buttons button').nth(first).click();
      }
      if(!fixture.includes('NORMAL-D1-A')&&!fixture.includes('NORMAL-D1-B')){
        const second=byId('T04-NORMAL-D1-B');
        if(second>=0)await page.locator('#official-buttons button').nth(second).click();
      }
      if(fixture.includes('RECOVER')){
        const failure=all.findIndex(x=>/TIMEOUT|AUTH|RATE|OFFLINE|SCHEMA/.test(x));
        if(failure>=0)await page.locator('#official-buttons button').nth(failure).click();
      }
      await page.locator('#official-buttons button').nth(i).click();
      const output=await text('#official-result');
      expect(output.includes(fixture),'Fixture ID not rendered in result');
      expect(output.includes('fixture 예상 결과 일치'),`Fixture mismatch: ${output}`);
      return output;
    }});
  }
  await test(`${idPrefix}-reset`,route,'Click synthetic state reset','Reset state visible',{run:async()=>{
    await click('#official-reset');const output=await text('#official-result');
    expect(output.includes('초기화'),'Reset not confirmed');return output;
  }});
  await test(`${idPrefix}-retry`,route,'Activate recovery after synthetic failure','Recovery button and result function',{run:async()=>{
    const all=await page.locator('#official-buttons button').allTextContents();
    await click('#official-reset');
    for(const pattern of ['T04-NORMAL-D1-A','T04-NORMAL-D1-B']){
      const i=all.findIndex(v=>v.includes(pattern));if(i<0)throw new NotVerified(`Missing ${pattern}`);
      await page.locator('#official-buttons button').nth(i).click();
    }
    const fail=all.findIndex(x=>/TIMEOUT|AUTH|RATE|OFFLINE|SCHEMA/.test(x));
    if(fail<0)throw new NotVerified('No failure fixture for recovery');
    await page.locator('#official-buttons button').nth(fail).click();
    const retry=page.locator('#official-retry');
    if(await retry.isDisabled())throw new NotVerified('Recovery button not enabled by this failure scenario');
    await retry.click();
    const result=await text('#official-result');
    expect(result.includes('T04-RECOVER-D2'),'Recovery fixture not run');
    return result;
  }});
}

try{
  browser=await chromium.launch({headless:true});
  const ctx=await browser.newContext({acceptDownloads:true,locale:'ko-KR',timezoneId:'Asia/Seoul'});
  page=await ctx.newPage();page.setDefaultTimeout(7000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message.slice(0,160)));

  await pageTest('S01','/');
  await test('S02','/','Switch to silver tab','Silver title and selected tab',{run:async()=>{
    await click('[data-symbol="XAG"]');
    expect((await text('#board-title')).includes('은'),'Silver title unchanged');
    expect((await page.locator('[data-symbol="XAG"]').getAttribute('aria-pressed'))==='true','Silver tab unselected');
    return text('#quote-unit');
  }});
  await test('S03','/','Switch to gold tab','Gold title and selected tab',{run:async()=>{
    await click('[data-symbol="XAU"]');expect((await text('#board-title')).includes('금'),'Gold title unchanged');
    return text('#quote-unit');
  }});
  await test('S04','/','Click gold live refresh','Real positive price, unit, and timestamp',{run:async()=>{
    await page.locator('#refresh:not([disabled])').waitFor({timeout:40000});await click('#refresh');
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent==='정상',{},{timeout:25000});
    const price=await text('#price');expect(Number(price.replaceAll(',',''))>0,'No real gold price');
    expect((await text('#fetched-at'))!=='—','Gold timestamp missing');return price;
  }});
  await test('S05','/','Click silver live refresh','Real positive price, unit, and timestamp',{run:async()=>{
    await click('[data-symbol="XAG"]');
    await page.locator('#refresh:not([disabled])').waitFor({timeout:40000});await click('#refresh');
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent==='정상',{},{timeout:25000});
    const price=await text('#price');expect(Number(price.replaceAll(',',''))>0,'No real silver price');
    expect((await text('#fetched-at'))!=='—','Silver timestamp missing');return price;
  }});
  await test('S06','/','Enable auto refresh','Auto-status changes to enabled',{run:async()=>{
    await page.locator('#auto-refresh').check();
    const status=await text('#auto-status');expect(!status.includes('꺼짐'),'Auto-refresh not enabled');return status;
  }});
  await test('S07','/','Disable auto refresh','Auto-status indicates disabled',{run:async()=>{
    await page.locator('#auto-refresh').uncheck();
    const status=await text('#auto-status');expect(status.includes('꺼짐'),'Auto-refresh still on');return status;
  }});
  await test('S08','/','Click bitcoin live refresh','Real positive price, USD/BTC, timestamp and provider',{run:async()=>{
    await click('#bitcoin-refresh');
    await page.waitForFunction(()=>['정상','조회 실패','오래된 값'].includes(document.querySelector('#bitcoin-status')?.textContent),{},{timeout:16000});
    const status=await text('#bitcoin-status');
    expect(status==='정상',`Bitcoin real fetch failed: ${status} / ${await text('#bitcoin-error')}`);
    expect(Number((await text('#bitcoin-price')).replaceAll(',',''))>0,'Bitcoin price not positive');
    expect((await text('#bitcoin-unit'))==='USD/BTC','Bitcoin unit incorrect');
    expect((await text('#bitcoin-fetched-at'))!=='—','Bitcoin timestamp missing');
    return `${await text('#bitcoin-price')} ${await text('#bitcoin-unit')}`;
  }});
  await test('S09','/','Click bitcoin again during cooldown','Retry delay enforced, previous price unchanged',{run:async()=>{
    const status=await text('#bitcoin-status');
    const button=page.locator('#bitcoin-refresh');
    if(!['정상','조회 실패','오래된 값'].includes(status))throw new NotVerified('No completed request preceding cooldown trial');
    expect(await button.isDisabled(),'Cooldown button unexpectedly enabled');
    return `${await text('#bitcoin-error')}`;
  }});
  await test('S10','/','Refresh exchange rate','Exchange rate status updated',{run:async()=>{
    await click('#fx-refresh');
    await page.waitForTimeout(1500);
    const s=await text('#fx-status');
    expect(s.includes('1 USD ='),'Exchange rate lookup failed: '+s);
    return s;
  }});
  await test('S11','/','Read daily records','Row counter and data/empty-state are displayed',{run:async()=>{
    const counter=await text('#row-count');
    const rows=await page.locator('#daily-rows tr').count();
    expect(/\d+일/.test(counter)&&rows>0,'Record table incomplete');return `${counter}, ${rows} rows`;
  }});
  await test('S12','/','Click general retry','Retry button handles request',{run:async()=>{
    await page.locator('#retry:not([disabled])').waitFor({timeout:20000});
    await click('#retry');await page.waitForTimeout(500);
    return text('#notice-body');
  }});
  for(const value of ['1','5','15','60','240','D','W','M']){
    await test(`S13-${value}`,'/',`Choose chart interval ${value}`,'Chart interval config and chart host updated',{run:async()=>{
      await page.locator('#chart-interval').selectOption(value);
      expect((await page.locator('#chart-interval').inputValue())===value,'Wrong interval');
      const note=await text('#chart-interval-note');
      expect(note.length>0,'Chart interval note missing');
      expect(await page.locator('#chart-host .tradingview-widget-container').count()>0,'Chart widget not mounted');
      return note;
    }});
  }
  await press('S14','/','#chart-reload','#chart-status');
  await linkTest('S15','/','a[href="/verify.html"]','/verify.html');
  await linkTest('S16','/','a[href="/task5.html"]','/task5.html');

  for(const [id,route,metal] of [['G','/verify.html','금'],['A','/silver-verify.html','은']]){
    await pageTest(`${id}01`,route);
    await press(`${id}02`,route,'#bundle-collect','#bundle-result');
    await press(`${id}03`,route,'#bundle-read','#bundle-result');
    await test(`${id}04`,route,`Run ${metal} recovery suite`,'All five synthetic failure cases pass',{run:async()=>{
      await click('#bundle-suite');
      await page.waitForFunction(()=>document.querySelector('#bundle-suite-status')?.textContent.includes('/5'),{},{timeout:12000});
      const result=await text('#bundle-suite-status');
      expect(result.includes('5/5 통과'),`${metal} suite incomplete: ${result}`);return result;
    }});
    await test(`${id}05`,route,'Open verification guide','Guide expands',{run:async()=>{
      await page.locator('details.guide').first().locator('summary').click();
      expect(await page.locator('details.guide').first().evaluate(el=>el.open),'Guide did not open');
      return 'Guide open';
    }});
    await downloadCheck(`${id}06`,route,id==='G'?'gold':'silver');
    await officialSuite(`${id}07`,route);
    await officialFixtures(`${id}08`,route);
  }
  await pageTest('O01','/official.html');
  await test('O02','/official.html','Follow official page redirect','URL points to /verify.html#official-tests',{run:async()=>{
    await page.waitForURL(/\/verify\.html#official-tests/,{timeout:12000});return page.url();
  }});
  await pageTest('T01','/task5.html');
  await test('T02','/task5.html','Open linked handoff status','Navigate to /handoff.html',{run:async()=>{
    await click('a[href="/handoff.html"]');await page.waitForURL(/\/handoff\.html$/,{timeout:10000});return page.url();
  }});
  await pageTest('H01','/handoff.html');
  await test('H02','/handoff.html','Inspect live handoff report','Shows status and next action',{run:async()=>{
    await page.waitForFunction(()=>!document.querySelector('#phase')?.textContent.includes('확인 중'),{},{timeout:12000});
    const phase=await text('#phase'),next=await text('#next');
    expect(next.length>8,'Missing next action');return `${phase} / ${next}`;
  }});
  await test('H03','/handoff.html','Follow home link','Main board displayed',{run:async()=>{
    await click('a[href="/"]');await page.waitForURL(url=>url.pathname==='/',{timeout:10000});
    expect(await page.locator('#bitcoin-live').count()>0,'Dashboard not displayed');return page.url();
  }});
  await test('META','all','Capture browser JavaScript errors','No pageerror observed',{run:async()=>{
    expect(!errors.length,`JavaScript errors: ${errors.slice(0,8).join('; ')}`);return 'No uncaught page errors';
  }});
}catch(error){
  console.error('Browser setup or site check interrupted:',error.message);
  rows.push({id:'SETUP',screen:'all',action:'Launch/navigate browser',expect:'Browser available',status:'UNVERIFIED',observed:String(error),at:new Date().toISOString()});
}finally{
  try{await browser?.close();}catch{}
  const counts={PASS:0,FAIL:0,UNVERIFIED:0};for(const r of rows)counts[r.status]++;
  const finished=new Date().toISOString();
  const payload={source:'real-browser-no-mocks',base,started,finished,counts,rows};
  await writeFile(join(dest,'result.json'),JSON.stringify(payload,null,2)+'\n');
  const safe=s=>String(s??'').replaceAll('|','\\|').replaceAll('\n',' ').slice(0,250);
  const md=[`# 실제 배포 사이트 전체 기능 검사`, '',`- 시작: ${started}`,`- 종료: ${finished}`,`- 대상: ${base}`,`- 결과: PASS ${counts.PASS}, FAIL ${counts.FAIL}, UNVERIFIED ${counts.UNVERIFIED}`,'- 정상 가격 조회와 합성 검사는 구분한다. 외부 API 장애는 PASS로 바꾸지 않는다.','', '| ID | 경로 | 행동 | 기대값 | 결과 | 실제 관찰 |', '|---|---|---|---|---|---|',...rows.map(r=>`| ${r.id} | ${safe(r.screen)} | ${safe(r.action)} | ${safe(r.expect)} | ${r.status} | ${safe(r.observed)} |`),'','## 이어받을 때','- 먼저 FAIL/UNVERIFIED를 조사한다. 스크린샷은 test-output/site-check 내부에 있다.','- 원래 고정 검사 10개와 과거 A/B 측정값을 변경하지 않는다.','- 이 결과는 브라우저에서 실제로 수행된 항목만 나타낸다.'];
  await writeFile(join(dest,'report.md'),md.join('\n')+'\n');
  console.log(`SITE CHECK: ${JSON.stringify(counts)}. Evidence: ${dest}/report.md`);
  if(counts.FAIL||counts.UNVERIFIED||!rows.length)process.exitCode=1;
}
