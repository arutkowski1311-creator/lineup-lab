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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased" style={{ background: "hsl(0 0% 7%)", color: "hsl(40 20% 92%)" }}>
        <div className="min-h-screen pb-20">
          {children}
        </div>
        <BottomNav />
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: { fontSize: "14px", background: "hsl(0 0% 12%)", color: "hsl(40 20% 92%)", borderColor: "hsl(0 0% 18%)" },
          }}
        />
      </body>
    </html>
  );
}
