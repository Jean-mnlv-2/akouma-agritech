-- Admin optimizations: indices, RLS policies, updated_at triggers, storage policies

create or replace function public.set_updated_at()
returns trigger as $fn$
begin
  new.updated_at := now();
  return new;
end
$fn$ language plpgsql;

-- Attach trigger to tables
do $do$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_courses_updated_at') then
    create trigger set_courses_updated_at before update on public.courses for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_seeds_updated_at') then
    create trigger set_seeds_updated_at before update on public.seeds for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_news_updated_at') then
    create trigger set_news_updated_at before update on public.news for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_shop_products_updated_at') then
    create trigger set_shop_products_updated_at before update on public.shop_products for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_legal_pages_updated_at') then
    create trigger set_legal_pages_updated_at before update on public.legal_pages for each row execute function public.set_updated_at();
  end if;
end
$do$ language plpgsql;

-- 2) Performance indices
create index if not exists idx_courses_created_at on public.courses (created_at desc);
create index if not exists idx_courses_is_published on public.courses (is_published);
create index if not exists idx_seeds_created_at on public.seeds (created_at desc);
create index if not exists idx_seeds_is_published on public.seeds (is_published);
create index if not exists idx_news_created_at on public.news (created_at desc);
create index if not exists idx_news_is_published on public.news (is_published);
create index if not exists idx_shop_products_created_at on public.shop_products (created_at desc);
create index if not exists idx_shop_products_is_published on public.shop_products (is_published);
create index if not exists idx_legal_pages_created_at on public.legal_pages (created_at desc);

-- 3) RLS policies for public read of published content
alter table if exists public.courses enable row level security;
alter table if exists public.seeds enable row level security;
alter table if exists public.news enable row level security;
alter table if exists public.shop_products enable row level security;
alter table if exists public.legal_pages enable row level security;

drop policy if exists "Public read published courses" on public.courses;
create policy "Public read published courses" on public.courses for select using (is_published = true);
drop policy if exists "Public read published seeds" on public.seeds;
create policy "Public read published seeds" on public.seeds for select using (is_published = true);
drop policy if exists "Public read published news" on public.news;
create policy "Public read published news" on public.news for select using (is_published = true);
drop policy if exists "Public read published products" on public.shop_products;
create policy "Public read published products" on public.shop_products for select using (is_published = true);
drop policy if exists "Public read legal pages" on public.legal_pages;
create policy "Public read legal pages" on public.legal_pages for select using (true);

-- 4) Storage: public read and authenticated write for media buckets
drop policy if exists "Public read admin media" on storage.objects;
create policy "Public read admin media" on storage.objects for select
  using (bucket_id in ('product-images','seed-images','course-thumbnails','course-videos','news-images'));
drop policy if exists "Authenticated write admin media" on storage.objects;
create policy "Authenticated write admin media" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images','seed-images','course-thumbnails','course-videos','news-images'));


