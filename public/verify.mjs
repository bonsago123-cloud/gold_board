import {METALS} from './metals.mjs';
import { ERRORS, emptyState, failure, withAge, comparison, formatValue, SOURCE_URL } from './core.mjs';
import { FIXTURES, replay } from './fixtures.mjs';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=iso=>iso?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(iso)):'—';
let live=emptyState(),lab=emptyState(),mode='live',busy=false,selected=null,cached=false,labBusy=false;
let readAt=null;
function current(){return mode==='lab'?lab:withAge(live);}
function storeCache(){try{localStorage.setItem('gold-note-last-snapshot-v1',JSON.stringify(live));}catch{}}
function readCache(){try{const s=JSON.parse(localStorage.getItem('gold-note-last-snapshot-v1'));if(s?.last_good&&Array.isArray(s.daily)){live=failure(s,'offline');cached=true;}}catch{}}
function deltaText(rows){const c=comparison(rows);if(!c)return '비교할 기록이 아직 없습니다.';return `${c.consecutive?'어제':'이전 기록'} 대비 ${c.delta>=0?'+':''}${c.delta.toFixed(6)} USD (${c.percent>=0?'+':''}${c.percent.toFixed(4)}%)`;}
function recordMatch(r){return r.raw?.price===r.value&&r.raw?.updatedAt===r.source_at&&r.raw?.currency==='USD'&&r.source_url===SOURCE_URL;}
function render(){
  const s=current(),r=s.last_good;
  $('board-title').textContent=mode==='lab'?'자체 실패 시험 · 합성값':'금 기록 대조';
  $('board-description').textContent=mode==='lab'?'합성값과 실제 기록은 분리됩니다. 실제 금 가격이나 Supabase 기록을 변경하지 않습니다.':'메인 금 탭과 같은 저장 기록을 읽습니다. 페이지를 열기만 해서는 새 가격을 수집하지 않습니다.';
  $('dashboard').setAttribute('aria-label',mode==='lab'?'합성 시험 상태':'대조할 금 저장 기록');
  $('quote-source').href=SOURCE_URL;$('quote-source').textContent=mode==='lab'?'합성 시험의 모사 대상 · Gold API XAU':'Gold API · XAU';
  $('lab').hidden=mode!=='lab';$('mode-label').textContent=mode==='lab'?'합성 시험값 · 실제 가격 아님':'실제 저장 기록 · XAU';
  $('tab-live').classList.toggle('active',mode==='live');$('tab-lab').classList.toggle('active',mode==='lab');
  $('tab-live').setAttribute('aria-pressed',String(mode==='live'));$('tab-lab').setAttribute('aria-pressed',String(mode==='lab'));
  $('price').textContent=r?formatValue(r.value):'—'; $('source-at').textContent=time(r?.source_at);$('fetched-at').textContent=time(r?.fetched_at);
  $('change').textContent=deltaText(s.daily);
  $('status').textContent=({fresh:'정상 · fresh',stale:'오래된 값 · stale',error:'오류 · error',empty:'기록 없음'})[s.status];$('status').className=`badge ${s.status}`;
  $('machine-state').textContent=`status: ${s.status} · error_code: ${s.error_code}${cached&&mode==='live'?' · 브라우저 보관본 (서버 확인 불가)':''}`;
  const err=ERRORS[s.error_code];
  $('notice').className=`notice ${err?'warning':r?'good':''}`;
  $('notice-title').textContent=err?err[0]:r?'정상값을 보존하고 있습니다.':'아직 실제 기록이 없습니다.';
  $('notice-body').textContent=err?`${err[1]} ${r?'마지막 정상값을 유지합니다. ':''}${err[2]}`:r?(mode==='lab'?'합성 기록은 실제 일별 기록에 저장되지 않습니다.':'메인 정보판과 같은 금 기록입니다. 원천 관측 후 15분이 지나면 오래된 값으로 표시합니다.'):'금 원천 조회·기록을 눌러 실제 가격을 수집하세요.';
  $('retry').textContent=mode==='lab'?'D2 정상으로 다시 시도':'다시 시도';
  $('row-count').textContent=`${s.daily.length}일${mode==='lab'?' · 합성':''}${mode==='live'&&s.total_days>90?' · 최근 90일':''}`;
  $('daily-rows').innerHTML=s.daily.length?[...s.daily].reverse().map(row=>`<tr><td>${esc(row.date_kst)}${row.synthetic?' · 합성':''}</td><td>${esc(formatValue(row.value))}</td><td>${esc(time(row.source_at))}</td><td>${esc(time(row.fetched_at))}</td><td><button data-date="${esc(row.date_kst)}">대조 보기</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">정상 조회에 성공하면 이곳에 날짜별 기록이 쌓입니다.</td></tr>';
  $('daily-rows').querySelectorAll('button').forEach(button=>button.onclick=()=>{selected=button.dataset.date;renderProof();$('proof').scrollIntoView({behavior:'smooth'});});
  renderProof(); updateButtons();
}
function renderProof(){
  const s=mode==='lab'?lab:withAge(live),r=(selected?s.daily.find(row=>row.date_kst===selected):null)??s.last_good;
  $('proof-status').textContent=r?(recordMatch(r)?'필드 일치':'불일치 확인 필요'):'대조 대기';
  $('proof-description').textContent=r?`${r.date_kst} ${r.synthetic?'합성 시험':'실제 조회'} · 원자료의 price를 반올림하지 않고 저장합니다. 화면은 자릿수 구분 쉼표만 추가합니다.`:'정상 조회에 성공하면 원자료·저장값·화면값을 확인할 수 있습니다.';
  $('record-proof').innerHTML=r?`<div class="proof-grid"><div class="proof-cell"><h3>01 / 원자료 · 공개 필드</h3><pre>${esc(JSON.stringify(r.raw,null,2))}</pre></div><div class="proof-cell"><h3>02 / 저장값</h3><strong>${esc(r.value)}</strong><p>${esc(r.unit)}</p><p>원천: ${esc(r.source_at)}</p><p>조회: ${esc(r.fetched_at)}</p></div><div class="proof-cell"><h3>03 / 화면 표시값</h3><strong>${esc(formatValue(r.value))}</strong><p>${esc(r.unit)}</p><p>원천: ${esc(time(r.source_at))} KST</p><p>조회: ${esc(time(r.fetched_at))} KST</p></div></div><p class="section-note">출처 URL: <a href="${SOURCE_URL}" target="_blank" rel="noopener noreferrer">${SOURCE_URL}</a></p>`:'';
  const records=mode==='live'?(s.evidence??[]):[];
  $('two-days').textContent=mode==='lab'?'합성 D1/D2는 실제 이틀 증빙에 포함하지 않습니다.':`${records.length}/2건 확보${cached?' · 서버 재확인 필요':''}. ${records.length<2?'다른 실제 한국 날짜에 같은 원천을 다시 조회해야 합니다.':'최초 두 KST 날짜의 실제 저장값입니다.'}`;
  $('evidence-records').innerHTML=records.map(row=>`<div class="evidence-row"><strong>${esc(row.date_kst)}</strong><span>${esc(formatValue(row.value))} ${esc(row.unit)}</span><span>${recordMatch(row)?'원자료·저장값·화면값 일치':'대조 불일치'}</span><small>출처: ${esc(row.source_url)} · 원천: ${esc(row.source_at)} · 조회: ${esc(row.fetched_at)}</small></div>`).join('');
  const c=comparison(records);
  $('formula').textContent=c?`${c.consecutive?'어제 대비':'이전 기록 대비'} = ${c.to.value} − ${c.from.value} = ${c.delta.toFixed(6)} USD/트로이온스 · 변화율 = (${c.to.value} − ${c.from.value}) ÷ ${c.from.value} × 100 = ${c.percent.toFixed(4)}%${c.consecutive?'':' · 연속한 날짜가 아니므로 어제 대비로 표시하지 않습니다.'}`:'';
  $('export').disabled=mode==='lab'||!records.length||cached;
}
function updateButtons(){
 const wait=Math.max(0,Math.ceil((Date.parse(live.next_attempt_at??'')-Date.now())/1000))||0;
 $('refresh').disabled=mode==='lab'||busy||wait>0;
 $('refresh').textContent=busy?'확인 중…':wait>0?`${wait}초 후 원천 조회`:'금 원천 조회·기록';
 $('reload-records').disabled=mode==='lab'||busy;
 $('retry').disabled=mode==='lab'?labBusy:busy||wait>0;
 $('record-read-status').textContent=mode==='lab'?'합성 시험 중 · 실제 수집 없음':busy?'저장 기록 확인 중…':cached?'서버 확인 불가 · 브라우저 보관본':readAt?`서버 기록 확인: ${time(readAt)} KST`:'서버 기록 확인 전';
}
async function request(refresh=false){
  if(busy||mode==='lab'||(refresh&&Date.now()<Date.parse(live.next_attempt_at??'')))return;busy=true;updateButtons();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),35000);
  try{
    const res=await fetch('/api/board',{method:refresh?'POST':'GET',cache:'no-store',signal:controller.signal});
    const data=await res.json();
    if(!Array.isArray(data.daily)||!['empty','fresh','stale','error'].includes(data.status)) throw new Error('bad server response');
    if(!res.ok&&live.last_good&&!data.last_good){live=failure(live,data.error_code??'storage_error');cached=true;}
    else {live=data;cached=false;if(res.ok){readAt=new Date().toISOString();storeCache();}}
  }catch{live=failure(live,controller.signal.aborted?'timeout':'offline');cached=Boolean(live.last_good);}
  finally{clearTimeout(timer);busy=false;render();}
}
async function runFixture(id){
  if(labBusy)return;labBusy=true;updateButtons();
  try{lab=await replay(lab,id);selected=null;$('lab-result').textContent=`${id} · ${lab.daily.length}행 · ${lab.status} / ${lab.error_code}`;}
  finally{labBusy=false;render();}
}
$('fixture-buttons').innerHTML=Object.entries(FIXTURES).map(([id,f])=>`<button data-fixture="${id}">${f.label}</button>`).join('');
$('fixture-buttons').querySelectorAll('button').forEach(b=>b.onclick=()=>runFixture(b.dataset.fixture));
$('refresh').onclick=()=>{selected=null;request(true);};
$('retry').onclick=()=>mode==='lab'?runFixture('LOCAL-RECOVER-D2'):request(true);
$('reload-records').onclick=()=>{selected=null;request(false);};
$('tab-live').onclick=()=>{mode='live';selected=null;render();};$('tab-lab').onclick=()=>{mode='lab';selected=null;render();};
$('suite').onclick=async()=>{
  if(labBusy)return;labBusy=true;$('suite').disabled=true;updateButtons();
  const results=[];
  try{
    for(const [id,code] of [['LOCAL-SLOW','timeout'],['LOCAL-DENIED','access_denied'],['LOCAL-LIMIT','rate_limited'],['LOCAL-OFFLINE','offline'],['LOCAL-SCHEMA','schema_changed']]){
      let s=await replay(emptyState(),'LOCAL-D1-A');s=await replay(s,'LOCAL-D1-B');s=await replay(s,'LOCAL-D1-B');
      const before=JSON.stringify(s.daily);s=await replay(s,id);
      const kept=s.last_good.value===3010&&s.status==='stale'&&s.error_code===code&&JSON.stringify(s.daily)===before&&s.daily.length===1;
      s=await replay(s,'LOCAL-RECOVER-D2');s=await replay(s,'LOCAL-RECOVER-D2');
      const ok=kept&&s.status==='fresh'&&s.error_code==='none'&&s.daily.length===2&&comparison(s.daily).delta===30;
      results.push(`${ok?'통과':'실패'} · ${FIXTURES[id].label} / 보존·같은 날 1행·복구 후 2행`);lab=s;
    }
    $('suite-result').innerHTML=results.map(r=>`<p>${esc(r)}</p>`).join('');$('lab-result').textContent='자체 합성 시험 완료 · 공식 T04 검사는 별도 확인 필요';
  }finally{labBusy=false;$('suite').disabled=false;render();}
};
$('export').onclick=()=>{
  const rows=live.evidence??[],c=comparison(rows);
  const payload={title:'국제 금시세 실제 이틀 증빙',timezone:'Asia/Seoul',exported_at:new Date().toISOString(),official_package_report:"/official-verification.json",
    complete_real_two_dates:rows.length===2&&new Set(rows.map(r=>r.date_kst)).size===2,records:rows,
    comparison:c?{from:c.from.date_kst,to:c.to.date_kst,label:c.consecutive?'어제 대비':'이전 기록 대비',delta:c.delta.toFixed(6),percent:c.percent.toFixed(4),rule:'(later - earlier), (later - earlier) / earlier * 100'}:null};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='gold-real-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
// This inventory shares the main dashboard's asset definitions.
$('asset-inventory').innerHTML=Object.entries(METALS).map(([symbol,meta])=>`<tr><td><a href="/?asset=${symbol}">${esc(meta.name)} ↗</a></td><td>${meta.type==='widget'?'TradingView / OANDA CFD 참고가격':'Gold API · '+symbol}</td><td>${esc(meta.unit)}</td><td>${meta.type==='widget'?'시세·차트 재요청':'실제 원천 조회'} · 수동 / 자동 30초</td><td>${symbol==='XAU'?'Supabase 일별 저장 · 과제 증빙':'부가 시세 · 증빙 제외'}</td></tr>`).join('');
readCache();render();request(false);
const ticker=setInterval(()=>{updateButtons();if(mode==='live'&&withAge(live).status!==live.status){Object.assign(live,withAge(live));render();}},1000);
window.addEventListener('pagehide',()=>clearInterval(ticker),{once:true});
window.addEventListener('offline',()=>{live=failure(live,'offline');cached=Boolean(live.last_good);render();});
