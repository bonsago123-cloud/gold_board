import {fetchBitcoinQuote} from './bitcoin-core.mjs';

export function createBitcoinClient(onChange=()=>{},options={}){
 const now=options.now??(()=>new Date().toISOString());
 let state={status:'empty',error_code:'none',last_good:null,busy:false,due:0};
 const view=()=>({...state,last_good:state.last_good?{...state.last_good}:null});
 const notify=()=>onChange(view());
 async function request(){
  if(state.busy||Date.parse(now())<state.due)return false;
  state.busy=true;notify();
  let success=false,retry=30000;
  try{
   state.last_good=await fetchBitcoinQuote({...options,now});
   state.status='fresh';state.error_code='none';success=true;
  }catch(error){
   state.status=state.last_good?'stale':'error';state.error_code=error.code??'offline';
   retry=Math.max(30000,Number.isFinite(error.retryAfterMs)?error.retryAfterMs:0);
  }finally{
   state.busy=false;state.due=Date.parse(now())+retry;notify();
  }
  return success;
 }
 return {view,request};
}
