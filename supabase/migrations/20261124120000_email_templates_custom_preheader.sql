-- Pré-header (aperçu dans la boîte de réception) des emails composés dans l'admin.
ALTER TABLE public.email_templates_custom ADD COLUMN IF NOT EXISTS preheader TEXT;
