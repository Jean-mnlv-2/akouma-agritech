-- Migration pour corriger le problème des profils manquants
-- Date: 2025-08-24

-- 1. Vérifier et corriger la structure de la table profiles
DO $$
BEGIN
  -- Ajouter la colonne is_active si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE public.profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
  
  -- Ajouter la colonne display_name si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
    ALTER TABLE public.profiles ADD COLUMN display_name text;
  END IF;
  
  -- Note: Pas de contrainte unique ajoutée pour éviter les conflits
END $$;

-- 2. Créer le profil pour l'utilisateur admin existant (seulement s'il n'existe pas)
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
SELECT 
  'ee648fa4-e367-4980-afe2-4dd4eb041291',
  'mnlvmedia@yahoo.com',
  'Admin',
  'Principal',
  'Admin Principal',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = 'ee648fa4-e367-4980-afe2-4dd4eb041291'
);

-- 3. S'assurer que l'utilisateur a le rôle admin (seulement s'il n'existe pas)
INSERT INTO public.user_roles (user_id, role)
SELECT 'ee648fa4-e367-4980-afe2-4dd4eb041291', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'ee648fa4-e367-4980-afe2-4dd4eb041291' AND role = 'admin'
);

-- 4. Corriger les politiques RLS pour profiles (version simplifiée)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Créer des politiques plus simples et robustes
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour les admins (plus permissive)
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Créer une fonction pour créer automatiquement un profil si manquant
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le profil existe
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    -- Créer le profil
    INSERT INTO public.profiles (
      user_id,
      email,
      first_name,
      last_name,
      display_name,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Name'),
      COALESCE(
        NEW.raw_user_meta_data ->> 'display_name',
        CONCAT(
          COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
          ' ',
          COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Name')
        )
      ),
      true,
      now(),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer un trigger pour s'assurer qu'un profil existe toujours
DROP TRIGGER IF EXISTS ensure_profile_exists ON auth.users;
CREATE TRIGGER ensure_profile_exists
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ensure_user_profile();

-- 7. Notifier PostgREST de recharger le schéma
SELECT pg_notify('pgrst', 'reload schema');
