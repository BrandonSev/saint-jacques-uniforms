import { describe, it, expect } from "vitest";
import {
  buildInvoicesCsv,
  dateInputToIso,
  invoicePrefix,
  isoToDateInput,
  parseDeliveryDatesCsv,
  planInvoiceRanges,
  resolveDeliveredAt,
} from "@/lib/batchDelivery";
import { createZip, crc32 } from "@/lib/zip";

describe("batchDelivery / dates", () => {
  it("convertit une date de formulaire en instant à midi UTC", () => {
    expect(dateInputToIso("2026-09-01")).toBe("2026-09-01T12:00:00.000Z");
  });

  it("rejette les dates invalides", () => {
    expect(dateInputToIso("2026-02-31")).toBeNull();
    expect(dateInputToIso("01/09/2026")).toBeNull();
    expect(dateInputToIso("")).toBeNull();
  });

  it("reconvertit un instant en date de formulaire (fuseau Paris)", () => {
    expect(isoToDateInput("2026-09-01T12:00:00.000Z")).toBe("2026-09-01");
    expect(isoToDateInput(null)).toBe("");
  });

  it("choisit la date : commande > lot > existante > maintenant", () => {
    expect(resolveDeliveredAt({ itemDate: "A", jobDate: "B", existing: "C" })).toBe("A");
    expect(resolveDeliveredAt({ jobDate: "B", existing: "C" })).toBe("B");
    expect(resolveDeliveredAt({ existing: "C" })).toBe("C");
    expect(resolveDeliveredAt({})).toBeUndefined();
  });
});

describe("batchDelivery / import CSV", () => {
  it("lit les deux formats de date et ignore l'en-tête", () => {
    const { dates, errors } = parseDeliveryDatesCsv(
      "commande;date\r\nCMD-1;2026-08-28\nCMD-2;03/09/2026\n\nCMD-3,\"2026-09-01\"\n",
    );
    expect(errors).toEqual([]);
    expect(dates).toEqual({
      "CMD-1": "2026-08-28T12:00:00.000Z",
      "CMD-2": "2026-09-03T12:00:00.000Z",
      "CMD-3": "2026-09-01T12:00:00.000Z",
    });
  });

  it("signale les lignes invalides", () => {
    const { dates, errors } = parseDeliveryDatesCsv("CMD-1;2026-08-28\nCMD-2;demain\nCMD-3");
    expect(Object.keys(dates)).toEqual(["CMD-1"]);
    expect(errors).toHaveLength(2);
  });
});

describe("batchDelivery / plage de factures", () => {
  it("attribue des plages séparées par préfixe et saute les commandes déjà facturées", () => {
    const ranges = planInvoiceRanges(
      [
        { delivery_type: "individual", hasInvoice: false },
        { delivery_type: "individual", hasInvoice: false },
        { delivery_type: "grouped", hasInvoice: false },
        { delivery_type: "grouped", hasInvoice: true },
      ],
      { "FU-B": 12 },
      2026,
    );
    expect(ranges).toEqual([
      { prefix: "FU-B", count: 2, first: "FU-B-2026-00013", last: "FU-B-2026-00014" },
      { prefix: "FU-BE", count: 1, first: "FU-BE-2026-00001", last: "FU-BE-2026-00001" },
    ]);
    expect(invoicePrefix("individual")).toBe("FU-B");
    expect(invoicePrefix("grouped")).toBe("FU-BE");
  });
});

describe("batchDelivery / CSV comptable", () => {
  it("calcule HT et TVA à partir du TTC et échappe les champs", () => {
    const csv = buildInvoicesCsv([
      {
        invoiceNumber: "FU-B-2026-00001",
        invoiceDate: "2026-07-05T10:00:00.000Z",
        orderNumber: "CMD-1",
        deliveredAt: "2026-09-01T12:00:00.000Z",
        client: 'Dupont "Marie"; Jean',
        email: "a@b.fr",
        deliveryType: "individual",
        totalTtc: 120,
        pdfMissing: false,
      },
    ]);
    const lines = csv.replace("﻿", "").trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      'FU-B-2026-00001;05/07/2026;CMD-1;01/09/2026;"Dupont ""Marie""; Jean";a@b.fr;Individuelle;100,00;20,00;120,00;',
    );
  });
});

describe("zip", () => {
  it("produit une archive valide (signatures, nombre d'entrées, CRC)", () => {
    const zip = createZip([
      { name: "a.txt", data: new TextEncoder().encode("bonjour") },
      { name: "é.pdf", data: new Uint8Array([1, 2, 3]) },
    ]);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    const end = zip.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});
