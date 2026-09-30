// Independently authored synthetic samples. NOT the official T04 package.
import { emptyState, fetchQuote, success, failure } from './core.mjs';
const body = (price,time) => ({ symbol:'XAU', currency:'USD', price, updatedAt:time });
export const FIXTURES = {
  'LOCAL-D1-A': { label:'D1-A 정상', at:'2026-01-01T01:00:00Z', body:body(3000,'2026-01-01T00:59:30Z') },
  'LOCAL-D1-B': { label:'D1-B 같은 날 갱신', at:'2026-01-01T02:00:00Z', body:body(3010,'2026-01-01T01:59:30Z') },
  'LOCAL-SLOW': { label:'느린 응답', at:'2026-01-01T03:00:00Z', timeout:true },
  'LOCAL-DENIED': { label:'401 / 403 거절', at:'2026-01-01T03:00:00Z', status:403 },
  'LOCAL-LIMIT': { label:'429 호출 제한', at:'2026-01-01T03:00:00Z', status:429 },
  'LOCAL-OFFLINE': { label:'오프라인', at:'2026-01-01T03:00:00Z', offline:true },
  'LOCAL-SCHEMA': { label:'형식 변경', at:'2026-01-01T03:00:00Z', body:{ gold:'changed', time:null } },
  'LOCAL-RECOVER-D2': { label:'D2 정상 복구', at:'2026-01-02T01:00:00Z', body:body(3040,'2026-01-02T00:59:30Z') },
  'LOCAL-EMPTY': { label:'초기화', reset:true }
};
export async function replay(state,id) {
  const f=FIXTURES[id];
  if(!f) throw new Error('Unknown synthetic fixture');
  if(f.reset) return emptyState();
  const fetcher=async(_url,{signal})=>{
    if(f.offline) throw new TypeError('Synthetic offline');
    if(f.timeout) return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Synthetic timeout','AbortError')),{once:true}));
    return new Response(JSON.stringify(f.body??{}),{status:f.status??200,headers:{'Content-Type':'application/json','Retry-After':'60'}});
  };
  try {
    const row=await fetchQuote({fetcher,now:()=>f.at,timeoutMs:150});
    return success(state,{...row,synthetic:true});
  } catch(error) { return failure(state,error.code); }
}
