import { fetchQuote, BoardError } from '../public/core.mjs';
import { rpc, snapshot } from './store.mjs';
export async function collect() {
  const claim = await rpc('gold_claim');
  if (!claim.token) return { ...await snapshot(), cooldown: true };
  let record, failure;
  try { record = await fetchQuote(); } catch (error) { failure = error instanceof BoardError ? error : new BoardError('upstream_error'); }
  // A database error is not misreported as an upstream failure.
  await rpc('gold_finish', { p_token: claim.token, p_record: record ?? null,
    p_error: failure?.code ?? 'none', p_wait: failure?.retryAfter ?? 30 });
  return snapshot();
}
export function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json(body);
}
