// Bridge des anciens helpers vers la queue Lovable Emails.
// Tous les envois passent par enqueueTransactionalEmail -> templates React Email.
import { enqueueTransactionalEmail } from "@/lib/email/send.server";

export type OrderEmailItem = { name: string; size: string; qty: number; price: number; child: string };

export async function sendWelcomeEmail(to: string, prenom: string, familyName?: string) {
  await enqueueTransactionalEmail({
    templateName: "welcome",
    recipientEmail: to,
    templateData: { prenom, familyName },
    idempotencyKey: `welcome-${to}`,
  });
}

export async function sendOrderConfirmation(to: string, prenom: string, orderNumber: string, items: OrderEmailItem[], total: number, familyName?: string) {
  await enqueueTransactionalEmail({
    templateName: "order-confirmation",
    recipientEmail: to,
    templateData: { prenom, familyName, orderNumber, items, total },
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
  extras: { trackingNumber?: string | null; trackingCarrier?: string | null; note?: string | null; familyName?: string } = {},
) {
  await enqueueTransactionalEmail({
    templateName: "order-status",
    recipientEmail: to,
    templateData: { prenom, orderNumber, status, ...extras },
    idempotencyKey: `status-${orderNumber}-${status}`,
  });
}

export async function sendIncidentOpenedFamily(to: string, prenom: string, orderNumber: string, productName: string, type: string, eligible: boolean, familyName?: string) {
  await enqueueTransactionalEmail({
    templateName: "incident-family",
    recipientEmail: to,
    templateData: { prenom, familyName, orderNumber, productName, type, eligible },
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

export async function sendIncidentResolutionFamily(to: string, prenom: string, orderNumber: string, status: string, productName: string, familyName?: string) {
  await enqueueTransactionalEmail({
    templateName: "incident-resolution",
    recipientEmail: to,
    templateData: { prenom, familyName, orderNumber, status, productName },
    idempotencyKey: `incident-res-${orderNumber}-${productName}-${status}`,
  });
}

export async function sendOrderCorrectionResolutionFamily(
  to: string,
  prenom: string,
  orderNumber: string,
  productName: string,
  oldSize: string,
  newSize: string,
  familyName?: string,
) {
  await enqueueTransactionalEmail({
    templateName: "order-correction-resolution",
    recipientEmail: to,
    templateData: { prenom, familyName, orderNumber, productName, oldSize, newSize },
    idempotencyKey: `order-correction-${orderNumber}-${productName}-${newSize}`,
  });
}

export async function sendOrderCancellationEmail(
  to: string,
  prenom: string,
  orderNumber: string,
  reason: string | null,
  familyName?: string,
) {
  await enqueueTransactionalEmail({
    templateName: "order-cancellation",
    recipientEmail: to,
    templateData: { prenom, familyName, orderNumber, reason: reason ?? undefined },
    idempotencyKey: `order-cancel-${orderNumber}`,
  });
}

export async function sendOrderRefundEmail(
  to: string,
  prenom: string,
  orderNumber: string,
  amount: number,
  itemNames: string[],
  familyName?: string,
) {
  await enqueueTransactionalEmail({
    templateName: "order-refund",
    recipientEmail: to,
    templateData: { prenom, familyName, orderNumber, amount, itemNames },
    idempotencyKey: `order-refund-${orderNumber}-${amount}-${Date.now()}`,
  });
}

export async function sendAdminOrderActionNotification(
  to: string,
  orderNumber: string,
  familyName: string,
  action: "Annulation" | "Remboursement",
  amount: number | null,
  reason: string | null,
  actorEmail: string,
) {
  await enqueueTransactionalEmail({
    templateName: "admin-order-action",
    recipientEmail: to,
    templateData: { orderNumber, familyName, action, amount: amount ?? undefined, reason: reason ?? undefined, actorEmail },
    idempotencyKey: `admin-action-${orderNumber}-${action}-${Date.now()}`,
  });
}