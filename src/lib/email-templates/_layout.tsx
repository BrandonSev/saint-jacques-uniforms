import * as React from "react";
import { Body, Container, Head, Html, Img, Preview, Section, Text } from "@react-email/components";
import { type EmailBrand, resolveBrand } from "./brand";

interface LayoutProps {
  preview: string;
  title: string;
  /** Nom de la famille destinataire (ex : "Dupont") — affiché en sous-titre d'en-tête. */
  familyName?: string;
  /** Fonction/équipe qui signe (ex : "Commandes", "Service après-vente"). */
  signatureRole?: string;
  /** Branding tenant — fusionné avec `DEFAULT_EMAIL_BRAND`. */
  brand?: Partial<EmailBrand> | null;
  children: React.ReactNode;
}

export function EmailLayout({ preview, title, familyName, signatureRole, brand, children }: LayoutProps) {
  const cleanFamily = familyName?.trim();
  const b = resolveBrand(brand);
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...header, backgroundColor: b.headerColor }}>
            <Img
              src={b.logoUrl}
              width={String(b.logoWidth)}
              alt={b.logoAlt}
              style={logo}
            />
            <Text style={titleStyle}>{title}</Text>
            {cleanFamily ? <Text style={familyStyle}>Famille {cleanFamily}</Text> : null}
          </Section>
          <Section style={{ ...accentBar, backgroundColor: b.accentColor }} />
          <Section style={content}>
            {children}
            {signatureRole ? (
              <Text style={signature}>
                Bien cordialement,<br />
                L'équipe {signatureRole} {b.signatureSuffix}
              </Text>
            ) : null}
          </Section>
          <Section style={footer}>
            <Text style={footerText}>{b.footerTagline}</Text>
            <Text style={footerSmall}>
              Pour toute question, répondez simplement à cet email — il sera reçu par notre équipe.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const text = { fontSize: "15px", lineHeight: "1.6", color: "#1a1a1a", margin: "0 0 14px" };
export const muted = { fontSize: "13px", lineHeight: "1.5", color: "#666666", margin: "14px 0 0" };
export const button = {
  display: "inline-block",
  background: "#0a2540",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "14px",
  marginTop: "8px",
};
export const list = { fontSize: "14px", lineHeight: "1.7", color: "#1a1a1a", paddingLeft: "20px", margin: "0 0 14px" };

const body = {
  backgroundColor: "#ffffff",
  margin: 0,
  padding: "32px 16px",
  fontFamily: "Arial, Helvetica, sans-serif",
};
const container = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #eeeae0",
  boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
};
const header = { backgroundColor: "#0a2540", padding: "26px 32px" };
const logo = { display: "block", margin: "0 0 6px", height: "auto" };
const titleStyle = { fontSize: "22px", fontWeight: 600, color: "#ffffff", margin: "8px 0 0" };
const familyStyle = { fontSize: "13px", color: "#ffffff", opacity: 0.85, margin: "10px 0 0", fontStyle: "italic" as const };
const accentBar = { height: "3px", backgroundColor: "#c8102e", lineHeight: "3px", fontSize: 0 };
const content = { padding: "32px", backgroundColor: "#ffffff" };
const signature = { fontSize: "14px", lineHeight: "1.6", color: "#1a1a1a", margin: "28px 0 0" };
const footer = { backgroundColor: "#f5f5f5", padding: "20px 32px", textAlign: "center" as const };
const footerText = { fontSize: "12px", color: "#666666", margin: 0, fontWeight: 600 };
const footerSmall = { fontSize: "11px", color: "#999999", margin: "6px 0 0" };
