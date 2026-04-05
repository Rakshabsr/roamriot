-- ─── Analytics Events ────────────────────────────────────────────────────────
-- Tracks all meaningful user interactions in RoamRiot.
-- user_id is nullable — anonymous sessions are tracked via session_id.

create table if not exists public.analytics_events (
  id          uuid        default gen_random_uuid() primary key,
  event_type  text        not null,
  user_id     uuid        references auth.users(id) on delete set null,
  session_id  text,
  properties  jsonb       default '{}',
  country     text,
  city        text,
  created_at  timestamptz default now()
);

-- Indexes for common dashboard queries
create index if not exists idx_analytics_event_type  on public.analytics_events (event_type);
create index if not exists idx_analytics_user_id     on public.analytics_events (user_id);
create index if not exists idx_analytics_created_at  on public.analytics_events (created_at desc);
create index if not exists idx_analytics_destination on public.analytics_events ((properties->>'destination'));

-- RLS: only service role (API) can insert; authenticated users can read their own
alter table public.analytics_events enable row level security;

create policy "Service can insert analytics"
  on public.analytics_events for insert
  with check (true);

create policy "Users can read own analytics"
  on public.analytics_events for select
  using (auth.uid() = user_id);
