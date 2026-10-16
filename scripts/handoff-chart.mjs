import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const mode=process.argv[2]??'status',root='handoff/chart',now=()=>new Date().toISOString();
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const save=async(p,x)=>writeFile(p,JSON.stringify(x,null,2)+'\n');
const hash=x=>createHash('sha256').update(x).digest('hex');
const git=(...a)=>{const r=spawnSync('git',a,{encoding:'utf8'});if(r.status)throw Error('Git: '+r.stderr);return r.stdout.trim();};
await mkdir(root+'/history',{recursive:true});
async function integrity(){const f=await read('docs/task5/bitcoin-chart/freeze.json');for(const [p,h]of Object.entries(f.files))if(hash(await readFile(p))!==h)throw Error('Frozen bytes changed '+p);const a=git('log','--reverse','--format=%H','--','docs/task5/bitcoin-chart/freeze.json').split('\n')[0];if(!a)return {status:'UNVERIFIED',reason:'Local freeze valid; upload Git anchor required'};for(const p of [...Object.keys(f.files),'docs/task5/bitcoin-chart/freeze.json']){const b=spawnSync('git',['show',a+':'+p]);if(b.status||hash(b.stdout)!==hash(await readFile(p)))throw Error('Git freeze changed '+p);}return {status:'PASS',anchor:a};}
async function sourceDigest(){const rows=[];async function walk(dir){for(const e of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const p=dir+'/'+e.name;if(p==='public/handoff-status.json')continue;if(e.isDirectory())await walk(p);else rows.push(p+'\0'+hash(await readFile(p)));}}await walk('public');await walk('api');return hash(rows.join('\n'));}
async function review(id,digest){try{const r=await read(root+'/review.json');if(r.source_digest!==digest||!r.finished_at||Date.now()-Date.parse(r.finished_at)>3600000||Date.parse(r.finished_at)>Date.now())throw Error('Missing/current source evidence required');const g=r.gates?.find(x=>x.id===id);if(!g||!['PASS','FAIL','UNVERIFIED'].includes(g.status)||!g.evidence?.startsWith('docs/task5/bitcoin-chart/')||g.evidence.includes('..'))throw Error('Missing evidence '+id);const data=await readFile(g.evidence);if(hash(data)!==g.sha256)throw Error('Evidence hash mismatch '+id);if(id==='submission'&&g.status==='PASS'){const pair=await read(root+'/comparison.json');if(!Array.isArray(pair.session_ids)||pair.session_ids.length!==2||pair.session_ids[0]===pair.session_ids[1]||pair.session_ids.some(x=>!/^[-a-zA-Z0-9]+$/.test(x)))throw Error('Select two actual completed sessions for assignment comparison');const [a,b]=await Promise.all(pair.session_ids.map(x=>read(root+'/history/'+x+'.session.json')));if(!a.closed_at||!b.closed_at||!a.within_limits||!b.within_limits||!a.end_commit||!b.end_commit||g.different_models!==true||g.handoff_equal!==true||g.public_report_verified!==true||!g.student_decisions_verified)throw Error('Submission facts missing');}return {...g,reason:'Operator evidence supplied; inspect actual observations, not only status'};}catch(e){return {id,status:'UNVERIFIED',reason:e.message};}}
async function run(cmd){const r=spawnSync(cmd,{shell:true,encoding:'utf8',timeout:360000,maxBuffer:8e6});return {status:r.error?'UNVERIFIED':r.status===0?'PASS':'FAIL',exit_code:r.status,output:(r.stdout??'')+(r.stderr??'')};}
try{
 if(mode==='status'){console.log(await read(root+'/latest.json'));}
 else if(mode==='resume'){
  let previous;try{previous=await read(root+'/session.json');}catch{}
  if(previous&&!previous.closed_at){console.log('Resuming existing session '+previous.id+'; start time and request count preserved.');process.exit(0);}
  if(previous)await save(root+'/history/'+previous.id+'.session.json',previous);
  const received=await readFile('docs/handoff/current.md');const id=now().replace(/[:.]/g,'-');
  const s={id,parent_session_id:previous?.id??null,parent_session_sha256:previous?hash(JSON.stringify(previous)):null,started_at:now(),start_commit:git('rev-parse','HEAD'),received_handoff_sha256:hash(received),handoff_equal:previous?.outgoing_handoff_sha256?hash(received)===previous.outgoing_handoff_sha256:null,user_work_requests:1,service:'UNVERIFIED',model:'UNVERIFIED',closed_at:null};
  await writeFile(root+'/history/'+id+'.received.md',received);await save(root+'/session.json',s);await save(root+'/notes.json',{});console.log('Session started. Record actual service/model and additional user requests in session.json.');
 }else if(mode==='request') {const s=await read(root+'/session.json');if(s.closed_at)throw Error('Closed session');s.user_work_requests++;await save(root+'/session.json',s);if(s.user_work_requests>10)throw Error('Request limit exceeded; stop and hand off');}
 else if(['check','finish','ci'].includes(mode)){
  let session=null;if(mode==='finish'){session=await read(root+'/session.json');if(session.closed_at)throw Error('Session already closed');}
  const r={id:now().replace(/[:.]/g,'-'),started_at:now(),source_commit:git('rev-parse','HEAD'),source_digest:await sourceDigest(),mode,gates:[],phase:'BLOCKED',submission_ready:false};
  try{r.gates.push({id:'integrity',...await integrity()});}catch(e){r.gates.push({id:'integrity',status:'FAIL',reason:e.message});}
  for(const [id,cmd]of [['chart_fixed','node scripts/task5-chart-check.mjs'],['quote_fixed','node scripts/task5-bitcoin-check.mjs'],['regression','npm test'],['build','npm run build'],['site','npm run site:check']]){console.log('Running '+id);const g=await run(cmd);if(id==='chart_fixed'){try{const x=await read('test-output/chart-fixed.json');if(x.rows.some(v=>v.status==='UNVERIFIED'))g.status='UNVERIFIED';}catch{g.status='UNVERIFIED';}}if(id==='site'){try{const x=await read('test-output/site-check/result.json');g.status=Date.parse(x.started)<Date.parse(r.started_at)?'UNVERIFIED':x.counts.FAIL?'FAIL':x.counts.UNVERIFIED?'UNVERIFIED':g.status;}catch{g.status='UNVERIFIED';}}r.gates.push({id,...g});await save(root+'/latest.json',r);}
  for(const id of ['live_chart','deployment_match','manual_all_functions','submission'])r.gates.push(await review(id,r.source_digest));
  r.finished_at=now();if(session){session.closed_at=r.finished_at;session.elapsed_seconds=(Date.parse(r.finished_at)-Date.parse(session.started_at))/1000;session.end_base_commit=r.source_commit;session.end_commit=git('status','--porcelain')?null:r.source_commit;session.within_limits=session.elapsed_seconds<=1800&&session.user_work_requests<=10;await save(root+'/session.json',session);await save(root+'/history/'+session.id+'.session.json',session);r.session=session;}
  let usage=session;try{usage??=await read(root+'/session.json');}catch{}r.gates.push({id:'usage',status:usage?.closed_at&&usage?.within_limits===true?'PASS':'UNVERIFIED',reason:'Full session must be closed within 1800 seconds and 10 user requests'});
  r.phase=r.gates.every(g=>g.status==='PASS')?'COMPLETE':'BLOCKED';r.submission_ready=r.phase==='COMPLETE';
  const h=await read('HANDOFF.json');Object.assign(h,{source_commit:r.source_commit,phase:r.phase,submission_ready:r.submission_ready,last_run_id:r.id,next_action:r.phase==='COMPLETE'?'Review final evidence and user upload version':'Read handoff/chart/latest.json and NEXT.md; fix first failure, record unverified items'});await save('HANDOFF.json',h);await save('public/handoff-status.json',{...r,feature_id:'task5-bitcoin-chart-v1',next_action:h.next_action,blockers:r.gates.filter(g=>g.status!=='PASS').map(g=>g.id),gates:r.gates.map(({output,...g})=>g)});
  await save(root+'/latest.json',r);await save(root+'/history/'+r.id+'.json',r);for(const [a,b]of [['test-output/chart-fixed.json','.fixed.json'],['test-output/site-check/result.json','.site.json']]){try{await copyFile(a,root+'/history/'+r.id+b);}catch{}}
  if(mode==='finish'){
   let notes={};try{notes=await read(root+'/notes.json');}catch{}
   const text=`# 현재 인수인계 — 반복 재개

## 1. 목표
BTC 차트 한 기능. docs/task5/bitcoin-chart/NEXT.md와 고정10개를 따른다.

## 2. 현재 상태
${r.phase}; 기준 커밋 ${r.source_commit}; 소스 해시 ${r.source_digest}. 세션 ${session.id}; 이전 세션 ${session.parent_session_id??'없음'}. 업로드 종료 커밋 ${session.end_commit??'미확인'}.
변경: ${notes.changes??'이번 세션의 변경 설명 미기록 — git diff 및 실행 기록 확인 필요'}

## 3. 실행 명령
npm ci → npx playwright install chromium → npm run handoff:resume → npm run chart:check. 실패 조사/수정 후 npm run handoff:finish. 같은 열린 세션의 resume은 시간/요청 수를 초기화하지 않는다.

## 4. 통과 검사
${r.gates.map(g=>'- '+g.id+': '+g.status).join('\n')}
원본: handoff/chart/history/${r.id}.json. 모의검사는 실제 사이트 성공 증거가 아니다.

## 5. 남은 문제
${notes.problems??'최신 보고서의 FAIL/UNVERIFIED를 각각 조사한다.'}
${r.gates.filter(g=>g.status!=='PASS').map(g=>'- '+g.id+': '+(g.reason??'실행 로그 확인')).join('\n')}

## 6. 다음 행동
${notes.next_action??'첫 실패를 재현하고 수정·같은 검사 재실행. 실제 사이트 전체 기능을 하나씩 실행하고 미실행은 UNVERIFIED. 업로드 전 배포 완료 주장 금지.'}
담당 역할 이름 없이 이 문서와 세션 기록으로 이어간다. 종료 전 handoff/chart/notes.json에 changes/problems/next_action을 실제 내용으로 적고 finish 실행.

## 7. 건드리지 말 것
고정10개/기대값/freeze, 금·은·환율·DB·T04 증빙, 과거 세션. 사용자가 GitHub에 직접 업로드. AI 대화 자동 호출 없음.
`;
   await writeFile('docs/handoff/current.md',text);await writeFile(root+'/history/'+session.id+'.outgoing.md',text);session.outgoing_handoff_sha256=hash(text);await save(root+'/session.json',session);await save(root+'/history/'+session.id+'.session.json',session);
  }
  console.log(r.phase+': see handoff/chart/latest.json; update current.md seven sections with findings.');process.exitCode=r.phase==='COMPLETE'?0:1;
 }else throw Error('Use resume/request/check/finish/ci/status');
}catch(e){console.error(e.message);process.exitCode=2;}
