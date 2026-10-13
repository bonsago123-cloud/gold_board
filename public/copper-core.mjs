export const COPPER_ENDPOINT='https://metalmarket.cash/api/v1/prices/copper';
export const COPPER_SOURCE='https://metalmarket.cash/developers/metal-price-api';
export const COPPER_UNIT='USD/t';

export class CopperError extends Error{
  constructor(code='request_failed',retryAfterMs=0){
    super(code);
    this.code=code;
    this.retryAfterMs=retryAfterMs;
  }
}

export function normalizeCopper(raw,fetchedAt){
  if(!raw||Array.isArray(raw)||raw.id!=='copper'||raw.symbol!=='CU'||
     typeof raw.price!=='number'||!Number.isFinite(raw.price)||raw.price<=0||
     raw.unit!==COPPER_UNIT){
    throw new CopperError('schema_changed');
  }
  if(!Number.isFinite(Date.parse(fetchedAt)))throw new CopperError('schema_changed');
  return {
    symbol:'CU',
    value:raw.price,
    unit:COPPER_UNIT,
    source_url:COPPER_SOURCE,
    fetched_at:fetchedAt,
    timezone:'Asia/Seoul'
  };
}

export async function fetchCopperQuote({
  fetcher=fetch,
  now=()=>new Date().toISOString(),
  timeoutMs=10000
}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetcher(COPPER_ENDPOINT,{
      method:'GET',
      headers:{Accept:'application/json'},
      cache:'no-store',
      signal:controller.signal
    });
    if(response.status===429){
      const header=response.headers?.get('retry-after')?.trim();
      const delay=header&&/^\d+$/.test(header)
        ?Number(header)*1000
        :Date.parse(header)-Date.parse(now());
      throw new CopperError('rate_limited',Number.isFinite(delay)?Math.max(0,delay):30000);
    }
    if(!response.ok)throw new CopperError(response.status>=500?'server_error':'http_error');
    let raw;
    try{
      raw=await response.json();
    }catch(error){
      if(controller.signal.aborted||error?.name==='AbortError'||error?.name==='TimeoutError')throw error;
      if(error instanceof SyntaxError)throw new CopperError('schema_changed');
      throw new CopperError('offline');
    }
    return normalizeCopper(raw,now());
  }catch(error){
    if(error instanceof CopperError)throw error;
    throw new CopperError(controller.signal.aborted||error?.name==='AbortError'||error?.name==='TimeoutError'?'timeout':'offline');
  }finally{
    clearTimeout(timer);
  }
}
