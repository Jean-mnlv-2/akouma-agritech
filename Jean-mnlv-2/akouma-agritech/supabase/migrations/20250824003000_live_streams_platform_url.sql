alter table if exists public.live_streams
  add column if not exists platform text check (platform in ('youtube','facebook')) default 'youtube',
  add column if not exists url text;
