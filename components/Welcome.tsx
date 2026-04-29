"use client";

import { useRouter } from "next/navigation";
import { Btn } from "./UI";
import styles from "./Welcome.module.css";

export default function Welcome() {
  const router = useRouter();
  return (
    <main className={styles.wrap}>
      <div className={`${styles.icon} anim-fade-up`}>🌿</div>
      <h1 className={`${styles.title} anim-fade-up delay-1`}>
        Hi, I'm Momly.
      </h1>
      <p className={`${styles.sub} anim-fade-up delay-2`}>
        I help you decide what to do right now —<br />
        without the mental load.<br /><br />
        No plans. No pressure. Just a calm next step.
      </p>
      <div className={`${styles.btnWrap} anim-fade-up delay-3`}>
        <Btn onClick={() => router.push("/onboarding")}>Let's get started</Btn>
      </div>
      <p className={`${styles.note} anim-fade-up delay-4`}>
        Takes about 2 minutes · Free to use
      </p>
    </main>
  );
}
