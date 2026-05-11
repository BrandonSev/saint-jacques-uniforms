const API_BASE = "https://api.payplug.com/v1";

function authHeader() {
  const key = process.env.PAYPLUG_SECRET_KEY;
  if (!key) throw new Error("PAYPLUG_SECRET_KEY missing");
  return `Bearer ${key}`;
}

export type PayplugCreateInput = {
  amount: number;
  currency: "EUR";
  email: string;
  firstName: string;
  lastName: string;
  language?: string;
  shipping: {
    address1: string;
    city: string;
    postcode: string;
    country: string;
    deliveryType: "BILLING" | "NEW_ADDRESS" | "SHIP_TO_STORE" | "DIGITAL_GOODS" | "TRAVEL_OR_EVENT";
  };
  notificationUrl: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type PayplugPayment = {
  id: string;
  is_paid: boolean;
  is_live: boolean;
  amount: number;
  currency: string;
  hosted_payment?: { payment_url: string; cancel_url: string; return_url: string };
  failure?: { code: string; message: string } | null;
  metadata?: Record<string, string>;
};

export async function createPayplugPayment(input: PayplugCreateInput): Promise<PayplugPayment> {
  const body = {
    amount: input.amount,
    currency: input.currency,
    customer: {
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      language: input.language ?? "fr",
    },
    billing: {
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      address1: input.shipping.address1,
      city: input.shipping.city,
      postcode: input.shipping.postcode,
      country: input.shipping.country,
      language: input.language ?? "fr",
    },
    shipping: {
      first_name: input.firstName,
      last_name: input.lastName,
      address1: input.shipping.address1,
      city: input.shipping.city,
      postcode: input.shipping.postcode,
      country: input.shipping.country,
      delivery_type: input.shipping.deliveryType,
    },
    hosted_payment: {
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
    },
    notification_url: input.notificationUrl,
    metadata: input.metadata,
  };

  const res = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader(), "PayPlug-Version": "2019-08-06" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error("PayPlug create failed:", res.status, json);
    throw new Error(json?.message || `PayPlug ${res.status}`);
  }
  return json as PayplugPayment;
}

export async function fetchPayplugPayment(id: string): Promise<PayplugPayment> {
  const res = await fetch(`${API_BASE}/payments/${id}`, {
    headers: { Authorization: authHeader(), "PayPlug-Version": "2019-08-06" },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || `PayPlug ${res.status}`);
  return json as PayplugPayment;
}
