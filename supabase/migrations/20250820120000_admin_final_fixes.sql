-- Finalisation et harmonisation du schéma Admin + Formulaires
-- Idempotent, sans blocs DO, compatible Supabase CLI

-- Extensions utiles
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- 1) Colonnes manquantes pour les cours (utilisées par l'admin)
alter table if exists public.courses
  add column if not exists slug text,
  add column if not exists content text,
  add column if not exists excerpt text,
  add column if not exists instructor_bio text,
  add column if not exists course_materials_url text,
  add column if not exists enrollment_count integer default 0,
  add column if not exists rating numeric default 0,
  add column if not exists total_ratings integer default 0;

-- 2) Colonnes pays (sécurité contre erreurs d'absence)
alter table if exists public.contact_messages add column if not exists country text;
alter table if exists public.content_submissions add column if not exists country text;
alter table if exists public.newsletter_subscriptions add column if not exists country text;

-- 3) Buckets de stockage (lecture publique, écriture authentifiée)
insert into storage.buckets (id, name, public)
values
  ('product-images','product-images', true),
  ('seed-images','seed-images', true),
  ('course-thumbnails','course-thumbnails', true),
  ('course-videos','course-videos', true),
  ('news-images','news-images', true)
on conflict (id) do nothing;

-- 4) Fonction de mise à jour du updated_at
create or replace function public.set_updated_at()
returns trigger as $fn$
begin
  new.updated_at := now();
  return new;
end
$fn$ language plpgsql;

-- 5) Triggers updated_at (drop + create pour éviter DO blocks)
-- Content
drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at before update on public.courses for each row execute function public.set_updated_at();

drop trigger if exists set_seeds_updated_at on public.seeds;
create trigger set_seeds_updated_at before update on public.seeds for each row execute function public.set_updated_at();

drop trigger if exists set_news_updated_at on public.news;
create trigger set_news_updated_at before update on public.news for each row execute function public.set_updated_at();

drop trigger if exists set_shop_products_updated_at on public.shop_products;
create trigger set_shop_products_updated_at before update on public.shop_products for each row execute function public.set_updated_at();

drop trigger if exists set_legal_pages_updated_at on public.legal_pages;
create trigger set_legal_pages_updated_at before update on public.legal_pages for each row execute function public.set_updated_at();

-- Forms
drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();

drop trigger if exists set_content_submissions_updated_at on public.content_submissions;
create trigger set_content_submissions_updated_at before update on public.content_submissions for each row execute function public.set_updated_at();

drop trigger if exists set_demo_requests_updated_at on public.demo_requests;
create trigger set_demo_requests_updated_at before update on public.demo_requests for each row execute function public.set_updated_at();

drop trigger if exists update_newsletter_subscriptions_updated_at on public.newsletter_subscriptions;
create trigger update_newsletter_subscriptions_updated_at before update on public.newsletter_subscriptions for each row execute function public.set_updated_at();

-- 6) Index de perf (idempotents)
create index if not exists idx_courses_created_at on public.courses (created_at desc);
create index if not exists idx_courses_is_published on public.courses (is_published);
create index if not exists idx_seeds_created_at on public.seeds (created_at desc);
create index if not exists idx_seeds_is_published on public.seeds (is_published);
create index if not exists idx_news_created_at on public.news (created_at desc);
create index if not exists idx_news_is_published on public.news (is_published);
create index if not exists idx_shop_products_created_at on public.shop_products (created_at desc);
create index if not exists idx_shop_products_is_published on public.shop_products (is_published);
create index if not exists idx_legal_pages_created_at on public.legal_pages (created_at desc);
create index if not exists idx_contact_messages_created_at on public.contact_messages (created_at desc);
create index if not exists idx_content_submissions_created_at on public.content_submissions (created_at desc);
create index if not exists idx_demo_requests_created_at on public.demo_requests (created_at desc);

-- 7) RLS
-- Activer RLS sur les tables de contenu (lecture publique déjà gérée ailleurs) et formulaires
alter table if exists public.courses enable row level security;
alter table if exists public.seeds enable row level security;
alter table if exists public.news enable row level security;
alter table if exists public.shop_products enable row level security;
alter table if exists public.legal_pages enable row level security;

alter table if exists public.contact_messages enable row level security;
alter table if exists public.content_submissions enable row level security;
alter table if exists public.demo_requests enable row level security;

-- Lecture publique du contenu publié (ré-établit proprement)
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

-- Politiques Formulaires: insert public (anon/auth), lecture/MAJ admin uniquement
-- Contact messages
drop policy if exists "Public insert contact_messages" on public.contact_messages;
create policy "Public insert contact_messages" on public.contact_messages
  for insert to anon, authenticated with check (true);

drop policy if exists "Admin select contact_messages" on public.contact_messages;
create policy "Admin select contact_messages" on public.contact_messages
  for select to authenticated using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

drop policy if exists "Admin update contact_messages" on public.contact_messages;
create policy "Admin update contact_messages" on public.contact_messages
  for update to authenticated using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

drop policy if exists "Admin delete contact_messages" on public.contact_messages;
create policy "Admin delete contact_messages" on public.contact_messages
  for delete to authenticated using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- Content submissions
drop policy if exists "Public insert content_submissions" on public.content_submissions;
create policy "Public insert content_submissions" on public.content_submissions
  for insert to anon, authenticated with check (true);

drop policy if exists "Admin select content_submissions" on public.content_submissions;
create policy "Admin select content_submissions" on public.content_submissions
  for select to authenticated using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

drop policy if exists "Admin update content_submissions" on public.content_submissions;
create policy "Admin update content_submissions" on public.content_submissions
  for update to authenticated using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

drop policy if exists "Admin delete content_submissions" on public.content_submissions;
create policy "Admin delete content_submissions" on public.content_submissions
  for delete to authenticated using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- Demo requests
drop policy if exists "Public insert demo_requests" on public.demo_requests;
create policy "Public insert demo_requests" on public.demo_requests
  for insert to anon, authenticated with check (true);

drop policy if exists "Admin select demo_requests" on public.demo_requests;
create policy "Admin select demo_requests" on public.demo_requests
  for select to authenticated using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

drop policy if exists "Admin update demo_requests" on public.demo_requests;
create policy "Admin update demo_requests" on public.demo_requests
  for update to authenticated using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

drop policy if exists "Admin delete demo_requests" on public.demo_requests;
create policy "Admin delete demo_requests" on public.demo_requests
  for delete to authenticated using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- 8) Politiques Storage (compléter update/delete pour upsert/replace)
drop policy if exists "Public read admin media" on storage.objects;
create policy "Public read admin media" on storage.objects for select using (
  bucket_id in ('product-images','seed-images','course-thumbnails','course-videos','news-images')
);

drop policy if exists "Authenticated insert admin media" on storage.objects;
create policy "Authenticated insert admin media" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images','seed-images','course-thumbnails','course-videos','news-images'));

drop policy if exists "Authenticated update admin media" on storage.objects;
create policy "Authenticated update admin media" on storage.objects for update to authenticated
  using (bucket_id in ('product-images','seed-images','course-thumbnails','course-videos','news-images'))
  with check (bucket_id in ('product-images','seed-images','course-thumbnails','course-videos','news-images'));

drop policy if exists "Authenticated delete admin media" on storage.objects;
create policy "Authenticated delete admin media" on storage.objects for delete to authenticated
  using (bucket_id in ('product-images','seed-images','course-thumbnails','course-videos','news-images'));

-- 9) Harmonisation newsletter_subscriptions (optionnel, ne réduit pas les droits d'insert)
-- Conserver l'insert public pour les abonnements, mais restreindre lecture complète aux admins
alter table if exists public.newsletter_subscriptions enable row level security;
drop policy if exists "Anyone can subscribe to newsletter" on public.newsletter_subscriptions;
create policy "Anyone can subscribe to newsletter" on public.newsletter_subscriptions
  for insert to anon, authenticated with check (true);

drop policy if exists "Admins can view all newsletter subscriptions" on public.newsletter_subscriptions;
create policy "Admins can view all newsletter subscriptions" on public.newsletter_subscriptions
  for select to authenticated using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- 10) Assurer la colonne role dans profiles (fallback admin check)
alter table if exists public.profiles add column if not exists role text;

-- 11) S'assurer que les tables de panier existent (utilisées par les fonctions)
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 12) Rafraîchir le cache de schéma PostgREST (corrige les erreurs "could not find ... in the schema cache")
select pg_notify('pgrst', 'reload schema');

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete cascade not null,
  item_type text not null check (item_type in ('shop_product','seed','course')),
  item_id uuid not null,
  item_name text,
  unit_price_fcfa integer not null default 0,
  quantity integer not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


