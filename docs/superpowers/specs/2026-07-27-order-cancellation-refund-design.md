# Gestion des annulations et remboursements de commande — Design

Date : 2026-07-27

## Contexte

Aujourd'hui, l'annulation d'une commande se fait uniquement via un changement de
statut texte (`"Annulée"` existe déjà dans `ORDER_STATUSES`, sélectionnable dans
le panneau "Suivi & expédition" de `src/routes/admin.tsx`), sans aucune action
sur le paiement. Le remboursement n'existe pas du tout dans le code : aucune
colonne, aucune table, aucun appel à l'API de remboursement de PayPlug (le
prestataire de paiement déjà intégré via `src/server/payplug.server.ts`).

Ce projet ajoute une gestion outillée de ces deux actions, avec traçabilité et
emails automatiques, sur le modèle déjà utilisé pour `order_corrections`
(cf. `docs/superpowers/specs/2026-07-24-order-corrections-design.md`).

## Périmètre

- Annulation d'une commande (changement de statut, sans toucher au stock).
- Remboursement total ou partiel d'une commande payée via PayPlug, avec appel
  réel à l'API de remboursement PayPlug.
- Les deux actions sont **indépendantes** : on peut annuler sans rembourser
  (commande non payée) et rembourser sans annuler (remboursement partiel d'un
  article, commande toujours honorée pour le reste).
- Pas de restock automatique à l'annulation (géré manuellement par l'admin si
  besoin, hors périmètre).
- N'affecte pas `order_corrections` ni `order_incidents`, qui restent inchangés.

## Modèle de données

### Nouvelle table `order_refunds`

| Colonne | Type | Détail |
|---|---|---|
| `id` | uuid, PK | |
| `order_id` | uuid | FK → `orders` |
| `order_item_ids` | uuid[] | articles couverts par ce remboursement |
| `amount` | numeric(10,2) | montant remboursé (somme des `line_total` des articles sélectionnés) |
| `reason` | text nullable | motif libre saisi par l'admin |
| `payplug_refund_id` | text nullable | id renvoyé par PayPlug si l'appel réussit |
| `status` | text | `"Réussi"` \| `"Échoué"` |
| `error_message` | text nullable | message d'erreur si l'appel PayPlug échoue |
| `created_by` | uuid | admin ayant déclenché l'action (`auth.uid()`) |
| `created_at` | timestamptz, default now() | |

RLS : même pattern que `order_corrections` — accès réservé aux admins
(`has_role(auth.uid(), 'admin'::app_role)`), SELECT/INSERT/UPDATE.

### `orders`

Ajout de `"Remboursée"` à la constante `ORDER_STATUSES` dans
`src/routes/admin.tsx`. Pas de nouvelle colonne : le montant cumulé remboursé
se calcule en sommant `order_refunds.amount` (où `status = 'Réussi'`) pour la
commande.

### `order_status_history`

Table et trigger déjà existants (`log_order_status_change`) : se remplissent
automatiquement dès que `orders.status` passe à `"Annulée"` ou `"Remboursée"`,
sans modification nécessaire.

## Flux — Annulation

1. Dans le panneau "Suivi & expédition" (`TrackingPanel`), nouveau bouton
   **"Annuler la commande"**.
2. Garde-fou non bloquant : si `status` ∈ `{Expédiée, Livrée, Annulée,
   Remboursée}`, avertissement visuel avant confirmation ("cette commande est
   déjà [statut], confirmer quand même ?"), sur le modèle du garde-fou des
   corrections. L'action reste possible.
3. Confirmation → réutilise `updateOrder(orderId, { status: "Annulée" },
   notify: true)` déjà existant. Aucune action sur le stock.
4. Email dédié à la famille : nouveau template `order-cancellation.tsx` et
   server function `sendOrderCancellation`, déclenchés à la place du générique
   `order-status.tsx` uniquement quand le nouveau statut est `"Annulée"` (les
   autres transitions de statut continuent d'utiliser le template générique
   existant).
5. Notification interne admin (voir section Emails).

## Flux — Remboursement

1. Dans le même panneau, nouveau bloc **"Remboursement"** :
   - Liste des `order_items` de la commande, chacun avec case à cocher et prix
     (`line_total`) affiché.
   - Montant total sélectionné recalculé en direct.
   - Champ motif optionnel.
   - Bouton "Rembourser X,XX €", désactivé si aucun article coché ou si
     `orders.payplug_payment_id` est absent (message : "Commande non payée via
     PayPlug, remboursement impossible ici").
   - Historique des remboursements déjà effectués sur cette commande, affiché
     sous le formulaire (montant, date, statut, motif, échecs inclus).
2. Confirmation → nouvelle server function `refundOrder` :
   a. Charge la commande, vérifie `payplug_payment_id`.
   b. Calcule le montant en centimes à partir des `order_items` sélectionnés
      (`line_total` est stocké en euros décimaux dans `order_items`/`orders` ;
      PayPlug attend un entier en centimes, même conversion que celle déjà
      faite dans `createOrderPayment` pour le montant initial).
   c. Garde-fou : vérifie que les articles sélectionnés n'ont pas déjà été
      intégralement couverts par des remboursements `"Réussi"` antérieurs.
   d. Appelle `refundPayplugPayment(paymentId, amount)` (nouvelle fonction dans
      `src/server/payplug.server.ts`, pattern jumeau de
      `createPayplugPayment`/`fetchPayplugPayment`, `POST
      /v1/payments/{id}/refunds`).
   e. Insère une ligne dans `order_refunds` : `"Réussi"` + `payplug_refund_id`
      en cas de succès, ou `"Échoué"` + `error_message` en cas d'erreur (jamais
      d'exception silencieuse ; la ligne échouée reste visible pour trace et
      l'admin peut retenter).
   f. Si succès et que le cumul remboursé atteint `orders.total_amount` → passe
      `orders.status` à `"Remboursée"`.
   g. Envoie l'email `sendOrderRefund` (fire-and-forget) si succès.
3. Notification interne admin (voir section Emails).

## Interface admin

Extension du panneau "Suivi & expédition" existant (`TrackingPanel`) — pas de
nouvel onglet, pas de badge de compteur (ce ne sont pas des files d'attente à
traiter comme Incidents/Corrections, mais des actions ponctuelles sur une
commande déjà identifiée) :

- Bouton "Annuler la commande" avec dialog de confirmation.
- Bloc "Remboursement" : sélection d'articles par case à cocher, montant
  calculé, motif, bouton de confirmation, historique des remboursements de la
  commande.
- Toasts de succès/erreur cohérents avec le reste de l'admin.

## Emails et notification interne

Trois nouveaux templates dans `src/lib/email-templates/`, enregistrés dans
`registry.ts`, envoyés via `enqueueTransactionalEmail` (pattern
`sendOrderCorrectionUpdate`) :

- **`order-cancellation.tsx`** — à la famille : commande n°X annulée, motif si
  renseigné.
- **`order-refund.tsx`** — à la famille : montant remboursé sur la commande
  n°X, liste des articles concernés.
- **`admin-order-action.tsx`** — notification interne (calquée sur
  `admin-order.tsx`), envoyée à l'email admin à chaque annulation ou
  remboursement, récapitulant commande, montant, motif et admin ayant agi.

Toutes les server functions (`sendOrderCancellation`, `sendOrderRefund`,
`sendAdminOrderAction`) suivent le pattern existant : `createServerFn` protégée
par `requireSupabaseAuth`, appel fire-and-forget (`.catch(() => {})`) depuis
l'UI après succès de la mutation.

## Erreurs et cas limites

- Échec de l'appel PayPlug refund : aucune écriture sur `orders.status`, ligne
  `order_refunds` en `"Échoué"` créée pour trace, toast d'erreur affiché avec
  le message PayPlug, l'admin peut retenter.
- Double remboursement du même article : bloqué par le garde-fou de l'étape 2c
  (vérifie le montant déjà remboursé par article via `order_item_ids`).
- Commande sans `payplug_payment_id` (paiement resté "En attente" ou hors
  PayPlug) : bouton de remboursement désactivé avec message explicite.
- Annulation d'une commande déjà expédiée/livrée/annulée/remboursée :
  avertissement non bloquant, décision laissée à l'admin.

## Hors périmètre

- Pas de restock automatique à l'annulation.
- Pas d'annulation automatique liée à un remboursement total (actions
  indépendantes, déclenchées séparément par l'admin).
- Pas de nouvel onglet de vue liste globale des annulations/remboursements
  (l'historique reste consultable par commande, dans le panneau de suivi).
- Pas de gestion d'un autre prestataire de paiement que PayPlug.
