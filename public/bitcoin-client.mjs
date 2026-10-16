// Planned handoff boundary: B implements state transitions and 30-second cooldown.
export function createBitcoinClient(onChange=()=>{},options={}){
 const view=()=>({status:'empty',error_code:'not_implemented',last_good:null,busy:false,due:0});
 return {view,request:async()=>{onChange(view());return false;}};
}
