"use client";

import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { getBestIdeas } from "@/lib/getBestIdeas";
import type { Duration, EnergyLevel, Filters } from "@/lib/types";
import activitiesData from "@/data/activities.json";
import type { Activity } from "@/lib/types";
import { Topbar, Btn, Chip } from "./UI";
import styles from "./DecideScreen.module.css";

const activities = activitiesData as Activity[];

const TIME_OPTIONS: { value: Duration; label: string; sub: string }[] = [
  { value: "short", label: "20 – 40мин", sub: "" },
  { value: "medium", label: "40 – 90мин", sub: "" },
  { value: "long", label: "1.5 – 3ч", sub: "" },
];

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; sub: string }[] = [
  { value: "low", label: "Изморена 🪫", sub: "" },
  { value: "medium", label: "Окей 👌", sub: "" },
  { value: "high", label: "Енергична ⚡", sub: "" },
];

const CTX_OPTIONS = [
  { value: "alone" as const, label: "Сама 🙍‍♀️", sub: "" },
  { value: "child" as const, label: "С детето 🐥", sub: "" },
];

const TIME_META: Record<Duration, string> = {
  short: "20 – 40мин",
  medium: "40 – 90мин",
  long: "1.5 – 3ч",
};
const ENERGY_META: Record<EnergyLevel, string> = {
  low: "уморена",
  medium: "добре",
  high: "енергия",
};
const CTX_META: Record<Filters["ctx"], string> = {
  alone: "сама",
  child: "с детето",
};

export default function DecideScreen() {
  const router = useRouter();
  const store = useMomlyStore();
  const filters = store.filters as Partial<Filters>;
  const profile = store.profile;

  const ready = !!(filters.time && filters.energy && filters.ctx);
  const hasResults = store.results.length > 0;
  const meta = [
    filters.time ? TIME_META[filters.time] : "време",
    filters.energy ? ENERGY_META[filters.energy] : "енергия",
    filters.ctx ? CTX_META[filters.ctx] : "сама / с детето",
  ].join(" • ");

  function handleDecide() {
    if (!ready) return;
    const results = getBestIdeas(
      activities,
      filters as Filters,
      profile,
      store.recentIds,
      store.userPreferences,
      {
        favorites: store.favorites,
        completedIds: store.completedIds,
        city: profile.city,
      },
    );
    store.setResults(results);
    if (results[0]) store.addRecentId(results[0].id);
    router.push("/result");
  }

  return (
    <div className={styles.wrap}>
      <Topbar showBack onBack={() => router.push("/")} />

      <div className={styles.body}>
        <div className={`${styles.header} anim-fade-up`}>
          <h2 className={styles.title}>Хайде да измислим нещо за теб</h2>
          <p className={styles.meta}>{meta}</p>
        </div>

        <section className={`${styles.card} anim-card-in delay-1`}>
          <div className={styles.choiceGroup}>
            <p className={styles.choiceLabel}>С колко време разполагаш?</p>
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
          </div>

          <div className={styles.choiceGroup}>
            <p className={styles.choiceLabel}>Как се чувстваш днес?</p>
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
          </div>

          <div className={styles.choiceGroup}>
            <p className={styles.choiceLabel}>Сама ли си или с детето?</p>
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
          </div>
        </section>

        <div className={`${styles.ctaWrap} anim-fade-up delay-2`}>
          {hasResults && (
            <p className={styles.ctaMicro}>Можеш да промениш нещо</p>
          )}
          <Btn onClick={handleDecide} disabled={!ready}>
            ✨ Дай ми идея
          </Btn>
        </div>
      </div>
    </div>
  );
}
