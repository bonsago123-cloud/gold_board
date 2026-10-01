import {METALS} from './metals.mjs';
export const CHART_INTERVALS = Object.freeze({'1':'1분','5':'5분','15':'15분','60':'1시간','240':'4시간','D':'1일','W':'1주','M':'1개월'});
export function chartConfig(interval='60',symbol='XAU') {
  if (!Object.hasOwn(CHART_INTERVALS,interval)||!Object.hasOwn(METALS,symbol)||!METALS[symbol].chart) throw new TypeError('Unsupported chart interval');
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
  const link=document.createElement('a');link.href=`https://www.tradingview.com/symbols/${config.symbol.replace(':','-')}/`;
  link.target='_blank';link.rel='noopener nofollow noreferrer';link.textContent=`${config.symbol} · TradingView`;credit.append(link);box.append(credit);
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
 const $=id=>document.getElementById(id);let dispose=()=>{},disposeQuote=()=>{},generation=0,lastSymbol=null;
 async function update(){
  const symbol=getSymbol(),meta=METALS[symbol],id=++generation;dispose();
  $('chart-title').textContent=`${meta.name} 과거 시세 차트`;
  $('chart-interval').disabled=symbol==='RHENIUM';
  if(symbol!==lastSymbol){disposeQuote();if(meta.type==='widget')disposeQuote=mountWidget($('futures-quote'),$('futures-status'),'embed-widget-symbol-info',{symbol:meta.chart,width:'100%',locale:'kr',colorTheme:'light',isTransparent:false});lastSymbol=symbol;}
  if(symbol==='RHENIUM'){
   $('chart-host').replaceChildren();$('chart-interval-note').textContent='최근 30일 · 일별 제공값 · USD/트로이온스 · 날짜는 제공자 UTC 기준';$('chart-status').textContent='레늄 과거 데이터 조회 중…';
   try{const response=await fetch('/api/rhenium?history=true',{signal:AbortSignal.timeout(12000)});const data=await response.json();if(id!==generation)return;
    if(!response.ok)throw new Error(data.error);
    if(!Array.isArray(data.points)||!data.points.length)throw new Error('empty');
    const points=data.points;if(points.some(p=>!Number.isFinite(p.value)||!Number.isFinite(Date.parse(p.date))))throw new Error('invalid');
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 800 360');svg.setAttribute('role','img');svg.setAttribute('aria-label','레늄 최근 30일 일별 제공 가격');svg.style.width='100%';svg.style.height='100%';
    const lo=Math.min(...points.map(p=>p.value)),hi=Math.max(...points.map(p=>p.value)),min=lo-(hi-lo||lo*.01)*.1,max=hi+(hi-lo||hi*.01)*.1;
    const first=Date.parse(points[0].date),last=Date.parse(points.at(-1).date);
    const text=(x,y,value)=>{const n=document.createElementNS(ns,'text');n.setAttribute('x',x);n.setAttribute('y',y);n.setAttribute('font-size','12');n.textContent=value;svg.append(n);};
    text(12,25,max.toFixed(2));text(12,290,min.toFixed(2));text(70,325,points[0].date);text(660,325,points.at(-1).date);text(70,350,'USD / 트로이온스 · 각 점에 마우스를 올리면 날짜와 가격 표시');
    // Individual observations, no invented interpolation across missing dates.
    for(const p of points){const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',70+(Date.parse(p.date)-first)/(last-first||1)*680);dot.setAttribute('cy',290-(p.value-min)/(max-min||1)*265);dot.setAttribute('r','4');dot.setAttribute('fill','#a47b25');const title=document.createElementNS(ns,'title');title.textContent=`${p.date}: ${p.value} USD/트로이온스`;dot.append(title);svg.append(dot);}
    $('chart-host').append(svg);$('chart-status').textContent=`Metals-API · ${points.length}개 일별 관측값 · 누락일은 보간하지 않습니다.`;
   }catch(error){if(id===generation)$('chart-status').textContent=error.message==='setup_required'?'레늄 데이터 연결 대기 · API 키 설정 후 표시됩니다.':'레늄 과거 데이터를 불러오지 못했습니다. 이용 권한과 연결을 확인한 뒤 다시 불러오세요.';}
   return;
  }
  const interval=$('chart-interval').value;$('chart-interval-note').textContent=`${meta.chart} · 간격 ${CHART_INTERVALS[interval]} · x축 시각/날짜 · y축 ${meta.unit}`;
  dispose=mountWidget($('chart-host'),$('chart-status'),'embed-widget-advanced-chart',chartConfig(interval,symbol));
 }
 $('chart-interval').addEventListener('change',update);$('chart-reload').onclick=update;
 window.addEventListener('pagehide',()=>{generation++;dispose();disposeQuote();},{once:true});update();return {update};
}
