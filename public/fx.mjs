export const FX_URL='https://open.er-api.com/v6/latest/USD';
export function normalizeFx(raw,now=Date.now()){
 const rate=raw?.rates?.KRW,at=raw?.time_last_update_unix*1000,next=raw?.time_next_update_unix*1000;
 if(raw?.result!=='success'||raw.base_code!=='USD'||typeof rate!=='number'||!Number.isFinite(rate)||rate<=0||!Number.isFinite(at)||at<=0||at>now+300000||!Number.isFinite(next)||next<=at)throw Error('환율 응답 형식 오류');
 return {rate,source_at:new Date(at).toISOString(),next_at:new Date(next).toISOString(),fetched_at:new Date(now).toISOString()};
}
export function toWon(value,fx){return typeof value==='number'&&Number.isFinite(value)&&fx&&Number.isFinite(fx.rate)&&fx.rate>0&&Number.isFinite(value*fx.rate)?value*fx.rate:null;}
export function createFxClient(onChange){
 let quote=null,error=false,busy=false,attempt=0;
 try{const q=JSON.parse(localStorage.getItem('usd-krw-v1'));if(q&&Number.isFinite(q.rate)&&q.rate>0&&Number.isFinite(Date.parse(q.source_at))&&Number.isFinite(Date.parse(q.next_at))&&Number.isFinite(Date.parse(q.fetched_at))&&Date.parse(q.source_at)<=Date.now()+300000)quote=q;}catch{}
 const view=()=>({quote,busy,stale:error||!!quote&&(Date.now()>Date.parse(quote.next_at)||Date.now()-Date.parse(quote.source_at)>172800000)});
 async function request(){
  if(busy||Date.now()-attempt<60000)return;
  if(quote&&Date.now()-Date.parse(quote.fetched_at)<3600000&&Date.now()<Date.parse(quote.next_at)){onChange(view());return;}
  attempt=Date.now();busy=true;onChange(view());
  try{const res=await fetch(FX_URL,{signal:AbortSignal.timeout(10000),cache:'no-store'});if(!res.ok)throw Error('환율 조회 실패');quote=normalizeFx(await res.json());error=false;try{localStorage.setItem('usd-krw-v1',JSON.stringify(quote));}catch{}}
  catch{error=true;}finally{busy=false;onChange(view());}
 }
 return {view,request};
}
