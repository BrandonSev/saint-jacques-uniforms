# Système de templates d'email personnalisés + envoi bulk (admin)

Date : 2026-07-03

## Contexte et objectif

L'admin a besoin de composer un email personnalisé (header, texte, bouton, lien) directement depuis l'interface d'administration, de le sauvegarder pour réutilisation future, et de l'envoyer en masse à un ensemble de destinataires — qu'il s'agisse de familles ayant un compte (`profiles`) ou d'adresses email brutes sans compte associé (ex : personnes ayant tenté une réinitialisation de mot de passe sur un email non enregistré).

Cas d'usage déclencheur : des logs `password-reset-error` (`user_not_found`) montrent des tentatives de connexion pour des emails absents de la base. L'admin veut pouvoir contacter ces personnes en masse, en plus de pouvoir cibler des familles existantes pour d'autres campagnes (ex : information, relance, résolution d'incident).

## Approche générale

Réutiliser au maximum l'existant plutôt que créer un nouveau sous-système :

- **Rendu visuel** : le composant partagé `EmailLayout` (`src/lib/email-templates/_layout.tsx`) reste la seule source de vérité pour le header bleu marine, la barre d'accent rouge, le footer — garantissant que les emails bulk ont le même rendu que welcome/password-reset/order-confirmation, etc.
- **Sélection de destinataires** : le pattern déjà en production dans `src/routes/apel.tsx` (tableau de familles avec checkboxes, `Set<string>` de sélection) est étendu avec un second mode de saisie (emails collés).
- **Envoi bulk** : le pattern déjà en production dans `sendApelReminders` (`src/lib/apel.functions.ts`) — boucle synchrone cappée à 500 destinataires, retour `{sent, total, errors}` — est répliqué pour ce nouveau cas d'usage. Pas de bascule vers la queue `pgmq` existante pour cette V1 (jugée suffisante au volume actuel, garde une implémentation simple et cohérente avec l'existant).
- **Traçabilité** : aucune nouvelle table de log d'envoi bulk n'est créée ; la table `email_send_log` existante trace déjà chaque envoi individuel avec son statut.

## Modèle de données

Nouvelle table `email_templates_custom`, migration au format des migrations existantes (`supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql`, `CREATE TABLE`, `ENABLE ROW LEVEL SECURITY`, policies nommées) :

```sql
create table email_templates_custom (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  header_title text not null,
  body text not null,               -- paragraphes séparés par \n\n
  button_label text,
  button_url text,
  signature_role text not null default 'technique',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table email_templates_custom enable row level security;

-- Lecture/écriture réservée aux admins (has_role admin), suivant le pattern
-- des policies admin déjà en place ailleurs dans le schéma.
```

## Template email générique

Nouveau fichier `src/lib/email-templates/custom-bulk.tsx`, dans le même registre que les templates existants (`registry.ts`), utilisant `EmailLayout` :

```tsx
interface Props {
  headerTitle: string;
  body: string;              // paragraphes séparés par \n\n, un <Text> par paragraphe
  buttonLabel?: string;
  buttonUrl?: string;
  familyName?: string;       // absent → pas de sous-titre "Famille X" dans le header
  greeting: string;          // "Bonjour Marie," ou "Bonjour,"
  signatureRole: string;
}
```

- Le bouton (`<Button style={button}>`) n'est rendu que si `buttonLabel` **et** `buttonUrl` sont tous deux renseignés.
- La signature est déjà gérée nativement par `EmailLayout` via `signatureRole`.

## Backend

Nouveau fichier `src/lib/email-templates-admin.functions.ts`, trois `createServerFn`, toutes protégées par le middleware `requireSupabaseAuth` puis une vérification explicite `userHasAnyRole(userId, ["admin"])` dans le handler (pattern identique à `apel.functions.ts`) :

### `listCustomTemplates()`
Liste les templates sauvegardés, triés par `updated_at desc`, pour peupler le sélecteur "Charger un template existant" côté UI.

### `saveCustomTemplate(input)`
Upsert (crée si `id` absent, met à jour sinon) un `email_templates_custom`.

### `sendCustomBulkEmail(input)`
Entrées :
```ts
{
  profileIds?: string[];   // familles sélectionnées via le tableau
  rawEmails?: string[];    // emails collés manuellement
  headerTitle: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
  signatureRole: string;
}
```

Validation d'entrée (`zod`) : `profileIds` + `rawEmails` combinés cappés à 500 (`.max(500)` sur le total), au moins un des deux non vide.

Logique, pour chaque destinataire :
- **Cas `profileId`** : lookup dans `profiles` (civilité, prénom, nom, email). Salutation personnalisée ("Bonjour {prénom},"), `familyName` renseigné → le header affiche "Famille {nom}".
- **Cas `rawEmail`** : aucun lookup. Salutation générique "Bonjour,", `familyName` absent → pas de sous-titre dans le header.
- Appelle `enqueueTransactionalEmail` avec le template `custom-bulk.tsx`, idempotency key dérivée de `email + date du jour + id du template/contenu` pour éviter les doublons en cas de double-clic.
- Les échecs individuels (email invalide, erreur du mailer) sont capturés et n'interrompent pas la boucle.

Retour : `{ sent: number, total: number, errors: Array<{ email: string, reason: string }> }`.

## Interface admin

Nouveau tab **"Emails"** dans `src/routes/admin.tsx`, aux côtés des tabs existants (orders, tracking, incidents, roles).

### Colonne gauche — Composer
- Dropdown "Charger un template existant" (optionnel, pré-remplit les champs depuis `listCustomTemplates`)
- Champ `Nom du template` (utilisé pour la sauvegarde)
- Champ `Titre du header`
- Textarea `Corps du message`
- Champs optionnels `Texte du bouton` / `Lien du bouton`
- Champ `Signature` (ex : "technique", "Commandes")
- Bouton `Enregistrer le template` → appelle `saveCustomTemplate`

### Colonne droite — Aperçu
Rendu HTML live, recalculé à chaque frappe, reflétant fidèlement le futur email (mêmes couleurs/structure que `_layout.tsx` : header bleu marine `#0a2540`, barre rouge `#c8102e`, bouton arrondi, footer gris).

### Section destinataires (pleine largeur, sous le composer)
Deux onglets internes :
- **Familles** : tableau des `profiles` avec checkboxes (repris du pattern `apel.tsx`), champ de recherche par nom/email.
- **Emails collés** : textarea acceptant une adresse par ligne ou séparées par virgules, avec validation basique du format et affichage du nombre d'adresses détectées.

Bouton final `Envoyer à N destinataires`, avec confirmation explicite avant l'envoi effectif (irréversible).

### Après envoi
Toast de résumé + tableau récapitulatif : `X envoyés / Y total`, liste des échecs avec leur raison.

## Hors périmètre (V1)

- Pas d'éditeur WYSIWYG riche (gras, listes, blocs multiples) — formulaire à champs fixes uniquement.
- Pas de bascule vers la queue `pgmq` existante — boucle synchrone cappée, comme `sendApelReminders`.
- Pas de matching automatique d'un email brut vers un profil existant — salutation générique systématique pour les emails collés.
- Pas de programmation d'envoi différé (l'envoi est immédiat au clic).
