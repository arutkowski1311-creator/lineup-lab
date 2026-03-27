import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

const INTEGRATIONS = [
  { name: "Supabase", desc: "Database, Auth, Storage", connected: true },
  { name: "Stripe", desc: "Payment processing", connected: true },
  { name: "Twilio", desc: "SMS & Voice", connected: false },
  { name: "Resend", desc: "Transactional email", connected: true },
  { name: "Google Maps", desc: "Geocoding, routes, Places autocomplete", connected: false },
  { name: "Claude API", desc: "AI content & insights", connected: true },
];

export default function IntegrationsSettings() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/settings" className="text-tippd-smoke hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
      </div>
      <div className="space-y-2 max-w-2xl">
        {INTEGRATIONS.map((int) => (
          <div key={int.name} className="rounded-lg border border-white/10 bg-tippd-charcoal p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{int.name}</p>
              <p className="text-xs text-tippd-ash">{int.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              {int.connected ? (
                <><CheckCircle className="w-4 h-4 text-emerald-400" /><span className="text-xs text-emerald-400">Connected</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-tippd-ash" /><span className="text-xs text-tippd-ash">Not configured</span></>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
