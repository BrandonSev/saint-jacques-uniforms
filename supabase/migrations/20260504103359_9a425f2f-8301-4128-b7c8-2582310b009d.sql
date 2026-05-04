ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS tour_taille text,
  ADD COLUMN IF NOT EXISTS tour_bassin text;