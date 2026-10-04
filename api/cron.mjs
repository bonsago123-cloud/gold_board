import { timingSafeEqual } from 'node:crypto';
import { collect, send } from '../server/service.mjs';
export default async function handler(req,res) {
  if (req.method !== 'GET') return send(res,405,{error:'method_not_allowed'});
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';
  const given = req.headers.authorization ?? '';
  if (!expected || Buffer.byteLength(given) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(given),Buffer.from(expected))) return send(res,401,{error:'unauthorized'});
  try { const data=await collect(); send(res,200,{ok:!!data.last_good&&['none','source_stale'].includes(data.error_code),cooldown:Boolean(data.cooldown),symbol:'XAU',error_code:data.error_code}); } catch { send(res,503,{ok:false,error:'collection_failed'}); }
}
