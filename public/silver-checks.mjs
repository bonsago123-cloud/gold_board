import {emptyState} from './core.mjs';
import {normalizeMetal} from './metals.mjs';
import {requestSilver} from './silver-client.mjs';
export async function checkSilverFailures(){
 const clock=Date.now(),now=()=>clock,at=new Date(clock).toISOString();
 const good=value=>async()=>Response.json({quote:normalizeMetal({symbol:'XAG',currency:'USD',price:value,updatedAt:at},'XAG',at)});
 const cases=[
  ['응답 지연','timeout',(_,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}))],
  ['원천 401/403 거절','access_denied',async()=>Response.json({error:'access_denied'},{status:502})],
  ['호출 제한','rate_limited',async()=>Response.json({error:'rate_limited',retry_after:120},{status:502})],
  ['오프라인','offline',async()=>{throw new Error('offline');}],
  ['형식 변경','schema_changed',async()=>Response.json({quote:{symbol:'XAG',value:'invalid'}})]
 ];
 const results=[];
 for(const [label,code,fetcher] of cases){
  const before=await requestSilver(emptyState(),{fetcher:good(30),now});
  const failed=await requestSilver(before,{fetcher,now,timeoutMs:10});
  const recovered=await requestSilver(failed,{fetcher:good(31),now});
  results.push({label,code,passed:failed.status==='stale'&&failed.error_code===code&&JSON.stringify(failed.last_good)===JSON.stringify(before.last_good)&&JSON.stringify(failed.daily)===JSON.stringify(before.daily)&&recovered.status==='fresh'&&recovered.error_code==='none'&&recovered.last_good.value===31&&recovered.daily.length===0,failed:{status:failed.status,error_code:failed.error_code,value:failed.last_good?.value},recovered:{status:recovered.status,error_code:recovered.error_code,value:recovered.last_good?.value}});
 }
 return {synthetic:true,scope:'XAG client response handling; not official T04 fixtures or real prices',checked_at:new Date().toISOString(),results};
}
