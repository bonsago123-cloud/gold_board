export const BITCOIN_ENDPOINT='https://api.gold-api.com/price/BTC';
export class BitcoinError extends Error {
 constructor(code,retryAfterMs=0){super(code);this.code=code;this.retryAfterMs=retryAfterMs;}
}
export function normalizeBitcoin(raw,fetchedAt){
 if(!raw||Array.isArray(raw)||raw.symbol!=='BTC'||raw.currency!=='USD'||typeof raw.price!=='number'||!Number.isFinite(raw.price)||raw.price<=0||typeof raw.updatedAt!=='string'||!Number.isFinite(Date.parse(raw.updatedAt))||!Number.isFinite(Date.parse(fetchedAt)))throw new BitcoinError('schema_changed');
 return {symbol:'BTC',value:raw.price,unit:'USD/BTC',source_url:BITCOIN_ENDPOINT,source_at:raw.updatedAt,fetched_at:fetchedAt,timezone:'Asia/Seoul'};
}
// Planned handoff boundary: B implements transport, timeout, HTTP/JSON errors.
export async function fetchBitcoinQuote(options={}){throw new BitcoinError('not_implemented');}
