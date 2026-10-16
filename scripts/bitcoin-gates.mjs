export const REQUIRED=['integrity','fixed_tests','regression','build','live_api','deployment','site','manual','submission'];
export function decision(gates){return REQUIRED.every(id=>gates.filter(g=>g.id===id).length===1&&gates.find(g=>g.id===id).status==='PASS')?'COMPLETE':'BLOCKED';}
export function siteDecision(report){
 if(!Array.isArray(report?.rows)||!report.rows.length)return 'UNVERIFIED';
 if(report.rows.some(r=>r.status==='FAIL'))return 'FAIL';
 if(report.rows.some(r=>r.status!=='PASS'))return 'UNVERIFIED';
 // SETUP alone or partial run cannot prove completion.
 if(!report.rows.some(r=>r.id==='META')||!report.rows.some(r=>r.id==='S08'))return 'UNVERIFIED';
 return 'PASS';
}
