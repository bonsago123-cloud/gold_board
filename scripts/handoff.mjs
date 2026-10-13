import {readFile,writeFile,mkdir,rename,readdir,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {sha256,decide,isFresh,fixedResult,inspectLive} from './handoff-core.mjs';
import {normalizeCopper,COPPER_ENDPOINT} from '../public/copper-core.mjs';
const root=process.cwd();
const mode=process.argv[2]??'status';
const readJSON=async p=>JSON.parse(await readFile(p,'utf8'));
const config=await readJSON('handoff/config.json');
const atomic=async(p,value)=>{await mkdir(path.dirname(p),{recursive:true});const tmp=p+'.tmp';await writeFile(tmp,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');await rename(tmp,p);};
function git(...args){const r=spawnSync('git',args,{encoding:'utf8'});if(r.status!==0)throw new Error('Git metadata unavailable');return r.stdout.trim();}
async function digest(){
  // Include working-tree edits AND new files, excluding generated reports and secret/local artifacts.
  const entries=[];
  async function walk(dir){for(const e of (await readdir(dir||'.',{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    const p=dir?`${dir}/${e.name}`:e.name;
    if(['.git','node_modules','dist','.vercel','test-output','handoff/history','handoff/latest.json','handoff/session.json','HANDOFF.json','docs/handoff/current.md','public/handoff-status.json'].includes(p)||e.name.startsWith('.env')||p.endsWith('.tmp'))continue;
    if(e.isDirectory())await walk(p);else if(e.isFile())entries.push(`${p}\0${sha256(await readFile(p))}`);
  }}
  await walk('');return sha256(entries.join('\n'));
}
async function integrity(){
  if(config.fixed_ids.length!==10||new Set(config.fixed_ids).size!==10)throw new Error('Exactly ten fixed IDs required');
  if(COPPER_ENDPOINT!==config.endpoint)throw new Error('Fixed endpoint changed');
  for(const [file,expected] of Object.entries(config.fixed_files)){
    if(sha256(await readFile(file))!==expected)throw new Error(`Fixed content changed: ${file}`);
    // Verify the pinned hash against original Git history, not just against an editable new expectation.
    const original=spawnSync('git',['show',`${config.baseline_commit}:${file}`]);
    if(original.status!==0||sha256(original.stdout)!==expected)throw new Error(`Original baseline missing/mismatch: ${file}`);
  }
  const text=await readFile('docs/task5/copper-fixed-tests.md','utf8');
  const ids=[...text.matchAll(/^\| (T05-CU\d{2}) \|/gm)].map(m=>m[1]);
  if(ids.join()!==config.fixed_ids.join())throw new Error('Fixed ID sequence changed');
  return {status:'PASS',reason:'Original Git baseline + document + executable hashes unchanged'};
}
function run(args){const r=spawnSync(process.execPath,args,{encoding:'utf8',timeout:120000,maxBuffer:2e6});return {status:r.status===0?'PASS':'FAIL',exit_code:r.status,output:((r.stdout??'')+(r.stderr??'')).slice(-24000)};}
async function commandGate(id,args){const r=run(args);if(id==='fixed_tests'&&!fixedResult(r.output,config.fixed_ids))r.status='FAIL';return r;}
async function deployment(){
  try{
    for(const file of config.deployed_files){
      const response=await fetch(new URL('/'+file,config.deployment_url),{signal:AbortSignal.timeout(12000),redirect:'error',cache:'no-store'});
      if(!response.ok)return {status:'FAIL',reason:`Deployment ${file}: HTTP ${response.status}`};
      if(sha256(Buffer.from(await response.arrayBuffer()))!==sha256(await readFile('public/'+file)))return {status:'FAIL',reason:`Deployment differs from current source: ${file}`};
    }
    return {status:'PASS',reason:'Anonymous deployment files match current source bytes'};
  }catch{return {status:'UNVERIFIED',reason:'Deployment unavailable from this execution environment'};}
}
async function submission(){
  const s=await readJSON('handoff/submission.json');
  const missing=[];
  for(const key of ['a_actual_seconds','a_actual_requests','a_failed_test_runs','b_actual_seconds','b_actual_requests','b_failed_test_runs'])if(!Number.isFinite(s[key])||s[key]<0)missing.push(key);
  for(const who of ['a','b'])if(s[who+'_actual_seconds']>1800||s[who+'_actual_requests']>10)missing.push('original '+who+' limit exceeded');
  if(s.different_models_confirmed!==true)missing.push('different_models_confirmed');
  for(const key of ['student_tool_choice','student_decision','student_rejected_suggestion_or_reason','common_request_unit'])if(typeof s[key]!=='string'||!s[key].trim())missing.push(key);
  for(const key of ['a_usage_evidence_path','b_usage_evidence_path','model_evidence_path']){
    if(typeof s[key]!=='string'||!s[key].startsWith('docs/task5/')||s[key].includes('..')){missing.push(key);continue;}
    try{if(!(await readFile(s[key],'utf8')).trim())missing.push(key);}catch{missing.push(key);}
  }
  return {status:missing.length?'UNVERIFIED':'PASS',reason:missing.length?'Missing human evidence: '+missing.join(', '):'Required evidence present; human truthfulness is not machine-verifiable'};
}
async function publish(report){
  const decision=decide(report.gates);
  report.phase=decision.phase;report.blockers=decision.blockers;
  report.next_action=decision.blockers.length?config.next_actions[decision.blockers[0]]:'검증 완료. 현재 목표를 유지하며 다음 요청을 기다린다. 새 기능은 사용자 요청이 있을 때만 시작한다.';
  if(!report.finished_at)report.phase='VERIFYING';
  await atomic(`handoff/history/${report.id}.json`,report);
  await atomic('handoff/latest.json',report);
  const manifest=await readJSON('HANDOFF.json');
  Object.assign(manifest,{schema_version:2,protocol:'repository-handoff-v2',phase:report.phase,submission_ready:report.phase==='COMPLETE',handoff_document:'docs/handoff/current.md',runtime_report:'handoff/latest.json',config:'handoff/config.json',next_action:report.next_action,last_run_id:report.id,verified_source_digest:report.source_digest,source_commit:report.source_commit,completion_scope:'실제 API·배포·브라우저·증빙을 포함한 모든 필수 gate가 PASS일 때만 COMPLETE. 모의 검사 통과만으로 완료 금지.',commands:{resume:'npm run handoff:resume',finish:'npm run handoff:finish',status:'npm run handoff:status',validate_handoff:'npm run handoff:check',run_fixed_tests:'npm run task5:check',baseline_tests:'npm test',build:'npm run build'}});
  await atomic('HANDOFF.json',manifest);
  const summary=report.gates.map(g=>`- ${g.id}: ${g.status}${g.reason?' — '+g.reason:''}`).join('\n');
  await atomic('docs/handoff/current.md',`# 현재 인수인계 — ${config.feature_id}\n\n## 1. 목표\n${config.title}\n\n## 2. 현재 상태\n${report.phase}. COMPLETE 문구를 믿지 말고 시작 시 재검증한다.\n실행 ID: ${report.id}\n시작 기준 커밋: ${report.source_commit}\n검사한 작업트리 SHA-256: ${report.source_digest}\n검사 시각: ${report.finished_at??'실행 중'}\n부모 실행: ${report.parent_run_id??'없음'}\n실행 환경: ${report.environment}\n이 JSON과 handoff/latest.json은 명령이 자동 생성한다. GitHub 홈페이지 업로드로 커밋 SHA가 바뀌어도 작업트리 해시로 검증하며 다음 실행에서 실제 HEAD를 자동 기록한다.\n\n## 3. 실행 명령\nNode 24, Git 필요. 저장소 루트에서 npm ci 후 npm run handoff:resume. 브라우저 실행 파일이 없으면 npx playwright install chromium. 종료 시 npm run handoff:finish. Windows PowerShell 정책 오류 시 npm 대신 npm.cmd 사용.\n실행 권한/네트워크가 없으면 UNVERIFIED로 남긴다. 과거 대화 대신 이 저장소만 읽는다.\n\n## 4. 통과 검사\n${summary}\n전체 출력: handoff/history/${report.id}.json\n고정 10개는 변경하지 않으며 운영 gate는 별도로 관리한다.\n\n## 5. 남은 문제\n${report.blockers.length?report.blockers.map(id=>'- '+id+': '+config.next_actions[id]).join('\n'):'없음'}\n실패 종료 코드는 작업 중단 명령이 아니라 완료 불가 신호다. 수정 가능한 문제를 계속 해결한다.\n\n## 6. 다음 행동\n${report.next_action}\nAGENTS.md의 반복 절차를 따른다. 매 작업 종료 시 finish가 검사·상태·7항목·실행 이력을 갱신한다. 아직 실패해도 기록하고 다음 AI가 같은 resume으로 이어받는다.\n\n## 7. 건드리지 말 것\n${config.protected_areas.map(x=>'- '+x).join('\n')}\n`);
  await atomic('public/handoff-status.json',{...report,gates:report.gates.map(({output,...g})=>g)});
}
async function main(){
 if(mode==='new')throw new Error('현재 목표가 완료되기 전 새 기능 초기화 금지. 다음 AI는 handoff:resume으로 이어받는다.');
 if(mode==='status'||mode==='check'){
   const hash=await digest();
   let report;try{report=await readJSON('handoff/latest.json');}catch{throw new Error('검사 기록 없음. npm run handoff:resume');}
   const fresh=isFresh(report,hash,Date.now(),config.evidence_max_age_minutes);
   const state=decide(report.gates);
   console.log(JSON.stringify({phase:fresh?state.phase:'UNVERIFIED',fresh,blockers:state.blockers,next_action:fresh?report.next_action:'npm run handoff:resume',report:'handoff/latest.json'},null,2));
   if(mode==='check')await integrity();
   process.exitCode=fresh&&state.phase==='COMPLETE'?0:1;return;
 }
 if(!['resume','finish','ci'].includes(mode))throw new Error('Use resume, finish, status or check');
 let parent=null,session=null;
 try{parent=await readJSON('handoff/latest.json');}catch{}
 try{session=await readJSON('handoff/session.json');}catch{}
 if(mode==='finish'&&(!session||session.closed_at))throw new Error('활성 세션 없음. 먼저 npm run handoff:resume');
 const started_at=new Date().toISOString(),id=started_at.replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8);
 const report={schema_version:2,id,mode,feature_id:config.feature_id,source_commit:git('rev-parse','HEAD'),source_digest:await digest(),parent_run_id:parent?.id??null,parent_report_sha256:parent?sha256(JSON.stringify(parent)):null,started_at,finished_at:null,environment:process.env.GITHUB_ACTIONS?'github-actions':'local',ci_run_url:process.env.GITHUB_RUN_ID?`https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`:null,gates:[]};
 if(mode==='resume'){
   session={id,started_at,start_commit:report.source_commit,start_digest:report.source_digest,inherited_session_id:session?.id??null,closed_at:null};
   await atomic('handoff/session.json',session);
 }
 if(session)report.session_id=session.id;
 await publish(report); // Invalidate any old COMPLETE before the first potentially failing operation.
 const gates=[
   ['integrity',integrity],
   ['fixed_tests',()=>commandGate('fixed_tests',['scripts/task5-copper-check.mjs'])],
   ['regression',async()=>commandGate('regression',['--test',...(await readdir('tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+f)])],
   ['build',()=>commandGate('build',['scripts/build.mjs'])],
   ['live_api',()=>inspectLive({endpoint:config.endpoint,origin:config.deployment_url,normalize:normalizeCopper})],
   ['deployment',deployment],
   ['browser',()=>report.gates.some(g=>['live_api','deployment'].includes(g.id)&&g.status!=='PASS')?{status:'NOT_RUN',reason:'Requires real API and current deployment to pass first'}:commandGate('browser',['scripts/handoff-browser.mjs',config.deployment_url])],
   ['submission',submission]
 ];
 for(const [gate,fn] of gates){
   let result;try{result=await fn();}catch(error){result={status:'FAIL',reason:error.message};}
   report.gates.push({id:gate,...result});
   console.log(`${gate}: ${result.status}${result.reason?' — '+result.reason:''}`);
   await publish(report);
 }
 // Prevent a concurrent source edit from being attached to earlier PASS results.
 if(await digest()!==report.source_digest){report.gates.find(g=>g.id==='integrity').status='FAIL';report.gates.find(g=>g.id==='integrity').reason='Source changed during verification; rerun';}
 report.finished_at=new Date().toISOString();
 if(mode==='finish'){
   session.closed_at=report.finished_at;session.end_commit=report.source_commit;session.end_digest=report.source_digest;session.elapsed_seconds=Math.round((Date.parse(session.closed_at)-Date.parse(session.started_at))/1000);session.last_run_id=id;
   report.session_elapsed_seconds=session.elapsed_seconds;await atomic('handoff/session.json',session);
 }
 await publish(report);
 if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,`# Handoff: ${report.phase}\n\n${report.gates.map(g=>`- ${g.id}: **${g.status}** ${g.reason??''}`).join('\n')}\n\nNext: ${report.next_action}\n\nDownload handoff-evidence artifact for updated handoff/latest.json and current.md.\n`);
 console.log(`\n${report.phase}\nNEXT: ${report.next_action}\nEvidence: handoff/history/${id}.json`);
 process.exitCode=report.phase==='COMPLETE'?0:1;
}
try{await main();}catch(error){console.error('HANDOFF ERROR:',error.message);process.exitCode=2;}
