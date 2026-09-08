# Annulations & remboursements de commande — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'admin d'annuler une commande et de rembourser (total ou
partiel, via l'API PayPlug) directement depuis le panneau "Suivi & expédition",
avec traçabilité complète et emails automatiques à la famille + notification
interne.

**Architecture:** Nouvelle table `order_refunds` (historique des
remboursements) + nouveau statut `"Remboursée"` sur `orders`. Une fonction
`refundPayplugPayment` dans `payplug.server.ts` appelle l'API REST PayPlug de
remboursement. Une nouvelle server function `refundOrder` orchestre : calcul du
montant, appel PayPlug, écriture `order_refunds`, mise à jour éventuelle de
`orders.status`. L'annulation réutilise le flux existant (`updateOrder` +
statut `"Annulée"`) en ajoutant un template d'email dédié. Trois nouveaux
templates React Email + server functions d'envoi suivent le pattern
`sendOrderCorrectionUpdate` déjà en place.

**Tech Stack:** TanStack Start (`createServerFn`), Supabase (Postgres + RLS),
React Email (`@react-email/components`), PayPlug REST API, Zod, Vitest.

## Global Constraints

- RLS : toute nouvelle table est réservée aux admins, pattern
  `has_role(auth.uid(), 'admin'::app_role)` identique à `order_corrections`.
- Toute server function admin est protégée par
  `.middleware([withSupabaseAuth, requireSupabaseAuth])` + vérification de rôle
  (`userHasAnyRole(userId, ["admin"])` ou équivalent).
- Les montants PayPlug sont des entiers en centimes ; `orders`/`order_items`
  stockent des `numeric(10,2)` en euros décimaux — toute conversion doit être
  explicite et testée.
- Les envois d'email sont toujours fire-and-forget côté UI
  (`.catch(() => {})`), jamais bloquants sur la mutation principale.
- Pas de restock automatique à l'annulation (hors périmètre, confirmé dans la
  spec).
- Annulation et remboursement sont des actions indépendantes — aucune ne
  déclenche automatiquement l'autre.
- Suivre le style existant du fichier `src/routes/admin.tsx` (Tailwind
  utilitaire inline, pas de composant `Tabs` externe, `toast` de `sonner` pour
  les retours utilisateur).
- Référence de spec : `docs/superpowers/specs/2026-07-27-order-cancellation-refund-design.md`.

---

## File Structure

- **Create** `supabase/migrations/20260727140000_order_refunds.sql` — table
  `order_refunds` + RLS + index.
- **Modify** `src/server/payplug.server.ts` — ajoute `refundPayplugPayment`.
- **Create** `src/lib/order-refunds.functions.ts` — server function
  `refundOrder` (calcul, appel PayPlug, écriture DB) + `listOrderRefunds`
  (lecture historique par commande).
- **Modify** `src/lib/email.functions.ts` — ajoute `sendOrderCancellation` et
  `sendOrderRefund`.
- **Modify** `src/server/email.server.ts` — ajoute les helpers
  `sendOrderCancellationEmail`, `sendOrderRefundEmail`,
  `sendAdminOrderActionNotification`.
- **Create** `src/lib/email-templates/order-cancellation.tsx` — template
  famille annulation.
- **Create** `src/lib/email-templates/order-refund.tsx` — template famille
  remboursement.
- **Create** `src/lib/email-templates/admin-order-action.tsx` — template
  notification interne.
- **Modify** `src/lib/email-templates/registry.ts` — enregistre les 3
  nouveaux templates.
- **Modify** `src/routes/admin.tsx` — `TrackingPanel` : bouton "Annuler la
  commande" + bloc "Remboursement" (sélection d'articles, historique). Étend
  la query `orderRows` pour charger `payplug_payment_id`, `total_amount` (déjà
  chargé) et les `order_items` par commande.

---

## Task 1 : Migration `order_refunds`

**Files:**
- Create: `supabase/migrations/20260727140000_order_refunds.sql`

**Interfaces:**
- Produces: table `public.order_refunds(id, order_id, order_item_ids, amount,
  reason, payplug_refund_id, status, error_message, created_by, created_at)`,
  policies RLS admin-only (SELECT/INSERT/UPDATE), index sur `order_id`.

- [ ] **Step 1: Écrire la migration**

```sql
CREATE TABLE public.order_refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  order_item_ids UUID[] NOT NULL DEFAULT '{}',
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT,
  payplug_refund_id TEXT,
  status TEXT NOT NULL DEFAULT 'Réussi',
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all refunds"
  ON public.order_refunds FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert refunds"
  ON public.order_refunds FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update refunds"
  ON public.order_refunds FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX order_refunds_order_id_idx ON public.order_refunds(order_id);
CREATE INDEX order_refunds_status_idx ON public.order_refunds(status);
```

- [ ] **Step 2: Vérifier la syntaxe SQL localement**

Run: `supabase db lint --schema public 2>/dev/null || psql --version`

Si `supabase` CLI n'est pas configuré en local, ouvrir le fichier et vérifier
visuellement la cohérence avec `20260724120000_order_corrections.sql` (même
structure de policies).

- [ ] **Step 3: Appliquer la migration à la base locale/staging si disponible**

Run: `supabase db push` (ou méthode de déploiement habituelle du projet — si
non disponible en local, cette étape est validée manuellement par l'admin lors
du déploiement).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260727140000_order_refunds.sql
git commit -m "feat: ajoute la table order_refunds pour l'historique des remboursements"
```

---

## Task 2 : Ajout du statut "Remboursée"

**Files:**
- Modify: `src/routes/admin.tsx:114`

**Interfaces:**
- Produces: `ORDER_STATUSES` inclut désormais `"Remboursée"`.

- [ ] **Step 1: Modifier la constante**

```ts
const ORDER_STATUSES = ["En attente", "Paiement validé", "En préparation", "Expédiée", "Livrée", "Annulée", "Remboursée"] as const;
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur liée à `ORDER_STATUSES`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/admin.tsx
git commit -m "feat: ajoute le statut Remboursée aux statuts de commande"
```

---

## Task 3 : `refundPayplugPayment` dans `payplug.server.ts`

**Files:**
- Modify: `src/server/payplug.server.ts`

**Interfaces:**
- Consumes: `authHeader()` (fonction privée déjà présente dans ce fichier),
  `API_BASE = "https://api.payplug.com/v1"`.
- Produces:
  ```ts
  export type PayplugRefund = {
    id: string;
    is_refunded: boolean;
    amount: number;
    payment_id: string;
    metadata?: Record<string, string>;
  };
  export async function refundPayplugPayment(paymentId: string, amountCents?: number): Promise<PayplugRefund>
  ```
  Lève une `Error` avec le message PayPlug en cas d'échec HTTP (même
  convention que `createPayplugPayment`/`fetchPayplugPayment`).

- [ ] **Step 1: Ajouter le type et la fonction**

Ajouter à la fin de `src/server/payplug.server.ts` :

```ts
export type PayplugRefund = {
  id: string;
  is_refunded: boolean;
  amount: number;
  payment_id: string;
  metadata?: Record<string, string>;
};

export async function refundPayplugPayment(paymentId: string, amountCents?: number): Promise<PayplugRefund> {
  const body = amountCents != null ? { amount: amountCents } : {};
  const res = await fetch(`${API_BASE}/payments/${paymentId}/refunds`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader(), "PayPlug-Version": "2019-08-06" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error("PayPlug refund failed:", res.status, json);
    throw new Error(json?.message || `PayPlug ${res.status}`);
  }
  return json as PayplugRefund;
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune erreur dans `payplug.server.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/server/payplug.server.ts
git commit -m "feat: ajoute refundPayplugPayment pour les remboursements PayPlug"
```

---

## Task 4 : Server functions `order-refunds.functions.ts`

**Files:**
- Create: `src/lib/order-refunds.functions.ts`

**Interfaces:**
- Consumes: `refundPayplugPayment` (Task 3), `supabaseAdmin` (client
  `@/integrations/supabase/client.server`), `requireSupabaseAuth` +
  `withSupabaseAuth` (pattern identique à `apel.functions.ts`).
- Produces:
  ```ts
  export const refundOrder = createServerFn({ method: "POST" })
    // input: { orderId: string, orderItemIds: string[], reason?: string }
    // output: { ok: true, refundId: string, amount: number }
    //       | { ok: false, error: "forbidden" | "order_not_found" | "no_payment"
    //           | "already_refunded" | "no_items" | string }
  export const listOrderRefunds = createServerFn({ method: "POST" })
    // input: { orderId: string }
    // output: { ok: true, refunds: OrderRefundRow[] } | { ok: false, error: string }
  ```
  `OrderRefundRow` = `{ id, order_id, order_item_ids, amount, reason, status,
  error_message, created_at }`.

Cette fonction est le cœur métier : elle recharge la commande et ses items
côté serveur (ne fait jamais confiance aux montants envoyés par le client),
calcule le montant à partir de `order_items.line_total`, vérifie qu'aucun item
sélectionné n'a déjà été intégralement remboursé, appelle PayPlug, écrit le
résultat (succès ou échec) dans `order_refunds`, et met à jour
`orders.status` à `"Remboursée"` si le cumul atteint `total_amount`.

- [ ] **Step 1: Écrire le fichier complet**

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { refundPayplugPayment } from "@/server/payplug.server";

type AppRole = "admin" | "apel" | "user";
async function userHasAnyRole(userId: string, roles: AppRole[]) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", roles);
  return (data ?? []).length > 0;
}

export type OrderRefundRow = {
  id: string;
  order_id: string;
  order_item_ids: string[];
  amount: number;
  reason: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

export const listOrderRefunds = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, refunds: [] };
    }
    const { data: refunds, error } = await supabaseAdmin
      .from("order_refunds")
      .select("id, order_id, order_item_ids, amount, reason, status, error_message, created_at")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false });
    if (error) return { ok: false as const, error: error.message, refunds: [] };
    return { ok: true as const, refunds: (refunds ?? []) as OrderRefundRow[] };
  });

export const refundOrder = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        orderId: z.string().uuid(),
        orderItemIds: z.array(z.string().uuid()).min(1),
        reason: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, payplug_payment_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderError || !order) return { ok: false as const, error: "order_not_found" as const };
    if (!order.payplug_payment_id) return { ok: false as const, error: "no_payment" as const };

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("id, line_total")
      .eq("order_id", data.orderId)
      .in("id", data.orderItemIds);
    if (itemsError || !items || items.length === 0) return { ok: false as const, error: "no_items" as const };

    const { data: previousRefunds } = await supabaseAdmin
      .from("order_refunds")
      .select("order_item_ids, amount, status")
      .eq("order_id", data.orderId)
      .eq("status", "Réussi");

    // Un item déjà couvert par un remboursement réussi antérieur ne peut pas être re-sélectionné.
    const alreadyRefundedItemIds = new Set(
      (previousRefunds ?? []).flatMap((r: any) => r.order_item_ids as string[]),
    );
    const duplicate = data.orderItemIds.find((id) => alreadyRefundedItemIds.has(id));
    if (duplicate) return { ok: false as const, error: "already_refunded" as const };

    const amount = items.reduce((sum: number, item: any) => sum + Number(item.line_total), 0);
    const amountCents = Math.round(amount * 100);

    let payplugResult: { refundId: string | null; status: "Réussi" | "Échoué"; errorMessage: string | null };
    try {
      const refund = await refundPayplugPayment(order.payplug_payment_id, amountCents);
      payplugResult = { refundId: refund.id, status: "Réussi", errorMessage: null };
    } catch (e: any) {
      payplugResult = { refundId: null, status: "Échoué", errorMessage: e?.message ?? String(e) };
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("order_refunds")
      .insert({
        order_id: data.orderId,
        order_item_ids: data.orderItemIds,
        amount,
        reason: data.reason ?? null,
        payplug_refund_id: payplugResult.refundId,
        status: payplugResult.status,
        error_message: payplugResult.errorMessage,
        created_by: userId,
      })
      .select("id")
      .single();
    if (insertError) return { ok: false as const, error: insertError.message };

    if (payplugResult.status === "Échoué") {
      return { ok: false as const, error: payplugResult.errorMessage ?? "refund_failed" };
    }

    const { data: successfulRefunds } = await supabaseAdmin
      .from("order_refunds")
      .select("amount")
      .eq("order_id", data.orderId)
      .eq("status", "Réussi");
    const totalRefunded = (successfulRefunds ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
    if (totalRefunded >= Number(order.total_amount)) {
      await supabaseAdmin.from("orders").update({ status: "Remboursée" }).eq("id", data.orderId);
    }

    return { ok: true as const, refundId: inserted.id as string, amount };
  });
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune erreur dans `order-refunds.functions.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/order-refunds.functions.ts
git commit -m "feat: ajoute refundOrder et listOrderRefunds (server functions)"
```

---

## Task 5 : Templates email (famille annulation, famille remboursement, admin)

**Files:**
- Create: `src/lib/email-templates/order-cancellation.tsx`
- Create: `src/lib/email-templates/order-refund.tsx`
- Create: `src/lib/email-templates/admin-order-action.tsx`
- Modify: `src/lib/email-templates/registry.ts`

**Interfaces:**
- Consumes: `EmailLayout`, `text`, `button` de `./_layout` (pattern
  `order-correction-resolution.tsx`), `TemplateEntry` de `./registry`.
- Produces: exports `template` (type `TemplateEntry`) dans chacun des 3
  fichiers ; entrées `'order-cancellation'`, `'order-refund'`,
  `'admin-order-action'` dans `TEMPLATES`.

- [ ] **Step 1: Créer `order-cancellation.tsx`**

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
  reason?: string
  appUrl?: string
}

function OrderCancellationEmail({
  prenom = '',
  familyName,
  orderNumber = '',
  reason,
  appUrl = APP_URL,
}: Props) {
  return (
    <EmailLayout
      preview={`Commande annulée — ${orderNumber}`}
      title="Commande annulée"
      familyName={familyName}
      signatureRole="Commandes"
    >
      <Text style={text}>Bonjour {prenom},</Text>
      <Text style={text}>
        Votre commande <strong>{orderNumber}</strong> a été annulée.
        {reason ? ` Motif : ${reason}` : ''}
      </Text>
      <Text style={text}>
        Si vous avez des questions concernant cette annulation, n'hésitez pas à nous contacter.
      </Text>
      <Button href={`${appUrl}/commandes`} style={button}>Voir mes commandes</Button>
    </EmailLayout>
  )
}

export const template = {
  component: OrderCancellationEmail,
  subject: (d: Record<string, any>) => `Commande annulée — ${d.orderNumber ?? ''}`,
  displayName: 'Commande annulée — confirmation famille',
  previewData: {
    prenom: 'Manon',
    familyName: 'Bauzet',
    orderNumber: 'CMD-20260504-C001-001',
    reason: 'Demande de la famille',
  },
} satisfies TemplateEntry
```

- [ ] **Step 2: Créer `order-refund.tsx`**

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
  amount?: number
  itemNames?: string[]
  appUrl?: string
}

function OrderRefundEmail({
  prenom = '',
  familyName,
  orderNumber = '',
  amount = 0,
  itemNames = [],
  appUrl = APP_URL,
}: Props) {
  return (
    <EmailLayout
      preview={`Remboursement effectué — ${orderNumber}`}
      title="Remboursement effectué"
      familyName={familyName}
      signatureRole="Commandes"
    >
      <Text style={text}>Bonjour {prenom},</Text>
      <Text style={text}>
        Un remboursement de <strong>{amount.toFixed(2)} €</strong> a été effectué sur votre commande{' '}
        <strong>{orderNumber}</strong>{itemNames.length > 0 ? ` pour : ${itemNames.join(', ')}` : ''}.
      </Text>
      <Text style={text}>
        Ce montant sera recrédité sur votre moyen de paiement d'origine sous quelques jours.
      </Text>
      <Button href={`${appUrl}/commandes`} style={button}>Voir mes commandes</Button>
    </EmailLayout>
  )
}

export const template = {
  component: OrderRefundEmail,
  subject: (d: Record<string, any>) => `Remboursement effectué — ${d.orderNumber ?? ''}`,
  displayName: 'Remboursement — confirmation famille',
  previewData: {
    prenom: 'Manon',
    familyName: 'Bauzet',
    orderNumber: 'CMD-20260504-C001-001',
    amount: 35,
    itemNames: ['Blouse officielle — 8 ans'],
  },
} satisfies TemplateEntry
```

- [ ] **Step 3: Créer `admin-order-action.tsx`**

```tsx
import * as React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, text } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  orderNumber?: string
  familyName?: string
  action?: 'Annulation' | 'Remboursement'
  amount?: number
  reason?: string
  actorEmail?: string
}

function AdminOrderActionEmail({
  orderNumber = '',
  familyName = '',
  action = 'Annulation',
  amount,
  reason,
  actorEmail = '',
}: Props) {
  return (
    <EmailLayout
      preview={`${action} — commande ${orderNumber}`}
      title={`${action} de commande`}
      signatureRole="Commandes"
    >
      <Text style={text}>
        {action} effectuée sur la commande <strong>{orderNumber}</strong> ({familyName}).
      </Text>
      {amount != null && <Text style={text}>Montant : <strong>{amount.toFixed(2)} €</strong></Text>}
      {reason && <Text style={text}>Motif : {reason}</Text>}
      <Text style={text}>Effectuée par : {actorEmail}</Text>
    </EmailLayout>
  )
}

export const template = {
  component: AdminOrderActionEmail,
  subject: (d: Record<string, any>) => `${d.action ?? 'Action'} — commande ${d.orderNumber ?? ''}`,
  displayName: 'Notification interne — action sur commande',
  previewData: {
    orderNumber: 'CMD-20260504-C001-001',
    familyName: 'Bauzet',
    action: 'Remboursement',
    amount: 35,
    reason: 'Erreur de taille',
    actorEmail: 'admin@franceuniformes.fr',
  },
} satisfies TemplateEntry
```

- [ ] **Step 4: Enregistrer les 3 templates dans `registry.ts`**

Ajouter les imports après la ligne 19 (`orderCorrectionResolution`) :

```ts
import { template as orderCancellation } from './order-cancellation'
import { template as orderRefund } from './order-refund'
import { template as adminOrderAction } from './admin-order-action'
```

Ajouter les entrées dans `TEMPLATES` après `'order-correction-resolution'` :

```ts
  'order-cancellation': orderCancellation,
  'order-refund': orderRefund,
  'admin-order-action': adminOrderAction,
```

- [ ] **Step 5: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune erreur dans les 4 fichiers modifiés/créés.

- [ ] **Step 6: Commit**

```bash
git add src/lib/email-templates/order-cancellation.tsx src/lib/email-templates/order-refund.tsx src/lib/email-templates/admin-order-action.tsx src/lib/email-templates/registry.ts
git commit -m "feat: ajoute les templates email annulation/remboursement/notification admin"
```

---

## Task 6 : Helpers d'envoi + server functions email

**Files:**
- Modify: `src/server/email.server.ts`
- Modify: `src/lib/email.functions.ts`

**Interfaces:**
- Consumes: `enqueueTransactionalEmail` (`@/lib/email/send.server`), templates
  Task 5.
- Produces (dans `email.server.ts`) :
  ```ts
  export async function sendOrderCancellationEmail(to: string, prenom: string, orderNumber: string, reason: string | null, familyName?: string): Promise<void>
  export async function sendOrderRefundEmail(to: string, prenom: string, orderNumber: string, amount: number, itemNames: string[], familyName?: string): Promise<void>
  export async function sendAdminOrderActionNotification(to: string, orderNumber: string, familyName: string, action: 'Annulation' | 'Remboursement', amount: number | null, reason: string | null, actorEmail: string): Promise<void>
  ```
- Produces (dans `email.functions.ts`) :
  ```ts
  export const sendOrderCancellation = createServerFn({ method: "POST" })
    // input: { orderId: string, reason?: string }
    // output: { ok: true } | { ok: false, error: string }
  export const sendOrderRefund = createServerFn({ method: "POST" })
    // input: { refundId: string }
    // output: { ok: true } | { ok: false, error: string }
  ```

- [ ] **Step 1: Ajouter les 3 helpers dans `email.server.ts`**

Ajouter à la fin du fichier :

```ts
export async function sendOrderCancellationEmail(
  to: string,
  prenom: string,
  orderNumber: string,
  reason: string | null,
  familyName?: string,
) {
  await enqueueTransactionalEmail({
    templateName: "order-cancellation",
    recipientEmail: to,
    templateData: { prenom, familyName, orderNumber, reason: reason ?? undefined },
    idempotencyKey: `order-cancel-${orderNumber}`,
  });
}

export async function sendOrderRefundEmail(
  to: string,
  prenom: string,
  orderNumber: string,
  amount: number,
  itemNames: string[],
  familyName?: string,
) {
  await enqueueTransactionalEmail({
    templateName: "order-refund",
    recipientEmail: to,
    templateData: { prenom, familyName, orderNumber, amount, itemNames },
    idempotencyKey: `order-refund-${orderNumber}-${amount}-${Date.now()}`,
  });
}

export async function sendAdminOrderActionNotification(
  to: string,
  orderNumber: string,
  familyName: string,
  action: "Annulation" | "Remboursement",
  amount: number | null,
  reason: string | null,
  actorEmail: string,
) {
  await enqueueTransactionalEmail({
    templateName: "admin-order-action",
    recipientEmail: to,
    templateData: { orderNumber, familyName, action, amount: amount ?? undefined, reason: reason ?? undefined, actorEmail },
    idempotencyKey: `admin-action-${orderNumber}-${action}-${Date.now()}`,
  });
}
```

- [ ] **Step 2: Ajouter l'import dans `email.functions.ts`**

Modifier le bloc d'import existant (ligne 11-22) pour ajouter les 3 nouveaux
helpers :

```ts
  sendOrderCorrectionResolutionFamily,
  sendOrderCancellationEmail,
  sendOrderRefundEmail,
  sendAdminOrderActionNotification,
  type OrderEmailItem,
```

- [ ] **Step 3: Ajouter `sendOrderCancellation` dans `email.functions.ts`**

Ajouter après `sendOrderCorrectionUpdate` (fin de fichier) :

```ts
// Notification d'annulation de commande (admin → famille + admin)
export const sendOrderCancellation = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, family_email, family_prenom, family_nom")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || !order.family_email) return { ok: false, error: "no_recipient" as const };
    try {
      await sendOrderCancellationEmail(
        order.family_email,
        order.family_prenom ?? "",
        order.order_number,
        data.reason ?? null,
        order.family_nom ?? undefined,
      );
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
      if (adminEmail) {
        await sendAdminOrderActionNotification(
          adminEmail,
          order.order_number,
          `${order.family_prenom ?? ""} ${order.family_nom ?? ""}`.trim(),
          "Annulation",
          null,
          data.reason ?? null,
          (context.claims as any)?.email ?? "admin",
        );
      }
      return { ok: true };
    } catch (e) {
      console.error("sendOrderCancellation:", e);
      return { ok: false, error: "send_failed" as const };
    }
  });

// Notification de remboursement de commande (admin → famille + admin)
export const sendOrderRefund = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ refundId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: refund } = await supabase
      .from("order_refunds")
      .select("order_id, amount, reason, order_item_ids")
      .eq("id", data.refundId)
      .maybeSingle();
    if (!refund) return { ok: false, error: "not_found" as const };
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, family_email, family_prenom, family_nom")
      .eq("id", refund.order_id)
      .maybeSingle();
    if (!order || !order.family_email) return { ok: false, error: "no_recipient" as const };
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name")
      .in("id", refund.order_item_ids as string[]);
    const itemNames = (items ?? []).map((i: any) => i.product_name);
    try {
      await sendOrderRefundEmail(
        order.family_email,
        order.family_prenom ?? "",
        order.order_number,
        Number(refund.amount),
        itemNames,
        order.family_nom ?? undefined,
      );
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
      if (adminEmail) {
        await sendAdminOrderActionNotification(
          adminEmail,
          order.order_number,
          `${order.family_prenom ?? ""} ${order.family_nom ?? ""}`.trim(),
          "Remboursement",
          Number(refund.amount),
          refund.reason,
          (context.claims as any)?.email ?? "admin",
        );
      }
      return { ok: true };
    } catch (e) {
      console.error("sendOrderRefund:", e);
      return { ok: false, error: "send_failed" as const };
    }
  });
```

**Note :** `context.claims` (JWT décodé, retourné par `requireSupabaseAuth`,
voir `src/integrations/supabase/auth-middleware.ts:76`) contient les claims
Supabase standard, dont `email` — d'où `(context.claims as any)?.email` ci-dessus.
Ce n'est qu'une note interne informative, pas bloquant si le claim est absent
(fallback `"admin"`).

- [ ] **Step 4: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune erreur dans `email.server.ts` et `email.functions.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/server/email.server.ts src/lib/email.functions.ts
git commit -m "feat: ajoute les server functions d'envoi annulation/remboursement"
```

---

## Task 7 : UI — bouton annulation + bloc remboursement dans `TrackingPanel`

**Files:**
- Modify: `src/routes/admin.tsx`

**Interfaces:**
- Consumes: `refundOrder`, `listOrderRefunds` (Task 4),
  `sendOrderCancellation`, `sendOrderRefund` (Task 6), `updateOrder` (déjà
  existant, ligne 369), `OrderRow` (type existant, à étendre).
- Produces: `TrackingPanel` affiche par ligne de commande un bouton
  "Annuler" (dialog de confirmation) et un panneau dépliable "Remboursement"
  (checklist d'articles + historique).

- [ ] **Step 1: Étendre le type `OrderRow` et la query `orderRows`**

Dans `OrderRow` (ligne 116-128), ajouter `payplug_payment_id: string | null;`.

Dans la query de chargement (ligne 154-159), ajouter `payplug_payment_id` à la
liste des colonnes sélectionnées :

```ts
        .select(
          "id, order_number, created_at, status, total_amount, family_prenom, family_nom, family_email, shipping_mode, tracking_number, tracking_carrier, payplug_payment_id",
        )
```

- [ ] **Step 2: Ajouter un composant `OrderItemsForRefund` chargé à la demande**

Ce composant charge les `order_items` d'une commande et l'historique
`order_refunds` uniquement quand la ligne est dépliée (évite de charger tous
les items de toutes les commandes d'un coup). L'ajouter avant `TrackingPanel` :

```tsx
type OrderItemRow = { id: string; product_name: string; size: string; line_total: number };

function RefundPanel({ orderId, disabled }: { orderId: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [refunds, setRefunds] = useState<OrderRefundRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: itemRows }, refundsResult] = await Promise.all([
      supabase.from("order_items").select("id, product_name, size, line_total").eq("order_id", orderId),
      listOrderRefunds({ data: { orderId } }),
    ]);
    setItems((itemRows ?? []) as OrderItemRow[]);
    if (refundsResult.ok) setRefunds(refundsResult.refunds);
    setLoading(false);
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const alreadyRefundedIds = new Set(refunds.filter((r) => r.status === "Réussi").flatMap((r) => r.order_item_ids));
  const total = items.filter((i) => selected.has(i.id)).reduce((s, i) => s + Number(i.line_total), 0);

  const submit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    const result = await refundOrder({ data: { orderId, orderItemIds: Array.from(selected), reason: reason || undefined } });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(`Remboursement échoué : ${result.error}`);
      await load();
      return;
    }
    toast.success(`Remboursement de ${result.amount.toFixed(2)} € effectué`);
    sendOrderRefund({ data: { refundId: result.refundId } }).catch(() => {});
    setSelected(new Set());
    setReason("");
    await load();
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          load();
        }}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
        title={disabled ? "Commande non payée via PayPlug" : undefined}
      >
        Rembourser
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3 text-xs">
      {loading && <p className="text-muted-foreground">Chargement…</p>}
      {!loading && (
        <>
          <div className="space-y-1">
            {items.map((i) => {
              const refunded = alreadyRefundedIds.has(i.id);
              return (
                <label key={i.id} className={`flex items-center gap-2 ${refunded ? "opacity-40" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={refunded}
                    checked={selected.has(i.id)}
                    onChange={() => toggle(i.id)}
                  />
                  {i.product_name} — {i.size} ({Number(i.line_total).toFixed(2)} €)
                  {refunded && <span className="italic"> déjà remboursé</span>}
                </label>
              );
            })}
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif (optionnel)"
            className="mt-2 h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold">Total sélectionné : {total.toFixed(2)} €</span>
            <button
              onClick={submit}
              disabled={selected.size === 0 || submitting}
              className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "…" : `Rembourser ${total.toFixed(2)} €`}
            </button>
          </div>
          {refunds.length > 0 && (
            <div className="mt-3 border-t border-border pt-2">
              <p className="mb-1 font-semibold text-muted-foreground">Historique</p>
              {refunds.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {new Date(r.created_at).toLocaleDateString("fr-FR")} — {Number(r.amount).toFixed(2)} €
                    {r.reason ? ` (${r.reason})` : ""}
                  </span>
                  <span className={r.status === "Réussi" ? "text-emerald-600" : "text-destructive"}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setOpen(false)} className="mt-2 text-[11px] text-muted-foreground hover:underline">
            Fermer
          </button>
        </>
      )}
    </div>
  );
}
```

Ajouter l'import du type `OrderRefundRow` et des fonctions en haut du fichier
`admin.tsx` :

```ts
import { refundOrder, listOrderRefunds, type OrderRefundRow } from "@/lib/order-refunds.functions";
import { sendOrderCancellation, sendOrderRefund } from "@/lib/email.functions";
```

(fusionner `sendOrderCancellation`/`sendOrderRefund` dans l'import existant de
la ligne 10 plutôt que dupliquer la ligne d'import.)

- [ ] **Step 3: Ajouter le bouton "Annuler la commande" dans `TrackingPanel`**

Dans la cellule "Action" du tableau (ligne 1678-1694), ajouter avant le bouton
"Enregistrer" existant :

```tsx
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          const blocking = ["Expédiée", "Livrée", "Annulée", "Remboursée"].includes(o.status);
                          const confirmMsg = blocking
                            ? `Cette commande est déjà "${o.status}". Confirmer l'annulation quand même ?`
                            : `Annuler la commande ${o.order_number} ?`;
                          if (!window.confirm(confirmMsg)) return;
                          const reason = window.prompt("Motif de l'annulation (optionnel)") ?? undefined;
                          onUpdate(o.id, { status: "Annulée" }, false).then(() => {
                            sendOrderCancellation({ data: { orderId: o.id, reason } }).catch(() => {});
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
                      >
                        Annuler
                      </button>
                      <RefundPanel orderId={o.id} disabled={!o.payplug_payment_id} />
                      <button
                        onClick={() =>
                          onUpdate(
                            o.id,
                            {
                              tracking_number: d.tracking_number || null,
                              tracking_carrier: d.tracking_carrier || null,
                            },
                            true,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        <Save className="h-3 w-3" /> Enregistrer
                      </button>
                    </div>
                  </td>
```

Remplacer l'ancienne cellule (une seule balise `<td>` avec un seul bouton) par
celle-ci.

**Note :** `updateOrder` envoie normalement l'email générique via
`notify: true` → ici on passe `notify: false` car c'est le nouvel email dédié
`sendOrderCancellation` qui est envoyé juste après, pour éviter un double
email à la famille.

- [ ] **Step 4: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune erreur dans `admin.tsx`.

- [ ] **Step 5: Test manuel dans le navigateur**

Lancer le serveur de dev (`npm run dev`), se connecter en admin, aller dans
l'onglet "Suivi & expédition" :
1. Vérifier que le bouton "Annuler" affiche bien la confirmation et, une fois
   confirmé, passe la commande en statut "Annulée" (toast de succès affiché).
2. Vérifier que le bouton "Rembourser" est désactivé sur une commande sans
   `payplug_payment_id`.
3. Sur une commande payée (test avec clé PayPlug sandbox si disponible),
   déplier "Rembourser", cocher un article, vérifier le calcul du total, puis
   confirmer et vérifier le toast de succès + apparition dans l'historique.
4. Vérifier qu'un item déjà remboursé n'est plus sélectionnable au rechargement.

- [ ] **Step 6: Commit**

```bash
git add src/routes/admin.tsx
git commit -m "feat: ajoute l'annulation et le remboursement dans le panneau Suivi et expédition"
```

---

## Task 8 : Vérification finale globale

**Files:** aucun nouveau fichier — vérification transverse.

- [ ] **Step 1: Build complet**

Run: `npm run build`
Expected: build réussi sans erreur TypeScript ni erreur de bundling.

- [ ] **Step 2: Suite de tests existante**

Run: `npm run test`
Expected: les tests existants (`deliveryOptions.test.ts`,
`featureFlags.test.ts`) passent toujours (aucune régression, ce projet n'a pas
de tests unitaires sur les server functions Supabase — la vérification de
cette fonctionnalité repose sur la compilation stricte + le test manuel de
l'étape précédente).

- [ ] **Step 3: Relire le diff complet**

Run: `git diff main --stat` puis relire chaque fichier modifié pour confirmer
qu'aucun changement non désiré n'a été introduit (ex : import dupliqué dans
`admin.tsx`, oubli de `context.userEmail` non résolu).

- [ ] **Step 4: Commit final si des ajustements ont été faits**

```bash
git add -A
git commit -m "fix: ajustements finaux annulation/remboursement de commande"
```
