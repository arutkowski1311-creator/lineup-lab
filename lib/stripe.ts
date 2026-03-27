import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });
}

interface CreateCheckoutParams {
  customerEmail: string;
  jobId: string;
  operatorName: string;
  amount: number; // in cents
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export async function createCheckoutSession({
  customerEmail,
  jobId,
  operatorName,
  amount,
  description,
  successUrl,
  cancelUrl,
  metadata = {},
}: CreateCheckoutParams) {
  return getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${operatorName} — ${description}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      job_id: jobId,
      ...metadata,
    },
  });
}

export async function constructWebhookEvent(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  return getStripe().webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
