export const METALS=Object.freeze({
 XAU:{name:'금',chart:'OANDA:XAUUSD',unit:'USD / 트로이온스',type:'metal'},
 XAG:{name:'은',chart:'OANDA:XAGUSD',unit:'USD / 트로이온스',type:'metal'},
 RHENIUM:{name:'레늄',chart:null,unit:'USD / 트로이온스',type:'rhenium'},
 WTI:{name:'석유(WTI)',chart:'OANDA:WTICOUSD',unit:'USD / 배럴',type:'widget'},
 WHEAT:{name:'밀',chart:'OANDA:WHEATUSD',unit:'USD · OANDA 호가 기준',type:'widget'}
});
export function normalizeMetal(raw,symbol,fetchedAt){
  if(!['XAU','XAG'].includes(symbol)||!raw||raw.symbol!==symbol||raw.currency!=='USD'||typeof raw.price!=='number'||!Number.isFinite(raw.price)||raw.price<=0||typeof raw.updatedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(raw.updatedAt)||!Number.isFinite(Date.parse(raw.updatedAt))||Date.parse(raw.updatedAt)>Date.parse(fetchedAt)+300000)throw new Error('schema_changed');
  return {symbol,value:raw.price,unit:'USD / 트로이온스',source_url:`https://api.gold-api.com/price/${symbol}`,source_at:raw.updatedAt,fetched_at:fetchedAt,timezone:'Asia/Seoul'};
}
