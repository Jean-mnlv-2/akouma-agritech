-- Tasks table for supervisor workflow
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Basic trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_set_updated_at on public.tasks;
create trigger trg_tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.tasks enable row level security;

-- Admin: full access
drop policy if exists "Admins can manage all tasks" on public.tasks;
create policy "Admins can manage all tasks"
  on public.tasks
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Supervisors: read own tasks
drop policy if exists "Supervisors can read own tasks" on public.tasks;
create policy "Supervisors can read own tasks"
  on public.tasks
  for select
  using (public.is_supervisor(auth.uid()) and assigned_to = auth.uid());

-- Supervisors: update own tasks (optional)
drop policy if exists "Supervisors can update own tasks" on public.tasks;
create policy "Supervisors can update own tasks"
  on public.tasks
  for update
  using (public.is_supervisor(auth.uid()) and assigned_to = auth.uid())
  with check (public.is_supervisor(auth.uid()) and assigned_to = auth.uid());

-- Insert by admins only; set created_by automatically via default in app layer
drop policy if exists "Admins can insert tasks" on public.tasks;
create policy "Admins can insert tasks"
  on public.tasks
  for insert
  with check (public.is_admin(auth.uid()));
