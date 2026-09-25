import { describe, it, expect } from "vitest";
import { formatAddressBlock, trackingUrl } from "@/lib/tracking";

describe("tracking / formatAddressBlock", () => {
  it("met l'adresse en forme sur trois lignes", () => {
    expect(
      formatAddressBlock({
        shipping_recipient: "Marie Dupont",
        shipping_address: "12 rue des Écoles",
        shipping_postal: "40100",
        shipping_city: "Dax",
      }),
    ).toBe("Marie Dupont\n12 rue des Écoles\n40100 Dax");
  });

  it("ignore les champs vides ou absents", () => {
    expect(
      formatAddressBlock({
        shipping_recipient: null,
        shipping_address: "12 rue des Écoles",
        shipping_postal: "  ",
        shipping_city: "Dax",
      }),
    ).toBe("12 rue des Écoles\nDax");
  });

  it("gère un code postal seul sans ville", () => {
    expect(
      formatAddressBlock({
        shipping_address: "12 rue des Écoles",
        shipping_postal: "40100",
      }),
    ).toBe("12 rue des Écoles\n40100");
  });
});

describe("tracking / trackingUrl", () => {
  it("construit l'URL Colissimo", () => {
    expect(trackingUrl("Colissimo", "6A12345678901")).toBe(
      "https://www.laposte.fr/outils/suivre-vos-envois?code=6A12345678901",
    );
  });

  it("renvoie null pour un transporteur inconnu", () => {
    expect(trackingUrl("DHL", "123")).toBeNull();
  });
});
