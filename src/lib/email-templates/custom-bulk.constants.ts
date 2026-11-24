/**
 * Partie fixe (non éditable depuis l'admin) de l'email « custom-bulk ».
 * Partagée entre le template et l'aperçu de l'éditeur — fichier sans
 * dépendance à @react-email pour rester léger côté client.
 */
export const CUSTOM_BULK_FIXED = {
  buttonLabel: "Commander maintenant",
  buttonUrl: "https://sjdc-dax.franceuniformes.fr/boutique",
  thanks: "Merci pour votre confiance.",
  signatureRole: "boutique",
  /** Mention légale affichée sous la signature. */
  disclaimer: "pour le compte de votre établissement scolaire.",
} as const;
