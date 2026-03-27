"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SIGNALS = [
  { type: "conversion", label: "View-to-Book Rate", value: "38%", prev: "41%", trend: "down" as const, color: "text-red-400",
    insight: "62% of visitors leaving at pricing step this week vs 41% last month. Price resistance possible." },
  { type: "fuel", label: "Diesel Price", value: "$4.12/gal", prev: "$3.70", trend: "up" as const, color: "text-amber-400",
    insight: "Diesel up $0.42/gal over 30 days. At your route volume: ~$340/month extra cost." },
  { type: "demand", label: "Booking Velocity", value: "87%", prev: "54%", trend: "up" as const, color: "text-emerald-400",
    insight: "87% booked for next week with 5 days to go. Historically 54% at this point. Elevated demand." },
  { type: "utilization", label: "Fleet Utilization", value: "91%", prev: "78%", trend: "up" as const, color: "text-blue-400",
    insight: "Utilization above 88% threshold for 18 days. Likely delaying or losing bookings." },
];

const RECOMMENDATIONS = [
  { title: "Add $8/job fuel surcharge", impact: "+$340/mo", status: "pending", signal: "Diesel up 12%" },
  { title: "Raise 20yd rate by $25 this week", impact: "+$375/wk", status: "pending", signal: "Demand elevated" },
  { title: "Targeted promo to top contractors", impact: "+$600/mo", status: "approved", signal: "Low demand period" },
];

export default function PricingIntelligence() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/reports" className="text-tippd-smoke hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <Sparkles className="w-5 h-5 text-tippd-green" />
        <h1 className="text-2xl font-bold text-white">Pricing Intelligence</h1>
      </div>

      {/* Signal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {SIGNALS.map((s) => (
          <div key={s.type} className="rounded-lg border border-white/10 bg-tippd-charcoal p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-tippd-smoke">{s.label}</p>
              {s.trend === "up" ? <TrendingUp className={cn("w-4 h-4", s.color)} /> : <TrendingDown className={cn("w-4 h-4", s.color)} />}
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-tippd-ash mt-1">vs {s.prev} last period</p>
            <p className="text-xs text-tippd-smoke mt-2 border-t border-white/5 pt-2">{s.insight}</p>
          </div>
        ))}
      </div>

      {/* Active recommendations */}
      <h2 className="text-lg font-semibold text-white mb-3">Recommendations</h2>
      <div className="space-y-3">
        {RECOMMENDATIONS.map((rec, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-tippd-charcoal p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{rec.title}</p>
              <p className="text-xs text-tippd-ash mt-1">Signal: {rec.signal}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-emerald-400">{rec.impact}</span>
              {rec.status === "pending" ? (
                <div className="flex gap-1">
                  <button className="px-3 py-1.5 bg-tippd-blue text-white rounded text-xs font-medium">Approve</button>
                  <button className="px-3 py-1.5 border border-white/10 text-tippd-smoke rounded text-xs">Dismiss</button>
                </div>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded text-xs">Approved</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
