-- Phase 4 — Catalogue produit en base (lecture seule, code reste source de vérité)

-- =========================================
-- 1. Table products
-- =========================================
CREATE TABLE public.products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES public.tenants(id) ON DELETE RESTRICT,
  slug        text NOT NULL,
  name        text NOT NULL,
  ref         text,
  base_price  numeric(10,2) NOT NULL DEFAULT 0,
  level       text,
  image_url   text,
  description text,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  active      boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_products_tenant_id  ON public.products(tenant_id);
CREATE INDEX idx_products_level      ON public.products(tenant_id, level) WHERE active = true;
CREATE INDEX idx_products_slug       ON public.products(tenant_id, slug);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_products_set_tenant_id
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active products"
  ON public.products FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================
-- 2. Table product_sizes
-- =========================================
CREATE TABLE public.product_sizes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES public.tenants(id) ON DELETE RESTRICT,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label       text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, label)
);

CREATE INDEX idx_product_sizes_tenant_id ON public.product_sizes(tenant_id);
CREATE INDEX idx_product_sizes_product   ON public.product_sizes(product_id);

CREATE TRIGGER trg_product_sizes_set_tenant_id
  BEFORE INSERT ON public.product_sizes
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active sizes"
  ON public.product_sizes FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert sizes"
  ON public.product_sizes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sizes"
  ON public.product_sizes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sizes"
  ON public.product_sizes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================
-- 3. Seed du catalogue Saint-Jacques (1 produit, 9 tailles)
-- =========================================
DO $$
DECLARE
  sj_id uuid;
  prod_id uuid;
  sizes text[] := ARRAY['3 ans','4 ans','6 ans','8 ans','10 ans','12 ans','14 ans','16 ans','18 ans'];
  s text;
  i int := 0;
BEGIN
  SELECT id INTO sj_id FROM public.tenants WHERE slug = 'saint-jacques';

  INSERT INTO public.products (tenant_id, slug, name, ref, base_price, level, description, sort_order)
  VALUES (
    sj_id,
    'blouse-officielle',
    'Blouse scolaire officielle SJDC',
    'Riviera Dax',
    30,
    'maternelle',
    'Blouse officielle de l''école Saint-Jacques-de-Compostelle, fabriquée en France.',
    1
  )
  RETURNING id INTO prod_id;

  FOREACH s IN ARRAY sizes LOOP
    INSERT INTO public.product_sizes (tenant_id, product_id, label, sort_order)
    VALUES (sj_id, prod_id, s, i);
    i := i + 1;
  END LOOP;
END $$;