import { createAdminClient } from "@/lib/supabase/admin";
import { constructWebhookEvent } from "@/lib/stripe";
import { json, error } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) return error("Missing stripe-signature", 400);

  let event;
  try {
    event = await constructWebhookEvent(body, signature);
  } catch (err) {
    return error(`Webhook verification failed: ${err instanceof Error ? err.message : "Unknown"}`, 400);
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const jobId = session.metadata?.job_id;
      const invoiceId = session.metadata?.invoice_id;

      if (invoiceId) {
        // Payment for invoice
        await admin
          .from("invoices")
          .update({
            status: "paid",
            amount_paid: (session.amount_total || 0) / 100,
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);

        // Update job status to paid
        if (jobId) {
          await admin
            .from("jobs")
            .update({ status: "paid" })
            .eq("id", jobId);
        }
      }
      break;
    }

    case "payment_intent.succeeded": {
      // Handle additional payment confirmations
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  return json({ received: true });
}
