"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { BottomNav } from "./BottomNav";

const HIDDEN_ON = ["/login", "/onboarding", "/decide", "/result"];

export function BottomNavWrapper() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // Show nav on /onboarding when opened from settings
  if (pathname.startsWith("/onboarding") && searchParams.get("from") === "settings") {
    return <BottomNav />;
  }

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  return <BottomNav />;
}
