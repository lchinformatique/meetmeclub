-- ========================================================================
-- Meet Me Club — Migration v4 : vérification faciale obligatoire des membres
-- Selfie pris en direct avec un geste imposé, contrôlé par l'administrateur.
-- Idempotent : peut être exécuté plusieurs fois sans risque.
-- ========================================================================

-- 1. Statut de vérification de chaque profil
--    NONE = selfie pas encore envoyé · PENDING = à contrôler · APPROVED = validé · REJECTED = refusé
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS "verificationStatus" text NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "verificationGesture" text,
  ADD COLUMN IF NOT EXISTS "verificationSelfiePath" text,
  ADD COLUMN IF NOT EXISTS "verificationSubmittedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "verificationReviewedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "verificationNote" text;

CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles("verificationStatus");

-- 2. Espace de stockage PRIVÉ des selfies (jamais accessible publiquement :
--    l'administrateur les voit uniquement via des liens temporaires d'une heure)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-selfies', 'verification-selfies', false, 5242880, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg'];

-- 3. Verrou : un membre connecté ne peut JAMAIS modifier lui-même son statut de vérification
--    ni son pass (plan, dates d'abonnement), même en contournant le site avec la règle
--    « Profiles editable by owner ». Seul le serveur (clé service_role) et l'éditeur SQL le peuvent.
CREATE OR REPLACE FUNCTION public.protect_profile_admin_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW."verificationStatus" := 'NONE';
      NEW."verificationReviewedAt" := NULL;
      NEW."plan" := 'FREE';
      NEW."subscriptionExpiresAt" := NULL;
      NEW."subscriptionStartedAt" := NULL;
    ELSE
      NEW."verificationStatus" := OLD."verificationStatus";
      NEW."verificationGesture" := OLD."verificationGesture";
      NEW."verificationSelfiePath" := OLD."verificationSelfiePath";
      NEW."verificationSubmittedAt" := OLD."verificationSubmittedAt";
      NEW."verificationReviewedAt" := OLD."verificationReviewedAt";
      NEW."verificationNote" := OLD."verificationNote";
      NEW."plan" := OLD."plan";
      NEW."subscriptionExpiresAt" := OLD."subscriptionExpiresAt";
      NEW."subscriptionStartedAt" := OLD."subscriptionStartedAt";
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_admin_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_admin_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_columns();

-- 4. Vérification : doit afficher le nombre de membres par statut
SELECT "verificationStatus", count(*) FROM public.profiles GROUP BY 1;
