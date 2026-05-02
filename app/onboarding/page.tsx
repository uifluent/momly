"use client";

import { Suspense } from "react";
import Onboarding from "@/components/Onboarding";

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <Onboarding />
    </Suspense>
  );
}
