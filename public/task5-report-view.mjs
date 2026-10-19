const el=id=>document.getElementById(id), text=(id,value)=>{el(id).textContent=value;};
const row=(target,values)=>{const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=value;tr.append(td);}el(target).append(tr);};
const item=(target,value)=>{const li=document.createElement('li');li.textContent=value;el(target).append(li);};
const link=(target,label,url)=>{const li=document.createElement('li'),a=document.createElement('a');a.href=url;a.textContent=label;li.append(a);el(target).append(li);};
const time=s=>new Date(s).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})+' KST';
try{
 const response=await fetch('/task5-report.json',{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);const r=await response.json(),last=r.records.at(-1),e=r.evidence;
 if(!last||r.tests.length!==10)throw Error('검사 기록 형식 오류');
 text('summary',`${r.phase==='FEATURE_COMPLETE'?'차트 구현·인수인계 성공':'구현 진행 중'} · ${r.records.map(s=>s.passed+'/10').join(' → ')}`);
 text('limits',`공통 상한: 실행당 ${r.limits.seconds_per_agent/60}분 / 사용자 작업 요청 ${r.limits.user_work_requests_per_agent}개. 도구 호출은 사용자 요청 수에 합산하지 않는다.`);
 for(const s of r.records){row('comparison',[s.label,s.seconds.toFixed(3)+'초',s.requests,s.failed_rounds,s.passed+'/10',s.within_limits?'이내':'초과']);item('timeline',`${s.label} 시작 ${time(s.started_at)} → 종료·인계 ${time(s.closed_at)}`);}
 const inherited=r.records.slice(1);text('equal',inherited.length&&inherited.every(s=>s.handoff_equal)?'인수인계 원문과 SHA-256 일치 확인.':'인수인계 동일성 확인 필요.');
 for(const t of r.tests)row('checks',[t.id,t.input,t.expected,last.rows.find(x=>x.id===t.id)?.status??'UNVERIFIED']);
 text('recheck',e.independent_recheck);text('actions',e.actions_result);for(const v of e.live_observations)item('live',v);text('live-scope',e.live_scope);
 const repo='https://github.com/bonsago123-cloud/gold_board';
 link('evidence','첫 실행 시작의 로컬 기준 커밋: '+e.start_base_commit,repo+'/commit/'+e.start_base_commit);
 link('evidence','첫 실행 종료·인계 / 다음 실행 시작: '+e.handoff_commit,repo+'/commit/'+e.handoff_commit);
 link('evidence','다음 실행 완료: '+e.completion_commit,repo+'/commit/'+e.completion_commit);
 link('evidence','완료 버전 GitHub Actions 결과',e.actions_url);
 for(const s of r.records){link('evidence',s.label+' 세션·사용량 기록',repo+'/blob/'+e.completion_commit+'/handoff/restart/history/'+s.id+'.session.json');}
 link('evidence','최초 고정 검사·입력·기대값',repo+'/blob/'+e.handoff_commit+'/docs/task5/chart-restart/fixed-tests.json');
 link('evidence','첫 작업자가 보낸 7항목 인수인계',repo+'/blob/'+e.completion_commit+'/handoff/restart/history/'+r.records[0].id+'.outgoing.md');
 link('evidence','다음 작업자가 받은 인수인계',repo+'/blob/'+e.completion_commit+'/handoff/restart/history/'+last.id+'.received.md');
 if(e.source_evidence_path){link('evidence','C26 복원 소스·고정 버전 쌍·검증 방법',repo+'/tree/main/'+e.source_evidence_path);link('evidence','복원 Git 버전 전체 묶음',repo+'/blob/main/'+e.source_evidence_path+'/source-history.bundle');for(const [label,pair] of Object.entries(e.source_versions))item('evidence',label+' 복원 고정 버전: '+pair.start+' → '+pair.end);}
 text('hash',e.handoff_sha256);text('gaps',e.gaps);text('source-note',e.source_note);text('attestation',e.attestation_note);text('generated','기록에서 자동 생성: '+time(r.generated_at)+' · 세션 종료 및 빌드 때 갱신');
}catch(error){text('summary','보고서 기록을 불러오지 못했습니다. '+error.message);}
