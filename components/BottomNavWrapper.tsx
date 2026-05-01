"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";

const HIDDEN_ON = ["/login", "/onboarding", "/decide", "/result"];

export function BottomNavWrapper() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  return <BottomNav />;
}
