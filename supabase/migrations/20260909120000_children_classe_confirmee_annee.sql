-- Passage à l'année suivante : on garde trace de l'année scolaire pour laquelle
-- la famille a confirmé la classe / le niveau de l'enfant.
--
-- Tant que children.classe_confirmee_annee ne correspond pas à l'année scolaire
-- courante, la boutique affiche une alerte « passage en classe supérieure » et
-- l'extraction admin signale la donnée comme non confirmée.
--
-- Backfill volontairement à NULL : à la première rentrée post-déploiement, toutes
-- les familles sont invitées à confirmer la classe de leurs enfants.
ALTER TABLE public.children
  ADD COLUMN classe_confirmee_annee TEXT;

COMMENT ON COLUMN public.children.classe_confirmee_annee IS
  'Année scolaire (format "AAAA/AAAA+1") pour laquelle la famille a confirmé la classe de l''enfant. NULL = jamais confirmée.';

-- L'admin doit pouvoir lire la classe « vivante » (à jour) des enfants pour
-- fiabiliser l'extraction des commandes destinée à la distribution en
-- établissement. Il voit déjà prénom / nom / classe figés via order_items ;
-- cette policy lui donne accès à la valeur courante de la fiche enfant.
CREATE POLICY "Admins can view all children"
  ON public.children FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Clé étrangère explicite order_items.child_id -> children.id pour permettre la
-- jointure PostgREST côté extraction admin. ON DELETE SET NULL : la suppression
-- d'une fiche enfant ne doit pas casser l'historique de commande.
-- On neutralise d'abord les child_id devenus orphelins (fiches enfant déjà
-- supprimées) : le snapshot child_prenom / child_nom / child_classe reste, lui,
-- intact sur la ligne de commande.
UPDATE public.order_items oi
  SET child_id = NULL
  WHERE child_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.children c WHERE c.id = oi.child_id);

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_child_id_fkey
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE SET NULL;
