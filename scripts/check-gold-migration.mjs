import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';import {normalize} from '../public/core.mjs';
const {PGlite}=await import(pathToFileURL(process.argv[2]));const db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role;');
const migration=async name=>db.exec(await readFile('sql/'+name,'utf8'));
await migration('001_gold_board.sql');await migration('003_restore_gold_records.sql'); // optional table absent is safe
await migration('002_four_assets.sql');
const q=(value,t)=>normalize({symbol:'XAU',currency:'USD',price:value,updatedAt:t},t);
const old=q(100,'2026-01-01T01:00:00Z'),newer=q(110,'2026-01-01T02:00:00Z'),second=q(120,'2026-01-02T01:00:00Z');
await db.query('insert into public.gold_daily values($1,$2)',[old.date_kst,old]);
for(const r of [newer,second])await db.query("insert into public.market_daily values('XAU',$1,$2)",[r.date_kst,r]);
await migration('003_restore_gold_records.sql');await migration('003_restore_gold_records.sql');
let s=(await db.query('select public.gold_snapshot() s')).rows[0].s;assert.equal(s.daily.length,2);assert.equal(s.evidence.length,2);assert.equal(s.daily[0].value,110);assert.equal(s.last_good.value,120);
await db.query('update public.market_daily set record=$1 where date_kst=$2',[old,old.date_kst]);await migration('003_restore_gold_records.sql');s=(await db.query('select public.gold_snapshot() s')).rows[0].s;assert.equal(s.daily[0].value,110);
assert.equal((await db.query('select count(*)::int n from public.market_daily')).rows[0].n,2);await db.close();console.log('PASS SQL: no market tables required, gold-only real record migration, newer values win, idempotence, earliest evidence and original rows preserved.');
