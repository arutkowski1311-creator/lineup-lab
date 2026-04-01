import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/softball/bottom-nav";

export const metadata: Metadata = {
  title: "Lineup Lab — Youth Softball Lineup Manager",
  description: "Generate fair, balanced lineups for youth softball. Mobile-first game management.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <div className="min-h-screen pb-20 md:pb-0">
          {children}
        </div>
        <BottomNav />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: { fontSize: "14px" },
          }}
        />
      </body>
    </html>
  );
}
