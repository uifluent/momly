"use client";

import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { decide } from "@/lib/engine";
import type { Duration, EnergyLevel, Filters } from "@/lib/types";
import activitiesData from "@/data/activities.json";
import type { Activity } from "@/lib/types";
import { Topbar, Btn, Chip, BottomNav } from "./UI";
import styles from "./DecideScreen.module.css";

const activities = activitiesData as Activity[];

const TIME_OPTIONS: { value: Duration; label: string; sub: string }[] = [
  { value: "short",  label: "20–40м",  sub: "за малко въздух"  },
  { value: "medium", label: "40–90м",  sub: "истинска пауза"   },
  { value: "long",   label: "1.5–3ч",  sub: "цяло парче"       },
];

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; sub: string }[] = [
  { value: "low",    label: "😴 Без сили",  sub: "почти на нула" },
  { value: "medium", label: "🙂 Ставам",   sub: "горе-долу"    },
  { value: "high",   label: "⚡ На вълна", sub: "имам сили"    },
];

const CTX_OPTIONS = [
  { value: "alone" as const, label: "🌙 Само аз",  sub: "само за мен"        },
  { value: "child" as const, label: "🧸 С детето", sub: "заедно"             },
];

export default function DecideScreen() {
  const router = useRouter();
  const store = useMomlyStore();
  const filters = store.filters as Partial<Filters>;
  const profile = store.profile;

  const ready = !!(filters.time && filters.energy && filters.ctx);

  function handleDecide() {
    if (!ready) return;
    const results = decide(activities, filters as Filters, profile, store.recentIds);
    store.setResults(results);
    if (results[0]) store.addRecentId(results[0].id);
    router.push("/result");
  }

  return (
    <div className={styles.wrap}>
      <Topbar />

      <div className={styles.body}>
        <div className={`${styles.question} anim-fade-up`}>
          <h2 className={styles.questionTitle}>Как е при теб в момента?</h2>
          <p className={styles.questionSub}>Три въпроса и аз поемам от там.</p>
        </div>

        {/* Time */}
        <section className={`${styles.filterSection} anim-fade-up delay-1`}>
          <p className={`label-caps ${styles.filterLabel}`}>⏱ С колко време разполагаш?</p>
          <div className={styles.chipRow}>
            {TIME_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                sublabel={o.sub}
                selected={filters.time === o.value}
                onClick={() => store.setFilter("time", o.value)}
              />
            ))}
          </div>
        </section>

        {/* Energy */}
        <section className={`${styles.filterSection} anim-fade-up delay-2`}>
          <p className={`label-caps ${styles.filterLabel}`}>💛 На каква вълна си?</p>
          <div className={styles.chipRow}>
            {ENERGY_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                sublabel={o.sub}
                selected={filters.energy === o.value}
                onClick={() => store.setFilter("energy", o.value)}
              />
            ))}
          </div>
        </section>

        {/* Context */}
        <section className={`${styles.filterSection} anim-fade-up delay-3`}>
          <p className={`label-caps ${styles.filterLabel}`}>👶 С кого си в момента?</p>
          <div className={styles.chipRow}>
            {CTX_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                sublabel={o.sub}
                selected={filters.ctx === o.value}
                onClick={() => store.setFilter("ctx", o.value)}
              />
            ))}
          </div>
        </section>

        <div className={`${styles.ctaWrap} anim-fade-up delay-4`}>
          <Btn onClick={handleDecide} disabled={!ready}>
            Дай ми идея →
          </Btn>
        </div>
      </div>

      <BottomNav
        items={[
          { icon: "💡", label: "Реши",  href: "/decide", active: true },
          { icon: "🌿", label: "Днес",  href: "/decide" },
        ]}
      />
    </div>
  );
}
