"use client";

import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { Topbar, Btn } from "@/components/UI";
import type { Need } from "@/lib/types";
import styles from "@/components/Onboarding.module.css";

const NEEDS: { value: Need; emoji: string; label: string }[] = [
  { value: "me-time",          emoji: "🛁",  label: "Време за мен"       },
  { value: "meals",            emoji: "🍳",  label: "Бързи рецепти"      },
  { value: "child-activities", emoji: "🧸",  label: "Занимания с детето" },
  { value: "outside",          emoji: "🌤️", label: "Активности навън"   },
  { value: "movement",         emoji: "🧘‍♀️", label: "Движение"           },
  { value: "calm",             emoji: "🌙",  label: "Спокойствие"        },
  { value: "creative",         emoji: "🎨",  label: "Нещо творческо"     },
];

export default function NeedsSettingsPage() {
  const router = useRouter();
  const store  = useMomlyStore();
  const needs  = store.profile.needs;

  return (
    <div className={styles.wrap}>
      <Topbar showBack onBack={() => router.push("/settings")} hideFav />

      <div className={styles.body}>
        <div className={`${styles.header} anim-fade-up`}>
          <h2 className={styles.title}>От какво най-вече имаш нужда?</h2>
          <p className={styles.meta}>{needs.length}/3 избрани</p>
        </div>

        <div className={`${styles.card} anim-card-in delay-1`}>
          <p className={styles.cardLabel}>Избери до 3</p>
          <div className={styles.needsGrid}>
            {NEEDS.map((n) => (
              <button
                key={n.value}
                className={[
                  styles.needChip,
                  needs.includes(n.value) ? styles.needChipSel : "",
                ].join(" ")}
                onClick={() => store.toggleNeed(n.value)}
              >
                <span className={styles.needEmoji}>{n.emoji}</span>
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <Btn
          onClick={() => router.push("/settings")}
          disabled={needs.length < 1}
          className={styles.ctaBtn}
        >
          Запази
        </Btn>
      </div>
    </div>
  );
}
