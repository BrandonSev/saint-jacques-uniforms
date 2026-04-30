-- Add family_name on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS family_name TEXT;

-- Create family_parents table
CREATE TABLE public.family_parents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'Parent',
  civilite TEXT NOT NULL DEFAULT 'Mme',
  prenom TEXT NOT NULL DEFAULT '',
  nom TEXT NOT NULL DEFAULT '',
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.family_parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parents" ON public.family_parents
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parents" ON public.family_parents
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parents" ON public.family_parents
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own parents" ON public.family_parents
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all parents" ON public.family_parents
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_family_parents_updated_at
BEFORE UPDATE ON public.family_parents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_family_parents_user ON public.family_parents(user_id);