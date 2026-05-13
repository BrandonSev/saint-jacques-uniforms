Cette demande contient 13 modifications distinctes touchant plusieurs pages, composants, la logique de recommandation de taille et la base de données. Je propose ce plan d'exécution.

## 1. Breadcrumbs — gestion du truncate
Repérer le composant de breadcrumbs (probablement inline dans `src/routes/*.tsx` comme `lycee.tsx`/`college.tsx`). Ajouter `min-w-0`, `truncate` et un wrapper `flex-1` sur le dernier segment pour qu'il se tronque proprement sur petits écrans.

## 2. `/` — drapeau français au lieu de l'icône MapPin
Dans `src/routes/index.tsx`, remplacer l'icône `MapPin` du `TrustItem` "Fabrication française" par un petit composant `FrenchFlag` (3 bandes CSS bleu/blanc/rouge, déjà utilisé sur `blouse-officielle` et `ProductCard`).

## 3. `ProductCard` — guide des tailles en modal
- Ajouter dans `src/components/ProductCard.tsx` un `Dialog` (shadcn) qui affiche le contenu du guide des tailles (extrait depuis `aide.guide-tailles.tsx`) au clic sur "Guide des tailles", au lieu du `Link` actuel.
- Pour éviter la duplication, extraire le tableau et le texte du guide dans un nouveau composant partagé `src/components/SizeGuideContent.tsx` réutilisé par la page `/aide/guide-tailles` et par le modal.

## 4. Logique "blouse = taille +1" (rentrée 2025)
- Modifier `src/lib/sizeRecommendation.ts` : ajouter un paramètre optionnel `{ product?: "blouse" }` à `recommendSize()` qui décale l'index recommandé de +1 (capé sur la dernière ligne).
- Mettre à jour les appelants : `AddChildDialog`, page enfants, page blouse, ProductCard. Quand le produit est la blouse, afficher la taille +1 et un message explicite "Pour la blouse livrée à la rentrée de Septembre 2025, nous recommandons de prendre une taille au-dessus".
- Ajouter cette mention sur le guide des tailles dans une encart dédié blouse.

## 5. `/boutique` — accent Collège & Lycée
Dans `src/routes/boutique.tsx`, remplacer `accent` des entrées `college` et `lycee` par "Non gérée par France Uniformes".

## 6. `/lycee` harmonisé avec `/college`
Reprendre la structure visuelle de `src/routes/college.tsx` (header, breadcrumbs, hero, sections, CTAs) dans `src/routes/lycee.tsx` en gardant le contenu spécifique "Prochainement / 3ᵉ rattachée".

## 7. `/boutique` — retirer "du lundi au vendredi…"
Dans `src/routes/boutique.tsx`, simplifier la phrase de bas de page :
"Besoin d'aide ? Contactez la boutique par email à boutique@franceuniformes.fr".

## 8. Mise en valeur ESS (économie sociale et solidaire)
- Ajouter dans `src/routes/blouse-officielle.tsx` un encart dédié "Fabriquée en France via l'économie sociale et solidaire" expliquant la production par des personnes en situation de handicap / reconversion / réinsertion professionnelle.
- Ajouter une mention compacte aussi sur `/` (TrustItem "Fabrication française" → texte enrichi) et sur `ProductCard` blouse (petite ligne sous le badge).

## 9. `/blouse-officielle` — alléger les mentions "Fabrication française"
- Garder le badge sur l'image de galerie OU à côté de "Tenue officielle", pas les deux. Choix : conserver le badge image (plus visible) et supprimer le pill à côté de "Tenue officielle".
- Conserver également la mention dans la description (`<strong>`) et le grand bandeau "Made in France" repensé pour intégrer la mention ESS (point 8).
- Supprimer le doublon dans le bloc de confiance si redondant.

## 10. Harmoniser tous les badges "Taille recommandée"
Créer `src/components/SizeBadge.tsx` utilisé partout (page enfants, AddChildDialog, ProductCard, blouse-officielle, guide-tailles). Style unique : pill `bg-primary/10 text-primary border border-primary/20`, icône `Ruler`, texte "Taille recommandée : X ans" + variante "blouse" (taille +1).

## 11. Nouveau type d'incident "Erreur de commande"
- Ajouter "Erreur de commande" dans la liste des types proposés sur le formulaire d'incident (côté UI, fichier de la modale d'incident — à repérer dans `commandes.tsx` ou composant dédié).
- Pas de changement DB nécessaire (`incident_type` est `text` libre).

## 12. Élargir la colonne "Taille" sur le guide des tailles
Dans `src/routes/aide.guide-tailles.tsx` et le composant partagé créé en 3, augmenter la largeur de la colonne `Taille` (`w-` plus large + `whitespace-nowrap`).

## 13. Date de mise à jour des enfants + tooltip
- Afficher `updated_at` formaté ("Mis à jour le …") sur chaque carte enfant dans `src/routes/enfants.tsx`.
- Ajouter un `Tooltip` (shadcn) sur la phrase "n'hésitez pas à mettre à jour…" expliquant que les mensurations évoluent et impactent la taille recommandée.

## Ordre de livraison
1. Composants partagés (SizeBadge, SizeGuideContent, FrenchFlag réutilisable)
2. Logique `sizeRecommendation` + appelants
3. Pages (`index`, `boutique`, `lycee`, `blouse-officielle`, `enfants`, `aide.guide-tailles`)
4. ProductCard (modal + badge + ESS)
5. Incident type
6. Breadcrumbs truncate

Aucune migration DB nécessaire.

Confirmez-vous ce plan ? Je peux aussi le découper en plusieurs livraisons si vous préférez valider par lots.