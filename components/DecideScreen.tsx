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
  { value: "low",    label: "Доста тежко",        sub: "газ на резерва" },
  { value: "medium", label: "Горе-долу съм",      sub: "стабилно"       },
  { value: "high",   label: "Изненадващо добре", sub: "имам енергия"   },
];

const CTX_OPTIONS = [
  { value: "alone" as const, label: "🌙 Само аз",  sub: "само за мен"        },
  { value: "child" as const, label: "🧸 С детето", sub: "заедно"             },
];

const TIME_META: Record<Duration, string> = {
  short: "20–40 мин",
  medium: "40–90 мин",
  long: "1.5-3 ч",
};
const ENERGY_META: Record<EnergyLevel, string> = {
  low: "доста тежко",
  medium: "горе-долу",
  high: "изненадващо добре",
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
  const meta = [
    filters.time ? TIME_META[filters.time] : "колко време",
    filters.energy ? ENERGY_META[filters.energy] : "каква енергия",
    filters.ctx ? CTX_META[filters.ctx] : "с кого си",
  ].join(" • ");

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
        <div className={`${styles.header} anim-fade-up`}>
          <h2 className={styles.title}>Какво ти се прави сега?</h2>
          <p className={styles.meta}>{meta}</p>
        </div>

        <section className={`${styles.card} anim-card-in delay-1`}>
          <div className={styles.choiceGroup}>
            <p className={styles.choiceLabel}>Колко време имаш?</p>
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
            <p className={styles.choiceLabel}>Как си точно сега?</p>
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
            <p className={styles.choiceLabel}>С кого си?</p>
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
          <p className={styles.ctaMicro}>Няма грешен избор 🤍</p>
          <Btn onClick={handleDecide} disabled={!ready}>
            Дай ми идея
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
