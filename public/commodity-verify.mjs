import {METALS} from './metals.mjs';
import {emptyState,withAge,formatValue,ERRORS} from './core.mjs';
import {requestSilver} from './silver-client.mjs';
import {checkSilverFailures} from './silver-checks.mjs';
const $=id=>document.getElementById(id),key='metal-note-manual-checks-v1';
const time=value=>value?new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'—';
let silver=emptyState(),busy=false,attemptAt=null,synthetic=null,manual={},storageAvailable=true;
const steps=[
 ['identity','종목·출처·단위','메인 탭의 종목 코드·OANDA CFD 출처·단위가 아래 안내와 일치하는지 확인합니다.'],
 ['display','실제 가격·차트 표시','숫자 가격과 과거 차트가 실제로 표시되는지, 원천의 가격 시각·휴장·지연 또는 오류 안내가 있는지 확인합니다. 빈 위젯은 확인 완료로 선택하지 마세요.'],
 ['manual','수동 갱신','자동 갱신을 끄고 30초 후 상단 갱신을 눌러 가격 위젯과 차트가 함께 다시 표시되는지 확인합니다. 가격이 반드시 달라져야 하는 것은 아닙니다.'],
 ['auto','자동 갱신·중지','자동 갱신을 켜 30초 이상 관찰하고, 끄면 반복 요청이 멈추는지 확인합니다. 다른 브라우저 탭으로 이동한 동안은 일시정지되어야 합니다.'],
 ['interval','차트 시간 단위','1분·1시간·1일 등을 선택해 차트 간격이 달라지고, 갱신 후에도 선택한 간격이 유지되는지 확인합니다.']
];
try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===1)for(const symbol of ['WTI','WHEAT']){const record=saved.records?.[symbol];if(record){manual[symbol]={};for(const [id] of steps){const item=record[id];if(item&&['unseen','confirmed','problem'].includes(item.result))manual[symbol][id]={result:item.result,at:typeof item.at==='string'?item.at:null};}manual[symbol].note=typeof record.note==='string'?record.note.slice(0,1000):'';}}}catch{storageAvailable=false;}
function save(){try{localStorage.setItem(key,JSON.stringify({version:1,records:manual}));storageAvailable=true;}catch{storageAvailable=false;}summary();}
function summary(){
 for(const symbol of ['WTI','WHEAT']){const entries=steps.map(([id])=>manual[symbol]?.[id]?.result??'unseen');const confirmed=entries.filter(x=>x==='confirmed').length,problems=entries.filter(x=>x==='problem').length;
 $(`${symbol}-summary`).textContent=`사용자 확인 ${confirmed}/${steps.length} · 문제 있음 ${problems} · 미확인 ${steps.length-confirmed-problems} (자동 판정 아님)`;}
 $('manual-save-status').textContent=storageAvailable?'수동 확인 기록은 이 브라우저에 보관됩니다. 배포를 바꾸거나 다시 검사할 때는 종목별 기록을 초기화하세요.':'브라우저에 보관하지 못했습니다. 페이지를 닫기 전에 결과 JSON을 다운로드하세요.';
}
function renderSilver(){
 const state=withAge(silver),q=state.last_good,wait=Math.max(0,Math.ceil(((silver.due??0)-Date.now())/1000));
 $('silver-live').disabled=busy||wait>0;$('silver-live').textContent=busy?'은 조회 중…':wait?`${wait}초 후 다시 조회`:'은 실제 조회 / 다시 시도';
 $('silver-price').textContent=q?`${formatValue(q.value)} ${q.unit}`:'—';$('silver-source-at').textContent=time(q?.source_at);$('silver-fetched-at').textContent=time(q?.fetched_at);
 $('silver-state').textContent=`status: ${state.status} · error_code: ${state.error_code}`;
 const err=ERRORS[state.error_code];$('silver-message').textContent=err?`${err[0]} · ${err[1].replaceAll('금시세','은 시세')} ${q?'마지막 정상값 유지. ':''}${err[2]}`:q?'응답의 종목·가격·단위·출처·두 시각 형식을 확인했습니다. 실제 일별 증빙에는 포함하지 않습니다.':'실제 조회는 버튼을 눌러 실행합니다. 합성 검사와 별개입니다.';
 $('silver-attempt').textContent=attemptAt?`최근 검사 요청: ${time(attemptAt)} KST`:'실제 조회 미실행';
}
for(const symbol of ['WTI','WHEAT']){
 const meta=METALS[symbol],box=document.createElement('section');box.className='proof commodity-check';
 box.innerHTML=`<div class="section-heading"><h3>${meta.name} · 사용자 확인</h3><a href="/?asset=${symbol}" target="_blank" rel="noopener">메인 ${meta.name} 탭 열기 ↗</a></div><p>${meta.chart} · ${meta.unit} · TradingView / OANDA CFD 참고가격</p><p id="${symbol}-summary" role="status"></p>`;
 for(const [id,label,description] of steps){const row=document.createElement('div');row.className='manual-check-row';const content=document.createElement('div'),heading=document.createElement('strong'),detail=document.createElement('p');heading.textContent=label;detail.textContent=description;content.append(heading,detail);const control=document.createElement('div'),select=document.createElement('select');select.id=`${symbol}-${id}`;select.setAttribute('aria-label',`${meta.name} ${label} 확인 결과`);
 for(const [value,text] of [['unseen','미확인'],['confirmed','직접 확인함'],['problem','문제 있음']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
 select.value=manual[symbol]?.[id]?.result??'unseen';const stamp=document.createElement('small');stamp.textContent=time(manual[symbol]?.[id]?.at);stamp.id=`${symbol}-${id}-at`;
 select.onchange=()=>{manual[symbol]??={};manual[symbol][id]={result:select.value,at:new Date().toISOString()};stamp.textContent=time(manual[symbol][id].at);save();};control.append(select,stamp);row.append(content,control);box.append(row);}
 const label=document.createElement('label');label.textContent='확인 메모 (선택)';const note=document.createElement('textarea');note.maxLength=1000;note.rows=2;note.setAttribute('aria-label',`${meta.name} 확인 메모`);note.value=manual[symbol]?.note??'';note.oninput=()=>{manual[symbol]??={};manual[symbol].note=note.value;save();};label.append(note);box.append(label);
 const reset=document.createElement('button');reset.className='secondary';reset.textContent=`${meta.name} 확인 기록 초기화`;reset.onclick=()=>{manual[symbol]={};for(const [id] of steps){$(`${symbol}-${id}`).value='unseen';$(`${symbol}-${id}-at`).textContent='—';}note.value='';save();};box.append(reset);$('widget-checklists').append(box);
}
$('silver-live').onclick=async()=>{if(busy||Date.now()<(silver.due??0))return;busy=true;attemptAt=new Date().toISOString();renderSilver();try{silver=await requestSilver(silver);}finally{busy=false;renderSilver();}};
$('silver-suite').onclick=async()=>{const button=$('silver-suite');button.disabled=true;$('silver-suite-status').textContent='합성 응답으로 검사 중…';try{synthetic=await checkSilverFailures();$('silver-suite-results').replaceChildren();for(const result of synthetic.results){const row=document.createElement('p');row.textContent=`${result.passed?'통과':'실패'} · ${result.label}: ${result.failed.status}/${result.failed.error_code} · 합성값 ${result.failed.value} 유지 → 복구 ${result.recovered.status}/${result.recovered.error_code} · 합성값 ${result.recovered.value}`;$('silver-suite-results').append(row);}$('silver-suite-status').textContent=`자체 합성 검사 ${synthetic.results.filter(x=>x.passed).length}/5 통과 · 실제 조회 및 공식 T04 판정과 별개`;}catch{$('silver-suite-status').textContent='검사를 완료하지 못했습니다. 다시 실행하세요.';}finally{button.disabled=false;}};
export function commodityReport(){return {version:1,exported_at:new Date().toISOString(),scope:'부가 원자재 기능 확인; 금 실제 이틀 증빙/공식 T04 검사/과정 영수증을 대체하지 않음',silver:{attempt_at:attemptAt,real:withAge(silver),synthetic},widgets:{verification:'사용자가 직접 입력한 결과; 외부 가격 수신에 대한 자동 판정 아님',records:manual}};}
$('commodity-export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(commodityReport(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='commodity-function-checks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
renderSilver();summary();const ticker=setInterval(renderSilver,1000);window.addEventListener('pagehide',()=>clearInterval(ticker),{once:true});
