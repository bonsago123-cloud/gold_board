import {SYMBOLS,normalizeRecord,applyOutcome,recordMatches} from './bundle-core.mjs';
import {emptyState} from './core.mjs';
function fixture(symbol,at,value){
 const raw=['XAU','XAG'].includes(symbol)?{symbol,currency:'USD',price:value,updatedAt:at}:{success:true,base:'USD',timestamp:Date.parse(at)/1000,rates:{WTIOIL:1/value,WHEAT:1/value},unit:{WTIOIL:'per barrel',WHEAT:'per metric ton'}};
 return {...normalizeRecord(raw,symbol,at),synthetic:true};
}
export function runBundleChecks(){
 const results=[];for(const code of ['timeout','access_denied','rate_limited','offline','schema_changed']){
  const assets={};for(const symbol of SYMBOLS){
   let s=emptyState();for(const value of [100,105,105])s=applyOutcome(s,{error:'none',record:fixture(symbol,'2026-01-01T03:00:00Z',value)});
   const before=JSON.stringify(s);s=applyOutcome(s,{error:code});const retained=s.status==='stale'&&s.error_code===code&&s.last_good.value===JSON.parse(before).last_good.value&&JSON.stringify(s.daily)===JSON.stringify(JSON.parse(before).daily)&&s.daily.length===1;
   for(let i=0;i<2;i++)s=applyOutcome(s,{error:'none',record:fixture(symbol,'2026-01-02T03:00:00Z',120)});
   assets[symbol]={passed:retained&&s.status==='fresh'&&s.error_code==='none'&&s.daily.length===2&&recordMatches(s.last_good),status:s.status,error_code:s.error_code,rows:s.daily.length,last_good:s.last_good};
  }results.push({code,assets,passed:SYMBOLS.every(s=>assets[s].passed)});
 }
 return {synthetic:true,checked_at:new Date().toISOString(),results};
}
