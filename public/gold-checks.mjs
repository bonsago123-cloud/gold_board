import {emptyState} from './core.mjs';
import {replay} from './fixtures.mjs';
export async function runGoldChecks(){
 const results=[];
 for(const [id,code] of [['LOCAL-SLOW','timeout'],['LOCAL-DENIED','access_denied'],['LOCAL-LIMIT','rate_limited'],['LOCAL-OFFLINE','offline'],['LOCAL-SCHEMA','schema_changed']]){
  let s=await replay(emptyState(),'LOCAL-D1-A');s=await replay(s,'LOCAL-D1-B');
  const before=JSON.stringify(s.daily),value=s.last_good.value;
  s=await replay(s,id);const failed=s.status==='stale'&&s.error_code===code&&s.last_good.value===value&&JSON.stringify(s.daily)===before&&s.daily.length===1;
  s=await replay(s,'LOCAL-RECOVER-D2');s=await replay(s,'LOCAL-RECOVER-D2');
  const result={passed:failed&&s.status==='fresh'&&s.error_code==='none'&&s.daily.length===2,status:s.status,error_code:s.error_code,rows:s.daily.length,last_good:s.last_good};
  results.push({code,assets:{XAU:result},passed:result.passed});
 }
 return {synthetic:true,checked_at:new Date().toISOString(),results};
}
