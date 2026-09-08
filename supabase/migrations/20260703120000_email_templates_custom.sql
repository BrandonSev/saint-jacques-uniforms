-- Table pour les templates d'email personnalisés créés depuis l'admin,
-- réutilisables pour des envois bulk (familles ou emails bruts).
CREATE TABLE IF NOT EXISTS public.email_templates_custom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  header_title TEXT NOT NULL,
  body TEXT NOT NULL,
  button_label TEXT,
  button_url TEXT,
  signature_role TEXT NOT NULL DEFAULT 'technique',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates_custom ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins can select custom email templates"
    ON public.email_templates_custom FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert custom email templates"
    ON public.email_templates_custom FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update custom email templates"
    ON public.email_templates_custom FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_templates_custom_updated_at
  ON public.email_templates_custom(updated_at DESC);
