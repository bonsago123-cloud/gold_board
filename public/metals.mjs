export const METALS=Object.freeze({XAU:{name:'금',chart:'OANDA:XAUUSD'},XAG:{name:'은',chart:'OANDA:XAGUSD'}});
export function normalizeMetal(raw,symbol,fetchedAt){
  if(!Object.hasOwn(METALS,symbol)||!raw||raw.symbol!==symbol||raw.currency!=='USD'||typeof raw.price!=='number'||!Number.isFinite(raw.price)||raw.price<=0||typeof raw.updatedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(raw.updatedAt)||!Number.isFinite(Date.parse(raw.updatedAt))||Date.parse(raw.updatedAt)>Date.parse(fetchedAt)+300000)throw new Error('schema_changed');
  return {symbol,value:raw.price,unit:'USD / 트로이온스',source_url:`https://api.gold-api.com/price/${symbol}`,source_at:raw.updatedAt,fetched_at:fetchedAt,timezone:'Asia/Seoul'};
}
