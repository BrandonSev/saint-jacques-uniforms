// Bridge des anciens helpers vers la queue Lovable Emails.
// Tous les envois passent par enqueueTransactionalEmail -> templates React Email.
import { enqueueTransactionalEmail } from "@/lib/email/send.server";

export type OrderEmailItem = { name: string; size: string; qty: number; price: number; child: string };

export async function sendWelcomeEmail(to: string, prenom: string) {
  await enqueueTransactionalEmail({
    templateName: "welcome",
    recipientEmail: to,
    templateData: { prenom },
    idempotencyKey: `welcome-${to}`,
  });
}

export async function sendOrderConfirmation(to: string, prenom: string, orderNumber: string, items: OrderEmailItem[], total: number) {
  await enqueueTransactionalEmail({
    templateName: "order-confirmation",
    recipientEmail: to,
    templateData: { prenom, orderNumber, items, total },
    idempotencyKey: `order-confirm-${orderNumber}`,
  });
}

export async function sendAdminOrderNotification(adminTo: string, orderNumber: string, familyName: string, total: number, itemsCount: number) {
  await enqueueTransactionalEmail({
    templateName: "admin-order",
    recipientEmail: adminTo,
    templateData: { orderNumber, familyName, total, itemsCount },
    idempotencyKey: `admin-order-${orderNumber}`,
  });
}

export async function sendPasswordResetEmail(to: string, link: string) {
  await enqueueTransactionalEmail({
    templateName: "password-reset",
    recipientEmail: to,
    templateData: { link },
    idempotencyKey: `pwreset-${to}-${Date.now()}`,
  });
}

export async function sendOrderStatusEmail(
  to: string,
  prenom: string,
  orderNumber: string,
  status: string,
  extras: { trackingNumber?: string | null; trackingCarrier?: string | null; note?: string | null } = {},
) {
  await enqueueTransactionalEmail({
    templateName: "order-status",
    recipientEmail: to,
    templateData: { prenom, orderNumber, status, ...extras },
    idempotencyKey: `status-${orderNumber}-${status}`,
  });
}

export async function sendIncidentOpenedFamily(to: string, prenom: string, orderNumber: string, productName: string, type: string, eligible: boolean) {
  await enqueueTransactionalEmail({
    templateName: "incident-family",
    recipientEmail: to,
    templateData: { prenom, orderNumber, productName, type, eligible },
    idempotencyKey: `incident-fam-${orderNumber}-${productName}`,
  });
}

export async function sendIncidentOpenedAdmin(to: string, orderNumber: string, family: string, productName: string, type: string, description: string) {
  await enqueueTransactionalEmail({
    templateName: "incident-admin",
    recipientEmail: to,
    templateData: { orderNumber, family, productName, type, description },
    idempotencyKey: `incident-adm-${orderNumber}-${productName}`,
  });
}

export async function sendIncidentResolutionFamily(to: string, prenom: string, orderNumber: string, status: string, productName: string) {
  await enqueueTransactionalEmail({
    templateName: "incident-resolution",
    recipientEmail: to,
    templateData: { prenom, orderNumber, status, productName },
    idempotencyKey: `incident-res-${orderNumber}-${productName}-${status}`,
  });
}