"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import DecideScreen from "@/components/DecideScreen";

export default function DecidePage() {
  const router = useRouter();
  const onboardingComplete = useMomlyStore((s) => s.profile.onboardingComplete);

  useEffect(() => {
    if (!onboardingComplete) router.replace("/onboarding");
  }, [onboardingComplete, router]);

  if (!onboardingComplete) return null;
  return <DecideScreen />;
}
