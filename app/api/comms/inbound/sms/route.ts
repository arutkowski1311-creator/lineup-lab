/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { error } from "@/lib/api-helpers";
import { sendSMS, normalizePhone } from "@/lib/twilio";
import { classifyIntent } from "@/lib/anthropic";
import {
  SMS_TEMPLATES,
  REPLY_ACTIONS,
} from "@/lib/sms-templates";

type ReplyCodeContext = string;
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function twiml(body?: string): Response {
  const inner = body ? `<Message>${escapeXml(body)}</Message>` : "";
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Find the most recent outbound SMS to this customer that used a reply-code
 * template. We store template_type in the raw_content prefix convention or
 * in the response_content field. We scan the last 5 outbound messages.
 */
async function findLastOutboundTemplate(
  admin: ReturnType<typeof createAdminClient>,
  operatorId: string,
  customerPhone: string
): Promise<{ templateType: ReplyCodeContext; jobId: string | null; commId: string } | null> {
  const normalized = normalizePhone(customerPhone);

  const { data: recent } = await admin
    .from("communications")
    .select("id, raw_content, job_id, response_content")
    .eq("operator_id", operatorId)
    .eq("direction", "outbound")
    .eq("channel", "sms")
    .eq("to_number", normalized)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!recent || recent.length === 0) return null;

  // Check each recent outbound for a known template match
  for (const msg of recent) {
    const content = (msg.raw_content || "") as string;
    for (const tpl of Object.keys(REPLY_ACTIONS)) {
      // Use distinctive phrases from each template to identify
      if (tpl === "window_missed" && content.includes("has been delayed")) {
        return { templateType: tpl, jobId: msg.job_id as string | null, commId: msg.id as string };
      }
      if (tpl === "invoice_sent" && content.includes("has been sent. Pay online")) {
        return { templateType: tpl, jobId: msg.job_id as string | null, commId: msg.id as string };
      }
      if (tpl === "reschedule_offer" && content.includes("We found an available window")) {
        return { templateType: tpl, jobId: msg.job_id as string | null, commId: msg.id as string };
      }
      if (tpl === "special_offer" && content.includes("as a valued Metro Waste customer")) {
        return { templateType: tpl, jobId: msg.job_id as string | null, commId: msg.id as string };
      }
    }
  }

  return null;
}

/**
 * Find customer by phone with fuzzy matching — tries normalized E.164 first,
 * then strips +1 prefix for a raw-10-digit match.
 */
async function findCustomer(
  admin: ReturnType<typeof createAdminClient>,
  operatorId: string,
  phone: string
) {
  const normalized = normalizePhone(phone);
  const digits10 = normalized.replace(/^\+1/, "");

  // Try exact E.164 match
  const { data: exact } = await admin
    .from("customers")
    .select("id, name, phone")
    .eq("operator_id", operatorId)
    .eq("phone", normalized)
    .single();

  if (exact) return exact;

  // Try 10-digit match (some operators store phone without +1)
  const { data: tenDigit } = await admin
    .from("customers")
    .select("id, name, phone")
    .eq("operator_id", operatorId)
    .eq("phone", digits10)
    .single();

  if (tenDigit) return tenDigit;

  // Try with parenthesized area code: (908) 725-0456
  const formatted = `(${digits10.slice(0, 3)}) ${digits10.slice(3, 6)}-${digits10.slice(6)}`;
  const { data: fmtMatch } = await admin
    .from("customers")
    .select("id, name, phone")
    .eq("operator_id", operatorId)
    .eq("phone", formatted)
    .single();

  return fmtMatch || null;
}

// ---------------------------------------------------------------------------
// Reply-code handlers
// ---------------------------------------------------------------------------

async function handleReplyCode(
  admin: ReturnType<typeof createAdminClient>,
  operatorId: string,
  customerId: string | null,
  code: string,
  templateCtx: { templateType: ReplyCodeContext; jobId: string | null; commId: string }
): Promise<string | null> {
  const { templateType, jobId } = templateCtx;

  switch (templateType) {
    // ----- WINDOW MISSED -----
    case "window_missed": {
      if (code === "1") {
        // Flag for callback — insert a comm note for the dashboard
        await admin.from("communications").insert({
          operator_id: operatorId,
          customer_id: customerId,
          job_id: jobId,
          direction: "inbound",
          channel: "sms",
          raw_content: "[CALLBACK REQUESTED] Customer replied 1 to window_missed notification",
          intent: "complaint",
          intent_confidence: 1.0,
        } as any);
        return "We've flagged your request. A team member will call you shortly.";
      }
      if (code === "2") {
        // Trigger auto-reschedule search
        if (jobId) {
          await admin
            .from("jobs")
            .update({ status: "pickup_requested" } as any)
            .eq("id", jobId);
        }
        return "We're checking available dates now. We'll text you options shortly.";
      }
      if (code === "3") {
        // Open live thread — notify owner
        await admin.from("communications").insert({
          operator_id: operatorId,
          customer_id: customerId,
          job_id: jobId,
          direction: "inbound",
          channel: "sms",
          raw_content: "[LIVE TEXT REQUESTED] Customer replied 3 to window_missed notification",
          intent: "complaint",
          intent_confidence: 1.0,
        } as any);
        return "A team member will text you directly in a moment. Thank you for your patience.";
      }
      return null;
    }

    // ----- INVOICE SENT -----
    case "invoice_sent": {
      if (code === "1") {
        // Confirm receipt — log it
        await admin.from("communications").insert({
          operator_id: operatorId,
          customer_id: customerId,
          job_id: jobId,
          direction: "inbound",
          channel: "sms",
          raw_content: "[INVOICE RECEIPT CONFIRMED] Customer replied 1 to invoice_sent",
          intent: "other",
          intent_confidence: 1.0,
        } as any);
        return "Receipt confirmed. Thank you!";
      }
      return null;
    }

    // ----- RESCHEDULE OFFER -----
    case "reschedule_offer": {
      if (code === "1") {
        // Accept reschedule
        if (jobId) {
          await admin
            .from("jobs")
            .update({ status: "scheduled" } as any)
            .eq("id", jobId);
        }
        return "Your new date is confirmed. We'll send your time window the evening before.";
      }
      if (code === "2") {
        return "No problem — we'll look for another date. A team member will reach out shortly.";
      }
      if (code === "3") {
        await admin.from("communications").insert({
          operator_id: operatorId,
          customer_id: customerId,
          job_id: jobId,
          direction: "inbound",
          channel: "sms",
          raw_content: "[LIVE TEXT REQUESTED] Customer replied 3 to reschedule_offer",
          intent: "reschedule",
          intent_confidence: 1.0,
        } as any);
        return "A team member will be in touch shortly. Thank you!";
      }
      return null;
    }

    // ----- SPECIAL OFFER -----
    case "special_offer": {
      if (code.toUpperCase() === "YES") {
        await admin.from("communications").insert({
          operator_id: operatorId,
          customer_id: customerId,
          job_id: jobId,
          direction: "inbound",
          channel: "sms",
          raw_content: "[OFFER ACCEPTED] Customer replied YES to special_offer",
          intent: "other",
          intent_confidence: 1.0,
        } as any);
        return "Awesome — your offer has been claimed! We'll follow up with details.";
      }
      return null;
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main POST handler — Twilio webhook
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const from = formData.get("From") as string;
  const body = (formData.get("Body") as string || "").trim();
  const sid = formData.get("MessageSid") as string;
  const to = formData.get("To") as string;

  if (!from || !body) return error("Missing From or Body", 400);

  const admin = createAdminClient();

  // -----------------------------------------------------------------------
  // 1. Match operator by the Twilio number the message was sent TO
  // -----------------------------------------------------------------------
  const { data: operator } = await admin
    .from("operators")
    .select("id, name, owner_id")
    .eq("twilio_number", to)
    .single();

  if (!operator) return error("Operator not found for this number", 404);

  const operatorId = operator.id as string;

  // -----------------------------------------------------------------------
  // 2. Match customer by phone (fuzzy)
  // -----------------------------------------------------------------------
  const customer = await findCustomer(admin, operatorId, from);
  const customerId = customer?.id as string | null;

  // Build customer context for intent classification
  let customerContext = "";
  if (customer) {
    const { data: activeJobs } = await admin
      .from("jobs")
      .select("id, status, drop_address, dumpster_unit_number")
      .eq("customer_id", customer.id)
      .not("status", "in", '("paid","cancelled")')
      .order("created_at", { ascending: false })
      .limit(3);

    if (activeJobs && activeJobs.length > 0) {
      customerContext = `Customer: ${customer.name}. Active jobs: ${activeJobs
        .map((j: any) => `${j.status} at ${j.drop_address}`)
        .join("; ")}`;
    } else {
      customerContext = `Customer: ${customer.name}. No active jobs.`;
    }
  }

  // -----------------------------------------------------------------------
  // 3. Check if this is a reply code ("1", "2", "3", "YES")
  // -----------------------------------------------------------------------
  const trimmedUpper = body.toUpperCase();
  const isReplyCode =
    trimmedUpper === "1" ||
    trimmedUpper === "2" ||
    trimmedUpper === "3" ||
    trimmedUpper === "YES";

  let autoResponse: string | null = null;
  let detectedIntent = "other";
  let intentConfidence = 0.5;

  if (isReplyCode) {
    const lastTemplate = await findLastOutboundTemplate(
      admin,
      operatorId,
      from
    );

    if (lastTemplate) {
      autoResponse = await handleReplyCode(
        admin,
        operatorId,
        customerId,
        trimmedUpper,
        lastTemplate
      );
      detectedIntent = "other";
      intentConfidence = 1.0;
    }
    // If no template context found, fall through to intent classification
  }

  // -----------------------------------------------------------------------
  // 4. Classify intent via Claude (skip if already handled as reply code)
  // -----------------------------------------------------------------------
  if (!autoResponse && !isReplyCode) {
    try {
      const result = await classifyIntent({
        message: body,
        customerContext: customerContext || undefined,
      });
      detectedIntent = result.intent;
      intentConfidence = result.confidence;
    } catch (err) {
      console.error("[inbound-sms] Intent classification failed:", err);
      // Continue with "other" intent
    }

    // ----- Intent-specific auto-responses -----

    if (detectedIntent === "drop_request") {
      // New booking request — send the booking start template
      autoResponse = SMS_TEMPLATES.booking_request_start();
    }

    if (detectedIntent === "pickup_request" && customer) {
      // Find their active (dropped) job and flag pickup_requested
      const { data: activeJob } = await admin
        .from("jobs")
        .select("id, status")
        .eq("customer_id", customer.id)
        .in("status", ["dropped", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (activeJob) {
        await admin
          .from("jobs")
          .update({ status: "pickup_requested" } as any)
          .eq("id", activeJob.id);

        autoResponse =
          "Got it — we've flagged your dumpster for pickup. You'll receive a pickup window soon.";
      } else {
        autoResponse =
          "We couldn't find an active dumpster on your account. Please call us at (908) 725-0456 and we'll get it sorted.";
      }
    }

    if (detectedIntent === "reschedule") {
      autoResponse =
        "We'll check available dates and get back to you shortly. If you'd prefer to call, reach us at (908) 725-0456.";
    }

    if (detectedIntent === "complaint") {
      autoResponse =
        "We're sorry to hear that. A team member will review your message and get back to you shortly.";
    }

    // For "driver_note" and "other", no auto-response — just log and notify owner
  }

  // -----------------------------------------------------------------------
  // 5. Handle STOP / opt-out (Twilio handles this at carrier level, but log it)
  // -----------------------------------------------------------------------
  if (trimmedUpper === "STOP") {
    detectedIntent = "other";
    intentConfidence = 1.0;
    autoResponse = null; // Twilio handles the actual opt-out
  }

  // -----------------------------------------------------------------------
  // 6. Log the inbound message to communications
  // -----------------------------------------------------------------------
  const { data: commRecord, error: dbError } = await admin
    .from("communications")
    .insert({
      operator_id: operatorId,
      customer_id: customerId,
      direction: "inbound",
      channel: "sms",
      from_number: normalizePhone(from),
      to_number: to,
      raw_content: body,
      twilio_sid: sid,
      intent: detectedIntent,
      intent_confidence: intentConfidence,
      auto_responded: !!autoResponse,
      response_content: autoResponse || null,
      responded_at: autoResponse ? new Date().toISOString() : null,
    } as any)
    .select()
    .single();

  if (dbError) {
    console.error("[inbound-sms] DB insert error:", dbError);
    return error(dbError.message);
  }

  // -----------------------------------------------------------------------
  // 7. Send auto-response via Twilio and log outbound
  // -----------------------------------------------------------------------
  if (autoResponse) {
    try {
      const outMsg = await sendSMS({
        to: from,
        body: autoResponse,
        from: to, // Reply from the same Twilio number
      });

      // Log the outbound auto-response
      await admin.from("communications").insert({
        operator_id: operatorId,
        customer_id: customerId,
        job_id: (commRecord as any)?.job_id || null,
        direction: "outbound",
        channel: "sms",
        from_number: to,
        to_number: normalizePhone(from),
        raw_content: autoResponse,
        twilio_sid: outMsg.sid,
      } as any);
    } catch (err) {
      console.error("[inbound-sms] Failed to send auto-response:", err);
    }
  }

  // -----------------------------------------------------------------------
  // 8. For unhandled intents or owner-attention items, we rely on the
  //    dashboard polling communications with auto_responded = false.
  //    No additional notification mechanism needed here — the comms table
  //    entry is the notification.
  // -----------------------------------------------------------------------

  // Return empty TwiML (auto-response sent via API, not TwiML, for logging)
  return twiml();
}
