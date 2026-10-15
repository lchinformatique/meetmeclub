-- ========================================================================
-- Meet Me Club International — Migration Supabase Profiles & Storage
-- Compatible avec le schéma existant (Idempotent: peut être exécuté sans risque)
-- ========================================================================

-- 1. Ajout sécurisé des colonnes manquantes dans public.profiles
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS "coverUrl" text,
  ADD COLUMN IF NOT EXISTS "lastName" text,
  ADD COLUMN IF NOT EXISTS "placeOfBirth" text;

-- Index pour recherche rapide et affichage optimisé
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles("userId");
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles("city");
CREATE INDEX IF NOT EXISTS idx_profiles_is_visible ON public.profiles("isVisible");

-- 2. Index et contraintes dans public.profile_photos
CREATE INDEX IF NOT EXISTS idx_profile_photos_profile_id ON public.profile_photos("profileId");
CREATE INDEX IF NOT EXISTS idx_profile_photos_is_main ON public.profile_photos("isMain");
CREATE INDEX IF NOT EXISTS idx_profile_photos_order ON public.profile_photos("order");

-- 3. Configuration du Bucket Supabase Storage 'profile-media'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-media',
  'profile-media',
  true,
  10485760, -- 10 Mo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 4. Politiques RLS Storage pour 'profile-media'
-- Tout le monde peut voir les photos de profil publiques
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read profile-media'
  ) THEN
    CREATE POLICY "Public read profile-media" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'profile-media');
  END IF;
END $$;

-- Un utilisateur connecté peut uploader dans son propre sous-dossier {userId}/...
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated upload profile-media'
  ) THEN
    CREATE POLICY "Authenticated upload profile-media" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'profile-media');
  END IF;
END $$;

-- Un utilisateur connecté peut modifier ou supprimer ses propres photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Owner modify profile-media'
  ) THEN
    CREATE POLICY "Owner modify profile-media" ON storage.objects
      FOR ALL
      TO authenticated
      USING (bucket_id = 'profile-media');
  END IF;
END $$;

-- 5. Politiques RLS Tables public.profiles et public.profile_photos
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- Lecture des profils visibles par les utilisateurs connectés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles viewable by authenticated users'
  ) THEN
    CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
      FOR SELECT
      TO authenticated
      USING ("isVisible" = true OR auth.uid()::text = "userId");
  END IF;
END $$;

-- Modification de son propre profil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles editable by owner'
  ) THEN
    CREATE POLICY "Profiles editable by owner" ON public.profiles
      FOR ALL
      TO authenticated
      USING (auth.uid()::text = "userId")
      WITH CHECK (auth.uid()::text = "userId");
  END IF;
END $$;

-- Lecture des photos par les utilisateurs connectés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profile_photos' AND policyname = 'Photos viewable by authenticated users'
  ) THEN
    CREATE POLICY "Photos viewable by authenticated users" ON public.profile_photos
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 6. Colonnes d'abonnement, compte à rebours & classement dans public.profiles
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS "plan" text DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "likesCount" integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles("plan");
CREATE INDEX IF NOT EXISTS idx_profiles_likes ON public.profiles("likesCount");

-- 7. Table d'historique des abonnements public.subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id text PRIMARY KEY,
  "userId" text NOT NULL,
  plan text NOT NULL DEFAULT 'FREE',
  status text NOT NULL DEFAULT 'ACTIVE',
  "startDate" timestamptz NOT NULL DEFAULT now(),
  "endDate" timestamptz NOT NULL,
  "priceFcfa" integer NOT NULL DEFAULT 0,
  "paymentRef" text,
  "paymentMethod" text,
  "paymentPhone" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions("status");

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Subscriptions viewable by owner'
  ) THEN
    CREATE POLICY "Subscriptions viewable by owner" ON public.subscriptions
      FOR SELECT
      TO authenticated
      USING (auth.uid()::text = "userId");
  END IF;
END $$;

-- 8. Table des publications de l'Espace VIP Exclusif (Mur VIP)
CREATE TABLE IF NOT EXISTS public.vip_posts (
  id text PRIMARY KEY,
  "userId" text NOT NULL,
  "authorName" text NOT NULL,
  "authorAvatar" text,
  "authorPseudo" text,
  title text,
  content text NOT NULL,
  "mediaUrl" text,
  "mediaType" text DEFAULT 'IMAGE',
  "likesCount" integer DEFAULT 0,
  "commentsCount" integer DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vip_posts_created_at ON public.vip_posts("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_vip_posts_user_id ON public.vip_posts("userId");

ALTER TABLE public.vip_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'vip_posts' AND policyname = 'VIP posts viewable by authenticated'
  ) THEN
    CREATE POLICY "VIP posts viewable by authenticated" ON public.vip_posts
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'vip_posts' AND policyname = 'VIP posts insertable by authenticated'
  ) THEN
    CREATE POLICY "VIP posts insertable by authenticated" ON public.vip_posts
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid()::text = "userId");
  END IF;
END $$;

-- ========================================================================
-- Fin du script de migration
-- ========================================================================
