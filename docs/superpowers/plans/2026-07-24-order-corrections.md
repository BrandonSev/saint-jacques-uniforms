# Gestion admin des demandes de correction de commande (taille) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à l'admin un onglet dédié pour créer, suivre et résoudre les demandes de correction de taille reçues par mail sur des commandes pas encore expédiées, sans toucher au système `order_incidents` (SAV post-livraison).

**Architecture:** Nouvelle table Supabase `order_corrections` (RLS admin-only), un nouveau composant `CorrectionsPanel` dans `src/routes/admin.tsx` (même pattern que `TrackingPanel`/`RolesPanel`/`EmailsPanel` déjà présents dans ce fichier), une action "Appliquer" qui met à jour `order_items.size` et déclenche un email de confirmation via un nouveau template `order-correction-resolution` enregistré dans le registry email existant.

**Tech Stack:** React + TanStack Router/Start, Supabase (Postgres + RLS), react-email (templates), Tailwind, vitest.

## Global Constraints

- Ne pas modifier `order_incidents`, ses policies, ni le flux SAV post-livraison existant.
- Toute nouvelle policy RLS suit le pattern `has_role(auth.uid(), 'admin'::app_role)` déjà utilisé dans les migrations existantes (voir `supabase/migrations/20260501001346_...sql` et `20260503165518_...sql`).
- Toute nouvelle table avec `updated_at` utilise le trigger existant `public.set_updated_at()` (voir `20260503165518_...sql`).
- Les nouveaux composants admin suivent le style Tailwind déjà en place dans `src/routes/admin.tsx` (classes `rounded-2xl border border-border bg-card`, tableau `text-sm` avec `thead bg-secondary`, badges `rounded-full px-2 py-0.5 text-[11px] font-medium`).
- Les nouveaux templates email suivent le pattern `EmailLayout` de `src/lib/email-templates/_layout.tsx` et sont enregistrés dans `src/lib/email-templates/registry.ts`.
- Toute nouvelle server function d'envoi d'email suit le pattern `createServerFn` + `withSupabaseAuth`/`requireSupabaseAuth` middleware déjà utilisé par `sendIncidentUpdate` dans `src/lib/email.functions.ts`.

---

## File Structure

- **Create:** `supabase/migrations/20260724120000_order_corrections.sql` — table, RLS, trigger, index.
- **Modify:** `src/integrations/supabase/types.ts` — ajout du type `order_corrections` (à la main, pas de CLI Supabase disponible dans cet environnement).
- **Create:** `src/lib/email-templates/order-correction-resolution.tsx` — template de confirmation famille.
- **Modify:** `src/lib/email-templates/registry.ts` — enregistrement du nouveau template.
- **Modify:** `src/server/email.server.ts` — nouvelle fonction `sendOrderCorrectionResolutionFamily`.
- **Modify:** `src/lib/email.functions.ts` — nouvelle server function `sendOrderCorrectionUpdate`.
- **Modify:** `src/routes/admin.tsx` — nouvel onglet "Corrections" (state, chargement des données, badge compteur, table, modal de création, composant `CorrectionsPanel`).

---

### Task 1: Migration SQL `order_corrections`

**Files:**
- Create: `supabase/migrations/20260724120000_order_corrections.sql`

**Interfaces:**
- Produces: table `public.order_corrections` avec colonnes `id uuid PK`, `order_id uuid`, `order_item_id uuid`, `field text default 'size'`, `old_value text`, `new_value text`, `status text default 'À traiter'`, `note text nullable`, `requester_email text`, `created_by uuid nullable`, `created_at timestamptz`, `resolved_at timestamptz nullable`. Policies admin-only (select/insert/update) via `has_role(auth.uid(), 'admin'::app_role)`.

- [ ] **Step 1: Écrire la migration**

```sql
CREATE TABLE public.order_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id),
  field TEXT NOT NULL DEFAULT 'size',
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'À traiter',
  note TEXT,
  requester_email TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.order_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all corrections"
  ON public.order_corrections FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert corrections"
  ON public.order_corrections FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update corrections"
  ON public.order_corrections FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update order items size"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX order_corrections_order_id_idx ON public.order_corrections(order_id);
CREATE INDEX order_corrections_status_idx ON public.order_corrections(status);
```

- [ ] **Step 2: Vérifier la syntaxe SQL localement**

Run: `grep -c "^CREATE" supabase/migrations/20260724120000_order_corrections.sql`
Expected: `7` (1 table + 4 policies + 2 index)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260724120000_order_corrections.sql
git commit -m "feat: table order_corrections pour les demandes de correction de taille"
```

---

### Task 2: Type Supabase `order_corrections`

**Files:**
- Modify: `src/integrations/supabase/types.ts:401` (juste avant l'entrée `order_incidents`, ordre alphabétique respecté par le générateur Supabase — `order_corrections` vient avant `order_incidents`)

**Interfaces:**
- Consumes: rien (types purs)
- Produces: `Database["public"]["Tables"]["order_corrections"]` avec `Row`, `Insert`, `Update` correspondant exactement aux colonnes de Task 1.

- [ ] **Step 1: Lire le bloc existant `order_incidents` pour caler le format**

Le bloc à insérer doit suivre exactement ce format (voir `src/integrations/supabase/types.ts:401-445` pour `order_incidents` comme référence de style).

- [ ] **Step 2: Insérer le nouveau bloc de type juste avant `order_incidents`**

Dans `src/integrations/supabase/types.ts`, remplacer :

```typescript
      order_incidents: {
```

par :

```typescript
      order_corrections: {
        Row: {
          created_at: string
          created_by: string | null
          field: string
          id: string
          new_value: string
          note: string | null
          old_value: string
          order_id: string
          order_item_id: string
          requester_email: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          field?: string
          id?: string
          new_value: string
          note?: string | null
          old_value: string
          order_id: string
          order_item_id: string
          requester_email: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          field?: string
          id?: string
          new_value?: string
          note?: string | null
          old_value?: string
          order_id?: string
          order_item_id?: string
          requester_email?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      order_incidents: {
```

(Cette édition insère le nouveau bloc et laisse `order_incidents: {` intact juste après.)

- [ ] **Step 3: Vérifier que le fichier reste un TypeScript valide**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "types.ts" || echo "OK: aucune erreur dans types.ts"`
Expected: `OK: aucune erreur dans types.ts`

- [ ] **Step 4: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "feat: type Supabase pour order_corrections"
```

---

### Task 3: Template email `order-correction-resolution`

**Files:**
- Create: `src/lib/email-templates/order-correction-resolution.tsx`
- Modify: `src/lib/email-templates/registry.ts`

**Interfaces:**
- Consumes: `EmailLayout`, `text`, `button` depuis `./_layout` (déjà utilisés par `incident-resolution.tsx`).
- Produces: `template` exporté (satisfait `TemplateEntry`), enregistré sous la clé `"order-correction-resolution"` dans `TEMPLATES`. Props du composant : `{ prenom?: string; familyName?: string; orderNumber?: string; productName?: string; oldSize?: string; newSize?: string; appUrl?: string }`.

- [ ] **Step 1: Créer le template**

```tsx
import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, text, button } from './_layout'
import type { TemplateEntry } from './registry'

const APP_URL = 'https://sjdc-dax.franceuniformes.fr'

interface Props {
  prenom?: string
  familyName?: string
  orderNumber?: string
  productName?: string
  oldSize?: string
  newSize?: string
  appUrl?: string
}

function OrderCorrectionResolutionEmail({
  prenom = '',
  familyName,
  orderNumber = '',
  productName = '',
  oldSize = '',
  newSize = '',
  appUrl = APP_URL,
}: Props) {
  return (
    <EmailLayout
      preview={`Taille corrigée — ${orderNumber}`}
      title="Correction de taille effectuée"
      familyName={familyName}
      signatureRole="Commandes"
    >
      <Text style={text}>Bonjour {prenom},</Text>
      <Text style={text}>
        Comme convenu, nous avons corrigé la taille de l'article <strong>{productName}</strong> sur votre
        commande <strong>{orderNumber}</strong> : {oldSize} → <strong>{newSize}</strong>.
      </Text>
      <Text style={text}>Aucune autre démarche n'est nécessaire de votre part.</Text>
      <Button href={`${appUrl}/commandes`} style={button}>Voir mes commandes</Button>
    </EmailLayout>
  )
}

export const template = {
  component: OrderCorrectionResolutionEmail,
  subject: (d: Record<string, any>) => `Correction de taille effectuée — ${d.orderNumber ?? ''}`,
  displayName: 'Correction de taille — confirmation famille',
  previewData: {
    prenom: 'Manon',
    familyName: 'Bauzet',
    orderNumber: 'CMD-20260504-C001-001',
    productName: 'Polo bleu',
    oldSize: '8 ans',
    newSize: '6 ans',
  },
} satisfies TemplateEntry
```

- [ ] **Step 2: Enregistrer le template dans le registry**

Dans `src/lib/email-templates/registry.ts`, ajouter l'import après celui de `incidentResolution` :

```typescript
import { template as orderCorrectionResolution } from './order-correction-resolution'
```

Et ajouter l'entrée après `'incident-resolution': incidentResolution,` :

```typescript
  'order-correction-resolution': orderCorrectionResolution,
```

- [ ] **Step 3: Vérifier que le registry compile et que le template est bien listé**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "registry.ts\|order-correction-resolution.tsx" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 4: Commit**

```bash
git add src/lib/email-templates/order-correction-resolution.tsx src/lib/email-templates/registry.ts
git commit -m "feat: template email de confirmation de correction de taille"
```

---

### Task 4: Server function d'envoi `sendOrderCorrectionUpdate`

**Files:**
- Modify: `src/server/email.server.ts`
- Modify: `src/lib/email.functions.ts`

**Interfaces:**
- Consumes: `enqueueTransactionalEmail` (déjà importé dans `email.server.ts`, voir `sendIncidentResolutionFamily`), `withSupabaseAuth`, `requireSupabaseAuth`, `supabase` context (pattern de `sendIncidentUpdate` dans `src/lib/email.functions.ts:291-327`).
- Produces: `sendOrderCorrectionResolutionFamily(to: string, prenom: string, orderNumber: string, productName: string, oldSize: string, newSize: string, familyName?: string): Promise<void>` exportée depuis `src/server/email.server.ts`. `sendOrderCorrectionUpdate` : `createServerFn` acceptant `{ correctionId: string }`, retourne `{ ok: true } | { ok: false, error: "not_found" | "no_recipient" | "send_failed" }`.

- [ ] **Step 1: Ajouter la fonction d'envoi dans `email.server.ts`**

Ajouter après `sendIncidentResolutionFamily` (ligne 76-83 de `src/server/email.server.ts`) :

```typescript
export async function sendOrderCorrectionResolutionFamily(
  to: string,
  prenom: string,
  orderNumber: string,
  productName: string,
  oldSize: string,
  newSize: string,
  familyName?: string,
) {
  await enqueueTransactionalEmail({
    templateName: "order-correction-resolution",
    recipientEmail: to,
    templateData: { prenom, familyName, orderNumber, productName, oldSize, newSize },
    idempotencyKey: `order-correction-${orderNumber}-${productName}-${newSize}`,
  });
}
```

- [ ] **Step 2: Importer la fonction dans `email.functions.ts`**

Dans `src/lib/email.functions.ts`, modifier le bloc d'import (lignes 11-21) pour ajouter `sendOrderCorrectionResolutionFamily` :

```typescript
import {
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendPasswordResetEmail,
  sendOrderStatusEmail,
  sendIncidentOpenedFamily,
  sendIncidentOpenedAdmin,
  sendIncidentResolutionFamily,
  sendOrderCorrectionResolutionFamily,
  type OrderEmailItem,
} from "@/server/email.server";
```

- [ ] **Step 3: Ajouter la server function `sendOrderCorrectionUpdate`**

Ajouter à la fin de `src/lib/email.functions.ts`, après `sendIncidentUpdate` (après la ligne 327) :

```typescript
// Notification de résolution d'une correction de commande (admin → famille)
export const sendOrderCorrectionUpdate = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ correctionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: corr } = await supabase
      .from("order_corrections")
      .select("order_id, order_item_id, old_value, new_value, requester_email")
      .eq("id", data.correctionId)
      .maybeSingle();
    if (!corr) return { ok: false, error: "not_found" as const };
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, family_prenom, family_nom")
      .eq("id", corr.order_id)
      .maybeSingle();
    const { data: item } = await supabase
      .from("order_items")
      .select("product_name")
      .eq("id", corr.order_item_id)
      .maybeSingle();
    if (!order || !corr.requester_email) return { ok: false, error: "no_recipient" as const };
    try {
      await sendOrderCorrectionResolutionFamily(
        corr.requester_email,
        order.family_prenom ?? "",
        order.order_number,
        item?.product_name ?? "—",
        corr.old_value,
        corr.new_value,
        order.family_nom ?? undefined,
      );
      return { ok: true };
    } catch (e) {
      console.error("sendOrderCorrectionUpdate:", e);
      return { ok: false, error: "send_failed" as const };
    }
  });
```

- [ ] **Step 4: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "email.server.ts\|email.functions.ts" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 5: Commit**

```bash
git add src/server/email.server.ts src/lib/email.functions.ts
git commit -m "feat: server function d'envoi de confirmation de correction de taille"
```

---

### Task 5: Onglet admin "Corrections" — état, chargement, badge

**Files:**
- Modify: `src/routes/admin.tsx`

**Interfaces:**
- Consumes: `sendOrderCorrectionUpdate` depuis `@/lib/email.functions` (Task 4), `supabase` client déjà importé.
- Produces: type `Correction` ; state `corrections`, `correctionsLoading`, `correctionModalOpen` ; `tab` étendu avec `"corrections"` ; fonctions `applyCorrection`, `cancelCorrection`, `createCorrection` disponibles pour Task 6.

- [ ] **Step 1: Étendre le type `tab` et ajouter le type `Correction`**

Dans `src/routes/admin.tsx`, modifier la ligne 114 :

```typescript
  const [tab, setTab] = useState<"orders" | "tracking" | "incidents" | "corrections" | "roles" | "emails">("orders");
```

Ajouter après le type `Incident` (après la ligne 72, avant `INCIDENT_TYPE_LABELS`) :

```typescript
type Correction = {
  id: string;
  order_id: string;
  order_item_id: string;
  field: string;
  old_value: string;
  new_value: string;
  status: string;
  note: string | null;
  requester_email: string;
  created_at: string;
  resolved_at: string | null;
  order_number?: string;
  family_prenom?: string;
  family_nom?: string;
  order_status?: string;
  product_name?: string;
  child_prenom?: string;
  child_nom?: string;
};

const CORRECTION_STATUSES = ["À traiter", "Résolu", "Annulé"] as const;
```

Importer `sendOrderCorrectionUpdate` en modifiant la ligne 10 :

```typescript
import { sendOrderStatusUpdate, sendIncidentUpdate, sendOrderCorrectionUpdate, sendTestRandomEmail } from "@/lib/email.functions";
```

- [ ] **Step 2: Ajouter le state et le chargement des données**

Après la ligne 118 (`const [photoPreview, setPhotoPreview] = useState<string | null>(null);`), ajouter :

```typescript
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [correctionsLoading, setCorrectionsLoading] = useState(true);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
```

Dans le `useEffect` principal (ligne 120), ajouter `setCorrectionsLoading(false);` dans la branche `!isAdmin` (à côté des deux autres `setLoading`/`setIncidentsLoading`) :

```typescript
    if (!isAdmin) {
      setLoading(false);
      setIncidentsLoading(false);
      setOrderRowsLoading(false);
      setCorrectionsLoading(false);
      return;
    }
```

Puis ajouter un nouveau bloc de chargement après le bloc `order_incidents` (après la ligne 205, juste avant la fermeture du `useEffect` à la ligne 240) :

```typescript
    (async () => {
      const { data, error } = await supabase
        .from("order_corrections")
        .select(
          `
          id, order_id, order_item_id, field, old_value, new_value, status, note, requester_email, created_at, resolved_at,
          orders!inner ( order_number, status, family_prenom, family_nom ),
          order_items!inner ( product_name, child_prenom, child_nom )
        `,
        )
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setCorrectionsLoading(false);
        return;
      }
      const flat: Correction[] = (data ?? []).map((r: any) => ({
        id: r.id,
        order_id: r.order_id,
        order_item_id: r.order_item_id,
        field: r.field,
        old_value: r.old_value,
        new_value: r.new_value,
        status: r.status,
        note: r.note,
        requester_email: r.requester_email,
        created_at: r.created_at,
        resolved_at: r.resolved_at,
        order_number: r.orders?.order_number,
        order_status: r.orders?.status,
        family_prenom: r.orders?.family_prenom,
        family_nom: r.orders?.family_nom,
        product_name: r.order_items?.product_name,
        child_prenom: r.order_items?.child_prenom,
        child_nom: r.order_items?.child_nom,
      }));
      setCorrections(flat);
      setCorrectionsLoading(false);
    })();
```

- [ ] **Step 3: Ajouter les fonctions `applyCorrection` et `cancelCorrection`**

Après la fonction `updateIncidentStatus` (après la ligne 252), ajouter :

```typescript
  const applyCorrection = async (correction: Correction) => {
    const { error: itemError } = await supabase
      .from("order_items")
      .update({ size: correction.new_value })
      .eq("id", correction.order_item_id);
    if (itemError) {
      toast.error(itemError.message);
      return;
    }
    const resolvedAt = new Date().toISOString();
    const { error } = await supabase
      .from("order_corrections")
      .update({ status: "Résolu", resolved_at: resolvedAt })
      .eq("id", correction.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCorrections((prev) =>
      prev.map((c) => (c.id === correction.id ? { ...c, status: "Résolu", resolved_at: resolvedAt } : c)),
    );
    sendOrderCorrectionUpdate({ data: { correctionId: correction.id } }).catch(() => {});
    toast.success("Taille corrigée et famille notifiée");
  };

  const cancelCorrection = async (correction: Correction) => {
    const resolvedAt = new Date().toISOString();
    const { error } = await supabase
      .from("order_corrections")
      .update({ status: "Annulé", resolved_at: resolvedAt })
      .eq("id", correction.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCorrections((prev) =>
      prev.map((c) => (c.id === correction.id ? { ...c, status: "Annulé", resolved_at: resolvedAt } : c)),
    );
    toast.success("Demande annulée");
  };
```

- [ ] **Step 4: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "admin.tsx" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin.tsx
git commit -m "feat: état et chargement des demandes de correction dans l'admin"
```

---

### Task 6: Onglet admin "Corrections" — bouton, badge, table, modal de création

**Files:**
- Modify: `src/routes/admin.tsx`

**Interfaces:**
- Consumes: `corrections`, `correctionsLoading`, `applyCorrection`, `cancelCorrection`, `correctionModalOpen`, `setCorrectionModalOpen`, `CORRECTION_STATUSES` (Task 5) ; `orderRows` (déjà chargé, pour la recherche de commande dans le formulaire de création) ; `items` n'existe pas dans `admin.tsx` — le formulaire de création charge lui-même les `order_items` de la commande sélectionnée via une requête Supabase directe.
- Produces: composant `CorrectionsPanel` (rendu conditionnel `tab === "corrections"`) et `CorrectionCreateModal`, tous deux définis en bas du fichier comme `TrackingPanel`/`RolesPanel`/`EmailsPanel`.

- [ ] **Step 1: Ajouter le calcul du badge de compteur**

Après la ligne 333 (`const incidentsEnAttente = ...`), ajouter :

```typescript
  const correctionsEnAttente = corrections.filter((c) => c.status === "À traiter").length;
```

- [ ] **Step 2: Ajouter le bouton d'onglet avec badge**

Après le bouton `Incidents` (après la ligne 388, avant le bouton `Rôles`), ajouter :

```typescript
          <button
            onClick={() => setTab("corrections")}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "corrections" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Corrections
            {correctionsEnAttente > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                {correctionsEnAttente}
              </span>
            )}
          </button>
```

- [ ] **Step 3: Ajouter le rendu de l'onglet "Corrections"**

Après le bloc `{tab === "incidents" && ( ... )}` (après la ligne 552, avant `{tab === "roles" && <RolesPanel />}`), ajouter :

```typescript
        {tab === "corrections" && (
          <div className="mt-4">
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setCorrectionModalOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Nouvelle demande
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Commande</th>
                      <th className="px-4 py-3">Famille</th>
                      <th className="px-4 py-3">Article</th>
                      <th className="px-4 py-3">Taille actuelle → demandée</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {correctionsLoading && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                          Chargement…
                        </td>
                      </tr>
                    )}
                    {!correctionsLoading && corrections.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                          Aucune demande de correction.
                        </td>
                      </tr>
                    )}
                    {corrections.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {c.order_number ?? "—"}
                          {(c.order_status === "Expédiée" || c.order_status === "Livrée") && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              Déjà {c.order_status.toLowerCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {c.family_prenom} {c.family_nom}
                        </td>
                        <td className="px-4 py-3">{c.product_name ?? "—"}</td>
                        <td className="px-4 py-3">
                          {c.old_value} → <strong>{c.new_value}</strong>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              c.status === "Résolu"
                                ? "bg-emerald-100 text-emerald-700"
                                : c.status === "Annulé"
                                  ? "bg-secondary text-muted-foreground"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {c.status === "À traiter" && (
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => applyCorrection(c)}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Appliquer
                              </button>
                              <button
                                onClick={() => cancelCorrection(c)}
                                className="text-xs font-semibold text-muted-foreground hover:underline"
                              >
                                Annuler
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
```

- [ ] **Step 4: Ajouter le modal de création en fin de fichier**

Après le composant `IncidentDetailsModal` (chercher où il se termine — juste avant `function RolesPanel()` à la ligne 584), ajouter :

```typescript
function CorrectionCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (correction: {
    id: string;
    order_id: string;
    order_item_id: string;
    field: string;
    old_value: string;
    new_value: string;
    status: string;
    note: string | null;
    requester_email: string;
    created_at: string;
    resolved_at: string | null;
  }) => void;
}) {
  const [orderNumber, setOrderNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<{ id: string; order_number: string; status: string } | null>(null);
  const [orderItems, setOrderItems] = useState<{ id: string; product_name: string; size: string }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [newSize, setNewSize] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const searchOrder = async () => {
    setSearching(true);
    setFoundOrder(null);
    setOrderItems([]);
    setSelectedItemId("");
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, status")
      .eq("order_number", orderNumber.trim())
      .maybeSingle();
    setSearching(false);
    if (error || !order) {
      toast.error("Commande introuvable");
      return;
    }
    setFoundOrder(order);
    const { data: itemsData } = await supabase
      .from("order_items")
      .select("id, product_name, size")
      .eq("order_id", order.id);
    setOrderItems((itemsData ?? []) as { id: string; product_name: string; size: string }[]);
  };

  const selectedItem = orderItems.find((i) => i.id === selectedItemId);

  const submit = async () => {
    if (!foundOrder || !selectedItem || !newSize.trim() || !requesterEmail.trim()) {
      toast.error("Merci de remplir tous les champs requis.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("order_corrections")
      .insert({
        order_id: foundOrder.id,
        order_item_id: selectedItem.id,
        old_value: selectedItem.size,
        new_value: newSize.trim(),
        requester_email: requesterEmail.trim(),
        note: note.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error(error?.message ?? "Erreur lors de la création");
      return;
    }
    toast.success("Demande créée");
    onCreated(data as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Nouvelle demande de correction</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground">N° de commande</label>
            <div className="mt-1 flex gap-2">
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
                placeholder="CMD-20260504-C001-001"
              />
              <button
                onClick={searchOrder}
                disabled={searching || !orderNumber.trim()}
                className="h-10 rounded-lg bg-secondary px-3 text-sm font-medium disabled:opacity-50"
              >
                Rechercher
              </button>
            </div>
            {foundOrder && (foundOrder.status === "Expédiée" || foundOrder.status === "Livrée") && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Cette commande est déjà {foundOrder.status.toLowerCase()} —
                une correction directe n'est pas appropriée, orientez la famille vers un retour/échange.
              </p>
            )}
          </div>

          {foundOrder && orderItems.length > 0 && (
            <div>
              <label className="text-xs font-medium text-foreground">Article concerné</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">— Choisir —</option>
                {orderItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.product_name} (taille actuelle : {i.size})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedItem && (
            <div>
              <label className="text-xs font-medium text-foreground">Nouvelle taille</label>
              <input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                placeholder="6 ans"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground">Email de la famille</label>
            <input
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              placeholder="manon.bauzet@gmail.com"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Note (optionnel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              rows={2}
              placeholder="Contexte du mail reçu"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="h-10 rounded-lg px-4 text-sm font-medium text-muted-foreground">
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Créer la demande
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Brancher le modal dans le rendu principal**

Après le bloc `{openIncident && ( <IncidentDetailsModal ... /> )}` (chercher sa fermeture, avant la fermeture du composant `AdminPage`), ajouter :

```typescript
      {correctionModalOpen && (
        <CorrectionCreateModal
          onClose={() => setCorrectionModalOpen(false)}
          onCreated={(c) =>
            setCorrections((prev) => [
              {
                id: c.id,
                order_id: c.order_id,
                order_item_id: c.order_item_id,
                field: c.field,
                old_value: c.old_value,
                new_value: c.new_value,
                status: c.status,
                note: c.note,
                requester_email: c.requester_email,
                created_at: c.created_at,
                resolved_at: c.resolved_at,
              },
              ...prev,
            ])
          }
        />
      )}
```

- [ ] **Step 6: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "admin.tsx" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 7: Lancer les tests existants pour vérifier l'absence de régression**

Run: `npm run test`
Expected: tous les tests passent (les 2 suites existantes `deliveryOptions.test.ts` et `featureFlags.test.ts` ne touchent pas ce code, doivent rester au vert).

- [ ] **Step 8: Commit**

```bash
git add src/routes/admin.tsx
git commit -m "feat: onglet Corrections dans l'admin (création, application, annulation)"
```

---

### Task 7: Vérification manuelle end-to-end

**Files:** aucun (vérification, pas de code)

**Interfaces:** aucune

- [ ] **Step 1: Lancer le serveur de dev**

Run: `npm run dev`
Expected: serveur démarré sans erreur, accessible en local.

- [ ] **Step 2: Se connecter en tant qu'admin et ouvrir l'onglet "Corrections"**

Vérifier : le bouton d'onglet apparaît entre "Incidents" et "Rôles", sans badge si aucune demande "À traiter".

- [ ] **Step 3: Créer une demande de test**

Cliquer "Nouvelle demande" → rechercher une commande existante non expédiée → choisir un article → saisir une nouvelle taille et un email → "Créer la demande". Vérifier que la ligne apparaît dans le tableau avec le statut "À traiter" et que le badge de l'onglet affiche "1".

- [ ] **Step 4: Appliquer la correction**

Cliquer "Appliquer" sur la ligne créée. Vérifier : le statut passe à "Résolu", le badge disparaît, et dans Supabase la colonne `order_items.size` de l'article concerné a bien la nouvelle valeur.

- [ ] **Step 5: Vérifier l'email envoyé**

Consulter les logs d'envoi email (ou l'onglet "Emails" de l'admin s'il permet de voir l'historique) pour confirmer qu'un email `order-correction-resolution` a été mis en file pour l'adresse saisie.

- [ ] **Step 6: Tester l'annulation**

Créer une seconde demande de test, cliquer "Annuler". Vérifier : statut "Annulé", pas d'email envoyé, `order_items.size` inchangé.

- [ ] **Step 7: Tester le garde-fou visuel**

Créer une demande sur une commande dont le statut est "Expédiée" ou "Livrée" (ou en modifier une temporairement pour le test). Vérifier que l'avertissement ambre s'affiche dans le modal de création et dans le tableau, sans bloquer la création.

---

## Self-Review

**Couverture de la spec :**
- Table `order_corrections` avec toutes les colonnes spécifiées → Task 1, 2.
- Onglet admin "Corrections" avec badge, création, application (met à jour `order_items.size`), annulation → Task 5, 6.
- Garde-fou non bloquant sur commande expédiée/livrée → Task 6 (modal + tableau).
- Email de confirmation après application → Task 3, 4, branché dans Task 6 (`applyCorrection`).
- Pas d'email lors de l'annulation → Task 5 (`cancelCorrection` ne l'appelle pas).
- `order_incidents` non touché → aucune tâche ne le modifie.

**Scan placeholders :** aucun "TBD"/"TODO" — toutes les étapes ont du code complet.

**Cohérence des types :** `Correction` (Task 5) utilisé de façon identique dans Task 6 (tableau, modal `onCreated`). `sendOrderCorrectionUpdate({ data: { correctionId } })` (Task 5) correspond exactement à la signature définie en Task 4 (`z.object({ correctionId: z.string().uuid() })`). `sendOrderCorrectionResolutionFamily` a la même signature dans sa définition (Task 4, Step 1) et son appel (Task 4, Step 3).
