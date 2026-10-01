import {METALS} from './metals.mjs';
export const CHART_INTERVALS = Object.freeze({'1':'1분','5':'5분','15':'15분','60':'1시간','240':'4시간','D':'1일','W':'1주','M':'1개월'});
export function chartConfig(interval='60',symbol='XAU') {
  if (!Object.hasOwn(CHART_INTERVALS,interval)||!Object.hasOwn(METALS,symbol)) throw new TypeError('Unsupported chart interval');
  return {autosize:true,symbol:METALS[symbol].chart,interval,timezone:'Asia/Seoul',theme:'light',style:'3',locale:'kr',
    allow_symbol_change:false,hide_top_toolbar:true,hide_side_toolbar:true,hide_volume:true,save_image:false,
    calendar:false,withdateranges:true,support_host:'https://www.tradingview.com'};
}
// Provider widgets are supplemental; they never call our price API or write daily records.
export function mountWidget(host,status,scriptName,config) {
  host.replaceChildren();
  const box=document.createElement('div');box.className='tradingview-widget-container';
  const body=document.createElement('div');body.className='tradingview-widget-container__widget';box.append(body);
  const credit=document.createElement('div');credit.className='tradingview-widget-copyright';
  const link=document.createElement('a');link.href=`https://www.tradingview.com/symbols/${config.symbol.split(':')[1]}/?exchange=OANDA`;
  link.target='_blank';link.rel='noopener nofollow noreferrer';link.textContent=`${config.symbol} · TradingView / OANDA`;credit.append(link);box.append(credit);
  const script=document.createElement('script');script.type='text/javascript';script.async=true;
  script.src=`https://s3.tradingview.com/external-embedding/${scriptName}.js`;script.textContent=JSON.stringify(config);
  status.textContent='외부 제공 화면을 불러오는 중입니다. 비어 있으면 다시 불러오기를 눌러 주세요.';
  let ended=false;
  const stop=()=>{ended=true;observer.disconnect();clearTimeout(timer);};
  const observer=new MutationObserver(()=>{
    const frame=box.querySelector('iframe');
    if(frame){frame.title=`${config.symbol} 과거 시세 차트`;
      frame.addEventListener('load',()=>{if(!ended){status.textContent='외부 화면 연결됨 · 가격 시각과 지연 여부는 제공 화면에서 확인하세요.';stop();}},{once:true});}
  });
  observer.observe(box,{childList:true,subtree:true});
  const timer=setTimeout(()=>{if(!ended){status.textContent='외부 내용의 표시 여부를 확인해 주세요. 비어 있거나 오류가 나면 다시 불러오기 또는 출처 링크를 이용하세요.';stop();}},20000);
  script.onerror=()=>{status.textContent='외부 화면을 가져오지 못했습니다. 다시 불러오거나 출처 링크를 확인하세요.';stop();};
  host.append(box);box.append(script);
  return stop;
}
export function initMarket(){
  const $=id=>document.getElementById(id);if(!$('chart-host'))return;
  let disposeChart=()=>{},controller=null,requestId=0;
  const states={XAU:{quote:null,due:0,error:null},XAG:{quote:null,due:0,error:null}};
  const selected=()=>$('metal-select').value;
  const format=iso=>new Date(iso).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
  const messages={timeout:'응답 지연',access_denied:'원천 접근 거절',rate_limited:'호출 제한',schema_changed:'응답 형식 변경',offline:'연결 실패',upstream_error:'원천 서버 오류'};
  function render(){
    const symbol=selected(),state=states[symbol],q=state.quote;
    $('metal-name').textContent=`${METALS[symbol].name} 현재 시세 · ${symbol}`;
    $('metal-value').textContent=q?`$${q.value.toLocaleString('en-US',{maximumFractionDigits:8})}`:'—';
    $('metal-source').href=`https://api.gold-api.com/price/${symbol}`;$('metal-source').textContent=`Gold API · ${symbol}`;
    $('metal-source-at').textContent=q?format(q.source_at)+' KST':'—';$('metal-fetched-at').textContent=q?format(q.fetched_at)+' KST':'—';
    const stale=q&&(Date.now()-Date.parse(q.source_at)>900000||Date.now()-Date.parse(q.fetched_at)>900000);
    $('metal-status').textContent=state.error?`${messages[state.error]||'조회 실패'} · ${q?'마지막 정상값 보존 · 오래된 값':'정상값 없음'} · 잠시 후 다시 시도하세요.`:stale?'오래된 값 · 원천 갱신 지연 또는 휴장 · 시각을 확인하세요.':q?'정상 조회 · 30초 간격 자동 갱신':'조회 전';
    $('metal-refresh').disabled=!!controller||Date.now()<state.due;
    $('metal-wait').textContent=Date.now()<state.due?`다음 조회까지 ${Math.ceil((state.due-Date.now())/1000)}초`:'조회 가능';
  }
  function loadChart(){
    const symbol=selected(),interval=$('chart-interval').value;disposeChart();
    $('chart-title').textContent=`${METALS[symbol].name} 과거 시세 차트`;
    $('chart-interval-note').textContent=`${METALS[symbol].chart} · 간격 ${CHART_INTERVALS[interval]} · x축 시각/날짜 · y축 USD/트로이온스 · 확대·축소 및 좌우 이동 가능`;
    disposeChart=mountWidget($('chart-host'),$('chart-status'),'embed-widget-advanced-chart',chartConfig(interval,symbol));
  }
  async function loadQuote(){
    const symbol=selected(),state=states[symbol];if(controller||Date.now()<state.due)return;
    const id=++requestId;controller=new AbortController();const active=controller;
    const timer=setTimeout(()=>active.abort(),12000);render();$('metal-status').textContent='조회 중 · 기존 정상값이 있으면 유지합니다.';
    try{
      const response=await fetch(`/api/metals?symbol=${symbol}`,{signal:active.signal});const data=await response.json();
      if(id!==requestId)return;
      if(!response.ok){state.due=Date.now()+Math.max(30,Math.min(3600,Number(data.retry_after)||60))*1000;throw new Error(data.error);}
      if(!data.quote||data.quote.symbol!==symbol||typeof data.quote.value!=='number'||!Number.isFinite(data.quote.value)||data.quote.value<=0||!Number.isFinite(Date.parse(data.quote.source_at))||!Number.isFinite(Date.parse(data.quote.fetched_at)))throw new Error('schema_changed');
      state.quote=data.quote;state.error=null;state.due=Date.now()+30000;
    }catch(error){if(id===requestId){state.error=active.signal.aborted?'timeout':error.message;state.due=Math.max(state.due,Date.now()+60000);}}
    finally{clearTimeout(timer);if(id===requestId){controller=null;render();}}
  }
  $('metal-select').addEventListener('change',()=>{++requestId;controller?.abort();controller=null;render();loadChart();loadQuote();});
  $('chart-interval').addEventListener('change',loadChart);$('chart-reload').onclick=loadChart;$('metal-refresh').onclick=loadQuote;
  loadChart();render();loadQuote();
  const interval=setInterval(()=>{if(!document.hidden&&!$('market').hidden){render();if($('metal-auto').checked)loadQuote();}},1000);
  window.addEventListener('pagehide',()=>{++requestId;controller?.abort();disposeChart();clearInterval(interval);},{once:true});
}
