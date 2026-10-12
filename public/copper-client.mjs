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

  function emit(){
    onChange({...state});
  }

  async function request(){
    if(state.busy)return false;
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
    }catch{
      // AI A의 계획된 중단 지점.
      // 실패 원인 구분, 마지막 정상값 보존, retry-after/backoff는 AI B가 구현한다.
      state={
        status:'error',
        error_code:'request_failed',
        last_good:null,
        busy:false,
        due:0
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
