export const COPPER_ENDPOINT='https://metalmarket.cash/api/v1/prices/copper';
export const COPPER_SOURCE='https://metalmarket.cash/developers/metal-price-api';
export const COPPER_UNIT='USD/t';

export class CopperError extends Error{
  constructor(code='request_failed'){
    super(code);
    this.code=code;
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
  now=()=>new Date().toISOString()
}={}){
  let response;
  try{
    response=await fetcher(COPPER_ENDPOINT,{
      method:'GET',
      headers:{Accept:'application/json'},
      cache:'no-store'
    });
  }catch{
    throw new CopperError('request_failed');
  }

  if(!response.ok)throw new CopperError('request_failed');

  let raw;
  try{
    raw=await response.json();
  }catch{
    throw new CopperError('schema_changed');
  }
  return normalizeCopper(raw,now());
}
