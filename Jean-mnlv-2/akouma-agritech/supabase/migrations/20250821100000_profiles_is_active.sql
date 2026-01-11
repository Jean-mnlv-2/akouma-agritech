-- Add is_active column to profiles and enforce auth checks
alter table if exists public.profiles
  add column if not exists is_active boolean not null default true;

-- Ensure updated_at trigger exists
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_profiles_updated_at') then
    create trigger set_profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- RLS policy to disallow inactive users from reading their own profile (defense-in-depth)
alter table if exists public.profiles enable row level security;

drop policy if exists "Active users can read own profile" on public.profiles;
create policy "Active users can read own profile" on public.profiles
  for select using ( auth.uid() = id and coalesce(is_active, true) = true );

-- Optional: prevent inactive users from updating
drop policy if exists "Active users can update own profile" on public.profiles;
create policy "Active users can update own profile" on public.profiles
  for update using ( auth.uid() = id and coalesce(is_active, true) = true );

-- Helper function to check if a user is active
create or replace function public.is_user_active(p_user_id uuid)
returns boolean as $$
declare v_active boolean;
begin
  select is_active into v_active from public.profiles where id = p_user_id;
  return coalesce(v_active, true);
end;$$ language plpgsql stable;

-- Notify PostgREST to reload schema
select pg_notify('pgrst', 'reload schema');


