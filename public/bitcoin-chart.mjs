import {CHART_INTERVALS, mountWidget} from './market.mjs';

export function bitcoinChartConfig(interval = '60') {
  if (!Object.hasOwn(CHART_INTERVALS, interval)) throw new TypeError('Unsupported chart interval');
  return {
    autosize: true, symbol: 'BITSTAMP:BTCUSD', interval, timezone: 'Asia/Seoul',
    theme: 'light', style: '3', locale: 'kr', allow_symbol_change: false,
    hide_top_toolbar: true, hide_side_toolbar: true, hide_volume: true,
    save_image: false, calendar: false, withdateranges: true,
    support_host: 'https://www.tradingview.com'
  };
}

// Chart interactions never fetch the current quote or write daily records.
export function initBitcoinChart() {
  const el = id => document.getElementById('bitcoin-chart-' + id);
  let dispose = () => {};
  const update = () => {
    dispose();
    // Detach the previous provider script and its callbacks before retrying.
    const host = el('host');
    for (const script of host.querySelectorAll('script')) script.onerror = null;
    host.replaceChildren();
    dispose = mountWidget(host, el('status'), 'embed-widget-advanced-chart',
      bitcoinChartConfig(el('interval').value));
  };
  el('interval').addEventListener('change', update);
  el('reload').addEventListener('click', update);
  window.addEventListener('pagehide', () => {
    dispose();
    el('interval').removeEventListener('change', update);
    el('reload').removeEventListener('click', update);
  }, {once: true});
  update();
}
