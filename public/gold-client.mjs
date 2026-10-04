import {emptyState,failure,withAge} from './core.mjs';
import {blankBundle} from './bundle-core.mjs';
export function goldEvidence(state){return [...(state.evidence??state.daily)].filter(r=>r.symbol==='XAU'&&r.synthetic===false).sort((a,b)=>a.date_kst.localeCompare(b.date_kst)).slice(0,2).map(r=>({date_kst:r.date_kst,records:{XAU:r}}));}
export function createGoldClient(onChange){
 let state=emptyState(),busy=false,cached=false,due=0;
 try{const s=JSON.parse(localStorage.getItem('gold-only-v3'));if(s&&Array.isArray(s.daily)){state=failure(s,'offline');cached=true;}}catch{}
 const view=()=>{const data=blankBundle();data.assets.XAU=withAge(state);data.evidence=goldEvidence(state);return {data,busy,cached,due:Math.max(due,Date.parse(state.next_attempt_at)||0)};};
 async function request(collect=false){
  if(busy||(collect&&Date.now()<view().due))return;busy=true;onChange(view());
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{const res=await fetch('/api/board',{method:collect?'POST':'GET',cache:'no-store',signal:controller.signal});const s=await res.json();
   if(!Array.isArray(s.daily)||!['empty','fresh','stale','error'].includes(s.status))throw Error('schema_changed');
   if(!res.ok){state=failure(state,s.error_code||'storage_error');cached=true;due=Date.now()+30000;}
   else{state=s;cached=false;due=collect?Date.now()+30000:0;try{localStorage.setItem('gold-only-v3',JSON.stringify(state));}catch{}}
  }catch(e){state=failure(state,controller.signal.aborted?'timeout':e.message==='schema_changed'?'schema_changed':'offline');cached=true;due=Date.now()+30000;}
  finally{clearTimeout(timer);busy=false;onChange(view());}
 }
 const offline=()=>{state=failure(state,'offline');cached=true;onChange(view());};window.addEventListener('offline',offline);window.addEventListener('pagehide',()=>window.removeEventListener('offline',offline),{once:true});
 return {view,request};
}
