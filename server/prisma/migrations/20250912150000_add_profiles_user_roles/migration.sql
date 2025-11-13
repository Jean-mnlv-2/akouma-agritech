-- Create profiles and user_roles tables expected by admin UI
-- Safe-guarded to avoid errors if already exist

-- Enable uuid extension if needed
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EXCEPTION WHEN OTHERS THEN
  -- ignore
END $$;

-- profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE,
  email text NOT NULL,
  first_name text,
  last_name text,
  display_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Keep id in sync with user_id when inserting
CREATE OR REPLACE FUNCTION public.profiles_set_id_from_user_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_set_id ON public.profiles;
CREATE TRIGGER trg_profiles_set_id
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_set_id_from_user_id();

-- user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('admin','supervisor','customer')),
  assigned_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);



