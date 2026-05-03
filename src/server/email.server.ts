// Server-only helpers pour invoquer la fonction edge send-email
const FN_URL = `${process.env.SUPABASE_URL ?? ""}/functions/v1/send-email`;

function escape(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function layout(title: string, body: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escape(title)}</title></head>
<body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:#0f3a5f;padding:24px 32px;color:#fff;">
          <div style="font-size:14px;letter-spacing:2px;text-transform:uppercase;opacity:.8;">Saint-Jacques</div>
          <div style="font-size:22px;font-weight:600;margin-top:4px;">${escape(title)}</div>
        </td></tr>
        <tr><td style="padding:32px;font-size:15px;line-height:1.6;color:#1a1a1a;">${body}</td></tr>
        <tr><td style="background:#fafaf7;padding:20px 32px;font-size:12px;color:#777;text-align:center;">
          Établissement Saint-Jacques · Email automatique, merci de ne pas répondre directement.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function send(to: string, subject: string, html: string) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) throw new Error("EMAIL_WEBHOOK_SECRET missing");
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
      apikey: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    },
    body: JSON.stringify({ to, subject, html }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("send-email failed:", res.status, txt);
    throw new Error(`send-email failed: ${res.status}`);
  }
}

export async function sendWelcomeEmail(to: string, prenom: string) {
  const html = layout("Bienvenue !", `
    <p>Bonjour ${escape(prenom)},</p>
    <p>Votre compte sur la boutique de l'établissement <strong>Saint-Jacques</strong> a bien été créé.</p>
    <p>Vous pouvez désormais ajouter vos enfants et passer commande de leurs uniformes.</p>
    <p style="margin-top:24px;"><a href="https://saint-jacques.lovable.app/famille" style="display:inline-block;background:#0f3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Accéder à mon espace</a></p>
    <p style="margin-top:24px;color:#666;">À très bientôt,<br/>L'équipe Saint-Jacques</p>
  `);
  await send(to, "Bienvenue sur la boutique Saint-Jacques", html);
}

export type OrderEmailItem = { name: string; size: string; qty: number; price: number; child: string };

export async function sendOrderConfirmation(to: string, prenom: string, orderNumber: string, items: OrderEmailItem[], total: number) {
  const rows = items.map((i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${escape(i.name)}<br/><span style="color:#888;font-size:12px;">Pour ${escape(i.child)} · Taille ${escape(i.size)}</span></td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${(i.qty * i.price).toFixed(2)} €</td>
    </tr>`).join("");
  const html = layout(`Commande ${escape(orderNumber)} confirmée`, `
    <p>Bonjour ${escape(prenom)},</p>
    <p>Nous avons bien reçu votre commande <strong>${escape(orderNumber)}</strong>. Voici son récapitulatif :</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse;font-size:14px;">
      <thead><tr><th align="left" style="padding:8px 0;border-bottom:2px solid #0f3a5f;">Article</th><th style="padding:8px 0;border-bottom:2px solid #0f3a5f;">Qté</th><th align="right" style="padding:8px 0;border-bottom:2px solid #0f3a5f;">Total</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="2" style="padding:12px 0;font-weight:700;">Total TTC</td><td style="padding:12px 0;text-align:right;font-weight:700;">${total.toFixed(2)} €</td></tr></tfoot>
    </table>
    <p>Vous serez prévenu(e) dès la mise à disposition.</p>
    <p style="margin-top:24px;color:#666;">Merci de votre confiance,<br/>L'équipe Saint-Jacques</p>
  `);
  await send(to, `Commande ${orderNumber} confirmée`, html);
}

export async function sendAdminOrderNotification(adminTo: string, orderNumber: string, familyName: string, total: number, itemsCount: number) {
  const html = layout("Nouvelle commande reçue", `
    <p>Une nouvelle commande vient d'être passée sur la boutique :</p>
    <ul>
      <li><strong>Numéro :</strong> ${escape(orderNumber)}</li>
      <li><strong>Famille :</strong> ${escape(familyName)}</li>
      <li><strong>Articles :</strong> ${itemsCount}</li>
      <li><strong>Total :</strong> ${total.toFixed(2)} €</li>
    </ul>
    <p style="margin-top:24px;"><a href="https://saint-jacques.lovable.app/admin" style="display:inline-block;background:#0f3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Ouvrir l'administration</a></p>
  `);
  await send(adminTo, `Nouvelle commande ${orderNumber} — ${familyName}`, html);
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const html = layout("Réinitialisation de votre mot de passe", `
    <p>Bonjour,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau :</p>
    <p style="margin:24px 0;"><a href="${escape(link)}" style="display:inline-block;background:#0f3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Réinitialiser mon mot de passe</a></p>
    <p style="color:#888;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email. Ce lien expire dans 1 heure.</p>
  `);
  await send(to, "Réinitialisation de votre mot de passe", html);
}

// ----------------------------------------------------------------------------
// Notifications de changement de statut commande
// ----------------------------------------------------------------------------

const STATUS_LABELS: Record<string, { title: string; body: string }> = {
  "En attente paiement": { title: "Commande enregistrée — paiement en attente", body: "Votre commande est enregistrée. Vous pouvez finaliser le paiement à tout moment depuis votre espace." },
  "Paiement validé": { title: "Paiement reçu", body: "Nous avons bien reçu votre règlement. Votre commande passe en préparation." },
  "Paiement échoué": { title: "Paiement échoué", body: "Le règlement n'a pas abouti. Vous pouvez relancer le paiement depuis votre espace commandes." },
  "En préparation": { title: "Commande en préparation", body: "Votre commande est en cours de préparation par notre atelier." },
  "Prête": { title: "Commande prête", body: "Votre commande est prête. Elle vous sera transmise très prochainement." },
  "Expédiée": { title: "Commande expédiée", body: "Votre commande vient de partir. Vous pouvez suivre son acheminement avec le numéro fourni." },
  "Disponible au retrait": { title: "Commande disponible", body: "Votre commande est disponible au secrétariat de l'établissement." },
  "Livrée": { title: "Commande livrée", body: "Votre commande a bien été livrée. Merci de votre confiance !" },
  "Retirée": { title: "Commande retirée", body: "Votre commande a bien été retirée. Merci !" },
  "Annulée": { title: "Commande annulée", body: "Votre commande a été annulée." },
};

export async function sendOrderStatusEmail(
  to: string,
  prenom: string,
  orderNumber: string,
  status: string,
  extras: { trackingNumber?: string | null; trackingCarrier?: string | null; note?: string | null } = {},
) {
  const map = STATUS_LABELS[status] ?? { title: `Mise à jour : ${status}`, body: `Votre commande est désormais au statut « ${status} ».` };
  const tracking =
    extras.trackingNumber
      ? `<p style="margin-top:16px;">Numéro de suivi : <strong>${escape(extras.trackingCarrier ?? "")} ${escape(extras.trackingNumber)}</strong></p>`
      : "";
  const note = extras.note ? `<p style="margin-top:12px;color:#555;font-style:italic;">${escape(extras.note)}</p>` : "";
  const html = layout(map.title, `
    <p>Bonjour ${escape(prenom)},</p>
    <p>Votre commande <strong>${escape(orderNumber)}</strong> a évolué :</p>
    <p>${escape(map.body)}</p>
    ${tracking}
    ${note}
    <p style="margin-top:24px;"><a href="https://saint-jacques.lovable.app/commandes" style="display:inline-block;background:#0f3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Voir mes commandes</a></p>
  `);
  await send(to, `${map.title} — ${orderNumber}`, html);
}

// ----------------------------------------------------------------------------
// Notifications incidents
// ----------------------------------------------------------------------------

const INCIDENT_LABELS: Record<string, string> = {
  malfacon: "Malfaçon / défaut",
  erreur_envoi: "Erreur d'envoi",
  article_manquant: "Article manquant",
  taille_inadaptee: "Taille inadaptée",
  usure_normale: "Usure normale",
  autre: "Autre",
};

export async function sendIncidentOpenedFamily(to: string, prenom: string, orderNumber: string, productName: string, type: string, eligible: boolean) {
  const html = layout("Incident enregistré", `
    <p>Bonjour ${escape(prenom)},</p>
    <p>Nous avons bien reçu votre déclaration d'incident concernant la commande <strong>${escape(orderNumber)}</strong>.</p>
    <ul>
      <li><strong>Article :</strong> ${escape(productName)}</li>
      <li><strong>Motif :</strong> ${escape(INCIDENT_LABELS[type] ?? type)}</li>
      <li><strong>Éligibilité :</strong> ${eligible ? "Éligible à étude — réponse sous 5 jours ouvrés." : "Motif a priori non éligible à une prise en charge."}</li>
    </ul>
    <p>Vous pouvez suivre l'avancement depuis votre espace commandes.</p>
    <p style="margin-top:24px;"><a href="https://saint-jacques.lovable.app/commandes" style="display:inline-block;background:#0f3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Voir mes commandes</a></p>
  `);
  await send(to, `Incident enregistré — Commande ${orderNumber}`, html);
}

export async function sendIncidentOpenedAdmin(to: string, orderNumber: string, family: string, productName: string, type: string, description: string) {
  const html = layout("Nouvel incident déclaré", `
    <p>Une famille vient de déclarer un incident :</p>
    <ul>
      <li><strong>Commande :</strong> ${escape(orderNumber)}</li>
      <li><strong>Famille :</strong> ${escape(family)}</li>
      <li><strong>Article :</strong> ${escape(productName)}</li>
      <li><strong>Motif :</strong> ${escape(INCIDENT_LABELS[type] ?? type)}</li>
    </ul>
    <p style="margin-top:12px;color:#555;font-style:italic;">${escape(description)}</p>
    <p style="margin-top:24px;"><a href="https://saint-jacques.lovable.app/admin" style="display:inline-block;background:#0f3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Traiter l'incident</a></p>
  `);
  await send(to, `Incident — Commande ${orderNumber}`, html);
}

export async function sendIncidentResolutionFamily(to: string, prenom: string, orderNumber: string, status: string, productName: string) {
  const map: Record<string, { title: string; body: string }> = {
    "Résolu": { title: "Votre incident a été résolu", body: "Notre équipe a traité votre incident. Une solution vous sera communiquée si ce n'est déjà fait." },
    "Refusé": { title: "Incident refusé", body: "Après étude, votre incident n'a pas pu être pris en charge." },
    "Non éligible": { title: "Incident non éligible", body: "Le motif déclaré n'ouvre pas droit à une prise en charge." },
    "En cours de traitement": { title: "Incident en cours", body: "Votre incident est en cours de traitement par notre équipe." },
    "À traiter": { title: "Incident reçu", body: "Votre incident est enregistré, nous l'étudions." },
    "En attente": { title: "Incident en attente", body: "Votre incident est en attente d'éléments complémentaires." },
  };
  const m = map[status] ?? { title: `Incident — ${status}`, body: `Votre incident a évolué au statut « ${status} ».` };
  const html = layout(m.title, `
    <p>Bonjour ${escape(prenom)},</p>
    <p>Mise à jour concernant l'incident sur votre commande <strong>${escape(orderNumber)}</strong> (article : ${escape(productName)}) :</p>
    <p>${escape(m.body)}</p>
    <p style="margin-top:24px;"><a href="https://saint-jacques.lovable.app/commandes" style="display:inline-block;background:#0f3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Voir mes commandes</a></p>
  `);
  await send(to, `${m.title} — ${orderNumber}`, html);
}