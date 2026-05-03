## Vue d'ensemble

8 chantiers sur la boutique famille. Le SMTP Outlook est déjà branché (edge function `send-email` + helpers `email.server.ts`), donc le point 6 est en réalité déjà actif — on l'étend au point 7. PayPlug sera branché en TEST (sandbox) après ajout de la clé secrète.

---

## 1. Page "Tout voir" — Historique des commandes par enfant

- Nouvelle route `src/routes/enfants.$childId.historique-complet.tsx` (ou réutiliser/étoffer la route existante `enfants.$childId.historique.tsx`).
- Lien "Tout voir" depuis `PurchaseHistoryPreview` sur `/enfants` → cette page.
- Affichage : liste complète, filtres (par catégorie, par statut "à remplacer"), tri par date, pagination simple si > 20 lignes.

## 2. Choix de l'adresse de livraison + mode

Dans la modal de confirmation (`panier.tsx > ConfirmModal`) :

- **Mode de livraison** (radios) : `Domicile` / `Retrait à l'établissement`.
  - Stocké côté admin dans une table `delivery_options` (id, label, active, default) — l'admin active/désactive. Par défaut, "Retrait à l'établissement" = inactif.
- **Si Domicile** : sélecteur d'adresse listant :
  - L'adresse principale du profil
  - Les adresses des `family_parents` (champs `adresse/code_postal/ville` + `shipping_*` si `has_alt_shipping`)
  - Option "Saisir une autre adresse" (champs ad hoc, non sauvegardés sauf coche "mémoriser")
- **Si Retrait** : pas d'adresse, mention "À retirer à l'établissement".
- L'adresse + le mode choisis sont enregistrés sur la commande (nouveaux champs `orders.shipping_mode`, `shipping_label`, `shipping_address`, `shipping_postal`, `shipping_city`, `shipping_recipient`).

## 3. Numérotation `CMD-YYYYMMDD-C{NNN}-{MMM}`

- Nouvelle table `client_counters (user_id uuid PK, client_number int unique)` — attribution séquentielle au 1er passage.
- Nouvelle table `order_sequences (user_id uuid PK, last_seq int)` — incrément par client.
- Fonction PL/pgSQL `generate_order_number(_user_id uuid)` qui :
  - Récupère ou crée `client_number` (séquence dédiée pour garantir l'unicité globale).
  - Incrémente `last_seq` du client.
  - Retourne `CMD-YYYYMMDD-C{client_number padStart 3}-{seq padStart 3}`.
- Trigger `BEFORE INSERT` sur `orders` qui remplit `order_number` via cette fonction (remplace le `DEFAULT` random actuel).
- Migration de rattrapage : attribuer un `client_number` aux familles existantes (ordre `created_at`).

## 4. Téléchargement PDF récap commande

- Côté client : génération avec `jspdf` + `jspdf-autotable` (légers, pas de dépendance serveur).
- Bouton "Télécharger le récap PDF" sur `/commandes` (par commande) et dans la modal de confirmation post-commande.
- Contenu : en-tête établissement, n° commande, date, famille, adresse livraison, tableau articles (enfant, produit, taille, qté, PU, total), total TTC, mention paiement.

## 5. Suivi de commande

- Statuts (modifiables par admin) :
  - `Reçue` → `Paiement validé` → `En préparation` → `Prête` → (`Expédiée` + n° suivi si Domicile / `Disponible au retrait` si Établissement) → `Livrée`/`Retirée`
- Champs ajoutés sur `orders` : `tracking_number text`, `tracking_carrier text`, `delivered_at timestamptz`.
- Table `order_status_history (order_id, status, note, created_at, created_by)` pour la timeline.
- UI :
  - `/commandes` (famille) : timeline visuelle des étapes franchies + n° suivi cliquable.
  - `/admin` : sélecteur de statut + champ n° suivi/transporteur, bouton "Mettre à jour" (déclenche email + historique).

## 6+7. Emails — Tous les flux via SMTP Outlook (déjà configuré)

L'infra existe (`send-email` edge function + `email.server.ts`). On ajoute les templates et les déclencheurs :

| Événement | Destinataire(s) | Déclencheur |
|---|---|---|
| Inscription | Famille | déjà câblé (`sendWelcomeEmail`) |
| Reset mot de passe | Famille | déjà câblé |
| Confirmation commande | Famille + Admin | déjà câblé, à enrichir avec adresse + mode livraison |
| Changement statut commande | Famille | trigger admin dans `/admin` (point 5) |
| Ouverture incident | Famille (accusé) + Admin | au `INSERT` dans `order_incidents` (server fn appelée depuis modal incident) |
| Mise à jour incident (résolu/refusé) | Famille | au passage de statut admin |
| Paiement reçu (PayPlug) | Famille | webhook PayPlug (point 8) |

Tous les helpers ajoutés dans `src/server/email.server.ts`, déclencheurs dans `email.functions.ts`, appelés depuis les pages concernées (panier, commandes, admin).

## 8. Tunnel PayPlug (TEST / sandbox)

Flux retenu : **Lovable Cloud comme orchestrateur, paiement hébergé PayPlug**.

1. **Secret** : ajout de `PAYPLUG_SECRET_KEY` (clé `sk_test_...`) via `add_secret`.
2. **Création paiement** : nouvelle server fn `createPayplugPayment({ orderId })` :
   - Lit la commande, appelle `POST https://api.payplug.com/v1/payments` avec montant, devise EUR, billing/shipping, `notification_url` et `return_url`.
   - Stocke `payplug_payment_id` et `payment_url` sur `orders` (champs ajoutés).
   - Retourne `payment_url` au front.
3. **UX panier** :
   - Bouton "Confirmer ma commande" → crée la commande avec `status='En attente paiement'` → crée le paiement PayPlug → redirige vers `payment_url`.
   - Page `/commandes/retour-paiement` qui lit la commande et affiche succès/échec/en attente.
4. **Webhook** : route `src/routes/api/public/payplug-webhook.ts` :
   - Vérifie l'authenticité (récupération du paiement via API PayPlug avec l'`id` reçu, plutôt que de faire confiance au body).
   - Si `is_paid === true` : passe la commande à `Paiement validé`, ajoute à `order_status_history`, envoie emails confirmation client + admin.
   - Si échec : passe à `Paiement échoué`.
5. **Mode TEST** : la clé sandbox renvoie l'environnement TEST de PayPlug. Cartes de test PayPlug : `4242 4242 4242 4242` (succès), `4000 0000 0000 0002` (refus). Aucun mouvement bancaire réel.

---

## Détails techniques (récap migrations)

```text
-- Point 2
ALTER TABLE orders ADD COLUMN shipping_mode text DEFAULT 'Domicile';
ALTER TABLE orders ADD COLUMN shipping_label text;
ALTER TABLE orders ADD COLUMN shipping_recipient text;
ALTER TABLE orders ADD COLUMN shipping_address text;
ALTER TABLE orders ADD COLUMN shipping_postal text;
ALTER TABLE orders ADD COLUMN shipping_city text;
CREATE TABLE delivery_options (id, label, code, active bool, is_default bool);
-- seed: 'Domicile' active+default, 'Retrait établissement' inactive.

-- Point 3
CREATE TABLE client_counters (user_id uuid PK, client_number int unique);
CREATE TABLE order_sequences (user_id uuid PK, last_seq int);
CREATE FUNCTION generate_order_number(uuid) RETURNS text ...;
CREATE TRIGGER orders_set_number BEFORE INSERT ON orders ...;

-- Point 5
ALTER TABLE orders ADD COLUMN tracking_number text, tracking_carrier text, delivered_at timestamptz;
CREATE TABLE order_status_history (id, order_id, status, note, created_at, created_by);
-- Politique : admin update orders, user view own history.

-- Point 8
ALTER TABLE orders ADD COLUMN payplug_payment_id text, payment_url text, paid_at timestamptz;
```

Permissions admin sur `orders.UPDATE` (actuellement absentes) à ajouter via policy `has_role(auth.uid(),'admin')`.

## Ordre d'implémentation suggéré

1. Migrations (points 2/3/5/8) en un seul lot.
2. Numérotation commande + trigger (vérifiable immédiatement).
3. Modal panier : adresses + mode livraison.
4. Pages historique "Tout voir" + PDF récap.
5. Admin : suivi de commande + déclencheurs emails (incident + statut).
6. PayPlug : server fns + webhook + UX retour.

Souhaitez-vous qu'on démarre par les migrations + la numérotation, ou prioriser PayPlug d'abord ?