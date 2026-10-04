-- Run AFTER 001_gold_board.sql. Existing gold records are copied; never deleted.
begin;
create table if not exists public.market_daily(symbol text not null check(symbol in ('XAU','XAG','WTI','WHEAT')),date_kst date not null,record jsonb not null,primary key(symbol,date_kst));
create table if not exists public.market_state(symbol text primary key check(symbol in ('XAU','XAG','WTI','WHEAT')),last_good jsonb,error_code text not null default 'none');
create table if not exists public.market_control(id integer primary key check(id=1),lease_token uuid,lease_until timestamptz,next_attempt_at timestamptz,last_run jsonb);
insert into public.market_state(symbol) values('XAU'),('XAG'),('WTI'),('WHEAT') on conflict do nothing;
insert into public.market_control(id) values(1) on conflict do nothing;
insert into public.market_daily select 'XAU',date_kst,record from public.gold_daily on conflict do nothing;
update public.market_state set last_good=(select record from public.market_daily where symbol='XAU' order by date_kst desc limit 1) where symbol='XAU' and last_good is null;
alter table public.market_daily enable row level security;
alter table public.market_state enable row level security;
alter table public.market_control enable row level security;
revoke all on public.market_daily,public.market_state,public.market_control from public,anon,authenticated;
grant all on public.market_daily,public.market_state,public.market_control to service_role;
create or replace function public.market_snapshot() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('assets',(select jsonb_object_agg(s.symbol,jsonb_build_object('last_good',s.last_good,'error_code',s.error_code,'status',case when s.last_good is null then case when s.error_code='none' then 'empty' else 'error' end when s.error_code='none' then 'fresh' else 'stale' end,'daily',coalesce((select jsonb_agg(x.record order by x.date_kst) from (select d.record,d.date_kst from public.market_daily d where d.symbol=s.symbol order by d.date_kst desc limit 90)x),'[]'::jsonb))) from public.market_state s),
 'next_attempt_at',c.next_attempt_at,'last_run',c.last_run,
 'evidence',coalesce((select jsonb_agg(jsonb_build_object('date_kst',e.date_kst,'records',e.records) order by e.date_kst) from (select date_kst,jsonb_object_agg(symbol,record) as records from public.market_daily group by date_kst having count(*)=4 and count(distinct record->>'batch_id')=1 and count(record->>'batch_id')=4 order by date_kst limit 2)e),'[]'::jsonb)) from public.market_control c where id=1;
$$;
create or replace function public.market_claim() returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.market_control%rowtype;t uuid;
begin
 select * into c from public.market_control where id=1 for update;
 if c.next_attempt_at>clock_timestamp() or c.lease_until>clock_timestamp() then return jsonb_build_object('token',null);end if;
 t:=gen_random_uuid();update public.market_control set lease_token=t,lease_until=clock_timestamp()+interval '45 seconds',next_attempt_at=clock_timestamp()+interval '60 seconds' where id=1;
 return jsonb_build_object('token',t);
end;$$;
create or replace function public.market_finish(p_token uuid,p_outcomes jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.market_control%rowtype;o jsonb;r jsonb;s text;d date;f timestamptz;src timestamptz;ok_count integer:=0;delay integer:=60;provider text;
begin
 select * into c from public.market_control where id=1 for update;
 if p_token is null or c.lease_token is distinct from p_token then return jsonb_build_object('applied',false);end if;
 if jsonb_typeof(p_outcomes) is distinct from 'array' or jsonb_array_length(p_outcomes)<>4 or (select count(distinct value->>'symbol') from jsonb_array_elements(p_outcomes))<>4 then raise exception 'Four outcomes required';end if;
 for o in select value from jsonb_array_elements(p_outcomes) loop
  s:=o->>'symbol';if s is null or s not in ('XAU','XAG','WTI','WHEAT') then raise exception 'Invalid symbol';end if;
  delay:=greatest(delay,least(3600,coalesce((o->>'wait')::integer,60)));
  if o->>'error'='none' then
   r:=o->'record';f:=(r->>'fetched_at')::timestamptz;src:=(r->>'source_at')::timestamptz;d:=(f at time zone 'Asia/Seoul')::date;
   if r->>'symbol' is distinct from s or r->>'synthetic' is distinct from 'false' or r->>'timezone' is distinct from 'Asia/Seoul' or r->>'date_kst' is distinct from d::text or jsonb_typeof(r->'value') is distinct from 'number' or (r->>'value')::numeric<=0 or f is null or src is null or f<clock_timestamp()-interval '2 minutes' or f>clock_timestamp()+interval '10 seconds' or src>f+interval '5 minutes' then raise exception 'Invalid observation';end if;
   if s in ('XAU','XAG') then
    if r->>'source_url' is distinct from 'https://api.gold-api.com/price/'||s or r->>'unit' is distinct from 'USD / 트로이온스' or r->'raw'->>'symbol' is distinct from s or r->'raw'->>'currency' is distinct from 'USD' or r->'raw'->'price' is distinct from r->'value' or r->'raw'->>'updatedAt' is distinct from r->>'source_at' then raise exception 'Metal mismatch';end if;
   else
    provider:=case when s='WTI' then 'WTIOIL' else 'WHEAT' end;
    if r->>'source_url' is distinct from 'https://commodities-api.com/symbols/'||provider or r->'raw'->>'base' is distinct from 'USD' or r->'raw'->>'success' is distinct from 'true' or coalesce(r->'raw'->'unit'->>provider,'') !~ '^per [a-zA-Z0-9 ./-]{1,50}$' or r->>'unit' is distinct from 'USD / '||substring(r->'raw'->'unit'->>provider from 5) or jsonb_typeof(r->'raw'->'rates'->provider) is distinct from 'number' or (r->'raw'->'rates'->>provider)::numeric<=0 or abs((r->>'value')::double precision - 1/(r->'raw'->'rates'->>provider)::double precision)>greatest(1e-10,abs((r->>'value')::double precision)*1e-12) or to_timestamp((r->'raw'->>'timestamp')::double precision) is distinct from src then raise exception 'Commodity mismatch';end if;
   end if;
   r:=r||jsonb_build_object('batch_id',p_token);
   insert into public.market_daily values(s,d,r) on conflict(symbol,date_kst) do update set record=excluded.record;
   update public.market_state set last_good=r,error_code='none' where symbol=s;ok_count:=ok_count+1;
  else
   if o->>'error' is null or o->>'error' not in ('timeout','access_denied','rate_limited','offline','schema_changed','upstream_error','source_setup_required') then raise exception 'Invalid error';end if;
   update public.market_state set error_code=o->>'error' where symbol=s;
  end if;
 end loop;
 update public.market_control set lease_token=null,lease_until=null,next_attempt_at=clock_timestamp()+make_interval(secs=>delay),last_run=jsonb_build_object('batch_id',p_token,'finished_at',clock_timestamp(),'success_count',ok_count,'outcomes',(select jsonb_agg(jsonb_build_object('symbol',v->>'symbol','error',v->>'error')) from jsonb_array_elements(p_outcomes)v)) where id=1;
 return jsonb_build_object('applied',true);
end;$$;
revoke all on function public.market_snapshot(),public.market_claim(),public.market_finish(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.market_snapshot(),public.market_claim(),public.market_finish(uuid,jsonb) to service_role;
commit;
