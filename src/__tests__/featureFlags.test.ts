import { describe, it, expect } from "vitest";
import { isHomeDeliveryEnabled, HOME_DELIVERY_AVAILABLE_FROM } from "@/config/featureFlags";

describe("featureFlags / isHomeDeliveryEnabled", () => {
  it("est désactivé avant le 01/09/2025", () => {
    expect(isHomeDeliveryEnabled(new Date("2025-08-31T22:00:00Z"))).toBe(false);
    expect(isHomeDeliveryEnabled(new Date("2024-01-15T10:00:00Z"))).toBe(false);
  });

  it("est activé à partir du 01/09/2025 (heure de Paris)", () => {
    expect(isHomeDeliveryEnabled(HOME_DELIVERY_AVAILABLE_FROM)).toBe(true);
    expect(isHomeDeliveryEnabled(new Date("2025-09-02T08:00:00Z"))).toBe(true);
    expect(isHomeDeliveryEnabled(new Date("2026-05-11T12:00:00Z"))).toBe(true);
  });
});