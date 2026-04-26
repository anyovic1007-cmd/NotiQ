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

create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  channel text not null check (channel in ('email', 'inapp')),
  subject text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_workflows (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  steps jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_slug text not null,
  user_id text not null,
  variables jsonb,
  status text not null default 'running' check (status in ('running','completed','failed')),
  current_step int not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists digest_configs (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  user_id text not null,
  window_ms int not null,
  template_slug text not null,
  unique(key, user_id)
);

create table if not exists digest_events (
  id uuid primary key default gen_random_uuid(),
  digest_key text not null,
  user_id text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
