import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeCopper,fetchCopperQuote,COPPER_ENDPOINT} from '../public/copper-core.mjs';
import {createCopperClient} from '../public/copper-client.mjs';

const results=[];
async function check(id,fn){
  try{
    await fn();
    results.push({id,pass:true});
    console.log(`PASS ${id}`);
  }catch(error){
    results.push({id,pass:false,message:error?.message??String(error)});
    console.log(`FAIL ${id} · ${error?.message??error}`);
  }
}

const goodRaw={id:'copper',symbol:'CU',price:9876.5,unit:'USD/t'};
const goodResponse=(raw=goodRaw)=>({ok:true,status:200,headers:{get:()=>null},json:async()=>raw});
const badResponse=(status,headers={})=>({
  ok:false,
  status,
  headers:{get:key=>headers[key.toLowerCase()]??headers[key]??null},
  json:async()=>({})
});

await check('T05-CU01',async()=>{
  const html=await readFile('public/index.html','utf8');
  assert.match(html,/id="copper-live"/);
  assert.match(html,/id="copper-refresh"/);
  assert.match(html,/구리 시세/);
});

await check('T05-CU02',async()=>{
  const q=normalizeCopper(goodRaw,'2026-10-12T05:00:00.000Z');
  assert.equal(q.symbol,'CU');
  assert.equal(q.value,9876.5);
  assert.equal(q.unit,'USD/t');
  assert.equal(q.fetched_at,'2026-10-12T05:00:00.000Z');
  assert.match(q.source_url,/metalmarket\.cash/);
});

await check('T05-CU03',async()=>{
  for(const raw of [
    {...goodRaw,price:0},
    {...goodRaw,price:-1},
    {...goodRaw,price:'9876.5'},
    {...goodRaw,unit:'USD/lb'}
  ])assert.throws(()=>normalizeCopper(raw,'2026-10-12T05:00:00.000Z'),/schema_changed/);
});

await check('T05-CU04',async()=>{
  let seen;
  const fetcher=async(url,init)=>{seen={url,init};return goodResponse();};
  const q=await fetchCopperQuote({fetcher,now:()=> '2026-10-12T05:00:00.000Z'});
  assert.equal(seen.url,COPPER_ENDPOINT);
  assert.equal(seen.init.method,'GET');
  const headers=seen.init.headers??{};
  assert.equal(Object.keys(headers).some(k=>k.toLowerCase()==='authorization'),false);
  assert.equal(q.value,9876.5);
});

await check('T05-CU05',async()=>{
  const client=createCopperClient(()=>{},{
    fetcher:async()=>goodResponse(),
    now:()=> '2026-10-12T05:00:00.000Z'
  });
  await client.request();
  const v=client.view();
  assert.equal(v.status,'fresh');
  assert.equal(v.error_code,'none');
  assert.equal(v.last_good.value,9876.5);
  assert.equal(v.last_good.unit,'USD/t');
  const html=await readFile('public/index.html','utf8');
  assert.match(html,/id="copper-price"/);
  assert.match(html,/id="copper-fetched-at"/);
  assert.match(html,/MetalMarket\.cash/);
});

await check('T05-CU06',async()=>{
  let call=0;
  const client=createCopperClient(()=>{},{
    fetcher:async()=>{
      call++;
      if(call===1)return goodResponse();
      throw new Error('offline');
    },
    now:()=> '2026-10-12T05:00:00.000Z'
  });
  await client.request();
  await client.request();
  const v=client.view();
  assert.equal(v.status,'stale');
  assert.equal(v.last_good.value,9876.5);
});

await check('T05-CU07',async()=>{
  const client=createCopperClient(()=>{},{
    fetcher:async()=>badResponse(429,{'retry-after':'120'}),
    now:()=> '2026-10-12T05:00:00.000Z'
  });
  await client.request();
  const v=client.view();
  assert.equal(v.error_code,'rate_limited');
  assert.ok(v.due>Date.parse('2026-10-12T05:00:00.000Z'));
});

await check('T05-CU08',async()=>{
  const timeoutClient=createCopperClient(()=>{},{
    fetcher:async()=>{const e=new Error('aborted');e.name='AbortError';throw e;}
  });
  await timeoutClient.request();
  assert.equal(timeoutClient.view().error_code,'timeout');

  const offlineClient=createCopperClient(()=>{},{
    fetcher:async()=>{throw new TypeError('network');}
  });
  await offlineClient.request();
  assert.equal(offlineClient.view().error_code,'offline');
});

await check('T05-CU09',async()=>{
  let call=0;
  const client=createCopperClient(()=>{},{
    fetcher:async()=>{
      call++;
      return call===1?goodResponse():badResponse(500);
    }
  });
  await client.request();
  await client.request();
  const v=client.view();
  assert.ok(v.last_good);
  assert.notEqual(v.error_code,'request_failed');
  const js=await readFile('public/dashboard.mjs','utf8');
  assert.match(js,/다시 시도/);
});

await check('T05-CU10',async()=>{
  let calls=0;
  const now=Date.parse('2026-10-12T05:00:00.000Z');
  const client=createCopperClient(()=>{},{
    fetcher:async()=>{
      calls++;
      return calls===1?badResponse(429,{'retry-after':'60'}):goodResponse();
    },
    now:()=>new Date(now).toISOString()
  });
  await client.request();
  const before=calls;
  const accepted=await client.request();
  assert.equal(accepted,false);
  assert.equal(calls,before);
  assert.ok(client.view().due>now);
});

const passed=results.filter(r=>r.pass).length;
console.log(`RESULT ${passed}/10`);
if(passed!==10)process.exitCode=1;
