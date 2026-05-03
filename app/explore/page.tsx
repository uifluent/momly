"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import Explore from "@/components/Explore";

export default function ExplorePage() {
  const router  = useRouter();
  const [ready, setReady] = useState(false);

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
        setReady(true);
      }
    };
    if (useMomlyStore.persist.hasHydrated()) {
      check();
    } else {
      return useMomlyStore.persist.onFinishHydration(check);
    }
  }, [router]);

  if (!ready) return null;
  return <Explore />;
}
