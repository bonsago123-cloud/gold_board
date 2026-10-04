import {METALS} from './metals.mjs';
import {initMarket} from './market.mjs';
import {createBundleClient} from './bundle-client.mjs';
import {displayTime as time,formatValue,safeDelta} from './bundle-core.mjs';
import {ERRORS} from './core.mjs';
import {createGoldClient} from './gold-client.mjs';
import {createFxClient,toWon} from './fx.mjs';
const $=id=>document.getElementById(id),requested=new URLSearchParams(location.search).get('asset');
let asset=Object.hasOwn(METALS,requested)?requested:'XAU',auto=false,chart;
const goldClient=createGoldClient(()=>render(client.view()));
const bundleClient=createBundleClient(()=>render(client.view()));
const client={view:()=> (asset==='XAU'?goldClient:bundleClient).view(),request:collect=>(asset==='XAU'?goldClient:bundleClient).request(collect)};
const fxClient=createFxClient(()=>render(client.view()));
function render({data,busy,cached,due}){
 const state=data.assets[asset],q=state.last_good,meta=METALS[asset];
 $('board-title').textContent=`오늘의 국제 ${meta.name} 시세`;$('board-description').textContent=`${meta.name} · ${q?.unit??meta.unit}`;
 $('mode-label').textContent=`${meta.name} · 저장된 실제 원천값`;$('price').textContent=q?formatValue(q.value):'—';$('quote-unit').textContent=q?.unit??meta.unit;
 const fx=fxClient.view(),won=toWon(q?.value,fx.quote);
 $('price-krw').textContent=won===null?'—':new Intl.NumberFormat('ko-KR',{maximumFractionDigits:0}).format(won);
 $('krw-unit').textContent=(q?.unit??meta.unit).replace(/^USD/,'KRW')+' · 환산 참고값';
 $('fx-status').textContent=fx.quote?`${fx.stale?'이전 환율 사용 · ':''}1 USD = ${fx.quote.rate.toLocaleString('ko-KR',{maximumFractionDigits:4})} KRW · 환율 기준 ${time(fx.quote.source_at)} KST · 조회 ${time(fx.quote.fetched_at)} KST`:(fx.busy?'환율 조회 중…':'환율 조회 실패 · 원화 환산 불가');
 $('fx-price-note').textContent=q?`${state.status==='stale'?'오래된 달러 가격에 환율을 적용한 참고값입니다. ':''}달러 원천값 × 적용 환율. 국내 매매가·수수료·세금은 포함하지 않습니다.`:'달러 원천값이 없어 원화도 표시할 수 없습니다. 외부 차트 가격은 자동 환산하지 않습니다.';
 $('source-at').textContent=time(q?.source_at);$('fetched-at').textContent=time(q?.fetched_at);$('quote-source').href=q?.source_url??meta.source;$('quote-source').textContent=meta.provider;
 $('source-description').textContent=meta.type==='commodity'?'원천 시각은 제공자의 데이터 수집 timestamp입니다. 실제 거래 체결 시각과 다를 수 있으며 갱신 주기는 데이터 이용 플랜을 따릅니다.':'원천 시각은 updatedAt입니다. 휴장 중에는 이전 가격이 유지될 수 있습니다.';
 $('status').className=`badge ${state.status}`;$('status').textContent=({fresh:'정상',stale:'오래된 값',error:'조회 오류',empty:'조회 전'})[state.status];
 const error=ERRORS[state.error_code];$('notice').className=`notice ${error?'warning':'good'}`;$('notice-title').textContent=error?error[0]:'가격과 적용 환율을 함께 확인하세요.';$('notice-body').textContent=error?`${error[1]} ${q?'마지막 정상값을 유지합니다. ':''}${error[2]}`:(asset==='XAU'?'조회 성공 시 금 일별 기록을 저장합니다.':'추가 원자재 조회 기능입니다. 석유·밀은 원천 API 연결이 필요합니다.');
 if(cached)$('notice-body').textContent+=' 서버 확인 실패 · 보관된 기록입니다.';
 const c=safeDelta(state.daily);$('change').textContent=c?`${Date.parse(c.to.date_kst)-Date.parse(c.from.date_kst)===86400000?'어제':'이전 기록'} 대비 ${c.value>=0?'+':''}${c.value.toFixed(6)} ${q.unit} (${c.percent.toFixed(4)}%)`:'비교할 같은 출처·단위의 일별 기록이 없습니다.';
 $('asset-tabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.symbol===asset)));
 $('records-title').textContent=`${meta.name} 일별 기록`;$('row-count').textContent=`${state.daily.length}일`;$('daily-rows').replaceChildren();
 for(const row of [...state.daily].reverse()){const tr=document.createElement('tr');for(const val of [row.date_kst,`${formatValue(row.value)} ${row.unit}`,toWon(row.value,fx.quote)===null?'—':`${Math.round(toWon(row.value,fx.quote)).toLocaleString('ko-KR')} ${row.unit.replace(/^USD/,'KRW')}${fx.stale?' (이전 환율)':''}`,time(row.source_at),time(row.fetched_at)]){const td=document.createElement('td');td.textContent=val;tr.append(td);}$('daily-rows').append(tr);}
 if(!state.daily.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='정상 조회 후 종목별 날짜 기록이 저장됩니다.';td.className='empty';tr.append(td);$('daily-rows').append(tr);}
 $('market-description').textContent=`저장 가격: ${meta.provider}. 차트: TradingView/OANDA CFD 참고가격. 두 출처의 가격 종류·단위·관측 시각이 다를 수 있으며 차트 값은 일별 증빙에 사용하지 않습니다.`;
 controls({data,busy,cached,due});
}
function controls(v=client.view()){
 const wait=Math.max(0,Math.ceil((v.due-Date.now())/1000));$('refresh').disabled=$('retry').disabled=v.busy||wait>0;$('refresh').textContent=v.busy?'조회·저장 중…':wait?`${wait}초 후 조회`:(asset==='XAU'?'금 조회·기록':'추가 종목 조회·기록');$('auto-status').textContent=!auto?'자동 갱신 꺼짐':document.hidden?'다른 탭을 보는 동안 일시정지':`${wait}초 후 자동 조회 · 서버 대기 시간 준수`;
 $('batch-status').textContent=asset==='XAU'?'금 일별 기록 · 한국 날짜 기준':v.data.last_run?`최근 묶음 수집 ${v.data.last_run.success_count}/4 성공 · ${time(v.data.last_run.finished_at)} KST`:'선택한 원자재의 가격과 원천 시각을 확인하세요.';
}
$('refresh').onclick=$('retry').onclick=()=>{client.request(true);fxClient.request();};
$('asset-tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{asset=b.dataset.symbol;render(client.view());chart.update();client.request(false);fxClient.request();});
$('auto-refresh').onchange=()=>{auto=$('auto-refresh').checked;controls();};
render(client.view());chart=initMarket(()=>asset);client.request(false);fxClient.request();$('fx-refresh').onclick=()=>fxClient.request();
let fxWasStale=fxClient.view().stale;
const timer=setInterval(()=>{const view=client.view(),fxStale=fxClient.view().stale;if(fxStale!==fxWasStale||$('status').className!==`badge ${view.data.assets[asset].status}`)render(view);else controls(view);fxWasStale=fxStale;if(auto&&!document.hidden){client.request(true);fxClient.request();}},1000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
