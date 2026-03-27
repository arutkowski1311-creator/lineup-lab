/**
 * TIPPD SMS Templates
 *
 * Messaging philosophy:
 * - Minimal, purposeful communication
 * - No specific times until absolutely necessary
 * - Reply codes: 1 = confirm/accept, 2 = reschedule/different option, 3 = talk to us
 * - STOP = opt out
 * - Never ask for review if: late fees applied, rescheduled by us
 */

export type TemplateType =
  | "booking_confirmation"
  | "evening_before_delivery"
  | "delivery_complete"
  | "pickup_approaching"
  | "pickup_confirmed"
  | "evening_before_pickup"
  | "pickup_complete"
  | "invoice_sent"
  | "payment_reminder_30"
  | "payment_reminder_45"
  | "payment_overdue_60"
  | "payment_overdue_80"
  | "payment_thank_you"
  | "booking_request_start"
  | "pickup_request_ack"
  | "reschedule_by_company"
  | "severe_weather"
  | "special_offer"
  | "extension_ack";

// ─── Templates ───

export const SMS_TEMPLATES: Record<TemplateType, (...args: any[]) => string> = {

  // ── BOOKING FLOW ──

  booking_confirmation: (p: { date: string }) =>
    `Metro Waste: Your dumpster is scheduled for delivery on ${p.date}. You'll receive a confirmation the evening before. Terms: metrowasteservice.com/terms Reply STOP to opt out.`,

  evening_before_delivery: () =>
    `Metro Waste: Your dumpster delivery is confirmed for tomorrow. Your driver will be in touch. Questions? Reply 3 to text us.`,

  delivery_complete: () =>
    `Metro Waste: Your dumpster has been delivered! Standard rental is 7 days. We'll reach out to schedule pickup. Questions? Reply 3 to text us.`,

  // ── PICKUP FLOW ──

  pickup_approaching: () =>
    `Metro Waste: Your dumpster rental is approaching the end of the standard 7-day period. We'll schedule your pickup soon.\nReply 1 - Ready for pickup anytime\nReply 2 - I need more time\nReply 3 - Text us`,

  // Reply 1 → schedule pickup
  // Reply 2 → note extension, daily overage applies
  // Reply 3 → open live thread

  extension_ack: () =>
    `No problem. Daily overage rate of $25/day applies after day 7. Reply 1 when you're ready for pickup or call (908) 725-0456.`,

  pickup_confirmed: (p: { date: string }) =>
    `Metro Waste: Your dumpster pickup is scheduled for ${p.date}. We'll confirm the evening before.`,

  evening_before_pickup: () =>
    `Metro Waste: Your dumpster pickup is confirmed for tomorrow. Please ensure clear access to the dumpster. Questions? Reply 3 to text us.`,

  pickup_complete: () =>
    `Metro Waste: Your dumpster has been picked up. You'll receive your invoice shortly. Thank you for choosing Metro Waste!`,

  // ── CUSTOMER TEXTS IN ──

  booking_request_start: () =>
    `Thanks for reaching out to Metro Waste! To get you scheduled, we need:\n1. Delivery address\n2. Preferred date\n3. Dumpster size (10yd $550, 20yd $750, 30yd $850)\n\nReply with this info or call (908) 725-0456.`,

  pickup_request_ack: () =>
    `Got it! We are working on getting a truck to you. We will let you know as soon as we get it on the schedule.`,

  // ── INVOICING ──

  invoice_sent: (p: { number: string; amount: string; link: string }) =>
    `Metro Waste: Invoice #${p.number} for $${p.amount} has been sent.\nPay online: ${p.link}\nReply 1 to confirm receipt.`,

  // Reply 1 → logged as receipt confirmed

  // ── PAYMENT REMINDERS (escalating) ──

  payment_reminder_30: (p: { number: string; amount: string; link: string }) =>
    `Friendly reminder: Invoice #${p.number} for $${p.amount} is due. Pay online: ${p.link}`,

  payment_reminder_45: (p: { number: string; amount: string; link: string }) =>
    `Second notice: Invoice #${p.number} for $${p.amount} is now 15 days past due. Please remit payment to avoid late fees. Pay: ${p.link} Per our service agreement, late fees apply after 30 days past due. See metrowasteservice.com/terms`,

  payment_overdue_60: (p: { number: string; fee: string; total: string; link: string }) =>
    `Invoice #${p.number} is 30 days past due. A 7% late fee of $${p.fee} has been applied. Total now due: $${p.total}. Pay: ${p.link}\nReply 1 - Pay now\nReply 2 - Request payment plan\nReply 3 - Request a callback`,

  // Reply 1 → payment link
  // Reply 2 → flags for owner to set up payment arrangement
  // Reply 3 → callback request → routes to boss action center

  payment_overdue_80: (p: { number: string; total: string; link: string }) =>
    `FINAL NOTICE: Invoice #${p.number} is 50 days past due. An additional 10% fee has been applied. Total: $${p.total}. Pay immediately: ${p.link}\nReply 1 - Pay now\nReply 3 - Request a callback`,

  // ── PAYMENT RECEIVED ──
  // NOTE: Only sent if paid on time AND not rescheduled by company

  payment_thank_you: (p: { amount: string; reviewLink: string; eligible: boolean }) =>
    p.eligible
      ? `Metro Waste: Payment of $${p.amount} received - thank you! We hope we met your expectations. If you had a great experience, we'd love a review: ${p.reviewLink}`
      : `Metro Waste: Payment of $${p.amount} received - thank you for your business!`,

  // ── SCHEDULE CHANGES ──

  reschedule_by_company: (p: { type: string; oldDate: string; newDate: string }) =>
    `Metro Waste: Your ${p.type} originally planned for ${p.oldDate} has been rescheduled to ${p.newDate}. We apologize for the inconvenience.\nReply 1 - Request a callback\nReply 2 - Request a different date`,

  // Reply 1 → routes to boss
  // Reply 2 → routes to boss

  severe_weather: (p: { type: string }) =>
    `Metro Waste: Due to severe weather, our operations are limited. Your ${p.type} may be rescheduled. We'll confirm your new date as soon as conditions allow. Stay safe!`,

  // ── SPECIALS ──

  special_offer: (p: { customerName: string; offerText: string; code: string; expiresDate: string }) =>
    `🎉 ${p.customerName}, as a valued Metro Waste customer: ${p.offerText}. Use code ${p.code} by ${p.expiresDate}. Reply YES to claim or STOP to opt out.`,

  // Reply YES → logged, code activated
};

// ─── Reply Code Mapping ───
// Maps template types to what each reply code means

export const REPLY_ACTIONS: Record<string, Record<string, { action: string; description: string }>> = {
  pickup_approaching: {
    "1": { action: "schedule_pickup", description: "Customer ready for pickup" },
    "2": { action: "extend_rental", description: "Customer needs more time (overage applies)" },
    "3": { action: "open_thread", description: "Customer wants to text" },
  },
  invoice_sent: {
    "1": { action: "receipt_confirmed", description: "Customer confirmed receipt" },
  },
  payment_overdue_60: {
    "1": { action: "send_payment_link", description: "Customer wants to pay" },
    "2": { action: "flag_payment_plan", description: "Customer requesting payment plan" },
    "3": { action: "request_callback", description: "Customer wants a callback about overdue invoice" },
  },
  payment_overdue_80: {
    "1": { action: "send_payment_link", description: "Customer wants to pay" },
    "3": { action: "request_callback", description: "Customer wants a callback about final notice" },
  },
  reschedule_by_company: {
    "1": { action: "request_callback", description: "Customer wants a callback" },
    "2": { action: "request_new_date", description: "Customer wants a different date" },
  },
  evening_before_delivery: {
    "3": { action: "open_thread", description: "Customer has questions" },
  },
  delivery_complete: {
    "3": { action: "open_thread", description: "Customer has questions" },
  },
  evening_before_pickup: {
    "3": { action: "open_thread", description: "Customer has questions" },
  },
  special_offer: {
    "YES": { action: "claim_offer", description: "Customer claimed offer" },
  },
};

// ─── Review Eligibility ───

export function isEligibleForReview(job: {
  hadLateFees?: boolean;
  wasRescheduledByCompany?: boolean;
}): boolean {
  // Don't ask for review if late fees were applied or we rescheduled on them
  if (job.hadLateFees) return false;
  if (job.wasRescheduledByCompany) return false;
  return true;
}

// ─── Coupon Code Generator ───

export function generateCouponCode(prefix: string = "MW"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
