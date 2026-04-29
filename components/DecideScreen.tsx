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
  { value: "short",  label: "20–40m",  sub: "quick breath"  },
  { value: "medium", label: "40–90m",  sub: "real break"    },
  { value: "long",   label: "1.5–3h",  sub: "whole stretch" },
];

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; sub: string }[] = [
  { value: "low",    label: "😴 Low",    sub: "nearly empty" },
  { value: "medium", label: "🙂 Okay",   sub: "getting by"   },
  { value: "high",   label: "⚡ High",   sub: "let's go"     },
];

const CTX_OPTIONS = [
  { value: "alone" as const, label: "🌙 Just me",    sub: "solo time"   },
  { value: "child" as const, label: "🧸 Together",   sub: "with child"  },
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
          <h2 className={styles.questionTitle}>What does right now look like?</h2>
          <p className={styles.questionSub}>Answer three things — I'll do the rest.</p>
        </div>

        {/* Time */}
        <section className={`${styles.filterSection} anim-fade-up delay-1`}>
          <p className={`label-caps ${styles.filterLabel}`}>⏱ How much time?</p>
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
          <p className={`label-caps ${styles.filterLabel}`}>💛 Energy level?</p>
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
          <p className={`label-caps ${styles.filterLabel}`}>👶 Who's with you?</p>
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
            Show me what to do →
          </Btn>
        </div>
      </div>

      <BottomNav
        items={[
          { icon: "💡", label: "DECIDE", href: "/decide", active: true },
          { icon: "🌿", label: "TODAY",  href: "/decide" },
        ]}
      />
    </div>
  );
}
