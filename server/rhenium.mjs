export function rheniumValue(rate){if(typeof rate!=='number'||!Number.isFinite(rate)||rate<=0||!Number.isFinite(1/rate))throw new Error('schema_changed');return 1/rate;}
export function rheniumQuote(data,now=new Date().toISOString()){
 if(data?.success!==true||data.base!=='USD'||typeof data.timestamp!=='number'||!Number.isFinite(data.timestamp)||data.timestamp<=0||data.timestamp*1000>Date.parse(now)+300000)throw new Error('schema_changed');
 return {symbol:'RHENIUM',value:rheniumValue(data.rates?.RHENIUM),unit:'USD / 트로이온스',source_url:'https://metals-api.com/symbols/RHENIUM',source_at:new Date(data.timestamp*1000).toISOString(),fetched_at:now,timezone:'Asia/Seoul'};
}
export function rheniumHistory(data){
 if(data?.success!==true||data.base!=='USD'||!data.rates||typeof data.rates!=='object')throw new Error('schema_changed');
 return Object.entries(data.rates).map(([date,rates])=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date)))throw new Error('schema_changed');return {date,value:rheniumValue(rates.RHENIUM)};}).sort((a,b)=>a.date.localeCompare(b.date));
}
