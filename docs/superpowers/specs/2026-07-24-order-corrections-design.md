# Gestion des demandes de correction de commande (taille) — Design

Date : 2026-07-24

## Contexte

Les familles signalent parfois par mail des erreurs de taille sur une commande pas
encore expédiée (ex. commande d'un article en 8 ans au lieu de 6 ans). Aujourd'hui
ce traitement se fait au cas par cas dans la boîte mail, sans trace, avec un risque
d'oubli.

Le projet a déjà un système `order_incidents` (déclaration côté famille, traitement
côté admin dans l'onglet "Incidents" de `src/routes/admin.tsx`), mais il est dédié
au SAV **post-livraison** (malfaçon, erreur d'envoi, article manquant...). Le type
`taille_inadaptee` y est explicitement marqué `eligible: false` et la déclaration
n'est possible que lorsque `canDeclareIncident` (commande livrée) — ce système ne
doit pas être touché ni réutilisé pour ce nouveau besoin.

## Périmètre

- Couvre uniquement les demandes de correction **avant expédition** de la commande.
- La famille continue de contacter par mail (pas de nouveau flux de déclaration
  côté famille). Le système à construire est **100% côté admin** : créer, suivre,
  résoudre ces demandes sans les perdre dans la boîte mail.
- N'affecte pas `order_incidents` (SAV post-livraison), qui reste inchangé.

## Modèle de données

Nouvelle table `order_corrections` :

| Colonne | Type | Détail |
|---|---|---|
| `id` | uuid, PK | |
| `order_id` | uuid | FK vers `orders` |
| `order_item_id` | uuid | FK vers `order_items` — l'article concerné |
| `field` | text | valeur fixe `"size"` pour l'instant (extensible plus tard, mais on n'implémente que la taille) |
| `old_value` | text | taille au moment de la création de la demande |
| `new_value` | text | taille demandée |
| `status` | text | `"À traiter"` \| `"Résolu"` \| `"Annulé"` |
| `note` | text nullable | commentaire libre admin (contexte du mail reçu) |
| `requester_email` | text | email de la famille, saisi manuellement par l'admin |
| `created_by` | uuid | admin ayant créé l'entrée (`auth.uid()`) |
| `created_at` | timestamptz, default now() | |
| `resolved_at` | timestamptz nullable | |

RLS : accès réservé aux admins (même politique que `order_incidents` / `orders`
côté admin). La famille n'a jamais d'accès direct à cette table.

## Flux

1. L'admin reçoit un mail de demande de correction de taille.
2. Dans l'admin, nouvel onglet **"Corrections"** (à côté de "Incidents") →
   bouton **"Nouvelle demande"**.
3. Formulaire de création :
   - Recherche de la commande par numéro ou email famille.
   - Sélection de l'article concerné dans la commande (pré-remplit `old_value`
     avec `order_items.size` actuel).
   - Saisie de `new_value` (nouvelle taille) et `requester_email`.
   - Note libre optionnelle.
   - **Garde-fou non bloquant** : si `orders.status` est `"Expédiée"` ou
     `"Livrée"`, affichage d'un avertissement visuel ("cette commande est déjà
     partie, une correction directe n'est pas appropriée — orientez la famille
     vers un retour/échange") mais la création reste possible (pour tracer
     quand même l'échange).
4. La demande apparaît dans la liste avec statut **"À traiter"** ; badge de
   compteur sur l'onglet "Corrections" (même pattern que le badge
   `incidentsEnAttente` existant).
5. Action **"Appliquer"** sur une ligne à traiter :
   - Met à jour `order_items.size` avec `new_value`.
   - Passe `status` à `"Résolu"`, horodate `resolved_at`.
   - Envoie un email de confirmation à `requester_email` (nouveau template
     `order-correction-resolution`, calqué sur `incident-resolution.tsx`).
6. Action **"Annuler"** sur une ligne à traiter :
   - Passe `status` à `"Annulé"`, horodate `resolved_at`.
   - Aucun email automatique (l'admin répond manuellement, car le cas est
     généralement plus complexe — ex. commande déjà expédiée).

## Interface admin

Réutilise les patterns déjà en place dans `admin.tsx` pour l'onglet "Incidents" :

- Liste tabulaire : commande, famille, enfant, article, taille actuelle → taille
  demandée, statut, date.
- Ligne cliquable ouvrant un panneau de détail (comme `IncidentDetail`) avec les
  actions Appliquer / Annuler et un champ de note.
- Compteur badge sur l'onglet pour les entrées `"À traiter"`.

## Email

Nouveau template dans `src/lib/email-templates/` : `order-correction-resolution.tsx`,
enregistré dans `registry.ts`. Contenu : confirmation que la taille de l'article
X est corrigée de `old_value` à `new_value` sur la commande `order_number`.
Nouvelle server function dans `email.functions.ts` (ou fichier dédié
`order-corrections.functions.ts`) : `sendOrderCorrectionResolution`, suivant le
pattern de `sendIncidentUpdate`.

## Hors périmètre

- Pas de flux de déclaration côté famille.
- Pas de gestion des échanges post-livraison (reste dans `order_incidents`,
  inchangé).
- Pas de gestion de stock/disponibilité de la nouvelle taille — reste une
  vérification manuelle par l'admin avant de cliquer "Appliquer".
