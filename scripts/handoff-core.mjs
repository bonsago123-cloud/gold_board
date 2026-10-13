import {createHash} from 'node:crypto';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const REQUIRED_GATES=['integrity','fixed_tests','regression','build','live_api','deployment','browser','submission'];
export function decide(gates){
  const blockers=REQUIRED_GATES.filter(id=>!gates.some(g=>g.id===id&&g.status==='PASS'));
  return {phase:blockers.length?'BLOCKED':'COMPLETE',blockers};
}
export function isFresh(report,digest,now=Date.now(),maxMinutes=60){
  const age=now-Date.parse(report?.finished_at);
  return report?.source_digest===digest&&Number.isFinite(age)&&age>=0&&age<=maxMinutes*60000;
}
export function fixedResult(output,ids){
  const found=[...output.matchAll(/^PASS (T05-CU\d{2})\s*$/gm)].map(m=>m[1]);
  return found.length===10&&new Set(found).size===10&&ids.every(id=>found.includes(id))&&/^RESULT 10\/10\s*$/m.test(output)&&!/^FAIL /m.test(output);
}
export async function inspectLive({fetcher=fetch,endpoint,origin,normalize,now=()=>new Date().toISOString()}){
  try{
    const response=await fetcher(endpoint,{headers:{Accept:'application/json',Origin:origin},signal:AbortSignal.timeout(12000),redirect:'error'});
    const http_status=response.status;
    if(!response.ok)return {status:'FAIL',http_status,reason:`HTTP ${http_status} from fixed endpoint`};
    let raw;
    try{raw=await response.json();}catch{return {status:'FAIL',http_status,reason:'Invalid JSON'};}
    let quote;
    try{quote=normalize(raw,now());}catch{return {status:'FAIL',http_status,reason:'Invalid price/schema/unit'};}
    const cors=response.headers.get('access-control-allow-origin');
    if(cors!=='*'&&cors!==origin)return {status:'FAIL',http_status,reason:'Browser CORS permission missing'};
    return {status:'PASS',http_status,quote};
  }catch(error){
    return {status:'UNVERIFIED',reason:`Network/runtime failure: ${error?.name??'Error'}. Live success not established.`};
  }
}
