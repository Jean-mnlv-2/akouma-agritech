-- Add missing country columns to forms-related tables
-- Safe to run multiple times thanks to IF NOT EXISTS

-- Contact messages
ALTER TABLE IF EXISTS public.contact_messages
ADD COLUMN IF NOT EXISTS country text;

-- Content submissions
ALTER TABLE IF EXISTS public.content_submissions
ADD COLUMN IF NOT EXISTS country text;

-- Newsletter subscriptions
ALTER TABLE IF EXISTS public.newsletter_subscriptions
ADD COLUMN IF NOT EXISTS country text;

-- Optional: backfill nulls to empty string if needed (commented out)
-- UPDATE public.contact_messages SET country = COALESCE(country, '') WHERE country IS NULL;
-- UPDATE public.content_submissions SET country = COALESCE(country, '') WHERE country IS NULL;
-- UPDATE public.newsletter_subscriptions SET country = COALESCE(country, '') WHERE country IS NULL;


