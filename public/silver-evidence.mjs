import {createBundleClient} from './bundle-client.mjs';
import {recordMatches} from './bundle-core.mjs';
export function silverEvidence(state){
 const dates=new Map();
 for(const r of state.daily??[])if(r.symbol==='XAG'&&r.synthetic===false&&recordMatches(r))dates.set(r.date_kst,r);
 return [...dates.values()].sort((a,b)=>a.date_kst.localeCompare(b.date_kst)).slice(-2).map(r=>({date_kst:r.date_kst,records:{XAG:r}}));
}
export function createSilverClient(onChange){
 const adapt=v=>({...v,data:{...v.data,evidence:silverEvidence(v.data.assets.XAG)}});
 const base=createBundleClient(v=>onChange(adapt(v)));
 return {view:()=>adapt(base.view()),request:collect=>base.request(collect)};
}
