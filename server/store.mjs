import { BoardError, emptyState, withAge } from '../public/core.mjs';
export function configured() { return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }
export async function rpc(name, body = {}) {
  if (!configured()) throw new BoardError('setup_required');
  const base = new URL(process.env.SUPABASE_URL);
  if (base.protocol !== 'https:' || !base.hostname.endsWith('.supabase.co')) throw new BoardError('setup_required');
  let res;
  try {
    res = await fetch(new URL(`/rest/v1/rpc/${name}`, base), {
      method: 'POST', signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json', apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }, body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('storage');
    return await res.json();
  } catch { throw new BoardError('storage_error'); }
}
export async function snapshot() {
  const data = await rpc('gold_snapshot');
  return withAge({ ...emptyState(), ...data, mode: 'live', configured: true });
}
