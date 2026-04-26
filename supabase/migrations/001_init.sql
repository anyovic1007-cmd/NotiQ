create extension if not exists "pgcrypto";

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null,
  title text not null,
  body text not null,
  status text not null default 'pending',
  retries integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz
);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  payload jsonb not null,
  processed_at timestamptz not null default timezone('utc', now())
);
