// Optional isolated PostgreSQL-compatible validation. Never connects to Supabase.
// Usage: node scripts/check-sql.mjs /absolute/path/to/@electric-sql/pglite/dist/index.js
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { normalize } from '../public/core.mjs';
if(!process.argv[2])throw new Error('Pass the installed PGlite module path. This is a local disposable test database only.');
const {PGlite}=await import(pathToFileURL(process.argv[2]));
const db=new PGlite();
await db.exec('create role anon; create role authenticated; create role service_role;');
const sql=await readFile('sql/001_gold_board.sql','utf8');
await db.exec(sql);await db.exec(sql);
const call=async(name,args=[])=>{
  const params=args.map((_,i)=>`$${i+1}`).join(',');
  const result=await db.query(`select public.${name}(${params}) as result`,args);return result.rows[0].result;
};
const clearWait=()=>db.exec("update public.gold_state set next_attempt_at=null,lease_until=null;");
const getRow=price=>{const now=new Date().toISOString();return normalize({symbol:'XAU',currency:'USD',price,updatedAt:now},now);};
assert.equal((await call('gold_snapshot')).daily.length,0);
let token=(await call('gold_claim')).token;assert.ok(token);assert.equal((await call('gold_claim')).token,null);
await call('gold_finish',[token,JSON.stringify(getRow(3000)),'none',30]);
assert.equal((await call('gold_snapshot')).last_good.value,3000);
for(const price of [3010,3020]){await clearWait();token=(await call('gold_claim')).token;await call('gold_finish',[token,JSON.stringify(getRow(price)),'none',30]);}
let state=await call('gold_snapshot');assert.equal(state.daily.length,1);assert.equal(state.daily[0].value,3020);
for(const code of ['timeout','access_denied','rate_limited','offline','schema_changed']){
  await clearWait();token=(await call('gold_claim')).token;
  await call('gold_finish',[token,null,code,60]);state=await call('gold_snapshot');
  assert.equal(state.error_code,code);assert.equal(state.status,'stale');assert.equal(state.last_good.value,3020);assert.equal(state.daily.length,1);
}
await clearWait();token=(await call('gold_claim')).token;
await call('gold_finish',[token,JSON.stringify(getRow(3040)),'none',30]);
state=await call('gold_snapshot');assert.equal(state.status,'fresh');assert.equal(state.error_code,'none');
const old=state.last_good;const previousTime=new Date(Date.parse(old.fetched_at)-86400000).toISOString();
const previous=normalize({symbol:'XAU',currency:'USD',price:2900,updatedAt:previousTime},previousTime);
// Seed only a disposable test DB to exercise a two-date snapshot; this is not real evidence.
await db.query('insert into public.gold_daily(date_kst,record) values($1,$2)',[previous.date_kst,JSON.stringify(previous)]);
state=await call('gold_snapshot');assert.equal(state.daily.length,2);assert.equal(state.evidence.length,2);assert.equal(state.evidence[0].value,2900);
await clearWait();token=(await call('gold_claim')).token;
await assert.rejects(call('gold_finish',[token,JSON.stringify(previous),'none',30]));
await db.exec('set role anon');await assert.rejects(call('gold_snapshot'));await assert.rejects(db.query('select * from public.gold_daily'));await assert.rejects(db.query("delete from public.gold_daily"));await db.exec('reset role');
assert.equal((await call('gold_snapshot')).daily.length,2);
await clearWait();await db.exec("update public.gold_state set lease_token=null");
const claims=await Promise.all([call('gold_claim'),call('gold_claim'),call('gold_claim')]);assert.equal(claims.filter(x=>x.token).length,1);
console.log('SQL PASS: idempotent migration, atomic lease, same-day upsert, 5 failures preserved, recovery, 2-date evidence, backdate rejection, anonymous denial, concurrent claims.');
await db.close();
