export const BITCOIN_ENDPOINT='https://api.gold-api.com/price/BTC';
export class BitcoinError extends Error {
 constructor(code,retryAfterMs=0){super(code);this.code=code;this.retryAfterMs=retryAfterMs;}
}
export function normalizeBitcoin(raw,fetchedAt){
 if(!raw||Array.isArray(raw)||raw.symbol!=='BTC'||raw.currency!=='USD'||typeof raw.price!=='number'||!Number.isFinite(raw.price)||raw.price<=0||typeof raw.updatedAt!=='string'||!Number.isFinite(Date.parse(raw.updatedAt))||!Number.isFinite(Date.parse(fetchedAt)))throw new BitcoinError('schema_changed');
 return {symbol:'BTC',value:raw.price,unit:'USD/BTC',source_url:BITCOIN_ENDPOINT,source_at:raw.updatedAt,fetched_at:fetchedAt,timezone:'Asia/Seoul'};
}
// The deadline covers both the headers and the response body.
export async function fetchBitcoinQuote({fetcher=fetch,now=()=>new Date().toISOString(),timeoutMs=10000}={}){
 const controller=new AbortController();
 let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{
  controller.abort();reject(new BitcoinError('timeout'));
 },timeoutMs);});
 const work=(async()=>{
  let response;
  try{response=await fetcher(BITCOIN_ENDPOINT,{method:'GET',headers:{Accept:'application/json'},signal:controller.signal,credentials:'omit',redirect:'error',cache:'no-store'});}
  catch(error){throw new BitcoinError(controller.signal.aborted?'timeout':'offline');}
  if(response.status===429){
   const value=response.headers.get('Retry-After');
   const seconds=value?.trim()!==''&&value!==null?Number(value):NaN;
   const date=Date.parse(value);
   const retry=Number.isFinite(seconds)&&seconds>=0?seconds*1000:Number.isFinite(date)?Math.max(0,date-Date.parse(now())):30000;
   throw new BitcoinError('rate_limited',Math.max(30000,retry));
  }
  if(!response.ok)throw new BitcoinError(response.status>=500?'server_error':response.status===401||response.status===403?'auth_error':'http_error');
  let raw;
  try{raw=await response.json();}
  catch(error){throw new BitcoinError(controller.signal.aborted?'timeout':error instanceof SyntaxError?'schema_changed':'offline');}
  return normalizeBitcoin(raw,now());
 })();
 try{return await Promise.race([work,deadline]);}finally{clearTimeout(timer);}
}
