"use client";

import { useRouter } from "next/navigation";
import { Btn } from "./UI";
import styles from "./Welcome.module.css";

export default function Welcome() {
  const router = useRouter();
  return (
    <main className={styles.wrap}>
      <div className={`${styles.header} anim-fade-up`}>
        <div className={styles.icon}>🌿</div>
        <h1 className={styles.title}>Едно спокойно нещо за днес.</h1>
        <p className={styles.meta}>около 2 мин · без натиск</p>
      </div>

      <section className={`${styles.card} anim-card-in delay-1`}>
        <p className={styles.cardLabel}>Момли</p>
        <h2 className={styles.cardTitle}>Когато не знаеш откъде да започнеш.</h2>
        <p className={styles.cardText}>Ще ти предложа само една лека стъпка.</p>
        <Btn onClick={() => router.push("/onboarding")} className={styles.cta}>
          Започваме
        </Btn>
      </section>

      <div className={`${styles.secondary} anim-fade-up delay-2`}>
        <button className={styles.secondaryBtn} onClick={() => router.push("/decide")}>
          Имам нужда от идея сега
        </button>
      </div>
    </main>
  );
}
