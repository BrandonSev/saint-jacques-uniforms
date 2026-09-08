// Génère un PDF de facture d'APERÇU en local, sans toucher à Supabase ni consommer
// un numéro comptable réel (FA-ANNÉE-NNNNN). Utile pour tester une mise en page ou
// un cas particulier avant de le soumettre au comptable, ou avant de repasser une
// vraie commande au statut "Livrée" (qui génère la facture définitive).
//
// Usage (depuis la racine du projet) :
//   npx tsx scripts/preview-invoice.ts
//
// Éditez le bloc `data` dans buildPreviewInvoice ci-dessous pour votre cas de test,
// relancez, et ouvrez scripts/facture-apercu.pdf (ignoré par git, voir .gitignore).
//
// Note technique : le PDF est construit par src/server/orderInvoicePdf.server.ts, qui
// dépend de jsPDF — un package dont l'interop CJS/ESM ne se résout correctement que
// sous un bundler (Vite), pas sous Node/tsx nu. On charge donc ce module via Vite en
// mode SSR (createServer + ssrLoadModule), qui reproduit fidèlement la résolution de
// modules utilisée en prod (alias @/, interop CJS inclus).

import { createServer } from "vite";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const server = await createServer({
    root: path.resolve(__dirname, ".."),
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "warn",
  });

  try {
    const mod = await server.ssrLoadModule("/src/server/orderInvoicePdf.server.ts");
    const buildOrderInvoicePdf = mod.buildOrderInvoicePdf as (data: unknown) => Buffer;

    // --- Éditez ces données pour votre test ---
    const data = {
      invoiceNumber: "FA-TEST-00000", // préfixe TEST bien visible : jamais un vrai numéro séquentiel
      orderNumber: "CMD-20260901-C202-001",
      paidAt: "2026-09-01T10:00:00.000Z",
      totalAmount: 75.0,
      family: {
        civilite: "Mme",
        prenom: "Johanna",
        nom: "Colle",
        email: "johannah85@gmail.com",
      },
      billing: {
        name: "Groupe scolaire Saint-Jacques de Compostelle",
        address: "35 avenue de l'aérodrome",
        postal: "40100",
        city: "Dax",
      },
      items: [
        {
          child: "Enfant Test",
          productName: "Polo manches courtes",
          productRef: "POLO-MC",
          size: "10 ans",
          quantity: 2,
          unitPrice: 22.5,
          lineTotal: 45.0,
        },
        {
          child: "Enfant Test",
          productName: "Pantalon",
          productRef: "PANT-01",
          size: "10 ans",
          quantity: 1,
          unitPrice: 30.0,
          lineTotal: 30.0,
        },
      ],
    };
    // --- Fin des données éditables ---

    const pdfBuffer = buildOrderInvoicePdf(data);
    const outPath = path.resolve(__dirname, "facture-apercu.pdf");
    writeFileSync(outPath, pdfBuffer);
    console.log(`PDF généré : ${outPath}`);
  } finally {
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
