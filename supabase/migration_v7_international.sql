-- ========================================================================
-- Meet Me Club — Migration v7 : ouverture internationale
-- Pays de résidence (code ISO) sur les profils, les Espaces Pro et les annonces.
-- Adresse de résidence des membres : table PRIVÉE séparée (jamais lisible par les autres
-- membres, même via l'API Supabase) ; adresse des Espaces Pro : publique (vitrine).
-- Idempotent : peut être exécuté plusieurs fois sans risque.
-- ========================================================================

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS country text;
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);

ALTER TABLE IF EXISTS public.pro_spaces
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE IF EXISTS public.pro_listings ADD COLUMN IF NOT EXISTS country text;
CREATE INDEX IF NOT EXISTS idx_pro_listings_country ON public.pro_listings(country);

-- Adresse privée des membres : accès réservé au serveur (RLS activé, aucune règle)
CREATE TABLE IF NOT EXISTS public.member_private (
  "userId" text PRIMARY KEY,
  address text,
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.member_private ENABLE ROW LEVEL SECURITY;

-- ── Demandes de sortie (lieux du Marché : hôtels, logements) ─────────────
-- Circuit : la personne invitée accepte → l'équipe négocie avec le lieu → confirmation.
-- status : WAITING_GUEST · WAITING_TEAM · CONFIRMED · DECLINED_GUEST · DECLINED_TEAM · CANCELLED
CREATE TABLE IF NOT EXISTS public.date_requests (
  id text PRIMARY KEY,
  "proposerId" text NOT NULL,
  "receiverId" text NOT NULL,
  "listingId" text REFERENCES public.pro_listings(id) ON DELETE SET NULL,
  "proId" text REFERENCES public.pro_spaces(id) ON DELETE SET NULL,
  "venueSnapshot" jsonb,
  pack text NOT NULL,
  "scheduledAt" timestamptz NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'WAITING_GUEST',
  "teamNote" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_date_requests_proposer ON public.date_requests("proposerId");
CREATE INDEX IF NOT EXISTS idx_date_requests_receiver ON public.date_requests("receiverId");
CREATE INDEX IF NOT EXISTS idx_date_requests_status ON public.date_requests(status);
ALTER TABLE public.date_requests ENABLE ROW LEVEL SECURITY;
