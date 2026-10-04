import {blankBundle,SYMBOLS,ageBundle} from './bundle-core.mjs';
import {failure} from './core.mjs';
export function createBundleClient(onChange){
 let data=blankBundle(),busy=false,cached=false,due=0;
 try{const saved=JSON.parse(localStorage.getItem('market-bundle-v2'));if(saved&&SYMBOLS.every(s=>Array.isArray(saved.assets?.[s]?.daily))){data=saved;cached=true;for(const s of SYMBOLS)data.assets[s]=failure(data.assets[s],'offline');}}catch{}
 const view=()=>({data:ageBundle(data),busy,cached,due:Math.max(due,Date.parse(data.next_attempt_at)||0)});
 async function request(collect=false){
  if(busy||(collect&&Date.now()<view().due))return;busy=true;onChange(view());
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{const res=await fetch('/api/bundle',{method:collect?'POST':'GET',cache:'no-store',signal:controller.signal});const next=await res.json();
   if(!SYMBOLS.every(s=>Array.isArray(next.assets?.[s]?.daily)&&['empty','fresh','stale','error'].includes(next.assets[s].status))||!Array.isArray(next.evidence))throw Error('schema_changed');
   if(!res.ok){for(const s of SYMBOLS){if(!next.assets[s].last_good&&data.assets[s].last_good)next.assets[s]={...failure(data.assets[s],next.assets[s].error_code),daily:data.assets[s].daily};}cached=true;due=Date.now()+60000;}else{cached=false;due=0;try{localStorage.setItem('market-bundle-v2',JSON.stringify(next));}catch{}}
   data=next;
  }catch(e){cached=true;due=Date.now()+60000;for(const s of SYMBOLS)data.assets[s]=failure(data.assets[s],controller.signal.aborted?'timeout':e.message==='schema_changed'?'schema_changed':'offline');}
  finally{clearTimeout(timer);busy=false;onChange(view());}
 }
 const offline=()=>{cached=true;for(const s of SYMBOLS)data.assets[s]=failure(data.assets[s],'offline');onChange(view());};
 window.addEventListener('offline',offline);window.addEventListener('pagehide',()=>window.removeEventListener('offline',offline),{once:true});
 return {view,request};
}
