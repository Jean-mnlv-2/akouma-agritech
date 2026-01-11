-- Fix is_supervisor to include 'moderator' as supervisor equivalent
CREATE OR REPLACE FUNCTION is_supervisor(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check user_roles first
  SELECT role INTO user_role 
  FROM user_roles 
  WHERE user_id = user_uuid AND role IN ('admin', 'supervisor', 'moderator');

  IF FOUND THEN 
    RETURN TRUE; 
  END IF;

  -- Fallback to profiles.role
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = user_uuid AND role IN ('admin', 'supervisor', 'moderator');

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reload PostgREST cache
SELECT pg_notify('pgrst', 'reload schema');
