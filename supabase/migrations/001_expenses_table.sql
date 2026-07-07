-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  day_number    int  not null default 1,
  category      text not null default 'other',
  description   text not null,
  amount        numeric(10,2) not null,
  currency      text not null default 'INR',
  paid_by       text,
  created_at    timestamptz not null default now()
);

-- Row-level security: users can only touch their own trips' expenses
alter table public.expenses enable row level security;

create policy "Users can read own trip expenses"
  on public.expenses for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "Users can insert own trip expenses"
  on public.expenses for insert
  with check (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "Users can delete own trip expenses"
  on public.expenses for delete
  using (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = auth.uid()
    )
  );
