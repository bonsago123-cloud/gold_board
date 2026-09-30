import {resetEvaluationState,runFixture} from './official-adapter.mjs';
import {OFFICIAL_FILES,officialSuite,matchesExpected} from './official-checks.mjs';
const $=id=>document.getElementById(id),base='/assets/studio-task-assets/t04-real-information-board/';
let state=resetEvaluationState(),fixtures=[],ready=false;
const messages={timeout:'응답 지연 · 마지막 정상값을 유지합니다. 잠시 후 다시 시도하세요.',auth:'외부 원천 401/403 거절 · 원천 상태 확인 후 다시 시도하세요.',rate_limit:'호출 제한 · 원천이 안내한 대기시간 후 다시 시도하세요.',offline:'오프라인 · 연결을 확인한 뒤 다시 시도하세요.',schema_error:'형식 변경 · 응답 스키마를 점검한 뒤 다시 시도하세요.'};
function render(){
  const code=state.status?.error_code;
  $('official-state').textContent=state.status?`${state.status.freshness==='stale'?'오래된 값 · ':''}${state.status.freshness} / ${code}`:'초기 상태';
  $('official-message').textContent=messages[code]??(state.current_reading?'정상 합성값을 보존했습니다.':'정상 D1-A를 재생하세요.');
  $('official-value').textContent=`값: ${state.current_reading?.normalized_value??'—'} · 단위: ${state.current_reading?.unit??'pt'}`;
  $('official-delta').textContent=state.last_delta===null?'비교할 다음 날짜 기록이 없습니다.':`변화 크기: ${state.last_delta} ${state.current_reading.unit} · ${state.last_comparison.direction}`;
  $('official-rows').replaceChildren();
  for(const r of state.daily_readings){const tr=document.createElement('tr');for(const value of [r.record_id,r.record_date,r.normalized_value,r.unit,r.reading.source_time,r.last_fetched_at]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('official-rows').append(tr);}
  $('official-json').textContent=JSON.stringify(state,null,2);$('official-retry').disabled=!ready||state.status?.freshness!=='stale';
}
function play(f){state=runFixture(state,f);$('official-result').textContent=`${f.fixture_id} · ${state.daily_readings.length}행 · ${matchesExpected(state,f)?'fixture 예상 결과 일치':'이 순서에서는 예상 결과와 다릅니다. 초기화 후 D1-A→D1-B 기준으로 재생하세요.'}`;render();}
$('official-reset').onclick=()=>{state=resetEvaluationState();$('official-result').textContent='합성 상태만 초기화했습니다.';render();};
$('official-retry').onclick=()=>play(fixtures.find(f=>f.fixture_id==='T04-RECOVER-D2'));
$('official-suite').onclick=()=>{const result=officialSuite(fixtures);state=result.state;$('official-suite-result').replaceChildren();for(const r of result.results){const p=document.createElement('p');p.textContent=`${r.ok?'통과':'실패'} · ${r.label}`;$('official-suite-result').append(p);}$('official-result').textContent='공식 정상·실패·복구 재생 완료';render();};
render();
try{
  const res=await fetch(base+'asset-manifest.json',{cache:'no-store'});if(!res.ok)throw new Error('manifest');const manifest=await res.json();
  $('official-package').textContent=`package ID: ${manifest.package_id}`;
  const checks=await Promise.all(manifest.files.map(async file=>{
    if(file.path.includes('..')||file.path.startsWith('/'))throw new Error('path');
    const response=await fetch(base+file.path,{cache:'no-store'});if(!response.ok)throw new Error('file');const bytes=await response.arrayBuffer();
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
    return {path:file.path,ok:hash===file.sha256&&bytes.byteLength===file.bytes,hash};
  }));
  for(const c of checks){const p=document.createElement('p');p.textContent=`${c.ok?'일치':'불일치'} · ${c.path} · ${c.hash}`;$('hash-details').append(p);}
  if(!checks.every(c=>c.ok))throw new Error('hash mismatch');
  fixtures=await Promise.all(OFFICIAL_FILES.map(async name=>{const r=await fetch(base+`fixtures/${name}.json`);if(!r.ok)throw new Error('fixture');return r.json();}));
  $('official-hash').textContent=`${checks.length}/${checks.length}개 파일 SHA-256·크기 일치 (첨부된 공식 manifest 기준, manifest 자체는 목록에서 제외)`;
  for(const f of fixtures){const b=document.createElement('button');b.textContent=f.fixture_id;b.title=f.description_ko;b.onclick=()=>play(f);$('official-buttons').append(b);}
  ready=true;$('official-suite').disabled=false;render();
}catch{$('official-hash').textContent='공식 파일을 검증하지 못했습니다. 연결과 원본 파일을 확인한 뒤 페이지를 새로고침하세요.';}
