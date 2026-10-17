// Partial implementation for the restart cycle. The chart provider is NOT connected.
// Next worker: mount BTCUSD, bind interval/reload, dispose old widget, handle failure/retry.
export function initBitcoinChart() {
  const status = document.getElementById('bitcoin-chart-status');
  const update = () => { status.textContent = '차트 준비 중 · 현재가는 정상 조회할 수 있습니다.'; };
  update();
  return {update};
}
