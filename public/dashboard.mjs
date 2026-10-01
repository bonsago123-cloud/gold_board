import {METALS} from './metals.mjs';
import {initMarket} from './market.mjs';
import {emptyState,failure,withAge,ERRORS,formatValue,comparison} from './core.mjs';
import {nextPollTime} from './poll-policy.mjs';
const $=id=>document.getElementById(id),states=Object.fromEntries(Object.keys(METALS).map(k=>[k,{...emptyState(),due:0,busy:false,failures:0}]));
let asset='XAU',auto=true,chart;
const time=iso=>iso?new Date(iso).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'—';
function render(){
 const state=withAge(states[asset]),q=state.last_good,meta=METALS[asset],name=meta.name,isWidget=meta.type==='widget';
 $('dashboard').hidden=isWidget;$('notice').hidden=isWidget;$('futures-panel').hidden=!isWidget;
 $('quote-unit').textContent=meta.unit;
 $('futures-description').textContent=`${name} · ${meta.chart} 연속선물 · ${meta.unit}. 가격·기준 시각·휴장 및 지연 여부는 제공 화면에서 확인하세요. 계약 교체로 가격이 달라질 수 있습니다.`;
 $('market-description').textContent=isWidget?'TradingView 제공 연속선물 시세 · 거래소 데이터는 지연되거나 제공되지 않을 수 있습니다.':asset==='RHENIUM'?'Metals-API 최신 제공 가격 · API 조회 시각이 실제 거래 시각을 의미하지는 않습니다.':'현재 가격: Gold API · 차트: TradingView / OANDA. 제공자가 달라 가격·시각이 다를 수 있습니다.';
 $('source-description').textContent=asset==='RHENIUM'?'원천 시각은 API 데이터 수집 timestamp입니다. 레늄 실거래 가격의 갱신 시각과 다를 수 있습니다.':'원천 시각은 updatedAt입니다. 휴장 때 이전 가격이 유지될 수 있습니다.';
 $('board-title').textContent=`오늘의 국제 ${name} 시세`;$('board-description').textContent=`${name} · ${meta.unit}${isWidget?' · 연속선물':''}`;
 $('dashboard').setAttribute('aria-label',`${name} 시세 현황`);$('mode-label').textContent=`실제 원천 · ${asset}`;
 $('price').textContent=q?formatValue(q.value):'—';$('source-at').textContent=time(q?.source_at);$('fetched-at').textContent=time(q?.fetched_at);
 $('quote-source').href=asset==='RHENIUM'?'https://metals-api.com/symbols/RHENIUM':`https://api.gold-api.com/price/${asset}`;$('quote-source').textContent=asset==='RHENIUM'?'Metals-API · RHENIUM':`Gold API · ${asset}`;
 $('status').textContent=({fresh:'정상',stale:'오래된 값',error:'조회 오류',empty:'조회 전'})[state.status];$('status').className=`badge ${state.status}`;
 const err=asset==='RHENIUM'&&state.error_code==='setup_required'?['레늄 데이터 연결 대기','레늄 가격을 표시하려면 데이터 서비스 연결이 필요합니다.','연결 전에는 가격을 표시하지 않습니다.']:ERRORS[state.error_code];$('notice').className=`notice ${err?'warning':q?'good':''}`;
 $('notice-title').textContent=err?err[0]:q?'가격과 관측 시각을 확인하세요.':'시세를 불러오는 중입니다.';
 $('notice-body').textContent=err?`${err[1].replace('금시세',name+' 시세')} ${q?'마지막 정상값을 유지합니다. ':''}${err[2]}`:'원천 관측 후 15분이 지나면 오래된 값으로 표시합니다. 휴장 중에는 이전 가격이 유지될 수 있습니다.';
 $('asset-tabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.symbol===asset)));
 $('gold-records').hidden=asset!=='XAU';$('change-label').textContent=asset==='XAU'?'일별 저장값 변화':'조회 기준';
 const c=comparison(state.daily);$('change').textContent=asset!=='XAU'?'최근 원천 제공 가격':c?`${c.consecutive?'어제':'이전 기록'} 대비 ${c.delta>=0?'+':''}${c.delta.toFixed(6)} USD (${c.percent.toFixed(4)}%)`:'비교할 일별 기록이 아직 없습니다.';
 const rows=states.XAU.daily;$('row-count').textContent=`${rows.length}일`;$('daily-rows').replaceChildren();
 for(const row of [...rows].reverse()){const tr=document.createElement('tr');for(const value of [row.date_kst,formatValue(row.value),time(row.source_at),time(row.fetched_at)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('daily-rows').append(tr);}
 if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.className='empty';td.textContent='정상 조회 후 날짜별 기록이 표시됩니다.';tr.append(td);$('daily-rows').append(tr);}
 controls();
}
function controls(){if(METALS[asset].type==='widget'){$('refresh').disabled=true;$('refresh').textContent='외부 시세 화면';$('auto-refresh').disabled=true;$('auto-status').textContent='갱신·지연 여부는 제공 화면 기준';return;}$('auto-refresh').disabled=false;const s=states[asset],wait=Math.max(0,Math.ceil((s.due-Date.now())/1000));$('refresh').disabled=s.busy||wait>0;$('retry').disabled=s.busy||wait>0;$('refresh').textContent=s.busy?'조회 중…':wait?`${wait}초 후 재조회`:`실제 ${METALS[asset].name} 시세 조회`;$('auto-status').textContent=!auto?'자동 갱신 꺼짐':document.hidden?'다른 탭을 보는 동안 일시정지':s.busy?'원천 조회 중…':`${wait}초 후 자동 조회 · ${asset==='RHENIUM'?'1시간':'30초'} 이상 간격`;}
async function request(symbol,initial=false){
 if(METALS[symbol].type==='widget')return;const s=states[symbol];if(s.busy||(!initial&&Date.now()<s.due))return;s.busy=true;controls();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),symbol==='XAU'?35000:12000);
 try{
  const response=await fetch(symbol==='XAU'?'/api/board':symbol==='RHENIUM'?'/api/rhenium':`/api/metals?symbol=${symbol}`,{method:symbol==='XAU'&&!initial?'POST':'GET',cache:'no-store',signal:controller.signal});const data=await response.json();
  if(symbol==='XAU'){
   if(!Array.isArray(data.daily)||!['empty','fresh','stale','error'].includes(data.status))throw new Error('schema_changed');
   if(!response.ok&&s.last_good&&!data.last_good)Object.assign(s,failure(s,data.error_code||'storage_error'));else Object.assign(s,data);
   s.failures=response.ok&&['none','source_stale'].includes(s.error_code)?0:s.failures+1;
   s.due=nextPollTime(Date.now(),s.next_attempt_at,s.failures);
   if(initial&&s.configured!==false&&s.error_code==='none'&&(!s.last_good||Date.now()-Date.parse(s.last_good.fetched_at)>=30000))s.due=0;
   if(response.ok)try{localStorage.setItem('gold-note-last-snapshot-v1',JSON.stringify(s));}catch{}
  }else{
   if(!response.ok){s.due=Date.now()+Math.max(60,Math.min(3600,Number(data.retry_after)||60))*1000;throw new Error(data.error);}
   const q=data.quote;if(!q||q.symbol!==symbol||typeof q.value!=='number'||!Number.isFinite(q.value)||q.value<=0||!Number.isFinite(Date.parse(q.source_at))||!Number.isFinite(Date.parse(q.fetched_at)))throw new Error('schema_changed');
   s.last_good=q;s.status='fresh';s.error_code='none';s.due=Date.now()+(symbol==='RHENIUM'?3600000:30000);
  }
 }catch(error){Object.assign(s,failure(s,controller.signal.aborted?'timeout':Object.hasOwn(ERRORS,error.message)?error.message:'offline'));s.due=Math.max(s.due,Date.now()+(symbol==='RHENIUM'?3600000:60000));}
 finally{clearTimeout(timer);s.busy=false;if(symbol===asset)render();}
}
$('asset-tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{asset=b.dataset.symbol;render();chart.update();request(asset);});
$('refresh').onclick=$('retry').onclick=()=>request(asset);$('auto-refresh').onchange=()=>{auto=$('auto-refresh').checked;controls();};
try{const cached=JSON.parse(localStorage.getItem('gold-note-last-snapshot-v1'));if(cached?.last_good&&Array.isArray(cached.daily))Object.assign(states.XAU,failure(cached,'offline'),{busy:false,due:0});}catch{}
render();chart=initMarket(()=>asset);request('XAU',true).then(()=>{if(auto&&!document.hidden&&asset==='XAU'&&states.XAU.due===0)request('XAU');});
const interval=setInterval(()=>{controls();if(auto&&!document.hidden)request(asset);if(withAge(states[asset]).status!==states[asset].status){Object.assign(states[asset],withAge(states[asset]));render();}},1000);
window.addEventListener('offline',()=>{for(const s of Object.values(states))Object.assign(s,failure(s,'offline'));render();});
window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
