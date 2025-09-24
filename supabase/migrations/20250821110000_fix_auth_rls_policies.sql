-- Fix authentication and RLS policy issues
-- Handle email confirmation and proper user registration flow

-- 1. Fix profiles table RLS policies for user registration
alter table if exists public.profiles enable row level security;

-- Drop conflicting policies
drop policy if exists "Active users can read own profile" on public.profiles;
drop policy if exists "Active users can update own profile" on public.profiles;
drop policy if exists "Admins can manage profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Create comprehensive profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Admins can manage all profiles" on public.profiles
  for all using (is_admin(auth.uid()));

-- 2. Fix user_roles table RLS policies
alter table if exists public.user_roles enable row level security;

-- Drop existing policies
drop policy if exists "Admins can manage user roles" on public.user_roles;

-- Create user_roles policies
create policy "Admins can manage user roles" on public.user_roles
  for all using (is_admin(auth.uid()));

-- Allow users to read their own roles
create policy "Users can view own roles" on public.user_roles
  for select using (auth.uid() = user_id);

-- 3. Create function to handle user registration with proper role assignment
create or replace function handle_user_registration()
returns trigger as $$
begin
  -- Insert profile if it doesn't exist
  insert into public.profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    display_name,
    is_active,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    true,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  
  -- Assign admin role if requested
  if new.raw_user_meta_data->>'is_admin' = 'true' then
    insert into public.user_roles (user_id, role, created_at)
    values (new.id, 'admin', now())
    on conflict (user_id, role) do nothing;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- 4. Create trigger for user registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_user_registration();

-- 5. Update auth management function to handle email confirmation
create or replace function handle_auth_user_confirmed()
returns trigger as $$
begin
  -- Update profile when email is confirmed
  update public.profiles
  set email_confirmed_at = now(),
      updated_at = now()
  where id = new.id;
  
  return new;
end;
$$ language plpgsql security definer;

-- 6. Create trigger for email confirmation
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function handle_auth_user_confirmed();

-- 7. Add email_confirmed_at column to profiles if it doesn't exist
alter table if exists public.profiles 
  add column if not exists email_confirmed_at timestamptz;

-- 8. Update is_user_active function to handle unconfirmed users
create or replace function public.is_user_active(p_user_id uuid)
returns boolean as $$
declare 
  v_active boolean;
  v_confirmed timestamptz;
begin
  select is_active, email_confirmed_at 
  into v_active, v_confirmed 
  from public.profiles 
  where id = p_user_id;
  
  -- User is active if: is_active is true AND email is confirmed
  return coalesce(v_active, true) and v_confirmed is not null;
end;
$$ language plpgsql stable;

-- 9. Create function to check if user can login (email confirmed and active)
create or replace function public.can_user_login(p_user_id uuid)
returns boolean as $$
declare 
  v_active boolean;
  v_confirmed timestamptz;
begin
  select is_active, email_confirmed_at 
  into v_active, v_confirmed 
  from public.profiles 
  where id = p_user_id;
  
  -- User can login if: is_active is true AND email is confirmed
  return coalesce(v_active, true) and v_confirmed is not null;
end;
$$ language plpgsql stable;

-- 10. Update RLS policies to use the new function
create policy "Active confirmed users can read own profile" on public.profiles
  for select using (auth.uid() = id and can_user_login(auth.uid()));

-- 11. Add indexes for better performance
create index if not exists idx_profiles_email_confirmed_at on public.profiles(email_confirmed_at);
create index if not exists idx_profiles_is_active on public.profiles(is_active);

-- 12. Notify PostgREST to reload schema
select pg_notify('pgrst', 'reload schema');
