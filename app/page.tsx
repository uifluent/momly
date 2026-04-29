"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import Welcome from "@/components/Welcome";

export default function Home() {
  const router = useRouter();
  const onboardingComplete = useMomlyStore((s) => s.profile.onboardingComplete);

  useEffect(() => {
    if (onboardingComplete) router.replace("/decide");
  }, [onboardingComplete, router]);

  if (onboardingComplete) return null;
  return <Welcome />;
}
