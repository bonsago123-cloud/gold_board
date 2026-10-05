-- Run after 002. Keeps all historical rows; collection now accepts only gold/silver.
begin;
create or replace function public.market_finish(p_token uuid,p_outcomes jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.market_control%rowtype;o jsonb;r jsonb;s text;d date;f timestamptz;src timestamptz;ok_count integer:=0;delay integer:=60;provider text;
begin
 select * into c from public.market_control where id=1 for update;
 if p_token is null or c.lease_token is distinct from p_token then return jsonb_build_object('applied',false);end if;
 if jsonb_typeof(p_outcomes) is distinct from 'array' or jsonb_array_length(p_outcomes)<>2 or (select count(distinct value->>'symbol') from jsonb_array_elements(p_outcomes))<>2 then raise exception 'Two metal outcomes required';end if;
 for o in select value from jsonb_array_elements(p_outcomes) loop
  s:=o->>'symbol';if s is null or s not in ('XAU','XAG') then raise exception 'Invalid symbol';end if;
  delay:=greatest(delay,least(3600,coalesce((o->>'wait')::integer,60)));
  if o->>'error'='none' then
   r:=o->'record';f:=(r->>'fetched_at')::timestamptz;src:=(r->>'source_at')::timestamptz;d:=(f at time zone 'Asia/Seoul')::date;
   if r->>'symbol' is distinct from s or r->>'synthetic' is distinct from 'false' or r->>'timezone' is distinct from 'Asia/Seoul' or r->>'date_kst' is distinct from d::text or jsonb_typeof(r->'value') is distinct from 'number' or (r->>'value')::numeric<=0 or f is null or src is null or f<clock_timestamp()-interval '2 minutes' or f>clock_timestamp()+interval '10 seconds' or src>f+interval '5 minutes' then raise exception 'Invalid observation';end if;
   if s in ('XAU','XAG') then
    if r->>'source_url' is distinct from 'https://api.gold-api.com/price/'||s or r->>'unit' is distinct from 'USD / 트로이온스' or r->'raw'->>'symbol' is distinct from s or r->'raw'->>'currency' is distinct from 'USD' or r->'raw'->'price' is distinct from r->'value' or r->'raw'->>'updatedAt' is distinct from r->>'source_at' then raise exception 'Metal mismatch';end if;
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

commit;
