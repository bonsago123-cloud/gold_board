// BTCUSD history chart for the Bitcoin tab (TradingView / Bitstamp).
// The provider widget is supplemental: it never calls our price API and never writes records.
// It reuses mountWidget/CHART_INTERVALS from market.mjs; metal charts and market.mjs are untouched.
import {CHART_INTERVALS, mountWidget} from './market.mjs';

export const BITCOIN_CHART_SYMBOL = 'BITSTAMP:BTCUSD';
export const BITCOIN_DEFAULT_INTERVAL = '60';

export function bitcoinChartConfig(interval = BITCOIN_DEFAULT_INTERVAL) {
  if (!Object.hasOwn(CHART_INTERVALS, interval)) throw new TypeError('Unsupported chart interval');
  return {autosize: true, symbol: BITCOIN_CHART_SYMBOL, interval, timezone: 'Asia/Seoul', theme: 'light', style: '3', locale: 'kr',
    allow_symbol_change: false, hide_top_toolbar: true, hide_side_toolbar: true, hide_volume: true, save_image: false,
    calendar: false, withdateranges: true, support_host: 'https://www.tradingview.com'};
}

export function initBitcoinChart() {
  const host = document.getElementById('bitcoin-chart-host');
  const select = document.getElementById('bitcoin-chart-interval');
  const reloadButton = document.getElementById('bitcoin-chart-reload');
  const statusEl = document.getElementById('bitcoin-chart-status');
  if (!host || !select || !reloadButton || !statusEl) return {update() {}, reload() {}, dispose() {}};

  let stopWidget = () => {};
  let generation = 0;
  let mounted = false;

  const selectedInterval = () => {
    if (!Object.hasOwn(CHART_INTERVALS, select.value)) select.value = BITCOIN_DEFAULT_INTERVAL;
    return select.value;
  };

  // Always replace the single widget: mountWidget clears the host first, so exactly one chart frame exists.
  function mount() {
    stopWidget();
    const mine = ++generation;
    // mountWidget only assigns status.textContent. A superseded mount that fails late
    // (script error after a newer mount began) must not overwrite the newer mount's status.
    const guardedStatus = {set textContent(text) { if (mine === generation) statusEl.textContent = text; }};
    mounted = true;
    stopWidget = mountWidget(host, guardedStatus, 'embed-widget-advanced-chart', bitcoinChartConfig(selectedInterval()));
  }

  function dispose() {
    generation++;
    stopWidget();
    stopWidget = () => {};
    mounted = false;
  }

  select.addEventListener('change', mount);
  reloadButton.addEventListener('click', mount);
  window.addEventListener('pagehide', dispose, {once: true});

  // Called whenever the Bitcoin tab is shown. Mount lazily on first show (the panel must be visible
  // for autosize) and keep the existing widget afterwards, so tab switching adds no provider requests.
  return {update() { if (!mounted) mount(); }, reload: mount, dispose};
}
