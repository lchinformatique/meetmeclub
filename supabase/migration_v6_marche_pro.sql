-- ========================================================================
-- Meet Me Club — Migration v6 : Espaces Pro et Marché (annonces)
-- Tout membre vérifié crée son Espace Pro (marque, logo, contacts WhatsApp / Facebook).
-- Packs Complice (6 000) et VIP publient des annonces, classées par catégorie dans le Marché.
-- Idempotent : peut être exécuté plusieurs fois sans risque.
-- ========================================================================

-- 1. Espaces Pro (un par membre)
CREATE TABLE IF NOT EXISTS public.pro_spaces (
  id text PRIMARY KEY,
  "userId" text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  activity text NOT NULL DEFAULT 'OTHER',
  "logoUrl" text,
  "coverUrl" text,
  description text,
  city text,
  neighborhood text,
  whatsapp text,
  facebook text,
  phone text,
  website text,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pro_spaces_activity ON public.pro_spaces(activity);

-- 2. Annonces
--    kind : SALE (vente d'objets / produits — 10 par mois en pack Complice) ou SERVICE (prestations, illimitées)
--    status : ACTIVE · SOLD (vendu, reste visible) · DELETED (supprimée par l'auteur) · REMOVED (retirée par l'admin)
CREATE TABLE IF NOT EXISTS public.pro_listings (
  id text PRIMARY KEY,
  "proId" text NOT NULL REFERENCES public.pro_spaces(id) ON DELETE CASCADE,
  "userId" text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  kind text NOT NULL DEFAULT 'SALE',
  price numeric,
  "priceLabel" text,
  description text,
  city text,
  neighborhood text,
  photos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'ACTIVE',
  views integer NOT NULL DEFAULT 0,
  "reportsCount" integer NOT NULL DEFAULT 0,
  "removedReason" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pro_listings_status_created ON public.pro_listings(status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_pro_listings_category ON public.pro_listings(category);
CREATE INDEX IF NOT EXISTS idx_pro_listings_user_created ON public.pro_listings("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_pro_listings_pro ON public.pro_listings("proId");

-- 3. Signalements (un par membre et par annonce)
CREATE TABLE IF NOT EXISTS public.pro_reports (
  id text PRIMARY KEY,
  "listingId" text NOT NULL REFERENCES public.pro_listings(id) ON DELETE CASCADE,
  "reporterId" text NOT NULL,
  reason text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("listingId", "reporterId")
);

-- 4. Accès réservé au serveur (clé service_role) : RLS activé, aucune règle publique
ALTER TABLE public.pro_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_reports ENABLE ROW LEVEL SECURITY;
