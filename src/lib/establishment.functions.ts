import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Vérifie le code établissement transmis par les familles à l'inscription.
 * Le code de référence est stocké côté serveur dans le secret ESTABLISHMENT_CODE.
 */
export const verifyEstablishmentCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        code: z.string().trim().min(1, "Code requis").max(64),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const expected = process.env.ESTABLISHMENT_CODE;
    if (!expected) {
      return { valid: false, reason: "not_configured" as const };
    }
    const valid = data.code.trim().toLowerCase() === expected.trim().toLowerCase();
    return { valid, reason: valid ? null : ("invalid" as const) };
  });