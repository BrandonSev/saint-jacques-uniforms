import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTransactionalEmail } from "@/lib/email/send.server";

async function userHasAnyRole(userId: string, roles: string[]) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", roles);
  return (data ?? []).length > 0;
}

// Liste des familles avec statut commande pour la rentrée
export const apelListFamilies = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ seasonStart: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin", "apel"]))) {
      return { ok: false as const, error: "forbidden" as const, families: [] };
    }
    const { data: rows, error } = await supabaseAdmin.rpc("apel_families_overview", {
      _season_start: data.seasonStart ?? "2026-01-01",
    });
    if (error) {
      console.error("apelListFamilies:", error);
      return { ok: false as const, error: error.message, families: [] };
    }
    return { ok: true as const, families: rows ?? [] };
  });

// Envoi d'une relance email à une liste de familles
export const sendApelReminders = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        userIds: z.array(z.string().uuid()).min(1).max(500),
        customMessage: z.string().max(1000).optional(),
        deadline: z.string().max(50).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin", "apel"]))) {
      return { ok: false as const, error: "forbidden" as const, sent: 0 };
    }
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, prenom")
      .in("id", data.userIds);
    let sent = 0;
    const errors: string[] = [];
    for (const p of profiles ?? []) {
      if (!p.email) continue;
      try {
        await enqueueTransactionalEmail({
          templateName: "apel-reminder",
          recipientEmail: p.email,
          templateData: {
            prenom: p.prenom ?? "",
            deadline: data.deadline ?? "30 juin 2026",
            customMessage: data.customMessage,
          },
          idempotencyKey: `apel-reminder-${p.id}-${new Date().toISOString().slice(0, 10)}`,
        });
        sent++;
      } catch (e: any) {
        errors.push(`${p.email}: ${e?.message ?? e}`);
      }
    }
    return { ok: true as const, sent, total: profiles?.length ?? 0, errors };
  });

// Attribution / révocation du rôle APEL (admin uniquement)
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        email: z.string().email(),
        role: z.enum(["apel", "admin"]),
        action: z.enum(["grant", "revoke"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (!profile) return { ok: false as const, error: "user_not_found" as const };
    if (data.action === "grant") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: profile.id, role: data.role });
      if (error && !error.message.includes("duplicate")) {
        return { ok: false as const, error: error.message };
      }
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", profile.id)
        .eq("role", data.role);
      if (error) return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

// Liste des utilisateurs ayant un rôle (admin uniquement)
export const listRoleAssignments = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({}).parse(d))
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, assignments: [] };
    }
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, created_at")
      .order("created_at", { ascending: false });
    const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, email, prenom, nom").in("id", ids)
      : { data: [] as any[] };
    const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const assignments = (roles ?? []).map((r: any) => ({
      user_id: r.user_id,
      role: r.role,
      created_at: r.created_at,
      email: pmap.get(r.user_id)?.email ?? "—",
      prenom: pmap.get(r.user_id)?.prenom ?? "",
      nom: pmap.get(r.user_id)?.nom ?? "",
    }));
    return { ok: true as const, assignments };
  });