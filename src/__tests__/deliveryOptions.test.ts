import { describe, it, expect } from "vitest";
import {
  filterDeliveryOptions,
  getInitialDeliveryOptions,
  pickInitialMode,
  HOME_FALLBACK,
  PICKUP_FALLBACK,
  type DeliveryOption,
} from "@/lib/deliveryOptions";

const home: DeliveryOption = { code: "home", label: "Livraison à domicile", description: null };
const pickup: DeliveryOption = { code: "pickup", label: "Retrait à l'établissement", description: null };

describe("getInitialDeliveryOptions", () => {
  it("renvoie uniquement le retrait quand le flag est OFF", () => {
    expect(getInitialDeliveryOptions(false)).toEqual([PICKUP_FALLBACK]);
  });
  it("renvoie la livraison à domicile quand le flag est ON", () => {
    expect(getInitialDeliveryOptions(true)).toEqual([HOME_FALLBACK]);
  });
});

describe("filterDeliveryOptions", () => {
  it("retire l'option home quand le flag est OFF", () => {
    expect(filterDeliveryOptions([home, pickup], false)).toEqual([pickup]);
  });
  it("renvoie null si la base ne contient que `home` et flag OFF", () => {
    expect(filterDeliveryOptions([home], false)).toBeNull();
  });
  it("conserve toutes les options quand le flag est ON", () => {
    expect(filterDeliveryOptions([home, pickup], true)).toEqual([home, pickup]);
  });
  it("renvoie null si la liste d'entrée est vide", () => {
    expect(filterDeliveryOptions([], true)).toBeNull();
    expect(filterDeliveryOptions([], false)).toBeNull();
  });
  it("ne touche pas aux options custom (ex: relais colis)", () => {
    const relais: DeliveryOption = { code: "relais", label: "Point relais", description: null };
    expect(filterDeliveryOptions([home, relais], false)).toEqual([relais]);
  });
});

describe("pickInitialMode", () => {
  it("préfère `home` si disponible", () => {
    expect(pickInitialMode([home, pickup])).toBe("home");
  });
  it("retombe sur `pickup` si seul disponible", () => {
    expect(pickInitialMode([pickup])).toBe("pickup");
  });
  it("retombe sur `home` si la liste est vide (rétro-compat)", () => {
    expect(pickInitialMode([])).toBe("home");
  });
});

describe("scénarios bout-en-bout (flag × options DB)", () => {
  it("phase actuelle : flag OFF + DB ne propose que home ⇒ on affiche le pickup de fallback", () => {
    const initial = getInitialDeliveryOptions(false);
    const filtered = filterDeliveryOptions([home], false);
    const finalOptions = filtered ?? initial;
    expect(finalOptions).toEqual([PICKUP_FALLBACK]);
    expect(pickInitialMode(finalOptions)).toBe("pickup");
  });

  it("phase actuelle : flag OFF + DB propose pickup ⇒ on affiche pickup DB", () => {
    const initial = getInitialDeliveryOptions(false);
    const filtered = filterDeliveryOptions([home, pickup], false);
    const finalOptions = filtered ?? initial;
    expect(finalOptions).toEqual([pickup]);
    expect(pickInitialMode(finalOptions)).toBe("pickup");
  });

  it("phase septembre : flag ON + DB propose les 2 ⇒ les 2 affichés, mode initial = home", () => {
    const initial = getInitialDeliveryOptions(true);
    const filtered = filterDeliveryOptions([home, pickup], true);
    const finalOptions = filtered ?? initial;
    expect(finalOptions).toEqual([home, pickup]);
    expect(pickInitialMode(finalOptions)).toBe("home");
  });

  it("phase septembre : flag ON + DB ne propose que pickup ⇒ pickup uniquement", () => {
    const initial = getInitialDeliveryOptions(true);
    const filtered = filterDeliveryOptions([pickup], true);
    const finalOptions = filtered ?? initial;
    expect(finalOptions).toEqual([pickup]);
    expect(pickInitialMode(finalOptions)).toBe("pickup");
  });
});