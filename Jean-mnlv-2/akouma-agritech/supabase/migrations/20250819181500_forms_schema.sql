-- Forms schema: ensure tables and columns used by admin are present and optimized

create extension if not exists pgcrypto;

-- Contact messages
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company text,
  project_type text not null,
  message text not null,
  status text not null default 'new',
  processed_at timestamptz,
  processed_by uuid,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.contact_messages
  add column if not exists status text default 'new',
  add column if not exists processed_at timestamptz,
  add column if not exists processed_by uuid,
  add column if not exists country text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Content submissions
create table if not exists public.content_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  organization text,
  content_type text not null,
  title text not null,
  description text not null,
  category text not null,
  duration text,
  target_audience text,
  file_url text,
  status text default 'new',
  processed_at timestamptz,
  processed_by uuid,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.content_submissions
  add column if not exists status text default 'new',
  add column if not exists processed_at timestamptz,
  add column if not exists processed_by uuid,
  add column if not exists country text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Demo requests
create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null,
  phone text,
  message text,
  status text not null default 'new',
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.demo_requests
  add column if not exists status text default 'new',
  add column if not exists processed_at timestamptz,
  add column if not exists processed_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Indices
create index if not exists idx_contact_messages_created_at on public.contact_messages (created_at desc);
create index if not exists idx_content_submissions_created_at on public.content_submissions (created_at desc);
create index if not exists idx_demo_requests_created_at on public.demo_requests (created_at desc);

-- Attach updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $fn$
begin
  new.updated_at := now();
  return new;
end
$fn$ language plpgsql;

do $do$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_contact_messages_updated_at') then
    create trigger set_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_content_submissions_updated_at') then
    create trigger set_content_submissions_updated_at before update on public.content_submissions for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_demo_requests_updated_at') then
    create trigger set_demo_requests_updated_at before update on public.demo_requests for each row execute function public.set_updated_at();
  end if;
end
$do$ language plpgsql;


