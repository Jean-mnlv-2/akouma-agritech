-- Migration pour améliorer la gestion des rôles admin et superviseurs
-- Assure que les admins créés ont automatiquement les bons rôles

-- Fonction pour créer automatiquement un rôle admin lors de la création d'un profil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer dans user_roles si le profil a un rôle admin ou supervisor
  IF NEW.role IN ('admin', 'supervisor') THEN
    INSERT INTO user_roles (user_id, role, created_at)
    VALUES (NEW.id, NEW.role, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour automatiquement créer les rôles lors de la création d'un profil
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger pour mettre à jour les rôles lors de la modification d'un profil
DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Fonction pour vérifier les permissions admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Vérifier d'abord dans user_roles
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

-- Fonction pour vérifier les permissions supervisor
CREATE OR REPLACE FUNCTION is_supervisor(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Vérifier d'abord dans user_roles
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

-- Politique RLS pour les admins seulement
CREATE POLICY "Admins can manage all content" ON courses
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all content" ON news
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all content" ON seeds
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all content" ON shop_products
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all content" ON legal_pages
  FOR ALL USING (is_admin(auth.uid()));

-- Politique RLS pour les superviseurs (lecture seule)
CREATE POLICY "Supervisors can view content" ON courses
  FOR SELECT USING (is_supervisor(auth.uid()));

CREATE POLICY "Supervisors can view content" ON news
  FOR SELECT USING (is_supervisor(auth.uid()));

CREATE POLICY "Supervisors can view content" ON seeds
  FOR SELECT USING (is_supervisor(auth.uid()));

CREATE POLICY "Supervisors can view content" ON shop_products
  FOR SELECT USING (is_supervisor(auth.uid()));

CREATE POLICY "Supervisors can view content" ON legal_pages
  FOR SELECT USING (is_supervisor(auth.uid()));

-- Politique RLS pour les soumissions (admins et superviseurs)
CREATE POLICY "Admins and supervisors can manage submissions" ON contact_messages
  FOR ALL USING (is_supervisor(auth.uid()));

CREATE POLICY "Admins and supervisors can manage submissions" ON content_submissions
  FOR ALL USING (is_supervisor(auth.uid()));

CREATE POLICY "Admins and supervisors can manage submissions" ON newsletter_subscriptions
  FOR ALL USING (is_supervisor(auth.uid()));

-- Politique RLS pour les profils (admins seulement)
CREATE POLICY "Admins can manage profiles" ON profiles
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage user roles" ON user_roles
  FOR ALL USING (is_admin(auth.uid()));

-- Index pour améliorer les performances des requêtes de rôles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Rafraîchir le cache PostgREST
SELECT pg_notify('pgrst', 'reload schema');
