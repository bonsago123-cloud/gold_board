import { emptyState, failure } from '../public/core.mjs';
import { snapshot } from '../server/store.mjs';
import { collect, send } from '../server/service.mjs';
export default async function handler(req, res) {
  if (!['GET','POST'].includes(req.method)) { res.setHeader('Allow','GET, POST'); return send(res,405,{error:'method_not_allowed'}); }
  // No client-supplied price, timestamp, fixture, source URL or database query is accepted.
  if (req.method === 'POST') {
    let wrongOrigin = req.headers['sec-fetch-site'] === 'cross-site';
    if (req.headers.origin) {
      try { wrongOrigin ||= new URL(req.headers.origin).host !== req.headers.host; }
      catch { wrongOrigin = true; }
    }
    if (wrongOrigin) return send(res,403,{error:'cross_origin'});
  }
  try { send(res, 200, req.method === 'GET' ? await snapshot() : await collect()); }
  catch (error) {
    const code = ['setup_required','storage_error'].includes(error.code) ? error.code : 'storage_error';
    // Preserve DB last_good on failure when the DB can still be read.
    let prior = emptyState();
    if (code !== 'setup_required') { try { prior = await snapshot(); } catch {} }
    send(res, 503, { ...failure(prior,code), mode:'live', configured: code !== 'setup_required' });
  }
}
