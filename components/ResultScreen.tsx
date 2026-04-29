"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { decide } from "@/lib/engine";
import type { Activity, Filters } from "@/lib/types";
import activitiesData from "@/data/activities.json";
import { BottomNav, Btn } from "./UI";
import styles from "./ResultScreen.module.css";

const activities = activitiesData as Activity[];

const TIME_LABEL: Record<string, string> = {
  short: "⏱ 20–40 min",
  medium: "⏱ 40–90 min",
  long: "⏱ 1.5–3 hrs",
};
const ENERGY_LABEL: Record<string, string> = {
  low: "😴 Low energy",
  medium: "🙂 Okay",
  high: "⚡ High energy",
};
const CTX_LABEL: Record<string, string> = {
  alone: "🌙 Just me",
  child: "👶 With child",
};

export default function ResultScreen() {
  const router = useRouter();
  const store = useMomlyStore();
  const results = store.results;
  const filters = store.filters as Filters;
  const profile = store.profile;

  const [accepted, setAccepted] = useState(false);
  const [acceptedTitle, setAcceptedTitle] = useState("");

  const primary = results[0];
  const secondary = results[1] ?? null;

  function handleAccept(activity: Activity) {
    setAccepted(true);
    setAcceptedTitle(activity.title);
    store.addRecentId(activity.id);
  }

  function handleShuffle() {
    const fresh = decide(activities, filters, profile, store.recentIds);
    store.setResults(fresh);
    if (fresh[0]) store.addRecentId(fresh[0].id);
    setAccepted(false);
  }

  if (accepted) {
    return (
      <div className={styles.wrap}>
        <div className={styles.acceptedWrap}>
          <div className={styles.acceptedIcon}>🌿</div>
          <h2 className={styles.acceptedTitle}>Наслади се на момента.</h2>
          <p className={styles.acceptedSub}>
            Избра: <strong>{acceptedTitle}</strong>.<br />
            Върни се когато си готова.
          </p>
          <Btn onClick={() => { setAccepted(false); router.push("/decide"); }}>
            Обратно
          </Btn>
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

  return (
    <div className={styles.wrap}>
      <div className={styles.scrollBody}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className={`${styles.header} anim-fade-up`}>
          <h1 className={styles.headerTitle}>Let's make this easy ✨</h1>
          <div className={styles.metaPills}>
            {filters.time   && <span className={styles.pill}>{TIME_LABEL[filters.time]}</span>}
            {filters.energy && <span className={styles.pill}>{ENERGY_LABEL[filters.energy]}</span>}
            {filters.ctx    && <span className={styles.pill}>{CTX_LABEL[filters.ctx]}</span>}
          </div>
        </div>

        {/* ── Primary card ─────────────────────────────────────────────────── */}
        {primary ? (
          <PrimaryCard
            activity={primary}
            filters={filters}
            onAccept={() => handleAccept(primary)}
            onShuffle={handleShuffle}
          />
        ) : (
          <div className={styles.empty}>
            <p>Няма перфектно съвпадение. Опитай с различни филтри.</p>
            <Btn variant="outline" onClick={() => router.push("/decide")} className={styles.emptyBtn}>
              Промени
            </Btn>
          </div>
        )}

        {/* ── Secondary card ───────────────────────────────────────────────── */}
        {secondary && (
          <SecondaryCard activity={secondary} filters={filters} onAccept={() => handleAccept(secondary)} />
        )}

        <div className={styles.backRow}>
          <Btn variant="ghost" onClick={() => router.push("/decide")}>
            ← Промени филтрите
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

// ── Sub-components ────────────────────────────────────────────────────────────

function PrimaryCard({
  activity,
  filters,
  onAccept,
  onShuffle,
}: {
  activity: Activity;
  filters: Filters;
  onAccept: () => void;
  onShuffle: () => void;
}) {
  const ageMeta =
    activity.ageRange
      ? `👶 ${Math.floor(activity.ageRange[0] / 12)}–${Math.floor(activity.ageRange[1] / 12)} yrs`
      : null;

  return (
    <div className={`${styles.primaryCard} anim-card-in`}>
      <p className={styles.cardCategory}>{activity.category.toUpperCase()}</p>
      <h2 className={styles.cardTitle}>{activity.title}</h2>
      <p className={styles.cardDesc}>{activity.description}</p>

      <ol className={styles.stepsList}>
        {activity.steps.map((step, i) => (
          <li key={i} className={styles.step}>
            <span className={styles.stepNum}>{i + 1}</span>
            <span className={styles.stepText}>{step}</span>
          </li>
        ))}
      </ol>

      <div className={styles.cardMeta}>
        <span className={styles.metaTag}>{TIME_LABEL[filters.time]}</span>
        <span className={styles.metaTag}>
          {activity.effort === "zero" ? "✦ Без подготовка" : `${activity.effort} усилие`}
        </span>
        {ageMeta && <span className={styles.metaTag}>{ageMeta}</span>}
      </div>

      <div className={styles.cardActions}>
        <button className={styles.btnDo} onClick={onAccept}>✓ Ще го направим</button>
        <button className={styles.btnNext} onClick={onShuffle}>Покажи друго →</button>
      </div>

      <p className={styles.warmth}>Не трябва да е перфектно. Достатъчно е. 🤍</p>
    </div>
  );
}

function SecondaryCard({
  activity,
  filters,
  onAccept,
}: {
  activity: Activity;
  filters: Filters;
  onAccept: () => void;
}) {
  return (
    <div className={`${styles.secondaryCard} anim-card-in delay-2`}>
      <p className={styles.secondaryLabel}>Също добър вариант</p>
      <h3 className={styles.secondaryTitle}>{activity.title}</h3>
      <p className={styles.secondaryDesc}>{activity.description}</p>
      <div className={styles.secondaryFooter}>
        <span className={styles.secondaryTime}>{TIME_LABEL[filters.time]} · {activity.category[0]}</span>
        <button className={styles.secondaryBtn} onClick={onAccept}>Избери</button>
      </div>
    </div>
  );
}
