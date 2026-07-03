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

export type CustomTemplate = {
  id: string;
  name: string;
  header_title: string;
  body: string;
  button_label: string | null;
  button_url: string | null;
  signature_role: string;
  updated_at: string;
};

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
