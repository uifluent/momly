"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import ResultScreen from "@/components/ResultScreen";

export default function ResultPage() {
  const router = useRouter();
  const results = useMomlyStore((s) => s.results);

  useEffect(() => {
    if (!results.length) router.replace("/decide");
  }, [results, router]);

  if (!results.length) return null;
  return <ResultScreen />;
}
