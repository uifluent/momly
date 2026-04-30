"use client";

import { useEffect, useState } from "react";

export function useUser() {
  const [name, setName] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("userName");
    setName(saved || null);
    setIsLoaded(true);
  }, []);

  return { name, isLoaded };
}
