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
export function initMarket(getSymbol=()=> 'XAU'){
  const $=id=>document.getElementById(id);let dispose=()=>{};
  function update(){
    const symbol=getSymbol(),interval=$('chart-interval').value;dispose();
    $('chart-title').textContent=`${METALS[symbol].name} 과거 시세 차트`;
    $('chart-interval-note').textContent=`${METALS[symbol].chart} · 간격 ${CHART_INTERVALS[interval]} · x축 시각/날짜 · y축 USD/트로이온스`;
    dispose=mountWidget($('chart-host'),$('chart-status'),'embed-widget-advanced-chart',chartConfig(interval,symbol));
  }
  $('chart-interval').addEventListener('change',update);$('chart-reload').onclick=update;
  window.addEventListener('pagehide',()=>dispose(),{once:true});update();return {update};
}
