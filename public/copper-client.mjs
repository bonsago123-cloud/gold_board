import {fetchCopperQuote} from './copper-core.mjs';

function blank(){
  return {
    status:'empty',
    error_code:'none',
    last_good:null,
    busy:false,
    due:0
  };
}

export function createCopperClient(onChange=()=>{},options={}){
  let state=blank();
  const now=options.now??(()=>new Date().toISOString());

  function emit(){
    onChange({...state});
  }

  async function request(){
    if(state.busy||Date.parse(now())<state.due)return false;
    state={...state,busy:true};
    emit();
    try{
      const quote=await fetchCopperQuote(options);
      state={
        status:'fresh',
        error_code:'none',
        last_good:quote,
        busy:false,
        due:0
      };
      emit();
      return true;
    }catch(error){
      state={
        status:state.last_good?'stale':'error',
        error_code:error.code??'offline',
        last_good:state.last_good,
        busy:false,
        due:Date.parse(now())+(error.code==='rate_limited'?error.retryAfterMs:30000)
      };
      emit();
      return false;
    }
  }

  return {
    view:()=>({...state}),
    request
  };
}
