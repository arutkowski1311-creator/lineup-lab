"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, Phone, Mail, Sparkles } from "lucide-react";

const MOCK_COMMS = [
  { id: "1", customer: "Mike Johnson", content: "Hey, can I get a pickup on Thursday?", channel: "sms", intent: "pickup_request", confidence: 0.94, time: "10 min ago", unread: true },
  { id: "2", customer: "Sarah Williams", content: "Can we reschedule to next week?", channel: "sms", intent: "reschedule", confidence: 0.88, time: "45 min ago", unread: true },
  { id: "3", customer: "Unknown", content: "[Voicemail — 0:42] Transcription pending", channel: "voicemail", intent: null, confidence: 0, time: "2 hrs ago", unread: true },
  { id: "4", customer: "Premier Roofing", content: "Thanks for the quick delivery!", channel: "sms", intent: "other", confidence: 0.72, time: "Yesterday", unread: false },
];

const INTENT_COLORS: Record<string, string> = {
  pickup_request: "bg-blue-900/30 text-blue-400",
  reschedule: "bg-amber-900/30 text-amber-400",
  complaint: "bg-red-900/30 text-red-400",
  drop_request: "bg-green-900/30 text-green-400",
  other: "bg-gray-700/30 text-gray-400",
};

export default function CommsPage() {
  const unreadCount = MOCK_COMMS.filter((c) => c.unread).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Communications</h1>
          <p className="text-sm text-tippd-smoke mt-1">{unreadCount} unread messages</p>
        </div>
      </div>

      <div className="space-y-2">
        {MOCK_COMMS.map((comm) => (
          <div
            key={comm.id}
            className={cn(
              "rounded-lg border p-4 transition-colors cursor-pointer hover:border-tippd-blue/50",
              comm.unread ? "border-white/10 bg-tippd-charcoal" : "border-white/5 bg-tippd-charcoal/50"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-tippd-steel flex items-center justify-center shrink-0 mt-0.5">
                  {comm.channel === "sms" ? <MessageSquare className="w-4 h-4 text-tippd-smoke" /> :
                   comm.channel === "voicemail" ? <Phone className="w-4 h-4 text-tippd-smoke" /> :
                   <Mail className="w-4 h-4 text-tippd-smoke" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-medium", comm.unread ? "text-white" : "text-tippd-smoke")}>{comm.customer}</p>
                    {comm.unread && <span className="w-2 h-2 rounded-full bg-tippd-blue" />}
                  </div>
                  <p className="text-sm text-tippd-ash mt-0.5 truncate">{comm.content}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-tippd-ash">{comm.time}</span>
                {comm.intent && (
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1", INTENT_COLORS[comm.intent] || INTENT_COLORS.other)}>
                    <Sparkles className="w-3 h-3" />
                    {comm.intent.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>

            {comm.intent === "pickup_request" && (
              <div className="mt-3 ml-11 flex gap-2">
                <button className="px-3 py-1.5 bg-tippd-blue text-white rounded text-xs font-medium hover:opacity-90">
                  Schedule Pickup
                </button>
                <button className="px-3 py-1.5 border border-white/10 text-tippd-smoke rounded text-xs hover:text-white">
                  Draft Reply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
