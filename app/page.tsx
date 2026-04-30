"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import Home from "@/components/Home";

export default function Page() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("userName")) {
      router.replace("/login");
      return;
    }

    const check = () => {
      const { profile } = useMomlyStore.getState();
      if (!profile.onboardingComplete) {
        router.replace("/onboarding");
      } else {
        setChecked(true);
      }
    };

    if (useMomlyStore.persist.hasHydrated()) {
      check();
    } else {
      return useMomlyStore.persist.onFinishHydration(check);
    }
  }, [router]);

  if (!checked) return null;
  return <Home />;
}
