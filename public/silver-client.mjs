import {failure,withAge,ERRORS} from './core.mjs';
import {METALS} from './metals.mjs';
// Shared by the public dashboard and verification. Never writes daily evidence.
export async function requestSilver(state,{fetcher=fetch,now=Date.now,timeoutMs=12000}={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 let due=now()+60000;
 try{
  const response=await fetcher('/api/metals?symbol=XAG',{cache:'no-store',signal:controller.signal});
  let data;try{data=await response.json();}catch{throw new Error('schema_changed');}
  if(!response.ok){due=now()+Math.max(60,Math.min(3600,Number(data?.retry_after)||60))*1000;throw new Error(Object.hasOwn(ERRORS,data?.error)?data.error:'upstream_error');}
  const q=data?.quote;
  if(!q||q.symbol!=='XAG'||typeof q.value!=='number'||!Number.isFinite(q.value)||q.value<=0||q.unit!==METALS.XAG.unit||q.source_url!=='https://api.gold-api.com/price/XAG'||q.timezone!=='Asia/Seoul'||![q.source_at,q.fetched_at].every(t=>typeof t==='string'&&Number.isFinite(Date.parse(t))&&Date.parse(t)<=now()+300000))throw new Error('schema_changed');
  return withAge({...state,last_good:q,status:'fresh',error_code:'none',due:now()+30000},now());
 }catch(error){return {...failure(state,controller.signal.aborted?'timeout':Object.hasOwn(ERRORS,error.message)?error.message:'offline'),due};}
 finally{clearTimeout(timer);}
}
