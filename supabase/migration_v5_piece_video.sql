-- ========================================================================
-- Meet Me Club — Migration v5 : pièce d'identité (packs 3 000 / 6 000) et vidéo (VIP)
-- Pièce : pré-contrôle automatique par IA, approbation automatique si tout concorde,
--         sinon contrôle par l'équipe. Vidéo VIP : contrôle par l'équipe.
-- Idempotent : peut être exécuté plusieurs fois sans risque.
-- ========================================================================

ALTER TABLE IF EXISTS public.profiles
  -- Pièce d'identité
  ADD COLUMN IF NOT EXISTS "idDocStatus" text NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "idDocType" text,
  ADD COLUMN IF NOT EXISTS "idDocFrontPath" text,
  ADD COLUMN IF NOT EXISTS "idDocBackPath" text,
  ADD COLUMN IF NOT EXISTS "idDocSubmittedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "idDocReviewedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "idDocReviewedBy" text,
  ADD COLUMN IF NOT EXISTS "idDocNote" text,
  ADD COLUMN IF NOT EXISTS "idDocCheck" jsonb,
  -- Vidéo de vérification (VIP)
  ADD COLUMN IF NOT EXISTS "videoStatus" text NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "videoCode" text,
  ADD COLUMN IF NOT EXISTS "videoPath" text,
  ADD COLUMN IF NOT EXISTS "videoSubmittedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "videoReviewedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "videoNote" text;

CREATE INDEX IF NOT EXISTS idx_profiles_id_doc_status ON public.profiles("idDocStatus");
CREATE INDEX IF NOT EXISTS idx_profiles_video_status ON public.profiles("videoStatus");

-- Espaces de stockage PRIVÉS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-documents', 'verification-documents', false, 5242880, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-videos', 'verification-videos', false, 10485760, ARRAY['video/webm', 'video/mp4'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760, allowed_mime_types = ARRAY['video/webm', 'video/mp4'];

-- Verrou étendu : un membre connecté ne peut modifier ni ses statuts de vérification ni son pass
CREATE OR REPLACE FUNCTION public.protect_profile_admin_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW."verificationStatus" := 'NONE';
      NEW."verificationReviewedAt" := NULL;
      NEW."idDocStatus" := 'NONE';
      NEW."idDocReviewedAt" := NULL;
      NEW."idDocReviewedBy" := NULL;
      NEW."idDocCheck" := NULL;
      NEW."videoStatus" := 'NONE';
      NEW."videoReviewedAt" := NULL;
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
      NEW."idDocStatus" := OLD."idDocStatus";
      NEW."idDocType" := OLD."idDocType";
      NEW."idDocFrontPath" := OLD."idDocFrontPath";
      NEW."idDocBackPath" := OLD."idDocBackPath";
      NEW."idDocSubmittedAt" := OLD."idDocSubmittedAt";
      NEW."idDocReviewedAt" := OLD."idDocReviewedAt";
      NEW."idDocReviewedBy" := OLD."idDocReviewedBy";
      NEW."idDocNote" := OLD."idDocNote";
      NEW."idDocCheck" := OLD."idDocCheck";
      NEW."videoStatus" := OLD."videoStatus";
      NEW."videoCode" := OLD."videoCode";
      NEW."videoPath" := OLD."videoPath";
      NEW."videoSubmittedAt" := OLD."videoSubmittedAt";
      NEW."videoReviewedAt" := OLD."videoReviewedAt";
      NEW."videoNote" := OLD."videoNote";
      NEW."plan" := OLD."plan";
      NEW."subscriptionExpiresAt" := OLD."subscriptionExpiresAt";
      NEW."subscriptionStartedAt" := OLD."subscriptionStartedAt";
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
