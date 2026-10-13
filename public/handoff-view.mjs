try{
 const response=await fetch('/handoff-status.json',{cache:'no-store'});if(!response.ok)throw new Error();
 const r=await response.json();
 const age=Date.now()-Date.parse(r.finished_at);
 document.getElementById('phase').textContent=Number.isFinite(age)&&age>=0&&age<=3600000?r.phase:'UNVERIFIED · 재검증 필요';
 document.getElementById('time').textContent=`마지막 검사: ${r.finished_at??'실행 중'}`;
 document.getElementById('next').textContent=`다음 행동: ${r.next_action}`;
 document.getElementById('source').textContent=`검사 기준 커밋: ${r.source_commit}`;
 for(const g of r.gates){const row=document.createElement('tr');for(const text of [g.id,g.status,g.reason??'실행 로그 참조']){const td=document.createElement('td');td.textContent=text;row.append(td);}document.getElementById('gates').append(row);}
}catch{document.getElementById('phase').textContent='UNVERIFIED · 검사 기록을 읽지 못했습니다.';}
