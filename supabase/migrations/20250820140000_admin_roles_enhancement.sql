-- Migration pour améliorer la gestion des rôles admin et superviseur
-- Clarification des permissions et ajout de fonctionnalités

-- 1. Clarification des rôles
-- Admin: Accès complet à toutes les fonctionnalités
-- Supervisor: Accès limité (lecture + gestion des soumissions)

-- 2. Améliorer la fonction is_admin pour être plus robuste
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Vérifier d'abord dans user_roles (priorité)
  SELECT role INTO user_role 
  FROM user_roles 
  WHERE user_id = user_uuid AND role = 'admin';
  
  IF FOUND THEN 
    RETURN TRUE; 
  END IF;
  
  -- Fallback vers profiles.role
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = user_uuid AND role = 'admin';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Améliorer la fonction is_supervisor
CREATE OR REPLACE FUNCTION is_supervisor(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Vérifier d'abord dans user_roles (priorité)
  SELECT role INTO user_role 
  FROM user_roles 
  WHERE user_id = user_uuid AND role IN ('admin', 'supervisor');
  
  IF FOUND THEN 
    RETURN TRUE; 
  END IF;
  
  -- Fallback vers profiles.role
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = user_uuid AND role IN ('admin', 'supervisor');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour obtenir le rôle principal d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Vérifier d'abord dans user_roles (priorité)
  SELECT role INTO user_role 
  FROM user_roles 
  WHERE user_id = user_uuid 
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'supervisor' THEN 2 
      ELSE 3 
    END
  LIMIT 1;
  
  IF FOUND THEN 
    RETURN user_role; 
  END IF;
  
  -- Fallback vers profiles.role
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = user_uuid;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Améliorer les politiques RLS pour une meilleure séparation des rôles

-- Politiques pour les admins (accès complet)
DROP POLICY IF EXISTS "Admins can manage all content" ON courses;
CREATE POLICY "Admins can manage all content" ON courses
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all content" ON news;
CREATE POLICY "Admins can manage all content" ON news
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all content" ON seeds;
CREATE POLICY "Admins can manage all content" ON seeds
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all content" ON shop_products;
CREATE POLICY "Admins can manage all content" ON shop_products
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all content" ON legal_pages;
CREATE POLICY "Admins can manage all content" ON legal_pages
  FOR ALL USING (is_admin(auth.uid()));

-- Politiques pour les superviseurs (lecture + soumissions)
DROP POLICY IF EXISTS "Supervisors can view content" ON courses;
CREATE POLICY "Supervisors can view content" ON courses
  FOR SELECT USING (is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Supervisors can view content" ON news;
CREATE POLICY "Supervisors can view content" ON news
  FOR SELECT USING (is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Supervisors can view content" ON seeds;
CREATE POLICY "Supervisors can view content" ON seeds
  FOR SELECT USING (is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Supervisors can view content" ON shop_products;
CREATE POLICY "Supervisors can view content" ON shop_products
  FOR SELECT USING (is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Supervisors can view content" ON legal_pages;
CREATE POLICY "Supervisors can view content" ON legal_pages
  FOR SELECT USING (is_supervisor(auth.uid()));

-- 6. Politiques pour les soumissions (admins et superviseurs)
DROP POLICY IF EXISTS "Admins and supervisors can manage submissions" ON contact_messages;
CREATE POLICY "Admins and supervisors can manage submissions" ON contact_messages
  FOR ALL USING (is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Admins and supervisors can manage submissions" ON content_submissions;
CREATE POLICY "Admins and supervisors can manage submissions" ON content_submissions
  FOR ALL USING (is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Admins and supervisors can manage submissions" ON newsletter_subscriptions;
CREATE POLICY "Admins and supervisors can manage submissions" ON newsletter_subscriptions
  FOR ALL USING (is_supervisor(auth.uid()));

-- 7. Politiques pour les profils (admins seulement)
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
CREATE POLICY "Admins can manage profiles" ON profiles
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
CREATE POLICY "Admins can manage user roles" ON user_roles
  FOR ALL USING (is_admin(auth.uid()));

-- 8. Politique pour permettre aux utilisateurs de voir leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 9. Politique pour permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 10. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);

-- 11. Commentaires pour clarifier les rôles
COMMENT ON FUNCTION is_admin(UUID) IS 'Vérifie si un utilisateur a le rôle admin (priorité: user_roles > profiles)';
COMMENT ON FUNCTION is_supervisor(UUID) IS 'Vérifie si un utilisateur a le rôle admin ou supervisor (priorité: user_roles > profiles)';
COMMENT ON FUNCTION get_user_role(UUID) IS 'Retourne le rôle principal d''un utilisateur (admin > supervisor > user)';

-- 12. Rafraîchir le cache PostgREST
SELECT pg_notify('pgrst', 'reload schema');
