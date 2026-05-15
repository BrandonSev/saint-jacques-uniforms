-- Phase 1 — Multi-tenant baseline
-- Additive only. Aucune table existante n'est modifiée. Aucun impact runtime.

-- =========================================
-- 1. Table tenants
-- =========================================
CREATE TABLE public.tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  name          text NOT NULL,
  short_name    text,
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'archived')),
  theme_tokens  jsonb NOT NULL DEFAULT '{}'::jsonb,
  config        jsonb NOT NULL DEFAULT '{}'::jsonb,
  logo_url      text,
  legacy_code_etablissement text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_slug   ON public.tenants(slug);
CREATE INDEX idx_tenants_status ON public.tenants(status);

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Lecture publique des tenants actifs (nécessaire pour la résolution serveur)
CREATE POLICY "Public can read active tenants"
  ON public.tenants FOR SELECT
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert tenants"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tenants"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tenants"
  ON public.tenants FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================
-- 2. Table tenant_domains
-- =========================================
CREATE TABLE public.tenant_domains (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostname    text NOT NULL UNIQUE,
  is_primary  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenant_domains_tenant   ON public.tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_hostname ON public.tenant_domains(hostname);

-- Un seul domaine primaire par tenant
CREATE UNIQUE INDEX uq_tenant_domains_primary
  ON public.tenant_domains(tenant_id)
  WHERE is_primary = true;

ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read tenant domains"
  ON public.tenant_domains FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert tenant domains"
  ON public.tenant_domains FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tenant domains"
  ON public.tenant_domains FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tenant domains"
  ON public.tenant_domains FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================
-- 3. Seed du tenant Saint-Jacques-de-Compostelle
-- =========================================
INSERT INTO public.tenants (slug, name, short_name, status, theme_tokens, config, legacy_code_etablissement)
VALUES (
  'saint-jacques',
  'Saint-Jacques-de-Compostelle',
  'Saint-Jacques',
  'active',
  '{}'::jsonb,
  jsonb_build_object(
    'levels', jsonb_build_array('maternelle', 'college', 'lycee'),
    'apel_enabled', true,
    'home_delivery_enabled', false
  ),
  NULL
);

INSERT INTO public.tenant_domains (tenant_id, hostname, is_primary)
SELECT id, 'franceuniformes.fr', true FROM public.tenants WHERE slug = 'saint-jacques';

INSERT INTO public.tenant_domains (tenant_id, hostname, is_primary)
SELECT id, 'www.franceuniformes.fr', false FROM public.tenants WHERE slug = 'saint-jacques';