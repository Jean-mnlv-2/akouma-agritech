-- Met à jour la valeur par défaut du rôle utilisateur et normalise les rôles existants

ALTER TABLE "User"
    ALTER COLUMN "role" SET DEFAULT 'customer';

UPDATE "User"
SET "role" = 'customer'
WHERE "role" IN ('user', 'customer', '') OR "role" IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user_roles'
    ) THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
        ALTER TABLE public.user_roles
            ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin','supervisor','customer'));

        UPDATE public.user_roles
        SET role = 'customer'
        WHERE role IN ('user', 'customer');
    END IF;
END $$;

