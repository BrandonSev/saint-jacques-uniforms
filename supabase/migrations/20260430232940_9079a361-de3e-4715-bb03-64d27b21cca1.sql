ALTER TABLE public.family_parents
  ADD COLUMN IF NOT EXISTS is_shipping_default BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_alt_shipping BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shipping_label TEXT,
  ADD COLUMN IF NOT EXISTS shipping_adresse TEXT,
  ADD COLUMN IF NOT EXISTS shipping_code_postal TEXT,
  ADD COLUMN IF NOT EXISTS shipping_ville TEXT;