-- Migration pour corriger les rôles et les triggers
-- Date: 2025-08-24

-- 1. Supprimer l'ancien enum app_role s'il existe
DROP TYPE IF EXISTS public.app_role CASCADE;

-- 2. Créer le nouveau type avec supervisor
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'user');

-- 3. Vérifier et modifier la table user_roles pour utiliser l'enum
-- D'abord, vérifier si la colonne role existe et son type
DO $$
BEGIN
  -- Si la colonne role n'existe pas, la créer
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_roles' AND column_name = 'role') THEN
    ALTER TABLE public.user_roles ADD COLUMN role public.app_role DEFAULT 'user';
  ELSE
    -- Si elle existe, modifier son type
    ALTER TABLE public.user_roles 
      ALTER COLUMN role TYPE public.app_role 
      USING role::public.app_role;
  END IF;
END $$;

-- 4. Supprimer les anciens triggers et fonctions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
DROP FUNCTION IF EXISTS handle_user_registration();
DROP FUNCTION IF EXISTS handle_new_user();

-- 5. Créer la fonction corrigée pour la création d'utilisateur
CREATE OR REPLACE FUNCTION handle_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer dans profiles avec user_id
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    display_name,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      CONCAT(
        NEW.raw_user_meta_data ->> 'first_name', 
        ' ', 
        NEW.raw_user_meta_data ->> 'last_name'
      )
    ),
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = now();
  
  -- Assigner le rôle par défaut 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recréer le trigger pour la création d'utilisateur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_registration();

-- 7. Fonction pour vérifier les permissions admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Vérifier dans user_roles
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = user_uuid AND role = 'admin';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fonction pour vérifier les permissions supervisor
CREATE OR REPLACE FUNCTION is_supervisor(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Vérifier dans user_roles (admin ou supervisor)
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = user_uuid AND role IN ('admin', 'supervisor');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Fonction pour obtenir le rôle principal d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Vérifier dans user_roles (priorité admin > supervisor > user)
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = user_uuid
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'supervisor' THEN 2
    WHEN 'user' THEN 3
  END
  LIMIT 1;
  
  IF FOUND THEN
    RETURN user_role::text;
  END IF;
  
  RETURN 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Mettre à jour les politiques RLS pour user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Créer les nouvelles politiques
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 11. Mettre à jour les politiques RLS pour profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Créer les nouvelles politiques
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (is_admin(auth.uid()));

-- 12. Notifier PostgREST de recharger le schéma
SELECT pg_notify('pgrst', 'reload schema');
