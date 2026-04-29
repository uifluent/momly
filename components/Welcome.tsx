"use client";

import { useRouter } from "next/navigation";
import { Btn } from "./UI";
import styles from "./Welcome.module.css";

export default function Welcome() {
  const router = useRouter();
  return (
    <main className={styles.wrap}>
      <div className={`${styles.icon} anim-fade-up`}>🌿</div>
      <h1 className={`${styles.title} anim-fade-up delay-1`}>Хей! Аз съм Момли.</h1>
      <p className={`${styles.sub} anim-fade-up delay-2`}>
        Когато не знаеш откъде да хванеш — аз съм тук.
        <br />
        <br />
        Без натиск. Без перфекция. Само едно малко, спокойно нещо.
      </p>
      <div className={`${styles.btnWrap} anim-fade-up delay-3`}>
        <Btn onClick={() => router.push("/onboarding")}>Да започнем</Btn>
      </div>
      <p className={`${styles.note} anim-fade-up delay-4`}>
        Около 2 минути · Безплатно
      </p>
    </main>
  );
}
