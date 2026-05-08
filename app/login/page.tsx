"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMomlyStore } from "@/lib/store";
import { Btn } from "@/components/UI";
import styles from "./page.module.css";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function LoginPage() {
  const router = useRouter();
  const setDisplayName = useMomlyStore((s) => s.setDisplayName);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localStorage.getItem("userName")) {
      router.replace("/");
      return;
    }
    inputRef.current?.focus();
  }, [router]);

  function handleContinue() {
    const trimmed = capitalize(name.trim());
    if (!trimmed) return;
    localStorage.setItem("userName", trimmed);
    setDisplayName(trimmed);
    const { profile } = useMomlyStore.getState();
    router.push(profile.onboardingComplete ? "/" : "/onboarding");
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.body}>
        <div className={styles.logoWrap}>
          <Image src="/logo.png" alt="Momly" width={105} height={30} priority />
        </div>

        <h1 className={styles.title}>Здравей 💛</h1>
        <p className={styles.sub}>Как да те наричам?</p>

        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Напиши името си"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleContinue()}
          autoComplete="given-name"
        />

        <Btn onClick={handleContinue} disabled={!name.trim()}>
          Продължи
        </Btn>
      </div>
    </div>
  );
}
