import {emptyState,failure,withAge,kstDate,normalize,formatValue} from './core.mjs';
import {normalizeMetal} from './metals.mjs';
export const SYMBOLS=['XAU','XAG','WTI','WHEAT'];
export const PROVIDER_SYMBOL={WTI:'WTIOIL',WHEAT:'WHEAT'};
export function blankBundle(){return {assets:Object.fromEntries(SYMBOLS.map(s=>[s,emptyState()])),evidence:[],next_attempt_at:null,last_run:null};}
export function normalizeRecord(raw,symbol,fetchedAt){
 if(!SYMBOLS.includes(symbol))throw Error('schema_changed');
 if(symbol==='XAU')return normalize(raw,fetchedAt);
 if(symbol==='XAG')return {...normalizeMetal(raw,symbol,fetchedAt),date_kst:kstDate(fetchedAt),synthetic:false,raw:{symbol:raw.symbol,currency:raw.currency,price:raw.price,updatedAt:raw.updatedAt}};
 const provider=PROVIDER_SYMBOL[symbol],rate=raw?.rates?.[provider],unit=raw?.unit?.[provider];
 if(raw?.success!==true||raw.base!=='USD'||typeof rate!=='number'||!Number.isFinite(rate)||rate<=0||!Number.isFinite(1/rate)||typeof unit!=='string'||!/^per [a-zA-Z0-9 ./-]{1,50}$/.test(unit)||typeof raw.timestamp!=='number'||!Number.isFinite(raw.timestamp)||raw.timestamp<=0||raw.timestamp*1000>Date.parse(fetchedAt)+300000)throw Error('schema_changed');
 const sourceAt=new Date(raw.timestamp*1000).toISOString();
 return {symbol,value:1/rate,unit:`USD / ${unit.slice(4)}`,source_url:`https://commodities-api.com/symbols/${provider}`,source_at:sourceAt,fetched_at:fetchedAt,date_kst:kstDate(fetchedAt),timezone:'Asia/Seoul',synthetic:false,conversion:'1 / rate',raw:{success:true,base:'USD',timestamp:raw.timestamp,rates:{[provider]:rate},unit:{[provider]:unit}}};
}
export function recordMatches(record){try{const q=normalizeRecord(record.raw,record.symbol,record.fetched_at);return ['value','unit','source_url','source_at','fetched_at','date_kst','timezone'].every(k=>q[k]===record[k]);}catch{return false;}}
export function applyOutcome(state,outcome){
 if(outcome.error!=='none')return failure(state,outcome.error);
 const record=outcome.record,rows=new Map(state.daily.map(r=>[r.date_kst,r]));rows.set(record.date_kst,record);
 return {...state,last_good:record,daily:[...rows.values()].sort((a,b)=>a.date_kst.localeCompare(b.date_kst)),status:'fresh',error_code:'none'};
}
export function ageBundle(bundle){return {...bundle,assets:Object.fromEntries(SYMBOLS.map(s=>[s,withAge(bundle.assets[s])]))};}
export function safeDelta(rows){const ordered=[...rows].sort((a,b)=>a.date_kst.localeCompare(b.date_kst));if(ordered.length<2)return null;const [a,b]=ordered.slice(-2);if(a.source_url!==b.source_url||a.unit!==b.unit)return null;return {from:a,to:b,value:b.value-a.value,percent:(b.value-a.value)/a.value*100};}
export function displayTime(value){return value?new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'—';}
export {formatValue};
