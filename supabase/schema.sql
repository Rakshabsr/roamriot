-- RoamRiot Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Trips table
create table public.trips (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  destination text not null,
  start_date  date not null,
  end_date    date not null,
  preferences jsonb not null default '{}',
  created_at  timestamptz default now()
);

-- Itinerary days
create table public.itinerary_days (
  id         uuid primary key default uuid_generate_v4(),
  trip_id    uuid references public.trips(id) on delete cascade not null,
  day_number integer not null,
  date       date not null
);

-- Activities
create table public.activities (
  id               uuid primary key default uuid_generate_v4(),
  day_id           uuid references public.itinerary_days(id) on delete cascade not null,
  name             text not null,
  description      text,
  location         text,
  address          text,
  latitude         float,
  longitude        float,
  start_time       time not null,
  duration_minutes integer not null default 60,
  category         text not null default 'attraction',
  price_range      text,
  rating           float,
  source_videos    jsonb not null default '[]',
  order_index      integer not null default 0,
  tips             text,
  created_at       timestamptz default now()
);

-- Row Level Security
alter table public.trips         enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.activities     enable row level security;

-- RLS Policies: users can only see their own data
create policy "Users can manage their own trips"
  on public.trips for all
  using (auth.uid() = user_id);

create policy "Users can manage days of their trips"
  on public.itinerary_days for all
  using (exists (
    select 1 from public.trips where trips.id = itinerary_days.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can manage activities of their trips"
  on public.activities for all
  using (exists (
    select 1 from public.itinerary_days
    join public.trips on trips.id = itinerary_days.trip_id
    where itinerary_days.id = activities.day_id and trips.user_id = auth.uid()
  ));

-- Indexes for performance
create index on public.itinerary_days (trip_id);
create index on public.activities (day_id, order_index);
