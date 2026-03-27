"use client";

import { Sidebar } from "./Sidebar";
import { Bell, Search, User, Menu } from "lucide-react";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export function DashboardLayout({
  children,
  userName = "Owner",
  userRole = "owner",
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content — offset by sidebar on desktop only */}
      <div className="lg:ml-56 min-h-screen flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-14 border-b border-white/5 bg-tippd-ink/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
          {/* Mobile hamburger + Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-tippd-smoke hover:text-white p-1 -ml-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-tippd-smoke">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs, customers, dumpsters..."
                className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 placeholder:text-tippd-ash"
              />
            </div>
            {/* Mobile: just show TIPPD text */}
            <span className="sm:hidden text-white font-bold text-sm">TIPPD</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Search icon on mobile */}
            <button className="sm:hidden text-tippd-smoke hover:text-white">
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button className="relative text-tippd-smoke hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-tippd-blue rounded-full" />
            </button>

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-tippd-steel flex items-center justify-center">
                <User className="w-4 h-4 text-tippd-smoke" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white leading-none">
                  {userName}
                </p>
                <p className="text-xs text-tippd-ash capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content — responsive padding */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
