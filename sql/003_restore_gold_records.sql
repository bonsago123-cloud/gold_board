-- Optional migration after 001: preserve real gold observations from the four-asset version.
-- No deletion; a newer gold record always wins on the same date.
begin;
do $$
begin
 if to_regclass('public.market_daily') is not null then
  insert into public.gold_daily(date_kst,record)
   select date_kst,record from public.market_daily
   where symbol='XAU' and record->>'synthetic'='false'
   and record->>'source_url'='https://api.gold-api.com/price/XAU'
   and record->>'unit'='USD / 트로이온스'
  on conflict(date_kst) do update set record=excluded.record
   where (public.gold_daily.record->>'fetched_at')::timestamptz < (excluded.record->>'fetched_at')::timestamptz;
  update public.gold_state s set last_good=d.record,error_code='none'
   from (select record from public.gold_daily order by (record->>'fetched_at')::timestamptz desc limit 1)d
   where s.id=1 and (s.last_good is null or (s.last_good->>'fetched_at')::timestamptz < (d.record->>'fetched_at')::timestamptz);
 end if;
end $$;
commit;
