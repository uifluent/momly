import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { BottomNavWrapper } from "@/components/BottomNavWrapper";

export const metadata: Metadata = {
  title: "Momly — your calm next step",
  description:
    "A decision-making assistant for mothers. Tells you what to do right now — without the mental load.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F6F2EF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div id="app-shell">
          {children}
          <Suspense fallback={null}><BottomNavWrapper /></Suspense>
        </div>
      </body>
    </html>
  );
}
