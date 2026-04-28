create table if not exists worker_heartbeats (
  id          text primary key default 'default',
  last_seen   timestamptz not null default now(),
  version     text,
  campaigns_running int default 0,
  campaigns_queued  int default 0,
  messages_sent_today int default 0,
  updated_at  timestamptz not null default now()
);

-- Seed row
insert into worker_heartbeats (id) values ('default') on conflict do nothing;
