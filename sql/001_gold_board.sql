-- Run once in Supabase SQL Editor. This migration only creates gold_* objects.
begin;
create table if not exists public.gold_daily (
  date_kst date primary key,
  record jsonb not null,
  constraint gold_daily_date check (record->>'date_kst' = date_kst::text),
  constraint gold_daily_real check ((record->>'synthetic')::boolean = false),
  constraint gold_daily_price check ((record->>'value')::numeric > 0)
);
create table if not exists public.gold_state (
  id integer primary key check(id=1),
  last_good jsonb,
  error_code text not null default 'none',
  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  lease_token uuid,
  lease_until timestamptz
);
insert into public.gold_state(id) values(1) on conflict do nothing;
alter table public.gold_daily enable row level security;
alter table public.gold_state enable row level security;
revoke all on public.gold_daily, public.gold_state from public, anon, authenticated;
grant all on public.gold_daily, public.gold_state to service_role;

create or replace function public.gold_snapshot() returns jsonb
language sql security definer set search_path = '' as $$
 select jsonb_build_object(
   'status', case when s.last_good is null then case when s.error_code='none' then 'empty' else 'error' end
                  when s.error_code='none' then 'fresh' else 'stale' end,
   'error_code', s.error_code, 'last_good', s.last_good,
   'last_attempt_at', s.last_attempt_at, 'next_attempt_at', s.next_attempt_at,
   'daily', coalesce((select jsonb_agg(d.record order by d.date_kst) from
     (select date_kst,record from public.gold_daily order by date_kst desc limit 90) d),'[]'::jsonb),
   'evidence',coalesce((select jsonb_agg(e.record order by e.date_kst) from
     (select date_kst,record from public.gold_daily order by date_kst limit 2) e),'[]'::jsonb),
   'total_days',(select count(*) from public.gold_daily),
   'server_at',clock_timestamp()
 ) from public.gold_state s where s.id=1;
$$;

create or replace function public.gold_claim() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.gold_state%rowtype; t uuid; n timestamptz := clock_timestamp();
begin
  select * into s from public.gold_state where id=1 for update;
  if s.next_attempt_at > n or s.lease_until > n then
    return jsonb_build_object('token',null);
  end if;
  t := gen_random_uuid();
  update public.gold_state set lease_token=t, lease_until=n+interval '35 seconds',
    last_attempt_at=n, next_attempt_at=n+interval '30 seconds' where id=1;
  return jsonb_build_object('token',t);
end;
$$;

create or replace function public.gold_finish(p_token uuid, p_record jsonb, p_error text, p_wait integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.gold_state%rowtype; d date; fetched timestamptz;
begin
  select * into s from public.gold_state where id=1 for update;
  if s.lease_token is distinct from p_token or p_token is null then
    return jsonb_build_object('applied',false);
  end if;
  if p_error='none' then
    if p_record is null or p_record->>'symbol' is distinct from 'XAU'
      or p_record->>'unit' is distinct from 'USD / 트로이온스'
      or p_record->>'timezone' is distinct from 'Asia/Seoul'
      or p_record->>'source_url' is distinct from 'https://api.gold-api.com/price/XAU'
      or p_record->>'synthetic' is distinct from 'false'
      or p_record->'raw'->>'currency' is distinct from 'USD'
      or p_record->'raw'->>'symbol' is distinct from 'XAU'
      or p_record->'raw'->'price' is distinct from p_record->'value'
      or p_record->'raw'->>'updatedAt' is distinct from p_record->>'source_at'
      or jsonb_typeof(p_record->'value') is distinct from 'number'
      or (p_record->>'value')::numeric <= 0 then
      raise exception 'Invalid real record';
    end if;
    fetched := (p_record->>'fetched_at')::timestamptz;
    if fetched is null or fetched < clock_timestamp()-interval '2 minutes'
       or fetched > clock_timestamp()+interval '10 seconds'
       or (p_record->>'source_at')::timestamptz > fetched+interval '5 minutes' then
      raise exception 'Invalid server observation time';
    end if;
    d := (fetched at time zone 'Asia/Seoul')::date;
    if p_record->>'date_kst' is distinct from d::text then raise exception 'KST date mismatch'; end if;
    if s.last_good is null or (s.last_good->>'fetched_at')::timestamptz <= fetched then
      insert into public.gold_daily(date_kst,record) values(d,p_record)
      on conflict(date_kst) do update set record=excluded.record
      where (public.gold_daily.record->>'fetched_at')::timestamptz <= fetched;
      update public.gold_state set last_good=p_record,error_code='none' where id=1;
    end if;
  else
    if p_error not in ('timeout','access_denied','rate_limited','offline','schema_changed','upstream_error') then
      raise exception 'Invalid error code';
    end if;
    update public.gold_state set error_code=p_error where id=1;
  end if;
  update public.gold_state set lease_token=null,lease_until=null,
    next_attempt_at=clock_timestamp()+make_interval(secs=>least(3600,greatest(30,coalesce(p_wait,30)))) where id=1;
  return jsonb_build_object('applied',true);
end;
$$;
revoke all on function public.gold_snapshot() from public,anon,authenticated;
revoke all on function public.gold_claim() from public,anon,authenticated;
revoke all on function public.gold_finish(uuid,jsonb,text,integer) from public,anon,authenticated;
grant execute on function public.gold_snapshot() to service_role;
grant execute on function public.gold_claim() to service_role;
grant execute on function public.gold_finish(uuid,jsonb,text,integer) to service_role;
commit;
