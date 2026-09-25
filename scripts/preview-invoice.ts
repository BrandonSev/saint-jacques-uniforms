// Génère un PDF de facture d'APERÇU en local, sans toucher à Supabase ni consommer
// un numéro comptable réel (FA-ANNÉE-NNNNN). Utile pour tester une mise en page ou
// un cas particulier avant de le soumettre au comptable, ou avant de repasser une
// vraie commande au statut "Livrée" (qui génère la facture définitive).
//
// Usage (depuis la racine du projet) :
//   npx tsx scripts/preview-invoice.ts
//
// Éditez le bloc `scenarios` ci-dessous pour vos cas de test,
// relancez, et ouvrez scripts/facture-apercu-*.pdf (ignorés par git, voir .gitignore).
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

    // --- Éditez ces données pour vos tests (données fictives uniquement) ---
    // Numéros en -00000 : jamais un vrai numéro séquentiel.
    const scenarios = {
      // Commande individuelle livrée au domicile de la famille : préfixe FU-B.
      individuelle: {
        invoiceNumber: "FU-B-2026-00000",
        orderNumber: "CMD-20260901-C101-001",
        paidAt: "2026-09-01T10:00:00.000Z",
        totalAmount: 75.0,
        family: {
          civilite: "Mme",
          prenom: "Marie",
          nom: "Dupont",
          email: "marie.dupont@example.com",
          phone: "06 12 34 56 78",
        },
        billing: {
          name: null, // le nom de la famille figure déjà au-dessus
          address: "12 rue des Lilas",
          postal: "40100",
          city: "Dax",
        },
        deliveryLabel: "Livraison à : Marie Dupont, 12 rue des Lilas, 40100 Dax",
        items: [
          {
            child: "Lucas Dupont",
            productName: "Polo manches courtes",
            productRef: "POLO-MC",
            size: "10 ans",
            quantity: 2,
            unitPrice: 22.5,
            lineTotal: 45.0,
          },
          {
            child: "Lucas Dupont",
            productName: "Pantalon",
            productRef: "PANT-01",
            size: "10 ans",
            quantity: 1,
            unitPrice: 30.0,
            lineTotal: 30.0,
          },
        ],
      },
      // Commande en livraison groupée, tout livré à l'établissement : préfixe FU-BE.
      groupee: {
        invoiceNumber: "FU-BE-2026-00000",
        orderNumber: "CMD-20260901-C102-001",
        paidAt: "2026-09-01T10:00:00.000Z",
        totalAmount: 97.5,
        family: {
          civilite: "M.",
          prenom: "Thomas",
          nom: "Martin",
          email: "thomas.martin@example.com",
        },
        billing: {
          name: "Groupe scolaire Saint-Jacques de Compostelle",
          address: "35 avenue de l'aérodrome",
          postal: "40100",
          city: "Dax",
        },
        items: [
          {
            child: "Léa Martin",
            productName: "Polo manches courtes",
            productRef: "POLO-MC",
            size: "8 ans",
            quantity: 1,
            unitPrice: 22.5,
            lineTotal: 22.5,
          },
          {
            child: "Léa Martin",
            productName: "Pantalon",
            productRef: "PANT-01",
            size: "8 ans",
            quantity: 1,
            unitPrice: 30.0,
            lineTotal: 30.0,
          },
          {
            child: "Hugo Martin",
            productName: "Polo manches courtes",
            productRef: "POLO-MC",
            size: "12 ans",
            quantity: 2,
            unitPrice: 22.5,
            lineTotal: 45.0,
          },
        ],
      },
    };
    // --- Fin des données éditables ---

    for (const [name, data] of Object.entries(scenarios)) {
      const pdfBuffer = buildOrderInvoicePdf(data);
      const outPath = path.resolve(__dirname, `facture-apercu-${name}.pdf`);
      writeFileSync(outPath, pdfBuffer);
      console.log(`PDF généré : ${outPath}`);
    }
  } finally {
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
