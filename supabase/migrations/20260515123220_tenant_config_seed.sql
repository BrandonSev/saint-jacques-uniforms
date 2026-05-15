-- ============================================================
-- Tenant config seed (Saint-Jacques)
-- ============================================================
-- Renseigne dans tenants.config les valeurs jusqu'ici hardcodées en TS :
--   - establishment_address (PayPlug shipping/billing + facturation)
--
-- La clé PayPlug est partagée entre tous les tenants (process.env.PAYPLUG_SECRET_KEY).
-- Le tenant_id est passé en metadata du paiement et permet de router les
-- notifications admin par tenant.
--
-- Idempotente : on n'écrase pas une config existante.
-- ============================================================

UPDATE public.tenants
SET config = config
  || jsonb_build_object(
       'establishment_address', jsonb_build_object(
         'name', 'Ensemble scolaire Saint-Jacques-de-Compostelle',
         'address1', 'Ensemble scolaire Saint-Jacques-de-Compostelle, 32 rue Paul Lahargou',
         'city', 'Dax',
         'postcode', '40100',
         'country', 'FR'
       )
     )
WHERE slug = 'saint-jacques'
  AND config->'establishment_address' IS NULL;
