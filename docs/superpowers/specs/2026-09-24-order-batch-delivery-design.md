# Passage en lot « Livrée » asynchrone + export comptable

## Besoin
Rattraper en une opération (et pouvoir la refaire : grosses commandes groupées, livraisons passées) le
passage en « Livrée » de nombreuses commandes afin de générer les factures, ouvrir les incidents côté
famille et exporter les factures pour le comptable. Les dates de livraison réelles sont parfois inconnues
(groupées : approximative ; individuelles : date Colissimo) et doivent rester corrigeables.

## Constats (code existant)
- `delivered_at` n'est lu nulle part hormis un repli sur le droit de déclarer un incident ; la facture
  affiche `paid_at`. La date de livraison est donc purement informative et modifiable sans effet comptable.
- La numérotation est atomique et idempotente (`reserve_order_invoice_number`) : refaire la génération
  pour une commande déjà facturée renvoie la même facture.
- Le bulk actuel tourne dans le navigateur, séquentiellement, et s'arrête si l'onglet se ferme.

## Conception
**Tables** `order_batch_jobs` (lot : statut cible, date par défaut, notify, compteurs, heartbeat) et
`order_batch_job_items` (une ligne par commande, date propre optionnelle, résultat, n° de facture).
Statuts de lot : `queued | running | done` ; de ligne : `pending | success | failed | skipped`.

**Worker** dans le processus serveur (Node persistant, cf. Dockerfile) : `createOrderBatchJob` insère le lot
puis lance `runJob` sans l'attendre. Les commandes sont traitées **par `paid_at` croissant** (numérotation
chronologique). Un lot `running` dont le heartbeat a plus de 90 s est repris (un redéploiement ne perd rien ;
la reprise est déclenchée par le polling de l'interface). Un seul lot actif à la fois.

**Règles par commande** : commandes Annulée/Remboursée ignorées ; date de livraison = date CSV de la
commande, sinon date du lot, sinon date déjà enregistrée, sinon maintenant ; la ligne « Livrée » de
`order_status_history` est datée de la même façon ; facture générée pour « Livrée » (idempotent) ; e-mail
uniquement si la case est cochée (décochée par défaut pour « Livrée »). Échec de facture → ligne `failed`,
relançable (`retryOrderBatchJob`).

**Aperçu avant lancement** (`previewOrderBatch`) : nombre de commandes modifiées / ignorées / déjà
facturées et plage de numéros de facture prévue par préfixe (FU-B / FU-BE).

**Interface (onglet Suivi)** : filtres (recherche, type, statut, période de paiement, « sans facture »),
colonne facture, barre d'actions en lot (date, import CSV `n° de commande;date`, notification, aperçu puis
lancement), bandeau de progression, champ « date de livraison » modifiable par commande livrée, bouton
« Exporter pour le comptable ».

**Export** : `POST /api/admin/invoices-export` (Bearer + rôle admin) renvoie un ZIP `factures/*.pdf` +
`recap-factures.csv` (n° facture, date de facturation, n° commande, date de livraison, client, type,
HT / TVA / TTC).

## Hors périmètre
Filtre par établissement (aucune colonne dédiée sur `orders`) ; récupération automatique des dates
Colissimo (import CSV manuel à la place).
