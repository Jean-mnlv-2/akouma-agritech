-- Ensure UUID generation is available
create extension if not exists pgcrypto;

-- Roles table for admin checks
create table if not exists public.user_roles (
  user_id uuid not null,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Optional: profiles.role for fallback admin checks
alter table if exists public.profiles
  add column if not exists role text;

-- Content tables (create if missing) and add media/audit columns where needed

-- Courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  instructor_name text,
  price_fcfa numeric,
  duration_minutes integer,
  category text,
  level text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  thumbnail_url text,
  video_url text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.courses
  add column if not exists thumbnail_url text,
  add column if not exists video_url text,
  add column if not exists is_published boolean default false,
  add column if not exists is_featured boolean default false,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Seeds
create table if not exists public.seeds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  variety text,
  price_fcfa numeric,
  unit text,
  stock_quantity integer,
  availability text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  rating numeric default 0,
  total_reviews integer default 0,
  image_url text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.seeds
  add column if not exists image_url text,
  add column if not exists is_published boolean default false,
  add column if not exists is_featured boolean default false,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- News
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  content text,
  author_name text,
  category text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  views_count integer not null default 0,
  image_url text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.news
  add column if not exists image_url text,
  add column if not exists views_count integer default 0,
  add column if not exists is_published boolean default false,
  add column if not exists is_featured boolean default false,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Shop products
create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  price_fcfa numeric,
  original_price_fcfa numeric,
  stock_quantity integer,
  in_stock boolean default true,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  is_new boolean not null default false,
  rating numeric default 0,
  total_reviews integer default 0,
  image_url text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shop_products
  add column if not exists image_url text,
  add column if not exists in_stock boolean default true,
  add column if not exists is_published boolean default false,
  add column if not exists is_featured boolean default false,
  add column if not exists is_bestseller boolean default false,
  add column if not exists is_new boolean default false,
  add column if not exists rating numeric default 0,
  add column if not exists total_reviews integer default 0,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Legal pages
create table if not exists public.legal_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  version text,
  effective_date date,
  content text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.legal_pages
  add column if not exists version text,
  add column if not exists effective_date date,
  add column if not exists content text,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Country columns on forms
alter table if exists public.contact_messages add column if not exists country text;
alter table if exists public.content_submissions add column if not exists country text;
alter table if exists public.newsletter_subscriptions add column if not exists country text;

-- Storage buckets for admin uploads (public readable)
insert into storage.buckets (id, name, public)
values
  ('product-images','product-images', true),
  ('seed-images','seed-images', true),
  ('course-thumbnails','course-thumbnails', true),
  ('course-videos','course-videos', true),
  ('news-images','news-images', true)
on conflict (id) do nothing;


