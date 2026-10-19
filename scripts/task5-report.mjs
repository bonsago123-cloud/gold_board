import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function generateTask5Report(){
 const h=await read('HANDOFF.json'), contract=await read(h.config), freeze=await read('docs/task5/chart-restart/freeze.json');
 for(const [p,digest] of Object.entries(freeze.files))if(sha(await readFile(p))!==digest)throw Error('Fixed checks changed: '+p);
 const root='handoff/restart/history/', sessions=[];let id=h.last_session;const seen=new Set();
 while(id){if(!/^[-\w]+$/.test(id)||seen.has(id))throw Error('Invalid session chain');seen.add(id);const s=await read(root+id+'.session.json');sessions.unshift(s);id=s.parent_session_id;}
 const records=[];
 for(const [i,s] of sessions.entries()){
  const runs=await Promise.all(s.runs.map(id=>read(root+id+'.checks.json')));const result=runs.at(-1);
  const ids=contract.tests.map(t=>t.id);if(result.rows.length!==10||new Set(result.rows.map(t=>t.id)).size!==10||result.rows.some(t=>!ids.includes(t.id)))throw Error('Invalid result IDs');
  const pass=result.rows.filter(t=>t.status==='PASS').length;
  let equal=null;if(i){const received=await readFile(root+s.id+'.received.md'),outgoing=await readFile(root+sessions[i-1].id+'.outgoing.md');equal=received.equals(outgoing)&&sha(received)===s.received_handoff_sha256&&sha(outgoing)===sessions[i-1].outgoing_handoff_sha256;}
  records.push({label:`실행 ${i+1}`,id:s.id,started_at:s.started_at,closed_at:s.closed_at,seconds:s.elapsed_seconds,requests:s.user_work_requests,failed_rounds:runs.filter(r=>r.rows.some(t=>t.status==='FAIL')).length,passed:pass,total:10,handoff_equal:equal,within_limits:s.elapsed_seconds<=contract.limits.seconds_per_agent&&s.user_work_requests<=contract.limits.user_work_requests_per_agent,rows:result.rows.map(({id,status})=>({id,status}))});
 }
 const evidence=await read('docs/task5/chart-restart/final/evidence.json');
 const data={feature:contract.feature_id,generated_at:new Date().toISOString(),phase:records.at(-1)?.passed===10?'FEATURE_COMPLETE':'IN_PROGRESS',limits:contract.limits,tests:contract.tests,records,evidence};
 await writeFile('public/task5-report.json',JSON.stringify(data,null,2)+'\n');return data;
}
if(process.argv[1]?.endsWith('/task5-report.mjs'))await generateTask5Report();
