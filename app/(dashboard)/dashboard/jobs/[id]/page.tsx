import Link from "next/link";
import { ArrowLeft, MapPin, Truck, Box, User, Clock, Camera, Scale } from "lucide-react";

export default function JobDetail({ params }: { params: { id: string } }) {
  // TODO: Fetch job from API
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/jobs" className="text-tippd-smoke hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Job #{params.id}</h1>
        <span className="px-2.5 py-0.5 rounded bg-green-900/30 text-green-400 text-xs font-medium">
          Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer + Address */}
          <div className="rounded-lg border border-white/10 bg-tippd-charcoal p-5">
            <h2 className="text-sm font-medium text-tippd-smoke mb-3">Job Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={User} label="Customer" value="Mike Johnson" />
              <InfoRow icon={MapPin} label="Address" value="123 Oak St, Springfield" />
              <InfoRow icon={Box} label="Dumpster" value="D-012 (20yd)" />
              <InfoRow icon={Truck} label="Truck" value="Truck 1 — Driver Mike" />
              <InfoRow icon={Clock} label="Dropped" value="Mar 24, 2026 9:15 AM" />
              <InfoRow icon={Scale} label="Weight" value="Pending pickup" />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-white/10 bg-tippd-charcoal p-5">
            <h2 className="text-sm font-medium text-tippd-smoke mb-4">Timeline</h2>
            <div className="space-y-4">
              {[
                { time: "Mar 24, 9:15 AM", event: "Dropped", actor: "Driver Mike", active: false },
                { time: "Mar 24, 9:00 AM", event: "En Route (Drop)", actor: "Driver Mike", active: false },
                { time: "Mar 23, 4:30 PM", event: "Scheduled", actor: "Owner", active: false },
                { time: "Mar 23, 2:15 PM", event: "Pending Approval", actor: "System (booking)", active: false },
              ].map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-tippd-blue mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-white">{entry.event}</p>
                    <p className="text-xs text-tippd-ash">{entry.time} — {entry.actor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="rounded-lg border border-white/10 bg-tippd-charcoal p-5">
            <h2 className="text-sm font-medium text-tippd-smoke mb-3">Photos</h2>
            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-lg bg-tippd-steel flex items-center justify-center">
                <Camera className="w-6 h-6 text-tippd-ash" />
              </div>
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-tippd-ash text-xs">
                Drop photo
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-tippd-charcoal p-5">
            <h2 className="text-sm font-medium text-tippd-smoke mb-3">Financials</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-tippd-smoke">Base rate</span><span className="text-white">$400.00</span></div>
              <div className="flex justify-between"><span className="text-tippd-smoke">Weight charge</span><span className="text-white">—</span></div>
              <div className="flex justify-between"><span className="text-tippd-smoke">Overage</span><span className="text-white">$0.00</span></div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-semibold"><span className="text-tippd-smoke">Total</span><span className="text-white">$400.00</span></div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-tippd-charcoal p-5">
            <h2 className="text-sm font-medium text-tippd-smoke mb-3">Notes</h2>
            <p className="text-sm text-tippd-smoke">Place in driveway, gate code: 1234</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-tippd-charcoal p-5">
            <h2 className="text-sm font-medium text-tippd-smoke mb-3">Actions</h2>
            <div className="space-y-2">
              <button className="w-full py-2 text-sm bg-tippd-blue text-white rounded-md hover:opacity-90">
                Schedule Pickup
              </button>
              <button className="w-full py-2 text-sm border border-white/10 text-tippd-smoke rounded-md hover:text-white hover:bg-white/5">
                Edit Job
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-tippd-ash mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-tippd-ash">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}
