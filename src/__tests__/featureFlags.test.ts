import { describe, it, expect } from "vitest";
import { isHomeDeliveryEnabled, HOME_DELIVERY_AVAILABLE_FROM, HOME_DELIVERY_OVERRIDE } from "@/config/featureFlags";

describe("featureFlags / isHomeDeliveryEnabled", () => {
  // Tests de la logique de date avec override désactivé
  it("est désactivé avant le 01/09/2025 (sans override)", () => {
    expect(isHomeDeliveryEnabled(new Date("2025-08-31T21:59:00Z"), null)).toBe(false);
    expect(isHomeDeliveryEnabled(new Date("2024-01-15T10:00:00Z"), null)).toBe(false);
  });

  it("est activé à partir du 01/09/2025 (sans override)", () => {
    expect(isHomeDeliveryEnabled(HOME_DELIVERY_AVAILABLE_FROM, null)).toBe(true);
    expect(isHomeDeliveryEnabled(new Date("2025-09-02T08:00:00Z"), null)).toBe(true);
    expect(isHomeDeliveryEnabled(new Date("2026-05-11T12:00:00Z"), null)).toBe(true);
  });

  it("l'override manuel a priorité sur la date", () => {
    expect(isHomeDeliveryEnabled(new Date("2030-01-01T00:00:00Z"), false)).toBe(false);
    expect(isHomeDeliveryEnabled(new Date("2020-01-01T00:00:00Z"), true)).toBe(true);
  });

  it("phase actuelle : l'override projet est positionné à false", () => {
    expect(HOME_DELIVERY_OVERRIDE).toBe(false);
    expect(isHomeDeliveryEnabled(new Date("2030-01-01T00:00:00Z"))).toBe(false);
  });
});