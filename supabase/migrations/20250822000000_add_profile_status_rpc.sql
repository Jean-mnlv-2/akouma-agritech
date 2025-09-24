-- Fonction RPC pour mettre à jour le statut des profils
CREATE OR REPLACE FUNCTION public.update_profile_status(
  p_user_id UUID,
  p_is_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  ) THEN
    RAISE EXCEPTION 'Accès refusé: droits insuffisants';
  END IF;

  -- Mettre à jour le statut du profil
  UPDATE public.profiles 
  SET is_active = p_is_active,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Vérifier que la mise à jour a été effectuée
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil utilisateur non trouvé';
  END IF;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.update_profile_status(UUID, BOOLEAN) TO authenticated;

-- Notifier PostgREST de recharger le schéma
SELECT pg_notify('pgrst', 'reload schema');
