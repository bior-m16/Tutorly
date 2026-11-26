-- Per-user daily usage, written only by the tutor edge function (service role).
create table public.usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  solves int not null default 0,
  primary key (user_id, day)
);
alter table public.usage_daily enable row level security;

-- Plus subscribers (set later by the subscription webhook).
create table public.subscribers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plus_until timestamptz
);
alter table public.subscribers enable row level security;

create policy "read own usage" on public.usage_daily for select to authenticated using (user_id = (select auth.uid()));
create policy "read own subscription" on public.subscribers for select to authenticated using (user_id = (select auth.uid()));

-- Atomically count one solve; returns the new count for today.
create or replace function public.bump_solves(p_user uuid)
returns int
language sql
security definer
set search_path = ''
as $$
  insert into public.usage_daily (user_id, day, solves)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set solves = public.usage_daily.solves + 1
  returning solves;
$$;
revoke execute on function public.bump_solves(uuid) from public, anon, authenticated;
