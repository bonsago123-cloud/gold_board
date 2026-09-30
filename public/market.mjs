export const CHART_INTERVALS = Object.freeze({'1':'1분','5':'5분','15':'15분','60':'1시간','240':'4시간','D':'1일','W':'1주','M':'1개월'});
export function chartConfig(interval='60') {
  if (!Object.hasOwn(CHART_INTERVALS,interval)) throw new TypeError('Unsupported chart interval');
  return {autosize:true,symbol:'OANDA:XAUUSD',interval,timezone:'Asia/Seoul',theme:'light',style:'3',locale:'kr',
    allow_symbol_change:false,hide_top_toolbar:true,hide_side_toolbar:true,hide_volume:true,save_image:false,
    calendar:false,withdateranges:true,support_host:'https://www.tradingview.com'};
}
export const NEWS_CONFIG=Object.freeze({feedMode:'symbol',symbol:'OANDA:XAUUSD',colorTheme:'light',isTransparent:false,
  displayMode:'regular',width:'100%',height:'100%',locale:'en'});

// Provider widgets are supplemental; they never call our price API or write daily records.
export function mountWidget(host,status,scriptName,config) {
  host.replaceChildren();
  const box=document.createElement('div');box.className='tradingview-widget-container';
  const body=document.createElement('div');body.className='tradingview-widget-container__widget';box.append(body);
  const credit=document.createElement('div');credit.className='tradingview-widget-copyright';
  const link=document.createElement('a');link.href='https://www.tradingview.com/symbols/XAUUSD/?exchange=OANDA';
  link.target='_blank';link.rel='noopener nofollow noreferrer';link.textContent='Gold XAU/USD by TradingView';credit.append(link);box.append(credit);
  const script=document.createElement('script');script.type='text/javascript';script.async=true;
  script.src=`https://s3.tradingview.com/external-embedding/${scriptName}.js`;script.textContent=JSON.stringify(config);
  status.textContent='외부 제공 화면을 불러오는 중입니다. 비어 있으면 다시 불러오기를 눌러 주세요.';
  let ended=false;
  const stop=()=>{ended=true;observer.disconnect();clearTimeout(timer);};
  const observer=new MutationObserver(()=>{
    const frame=box.querySelector('iframe');
    if(frame){frame.title=scriptName.includes('timeline')?'금 관련 최신 뉴스':'국제 금 과거 시세 차트';
      frame.addEventListener('load',()=>{if(!ended){status.textContent='외부 화면 연결됨 · 가격·기사 시각과 지연 여부는 제공 화면에서 확인하세요.';stop();}},{once:true});}
  });
  observer.observe(box,{childList:true,subtree:true});
  const timer=setTimeout(()=>{if(!ended){status.textContent='외부 내용의 표시 여부를 확인해 주세요. 비어 있거나 오류가 나면 다시 불러오기 또는 출처 링크를 이용하세요.';stop();}},20000);
  script.onerror=()=>{status.textContent='외부 화면을 가져오지 못했습니다. 다시 불러오거나 출처 링크를 확인하세요.';stop();};
  host.append(box);box.append(script);
  return stop;
}
export function initMarket(){
  const $=id=>document.getElementById(id);if(!$('chart-host'))return;
  let disposeChart=()=>{},disposeNews=()=>{};
  function loadChart(){
    const interval=$('chart-interval').value;disposeChart();
    $('chart-interval-note').textContent=`현재 간격: ${CHART_INTERVALS[interval]} · x축: 시각/날짜 · y축: USD/트로이온스. 확대·축소와 좌우 이동은 차트 안에서 가능합니다.`;
    disposeChart=mountWidget($('chart-host'),$('chart-status'),'embed-widget-advanced-chart',chartConfig(interval));
  }
  function loadNews(){disposeNews();disposeNews=mountWidget($('news-host'),$('news-status'),'embed-widget-timeline',NEWS_CONFIG);
    $('news-requested-at').textContent=`화면 요청: ${new Date().toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} KST · 기사 발행 시각과 다릅니다.`;}
  $('chart-interval').addEventListener('change',loadChart);$('chart-reload').onclick=loadChart;$('news-reload').onclick=loadNews;
  loadChart();loadNews();
  // Refresh news while visible every 10 minutes; pause when hidden or in synthetic mode.
  const interval=setInterval(()=>{if(!document.hidden&&!$('market').hidden)loadNews();},600000);
  window.addEventListener('pagehide',()=>{disposeChart();disposeNews();clearInterval(interval);},{once:true});
}
