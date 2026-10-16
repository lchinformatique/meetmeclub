-- ========================================================================
-- Meet Me Club — Migration v3 : paiements SasPay vérifiés (webhooks)
-- À exécuter une fois dans Supabase > SQL Editor (idempotent, sans risque)
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.saspay_payments (
  id text PRIMARY KEY,                 -- identifiant de transaction SasPay
  reference text,                      -- référence SasPay (reçu du payeur)
  event text NOT NULL,                 -- ex. transaction.success
  status text,
  amount numeric,                      -- montant du lien (3000, 6000, 15000…)
  charged numeric,                     -- montant réellement débité
  currency text,
  country text,
  network text,
  msisdn text,                         -- numéro mobile money du payeur
  plan text,                           -- ESSENTIAL | COMPLICE | VIP (déduit du montant)
  "userId" text,                       -- membre crédité (null tant que non rattaché)
  "claimedAt" timestamptz,
  raw jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saspay_payments_msisdn ON public.saspay_payments(msisdn);
CREATE INDEX IF NOT EXISTS idx_saspay_payments_reference ON public.saspay_payments(reference);
CREATE INDEX IF NOT EXISTS idx_saspay_payments_user ON public.saspay_payments("userId");

-- Accès réservé au serveur (clé service_role) : aucune lecture publique
ALTER TABLE public.saspay_payments ENABLE ROW LEVEL SECURITY;
