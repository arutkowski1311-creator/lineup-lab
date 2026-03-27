import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

export default function BrandSettings() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/settings" className="text-tippd-smoke hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-white">Brand Profile</h1>
      </div>
      <div className="max-w-2xl rounded-lg border border-white/10 bg-tippd-charcoal p-6 space-y-5">
        <div>
          <label className="block text-sm text-tippd-smoke mb-2">Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-tippd-steel flex items-center justify-center text-tippd-blue font-bold text-2xl">T</div>
            <button className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-md text-sm text-tippd-smoke hover:text-white"><Upload className="w-4 h-4" /> Upload Logo</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-tippd-smoke mb-1">Business Name</label><input defaultValue="Dumpster Rental Co" className="w-full h-10 px-3 rounded-md bg-tippd-steel border border-white/10 text-white text-sm" /></div>
          <div><label className="block text-sm text-tippd-smoke mb-1">Slug</label><input defaultValue="smithrolloff" className="w-full h-10 px-3 rounded-md bg-tippd-steel border border-white/10 text-white text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-tippd-smoke mb-1">Primary Color</label><div className="flex gap-2"><input defaultValue="#1B3A6B" className="flex-1 h-10 px-3 rounded-md bg-tippd-steel border border-white/10 text-white text-sm" /><div className="w-10 h-10 rounded-md bg-tippd-blue" /></div></div>
          <div><label className="block text-sm text-tippd-smoke mb-1">Accent Color</label><div className="flex gap-2"><input defaultValue="#6DB33F" className="flex-1 h-10 px-3 rounded-md bg-tippd-steel border border-white/10 text-white text-sm" /><div className="w-10 h-10 rounded-md bg-tippd-green" /></div></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-tippd-smoke mb-1">Phone</label><input defaultValue="(555) 123-4567" className="w-full h-10 px-3 rounded-md bg-tippd-steel border border-white/10 text-white text-sm" /></div>
          <div><label className="block text-sm text-tippd-smoke mb-1">Email</label><input defaultValue="info@example.com" className="w-full h-10 px-3 rounded-md bg-tippd-steel border border-white/10 text-white text-sm" /></div>
        </div>
        <div><label className="block text-sm text-tippd-smoke mb-1">Address</label><input defaultValue="123 Main St, Springfield, NJ 07081" className="w-full h-10 px-3 rounded-md bg-tippd-steel border border-white/10 text-white text-sm" /></div>
        <div><label className="block text-sm text-tippd-smoke mb-1">Service Area Description</label><textarea defaultValue="Serving Union, Essex, and Morris counties in Northern New Jersey" rows={2} className="w-full px-3 py-2 rounded-md bg-tippd-steel border border-white/10 text-white text-sm resize-none" /></div>
        <button className="w-full py-2.5 bg-tippd-blue text-white rounded-md text-sm font-semibold hover:opacity-90">Save Changes</button>
      </div>
    </div>
  );
}
