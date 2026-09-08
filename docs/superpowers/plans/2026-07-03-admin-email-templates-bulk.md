# Système de templates d'email personnalisés + envoi bulk (admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un admin de composer, sauvegarder et envoyer en masse un email personnalisé (header/texte/bouton/lien) à des familles existantes (`profiles`) ou à des adresses email brutes sans compte associé.

**Architecture:** Nouvelle table `email_templates_custom` (Supabase). Nouveau template React Email générique paramétrable (`custom-bulk.tsx`) enregistré dans le registry existant. Nouveau fichier de server functions (`email-templates-admin.functions.ts`) répliquant le pattern déjà en prod de `apel.functions.ts` (middleware auth + check rôle admin + boucle synchrone d'envoi cappée à 500). Nouveau tab "Emails" dans `src/routes/admin.tsx`, réutilisant le pattern de tableau à checkboxes de `apel.tsx`.

**Tech Stack:** TanStack Start (`createServerFn`), Supabase Postgres + RLS, `@react-email/components`, Zod, Tailwind (classes utilitaires brutes, pas de composant UI générique), `sonner` pour les toasts.

## Global Constraints

- Cap total de destinataires par envoi : 500 (familles + emails collés combinés) — identique à `sendApelReminders`.
- Aucune nouvelle table de log : réutiliser `email_send_log` existante pour la traçabilité individuelle.
- Pas de queue `pgmq` pour cette V1 : boucle synchrone dans la requête HTTP, comme `sendApelReminders`.
- Salutation générique "Bonjour," (sans prénom/civilité) pour tout email collé sans profil correspondant en base — aucun matching automatique.
- Toutes les server functions sont protégées par `withSupabaseAuth` + `requireSupabaseAuth` puis un check explicite `userHasAnyRole(userId, ["admin"])` dans le handler.
- Le rendu visuel doit provenir de `EmailLayout` (`src/lib/email-templates/_layout.tsx`) — même header bleu marine (`#0a2540`), barre rouge (`#c8102e`), footer gris que les autres templates.

---

### Task 1: Migration SQL — table `email_templates_custom`

**Files:**
- Create: `supabase/migrations/20260703120000_email_templates_custom.sql`

**Interfaces:**
- Produces: table `public.email_templates_custom` avec colonnes `id uuid pk`, `name text`, `header_title text`, `body text`, `button_label text nullable`, `button_url text nullable`, `signature_role text default 'technique'`, `created_by uuid`, `created_at timestamptz`, `updated_at timestamptz`.

- [ ] **Step 1: Écrire la migration**

```sql
-- Table pour les templates d'email personnalisés créés depuis l'admin,
-- réutilisables pour des envois bulk (familles ou emails bruts).
CREATE TABLE IF NOT EXISTS public.email_templates_custom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  header_title TEXT NOT NULL,
  body TEXT NOT NULL,
  button_label TEXT,
  button_url TEXT,
  signature_role TEXT NOT NULL DEFAULT 'technique',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates_custom ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins can select custom email templates"
    ON public.email_templates_custom FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert custom email templates"
    ON public.email_templates_custom FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update custom email templates"
    ON public.email_templates_custom FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_templates_custom_updated_at
  ON public.email_templates_custom(updated_at DESC);
```

- [ ] **Step 2: Appliquer la migration**

Run: `cd /var/www/html/saint-jacques-uniforms && npx supabase db push`
Expected: la migration s'applique sans erreur, la table apparaît dans le schéma `public`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260703120000_email_templates_custom.sql
git commit -m "feat: table email_templates_custom pour templates admin réutilisables"
```

---

### Task 2: Template email générique `custom-bulk.tsx`

**Files:**
- Create: `src/lib/email-templates/custom-bulk.tsx`
- Modify: `src/lib/email-templates/registry.ts`

**Interfaces:**
- Consumes: `EmailLayout`, `text`, `button` exportés de `src/lib/email-templates/_layout.tsx` (déjà existants, signature vue dans Task 0 exploration : `EmailLayout({ preview, title, familyName?, signatureRole?, disclaimer?, children })`).
- Produces: `TEMPLATES['custom-bulk']` dans le registry, composant `CustomBulkEmail` avec props `{ headerTitle: string; body: string; buttonLabel?: string; buttonUrl?: string; familyName?: string; greeting: string; signatureRole: string }`.

- [ ] **Step 1: Créer le template**

```tsx
import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, button } from "./_layout";
import type { TemplateEntry } from "./registry";

interface Props {
  headerTitle: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
  familyName?: string;
  greeting: string;
  signatureRole: string;
}

function CustomBulkEmail({ headerTitle, body, buttonLabel, buttonUrl, familyName, greeting, signatureRole }: Props) {
  const paragraphs = (body || "").split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return (
    <EmailLayout preview={headerTitle} title={headerTitle} familyName={familyName} signatureRole={signatureRole}>
      <Text style={text}>{greeting}</Text>
      {paragraphs.map((p, i) => (
        <Text key={i} style={text}>
          {p}
        </Text>
      ))}
      {buttonLabel && buttonUrl ? (
        <Button href={buttonUrl} style={button}>
          {buttonLabel}
        </Button>
      ) : null}
    </EmailLayout>
  );
}

export const template = {
  component: CustomBulkEmail,
  subject: (data: Record<string, any>) => data.headerTitle || "Message de l'équipe France Uniformes",
  displayName: "Email personnalisé (admin, bulk)",
  previewData: {
    headerTitle: "Votre compte est de nouveau accessible",
    body: "Nous avons résolu un souci technique.\n\nVous pouvez vous reconnecter dès à présent.",
    buttonLabel: "Accéder à mon espace",
    buttonUrl: "https://sjdc-dax.franceuniformes.fr/",
    familyName: "Dupont",
    greeting: "Bonjour Marie,",
    signatureRole: "technique",
  },
} satisfies TemplateEntry;
```

- [ ] **Step 2: Enregistrer le template dans le registry**

Modifier `src/lib/email-templates/registry.ts` :

```ts
import { template as apelReminder } from './apel-reminder'
import { template as signup } from './signup'
import { template as customBulk } from './custom-bulk'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcome,
  'signup': signup,
  'order-confirmation': orderConfirmation,
  'admin-order': adminOrder,
  'order-status': orderStatus,
  'incident-family': incidentFamily,
  'incident-admin': incidentAdmin,
  'incident-resolution': incidentResolution,
  'password-reset': passwordReset,
  'apel-reminder': apelReminder,
  'custom-bulk': customBulk,
}
```

(Ajouter la ligne d'import `import { template as customBulk } from './custom-bulk'` après celle de `apelReminder`, et la clé `'custom-bulk': customBulk,` en dernière entrée de l'objet `TEMPLATES`.)

- [ ] **Step 3: Vérifier le typecheck**

Run: `cd /var/www/html/saint-jacques-uniforms && npx tsc --noEmit`
Expected: aucune nouvelle erreur liée à `custom-bulk.tsx` ou `registry.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email-templates/custom-bulk.tsx src/lib/email-templates/registry.ts
git commit -m "feat: template email générique custom-bulk pour envois admin"
```

---

### Task 3: Server functions — CRUD templates + envoi bulk

**Files:**
- Create: `src/lib/email-templates-admin.functions.ts`

**Interfaces:**
- Consumes: `requireSupabaseAuth` (`@/integrations/supabase/auth-middleware`), `withSupabaseAuth` (`@/integrations/supabase/supabase-auth-middleware`), `supabaseAdmin` (`@/integrations/supabase/client.server`), `enqueueTransactionalEmail` (`@/lib/email/send.server`), `formatCivilite` (`@/lib/utils`). Table `email_templates_custom` (Task 1). Template `'custom-bulk'` (Task 2).
- Produces:
  - `listCustomTemplates(): Promise<{ ok: true; templates: CustomTemplate[] } | { ok: false; error: string; templates: [] }>`
  - `saveCustomTemplate(input: { id?: string; name: string; headerTitle: string; body: string; buttonLabel?: string; buttonUrl?: string; signatureRole: string }): Promise<{ ok: true; id: string } | { ok: false; error: string }>`
  - `sendCustomBulkEmail(input: { profileIds?: string[]; rawEmails?: string[]; headerTitle: string; body: string; buttonLabel?: string; buttonUrl?: string; signatureRole: string }): Promise<{ ok: true; sent: number; total: number; errors: Array<{ email: string; reason: string }> } | { ok: false; error: string; sent: 0 }>`
  - type `CustomTemplate = { id: string; name: string; header_title: string; body: string; button_label: string | null; button_url: string | null; signature_role: string; updated_at: string }`

- [ ] **Step 1: Écrire le fichier complet**

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTransactionalEmail } from "@/lib/email/send.server";
import { formatCivilite } from "@/lib/utils";

type AppRole = "admin" | "apel" | "user";
async function userHasAnyRole(userId: string, roles: AppRole[]) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", roles);
  return (data ?? []).length > 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Liste des templates personnalisés sauvegardés (admin uniquement)
export const listCustomTemplates = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({}).parse(d))
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, templates: [] };
    }
    const { data, error } = await supabaseAdmin
      .from("email_templates_custom")
      .select("id, name, header_title, body, button_label, button_url, signature_role, updated_at")
      .order("updated_at", { ascending: false });
    if (error) return { ok: false as const, error: error.message, templates: [] };
    return { ok: true as const, templates: data ?? [] };
  });

// Création ou mise à jour d'un template personnalisé (admin uniquement)
export const saveCustomTemplate = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(200),
        headerTitle: z.string().min(1).max(200),
        body: z.string().min(1).max(5000),
        buttonLabel: z.string().max(100).optional(),
        buttonUrl: z.string().url().max(500).optional(),
        signatureRole: z.string().min(1).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }
    const row = {
      name: data.name,
      header_title: data.headerTitle,
      body: data.body,
      button_label: data.buttonLabel ?? null,
      button_url: data.buttonUrl ?? null,
      signature_role: data.signatureRole,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("email_templates_custom").update(row).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id: data.id };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("email_templates_custom")
      .insert({ ...row, created_by: userId })
      .select("id")
      .single();
    if (error || !inserted) return { ok: false as const, error: error?.message ?? "insert_failed" };
    return { ok: true as const, id: inserted.id as string };
  });

// Envoi en masse d'un email personnalisé à des familles (profileIds) et/ou
// des adresses email brutes sans compte associé (rawEmails).
export const sendCustomBulkEmail = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        profileIds: z.array(z.string().uuid()).max(500).optional(),
        rawEmails: z.array(z.string().email()).max(500).optional(),
        headerTitle: z.string().min(1).max(200),
        body: z.string().min(1).max(5000),
        buttonLabel: z.string().max(100).optional(),
        buttonUrl: z.string().url().max(500).optional(),
        signatureRole: z.string().min(1).max(100),
      })
      .refine((d) => (d.profileIds?.length ?? 0) + (d.rawEmails?.length ?? 0) > 0, {
        message: "at_least_one_recipient_required",
      })
      .refine((d) => (d.profileIds?.length ?? 0) + (d.rawEmails?.length ?? 0) <= 500, {
        message: "too_many_recipients",
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, sent: 0 as const };
    }

    const templateData = {
      headerTitle: data.headerTitle,
      body: data.body,
      buttonLabel: data.buttonLabel,
      buttonUrl: data.buttonUrl,
      signatureRole: data.signatureRole,
    };

    let profiles: Array<{ id: string; email: string; prenom: string | null; nom: string | null; civilite: string | null }> = [];
    if (data.profileIds?.length) {
      const { data: rows } = await supabaseAdmin
        .from("profiles")
        .select("id, email, prenom, nom, civilite")
        .in("id", data.profileIds);
      profiles = rows ?? [];
    }

    const rawEmails = Array.from(new Set((data.rawEmails ?? []).filter((e) => EMAIL_RE.test(e))));

    const dateKey = new Date().toISOString().slice(0, 10);
    let sent = 0;
    const errors: Array<{ email: string; reason: string }> = [];
    const total = profiles.length + rawEmails.length;

    for (const p of profiles) {
      if (!p.email) continue;
      try {
        await enqueueTransactionalEmail({
          templateName: "custom-bulk",
          recipientEmail: p.email,
          templateData: {
            ...templateData,
            familyName: p.nom ?? "",
            greeting: `Bonjour ${formatCivilite(p.civilite)} ${p.prenom ?? ""},`.replace(/\s+,/, ","),
          },
          idempotencyKey: `custom-bulk-${p.id}-${dateKey}`,
        });
        sent++;
      } catch (e: any) {
        errors.push({ email: p.email, reason: e?.message ?? String(e) });
      }
    }

    for (const email of rawEmails) {
      try {
        await enqueueTransactionalEmail({
          templateName: "custom-bulk",
          recipientEmail: email,
          templateData: {
            ...templateData,
            familyName: undefined,
            greeting: "Bonjour,",
          },
          idempotencyKey: `custom-bulk-raw-${email}-${dateKey}`,
        });
        sent++;
      } catch (e: any) {
        errors.push({ email, reason: e?.message ?? String(e) });
      }
    }

    return { ok: true as const, sent, total, errors };
  });
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `cd /var/www/html/saint-jacques-uniforms && npx tsc --noEmit`
Expected: aucune erreur dans `email-templates-admin.functions.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email-templates-admin.functions.ts
git commit -m "feat: server functions pour templates email admin et envoi bulk"
```

---

### Task 4: Tab "Emails" dans l'admin — composer + aperçu + destinataires

**Files:**
- Modify: `src/routes/admin.tsx`

**Interfaces:**
- Consumes: `listCustomTemplates`, `saveCustomTemplate`, `sendCustomBulkEmail` (Task 3). Pattern de tableau checkboxes de `src/routes/apel.tsx:47,86-97` (`Set<string>`, `toggleAll`, `toggleOne`). Server function existante `apelListFamilies` (`@/lib/apel.functions`) pour la liste des familles — réutilisée telle quelle (retourne déjà `{ user_id, family_prenom, family_nom, family_email, ... }`).
- Produces: tab `"emails"` ajouté au type d'état `tab`, composant `EmailsPanel` rendu quand `tab === "emails"`.

- [ ] **Step 1: Étendre le type et l'état du tab**

Modifier la ligne d'état du tab (`src/routes/admin.tsx:113`) :

```tsx
const [tab, setTab] = useState<"orders" | "tracking" | "incidents" | "roles" | "emails">("orders");
```

- [ ] **Step 2: Ajouter le bouton de tab**

Après le bloc du bouton "Rôles" (`src/routes/admin.tsx:388-393`, juste avant le `<Link to="/apel">`), ajouter :

```tsx
          <button
            onClick={() => setTab("emails")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "emails" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Emails
          </button>
```

- [ ] **Step 3: Ajouter le rendu conditionnel du panel**

Après la ligne `{tab === "roles" && <RolesPanel />}` (`src/routes/admin.tsx:547`), ajouter :

```tsx
        {tab === "emails" && <EmailsPanel />}
```

- [ ] **Step 4: Ajouter les imports nécessaires**

En haut de `src/routes/admin.tsx`, à côté des imports existants de `@/lib/apel.functions` (si présents) ou en nouvelle ligne, ajouter :

```tsx
import { listCustomTemplates, saveCustomTemplate, sendCustomBulkEmail } from "@/lib/email-templates-admin.functions";
import { apelListFamilies } from "@/lib/apel.functions";
```

(Si `apelListFamilies` est déjà importé plus haut dans le fichier pour un autre usage, ne pas dupliquer l'import — vérifier avec `grep -n "apelListFamilies" src/routes/admin.tsx` avant d'ajouter.)

- [ ] **Step 5: Écrire le composant `EmailsPanel`**

Ajouter à la fin du fichier `src/routes/admin.tsx` (après la fonction `RolesPanel` et avant tout export final, en suivant le même niveau que les autres composants de panel) :

```tsx
type CustomTemplate = {
  id: string;
  name: string;
  header_title: string;
  body: string;
  button_label: string | null;
  button_url: string | null;
  signature_role: string;
  updated_at: string;
};

type FamilyRow = {
  user_id: string;
  family_prenom: string;
  family_nom: string;
  family_email: string;
};

function EmailsPanel() {
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [headerTitle, setHeaderTitle] = useState("");
  const [body, setBody] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [signatureRole, setSignatureRole] = useState("technique");
  const [saving, setSaving] = useState(false);

  const [recipientTab, setRecipientTab] = useState<"families" | "raw">("families");
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(true);
  const [familySearch, setFamilySearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rawEmailsText, setRawEmailsText] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; total: number; errors: Array<{ email: string; reason: string }> } | null>(null);

  const refreshTemplates = async () => {
    const r = await listCustomTemplates({ data: {} });
    if (r.ok) setTemplates(r.templates as CustomTemplate[]);
    else toast.error(r.error || "Erreur de chargement des templates");
  };

  useEffect(() => {
    refreshTemplates();
    (async () => {
      setFamiliesLoading(true);
      const r = await apelListFamilies({ data: {} });
      if (r.ok) setFamilies(r.families as FamilyRow[]);
      setFamiliesLoading(false);
    })();
  }, []);

  const loadTemplate = (id: string) => {
    const t = templates.find((tpl) => tpl.id === id);
    if (!t) return;
    setTemplateId(t.id);
    setName(t.name);
    setHeaderTitle(t.header_title);
    setBody(t.body);
    setButtonLabel(t.button_label ?? "");
    setButtonUrl(t.button_url ?? "");
    setSignatureRole(t.signature_role);
  };

  const handleSave = async () => {
    if (!name.trim() || !headerTitle.trim() || !body.trim()) {
      toast.error("Nom, titre et corps du message sont requis");
      return;
    }
    setSaving(true);
    const r = await saveCustomTemplate({
      data: {
        id: templateId,
        name: name.trim(),
        headerTitle: headerTitle.trim(),
        body,
        buttonLabel: buttonLabel.trim() || undefined,
        buttonUrl: buttonUrl.trim() || undefined,
        signatureRole: signatureRole.trim() || "technique",
      },
    });
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error || "Échec de la sauvegarde");
      return;
    }
    toast.success("Template enregistré");
    setTemplateId(r.id);
    refreshTemplates();
  };

  const filteredFamilies = useMemo(() => {
    const q = familySearch.trim().toLowerCase();
    if (!q) return families;
    return families.filter(
      (f) =>
        f.family_nom?.toLowerCase().includes(q) ||
        f.family_prenom?.toLowerCase().includes(q) ||
        f.family_email?.toLowerCase().includes(q),
    );
  }, [families, familySearch]);

  const toggleAll = () => {
    if (selected.size === filteredFamilies.length) setSelected(new Set());
    else setSelected(new Set(filteredFamilies.map((f) => f.user_id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const parsedRawEmails = useMemo(
    () =>
      Array.from(
        new Set(
          rawEmailsText
            .split(/[\n,]+/)
            .map((e) => e.trim())
            .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
        ),
      ),
    [rawEmailsText],
  );

  const recipientCount = selected.size + parsedRawEmails.length;

  const handleSend = async () => {
    if (!headerTitle.trim() || !body.trim()) {
      toast.error("Titre et corps du message sont requis");
      return;
    }
    if (recipientCount === 0) {
      toast.error("Sélectionnez au moins un destinataire");
      return;
    }
    if (!confirm(`Envoyer cet email à ${recipientCount} destinataire(s) ?`)) return;
    setSending(true);
    setLastResult(null);
    try {
      const r = await sendCustomBulkEmail({
        data: {
          profileIds: Array.from(selected),
          rawEmails: parsedRawEmails,
          headerTitle: headerTitle.trim(),
          body,
          buttonLabel: buttonLabel.trim() || undefined,
          buttonUrl: buttonUrl.trim() || undefined,
          signatureRole: signatureRole.trim() || "technique",
        },
      });
      if (!r.ok) {
        toast.error(r.error || "Échec de l'envoi");
      } else {
        toast.success(`${r.sent} email(s) envoyé(s) sur ${r.total}`);
        setLastResult({ sent: r.sent, total: r.total, errors: r.errors });
        setSelected(new Set());
        setRawEmailsText("");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setSending(false);
    }
  };

  const previewParagraphs = body.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  return (
    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Composer un email</h2>

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Charger un template existant</label>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={templateId ?? ""}
          onChange={(e) => (e.target.value ? loadTemplate(e.target.value) : setTemplateId(undefined))}
        >
          <option value="">— Nouveau template —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Nom du template</label>
        <input
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Relance inscription résolue"
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Titre du header</label>
        <input
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={headerTitle}
          onChange={(e) => setHeaderTitle(e.target.value)}
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Corps du message</label>
        <textarea
          className="mt-1 h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Séparez les paragraphes par une ligne vide"
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Texte du bouton</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Lien du bouton</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={buttonUrl}
              onChange={(e) => setButtonUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Signature</label>
        <input
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={signatureRole}
          onChange={(e) => setSignatureRole(e.target.value)}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer le template"}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Aperçu</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <div style={{ backgroundColor: "#0a2540", padding: "26px 32px" }}>
            <p style={{ fontSize: "22px", fontWeight: 600, color: "#ffffff", margin: 0 }}>{headerTitle || "Titre du header"}</p>
          </div>
          <div style={{ height: "3px", backgroundColor: "#c8102e" }} />
          <div style={{ padding: "24px", backgroundColor: "#ffffff" }}>
            <p style={{ fontSize: "15px", color: "#1a1a1a", margin: "0 0 14px" }}>Bonjour,</p>
            {previewParagraphs.length === 0 ? (
              <p style={{ fontSize: "15px", color: "#999999", margin: "0 0 14px" }}>Corps du message…</p>
            ) : (
              previewParagraphs.map((p, i) => (
                <p key={i} style={{ fontSize: "15px", color: "#1a1a1a", margin: "0 0 14px" }}>
                  {p}
                </p>
              ))
            )}
            {buttonLabel && buttonUrl ? (
              <span
                style={{
                  display: "inline-block",
                  background: "#0a2540",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                {buttonLabel}
              </span>
            ) : null}
          </div>
          <div style={{ backgroundColor: "#f5f5f5", padding: "16px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#666666", margin: 0, fontWeight: 600 }}>France Uniformes — Uniformes scolaires sur mesure</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
        <h2 className="text-base font-semibold text-foreground">Destinataires</h2>
        <div className="mt-3 inline-flex rounded-xl border border-border bg-muted p-1">
          <button
            onClick={() => setRecipientTab("families")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${recipientTab === "families" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Familles
          </button>
          <button
            onClick={() => setRecipientTab("raw")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${recipientTab === "raw" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Emails collés
          </button>
        </div>

        {recipientTab === "families" && (
          <div className="mt-4">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Rechercher une famille…"
              value={familySearch}
              onChange={(e) => setFamilySearch(e.target.value)}
            />
            {familiesLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Chargement…</p>
            ) : (
              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="w-8 p-2">
                        <input
                          type="checkbox"
                          checked={filteredFamilies.length > 0 && selected.size === filteredFamilies.length}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="p-2 text-left">Nom</th>
                      <th className="p-2 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFamilies.map((f) => (
                      <tr key={f.user_id} className="border-b border-border last:border-0">
                        <td className="p-2">
                          <input type="checkbox" checked={selected.has(f.user_id)} onChange={() => toggleOne(f.user_id)} />
                        </td>
                        <td className="p-2">
                          {f.family_prenom} {f.family_nom}
                        </td>
                        <td className="p-2 text-muted-foreground">{f.family_email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {recipientTab === "raw" && (
          <div className="mt-4">
            <textarea
              className="h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder={"une adresse par ligne, ou séparées par des virgules"}
              value={rawEmailsText}
              onChange={(e) => setRawEmailsText(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">{parsedRawEmails.length} adresse(s) valide(s) détectée(s)</p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{recipientCount} destinataire(s) sélectionné(s)</span>
          <button
            onClick={handleSend}
            disabled={sending || recipientCount === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {sending ? "Envoi…" : `Envoyer à ${recipientCount} destinataire(s)`}
          </button>
        </div>

        {lastResult && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <p>
              {lastResult.sent} envoyé(s) sur {lastResult.total}.
            </p>
            {lastResult.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs text-destructive">
                {lastResult.errors.map((e, i) => (
                  <li key={i}>
                    {e.email} — {e.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Vérifier le typecheck**

Run: `cd /var/www/html/saint-jacques-uniforms && npx tsc --noEmit`
Expected: aucune erreur dans `admin.tsx`.

- [ ] **Step 7: Vérification manuelle dans le navigateur**

Run: `cd /var/www/html/saint-jacques-uniforms && npm run dev` (ou la commande de dev existante du projet)
Aller sur `/admin` avec un compte admin, cliquer sur le tab "Emails".
Expected :
- Le tab s'affiche avec le formulaire à gauche et l'aperçu à droite qui se met à jour en direct.
- L'onglet "Familles" liste les familles avec checkboxes fonctionnelles (sélection individuelle + "tout sélectionner").
- L'onglet "Emails collés" détecte correctement le nombre d'adresses valides collées.
- Sauvegarder un template, le voir apparaître dans le sélecteur "Charger un template existant", le recharger et vérifier que les champs se repeuplent.
- Envoyer un email de test à une seule adresse collée (la vôtre) et vérifier sa réception avec le bon rendu (header bleu, bouton, footer).

- [ ] **Step 8: Commit**

```bash
git add src/routes/admin.tsx
git commit -m "feat: tab Emails dans l'admin pour composer et envoyer des emails bulk"
```

---

## Self-Review Notes

- **Couverture du spec** : modèle de données (Task 1), template générique (Task 2), backend CRUD + envoi (Task 3), UI composer/aperçu/destinataires/résultat (Task 4) — toutes les sections du spec sont couvertes par une tâche.
- **Cohérence des types** : `CustomTemplate` (Task 4) correspond exactement aux colonnes sélectionnées par `listCustomTemplates` (Task 3). Les champs passés à `sendCustomBulkEmail` (`profileIds`, `rawEmails`, `headerTitle`, `body`, `buttonLabel`, `buttonUrl`, `signatureRole`) correspondent à son `inputValidator`. Les props du template `custom-bulk.tsx` (`headerTitle`, `body`, `buttonLabel`, `buttonUrl`, `familyName`, `greeting`, `signatureRole`) correspondent exactement aux clés de `templateData` construites dans `sendCustomBulkEmail`.
- **Hors périmètre respecté** : pas d'éditeur WYSIWYG, pas de queue pgmq, pas de matching automatique email→profil, pas d'envoi différé — conforme au spec.
