import {normalizeRecord,SYMBOLS} from '../public/bundle-core.mjs';
export async function fetchOutcomes({fetcher=fetch,now=()=>new Date().toISOString(),timeoutMs=10000}={}){
 async function get(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{
  const res=await fetcher(url,{signal:controller.signal,redirect:'error',headers:{Accept:'application/json'},cache:'no-store'});
  if(!res.ok){const error=new Error([401,403].includes(res.status)?'access_denied':res.status===429?'rate_limited':'upstream_error');const v=res.headers.get('retry-after');const wait=/^\d+$/.test(v??'')?Number(v):Math.ceil((Date.parse(v)-Date.now())/1000);error.wait=Number.isFinite(wait)?Math.max(60,Math.min(3600,wait)):60;throw error;}
  let data;try{data=await res.json();}catch{throw Error('schema_changed');}
  if(data?.success===false){const code=Number(data.error?.code);throw Error([101,401,403,105].includes(code)?'access_denied':[104,429].includes(code)?'rate_limited':'upstream_error');}
  return {data,at:now()};
 }catch(e){const error=new Error(controller.signal.aborted?'timeout':['schema_changed','access_denied','rate_limited','upstream_error'].includes(e.message)?e.message:'offline');error.wait=e.wait??60;throw error;}finally{clearTimeout(timer);}}
 const metal=s=>get(`https://api.gold-api.com/price/${s}`);
 const results=await Promise.allSettled(SYMBOLS.map(metal));
 return SYMBOLS.map((symbol,index)=>{const result=results[index];if(result.status==='rejected')return {symbol,error:result.reason.message,wait:result.reason.wait??60};try{return {symbol,error:'none',record:normalizeRecord(result.value.data,symbol,result.value.at),wait:60};}catch{return {symbol,error:'schema_changed',wait:60};}});
}
