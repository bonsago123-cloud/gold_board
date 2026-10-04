export const SOURCE_URL = 'https://api.gold-api.com/price/XAU';
export const UNIT = 'USD / 트로이온스';
export const TIMEZONE = 'Asia/Seoul';
export const ERRORS = Object.freeze({
  source_setup_required: ['석유·밀 원천 연결 대기', 'Commodities-API 연결 키가 설정되지 않았습니다.', 'Vercel 서버 환경변수 COMMODITIES_API_KEY를 설정한 뒤 다시 시도하세요.'],
  timeout: ['응답 지연', '원천이 제한 시간 안에 응답하지 않았습니다.', '잠시 후 다시 시도하세요.'],
  access_denied: ['원천 접근 거절 (401/403)', '금시세 원천이 요청을 거절했습니다.', '출처의 서비스 상태를 확인한 뒤 다시 시도하세요.'],
  rate_limited: ['호출 제한 (429)', '원천의 요청 한도를 넘었습니다.', '재시도 대기 시간이 지난 뒤 다시 시도하세요.'],
  offline: ['네트워크 연결 실패', '네트워크에 연결할 수 없습니다.', '인터넷 연결을 확인한 뒤 다시 시도하세요.'],
  schema_changed: ['응답 형식 변경', '가격·통화·원천 시각이 예상 형식과 다릅니다.', '출처 형식 확인이 필요합니다. 수정 후 다시 시도하세요.'],
  upstream_error: ['원천 서버 오류', '금시세 제공 서버에서 오류가 발생했습니다.', '출처 복구 후 다시 시도하세요.'],
  storage_error: ['저장소 연결 실패', '기록을 안전하게 읽거나 저장하지 못했습니다.', 'Supabase 연결을 확인한 뒤 다시 시도하세요.'],
  setup_required: ['서비스 연결 대기', '아직 Supabase 연결 설정이 완료되지 않았습니다.', '배포 설정을 마친 뒤 다시 시도하세요.'],
  source_stale: ['원천 갱신 지연', '출처 시각 또는 마지막 조회 이후 15분이 지났습니다. 휴장일에도 이전 가격이 반환될 수 있습니다.', '출처 시각을 확인하고 다시 조회하세요.']
});
export class BoardError extends Error {
  constructor(code, retryAfter = 30) { super(code); this.code = code; this.retryAfter = retryAfter; }
}
export function kstDate(iso) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) throw new BoardError('schema_changed');
  return new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10);
}
export function normalize(raw, fetchedAt, synthetic = false) {
  if (!raw || Array.isArray(raw) || raw.symbol !== 'XAU' || raw.currency !== 'USD' ||
      typeof raw.price !== 'number' || !Number.isFinite(raw.price) || raw.price <= 0 ||
      typeof raw.updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(raw.updatedAt) ||
      !Number.isFinite(Date.parse(raw.updatedAt)) || Date.parse(raw.updatedAt) > Date.parse(fetchedAt) + 300000) {
    throw new BoardError('schema_changed');
  }
  return { date_kst: kstDate(fetchedAt), value: raw.price, unit: UNIT,
    symbol: 'XAU', source_url: SOURCE_URL, source_at: raw.updatedAt,
    fetched_at: fetchedAt, timezone: TIMEZONE, synthetic,
    raw: { symbol: raw.symbol, currency: raw.currency, price: raw.price, updatedAt: raw.updatedAt } };
}
export async function fetchQuote({ fetcher = fetch, now = () => new Date().toISOString(), timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetcher(SOURCE_URL, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (res.status === 401 || res.status === 403) throw new BoardError('access_denied');
    if (res.status === 429) {
      const header = res.headers.get('retry-after');
      const seconds = header && /^\d+$/.test(header) ? Number(header) : Math.ceil((Date.parse(header) - Date.parse(now())) / 1000);
      throw new BoardError('rate_limited', Math.min(3600, Math.max(30, Number.isFinite(seconds) ? seconds : 60)));
    }
    if (!res.ok) throw new BoardError('upstream_error');
    let raw;
    try { raw = await res.json(); } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new BoardError('schema_changed');
    }
    return normalize(raw, now());
  } catch (error) {
    if (error instanceof BoardError) throw error;
    throw new BoardError(controller.signal.aborted ? 'timeout' : 'offline');
  } finally { clearTimeout(timer); }
}
export function emptyState() { return { status: 'empty', error_code: 'none', last_good: null, daily: [] }; }
export function success(state, record) {
  const rows = new Map(state.daily.map(row => [row.date_kst, row]));
  rows.set(record.date_kst, record);
  return { ...state, status: 'fresh', error_code: 'none', last_good: record,
    daily: [...rows.values()].sort((a,b) => a.date_kst.localeCompare(b.date_kst)) };
}
export function failure(state, code) { return { ...state, status: state.last_good ? 'stale' : 'error', error_code: code }; }
export function withAge(state, now = Date.now()) {
  if (state.last_good && state.error_code === 'none' &&
      (now - Date.parse(state.last_good.source_at) > 900000 || now - Date.parse(state.last_good.fetched_at) > 900000)) {
    return failure(state, 'source_stale');
  }
  return state;
}
export function comparison(rows) {
  const sorted = [...rows].sort((a,b) => a.date_kst.localeCompare(b.date_kst));
  if (sorted.length < 2) return null;
  const [a,b] = sorted.slice(-2);
  const delta = b.value - a.value;
  return { from: a, to: b, delta, percent: delta / a.value * 100,
    consecutive: Date.parse(b.date_kst) - Date.parse(a.date_kst) === 86400000 };
}
export function formatValue(value) { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 20 }).format(value); }
