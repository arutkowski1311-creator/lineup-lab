"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, User } from "lucide-react";

interface DriverLayoutProps {
  children: React.ReactNode;
  driverName?: string;
}

export function DriverLayout({
  children,
  driverName = "Driver",
}: DriverLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isRoot = pathname === "/driver";

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Mobile header — high contrast, large tap targets */}
      <header className="sticky top-0 z-30 h-14 bg-white border-b-2 border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          {!isRoot && (
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {isRoot && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-tippd-navy flex items-center justify-center text-white font-bold text-sm">
                T
              </div>
              <span className="font-bold text-lg">Today&apos;s Route</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/driver"
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200"
            aria-label="Map view"
          >
            <MapPin className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-tippd-blue/10">
            <User className="w-5 h-5 text-tippd-blue" />
          </div>
        </div>
      </header>

      {/* Content — full height for mobile */}
      <main className="pb-20">{children}</main>

      {/* Bottom bar — driver name + status */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t-2 border-gray-200 flex items-center justify-between px-4 z-30">
        <div>
          <p className="text-sm font-semibold">{driverName}</p>
          <p className="text-xs text-gray-500">On Route</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tippd-green" />
          <span className="text-xs font-medium text-tippd-green">Active</span>
        </div>
      </div>
    </div>
  );
}
