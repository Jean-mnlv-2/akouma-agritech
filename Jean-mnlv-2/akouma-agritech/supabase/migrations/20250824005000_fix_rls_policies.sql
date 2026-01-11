-- Migration pour corriger toutes les politiques RLS
-- Date: 2025-08-24

-- 1. Corriger les politiques RLS pour user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Créer les nouvelles politiques (plus permissives pour les admins)
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Corriger les politiques RLS pour profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Créer les nouvelles politiques
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Corriger les politiques RLS pour courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;

-- Créer les nouvelles politiques
CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view published courses" ON public.courses
  FOR SELECT USING (is_published = true);

-- 4. Corriger les politiques RLS pour news
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage news" ON public.news;
DROP POLICY IF EXISTS "Public can view published news" ON public.news;

-- Créer les nouvelles politiques
CREATE POLICY "Admins can manage all news" ON public.news
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view published news" ON public.news
  FOR SELECT USING (is_published = true);

-- 5. Corriger les politiques RLS pour seeds
ALTER TABLE public.seeds ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage seeds" ON public.seeds;
DROP POLICY IF EXISTS "Public can view published seeds" ON public.seeds;

-- Créer les nouvelles politiques
CREATE POLICY "Admins can manage all seeds" ON public.seeds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view published seeds" ON public.seeds
  FOR SELECT USING (is_published = true);

-- 6. Corriger les politiques RLS pour shop_products
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage products" ON public.shop_products;
DROP POLICY IF EXISTS "Public can view published products" ON public.shop_products;

-- Créer les nouvelles politiques
CREATE POLICY "Admins can manage all products" ON public.shop_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view published products" ON public.shop_products
  FOR SELECT USING (is_published = true);

-- 7. Corriger les politiques RLS pour live_streams
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage live streams" ON public.live_streams;
DROP POLICY IF EXISTS "Public can view live streams" ON public.live_streams;

-- Créer les nouvelles politiques
CREATE POLICY "Admins can manage all live streams" ON public.live_streams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view live streams" ON public.live_streams
  FOR SELECT USING (true);

-- 8. Corriger les politiques RLS pour elearning_stats
ALTER TABLE public.elearning_stats ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage elearning stats" ON public.elearning_stats;
DROP POLICY IF EXISTS "Public can view elearning stats" ON public.elearning_stats;

-- Créer les nouvelles politiques
CREATE POLICY "Admins can manage all elearning stats" ON public.elearning_stats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view elearning stats" ON public.elearning_stats
  FOR SELECT USING (true);

-- 9. Corriger les politiques RLS pour elearning_enrollments
ALTER TABLE public.elearning_enrollments ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Public can insert elearning enrollments" ON public.elearning_enrollments;
DROP POLICY IF EXISTS "Admins can view all elearning enrollments" ON public.elearning_enrollments;

-- Créer les nouvelles politiques
CREATE POLICY "Public can insert elearning enrollments" ON public.elearning_enrollments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all elearning enrollments" ON public.elearning_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 10. Corriger les politiques RLS pour tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Supervisors can read own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Supervisors can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can insert tasks" ON public.tasks;

-- Créer les nouvelles politiques
CREATE POLICY "Admins can manage all tasks" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Supervisors can read own tasks" ON public.tasks
  FOR SELECT USING (
    assigned_to = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Supervisors can update own tasks" ON public.tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- 11. Notifier PostgREST de recharger le schéma
SELECT pg_notify('pgrst', 'reload schema');
