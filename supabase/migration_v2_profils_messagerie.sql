-- ========================================================================
-- Meet Me Club — Migration v2 : profils complets & messagerie temps réel
-- À exécuter une fois dans Supabase > SQL Editor (idempotent, sans risque)
-- ========================================================================

-- 1. Colonnes de profil utilisées par l'application (date de naissance, âge, avatar)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS "dateOfBirth" timestamptz,
  ADD COLUMN IF NOT EXISTS "age" integer,
  ADD COLUMN IF NOT EXISTS "avatarUrl" text;

-- 2. Valeur "EXCHANGE" (Échange & Discussion) proposée dans le formulaire de profil
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RelationshipType') THEN
    ALTER TYPE "RelationshipType" ADD VALUE IF NOT EXISTS 'EXCHANGE';
  END IF;
END $$;

-- 3. Index pour compter rapidement les messages non lus
CREATE INDEX IF NOT EXISTS idx_messages_conv_status ON public.messages("conversationId", "status");

-- 4. Index pour retrouver les abonnements de notifications téléphone
CREATE INDEX IF NOT EXISTS idx_notifications_type_user ON public.notifications("type", "userId");

-- 5. Photos : autoriser aussi les formats iPhone (HEIC)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
WHERE id = 'profile-media';
