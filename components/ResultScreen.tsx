"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { getBestIdeas } from "@/lib/getBestIdeas";
import type { Activity, Filters } from "@/lib/types";
import activitiesData from "@/data/activities.json";
import { Btn, Topbar } from "./UI";
import { getDescription, getSteps } from "@/lib/getDescription";
import styles from "./ResultScreen.module.css";

const activities = activitiesData as Activity[];

const TIME_LABEL: Record<string, string> = {
  short: "⏱ 20 – 40мин",
  medium: "⏱ 40 – 90мин",
  long: "⏱ 1.5 – 3ч",
};
const ENERGY_LABEL: Record<string, string> = {
  low: "🪫 Изтощена",
  medium: "👌 Окей",
  high: "⚡ Енергия",
};
const CTX_LABEL: Record<string, string> = {
  alone: "🙍‍♀️ Сама",
  child: "🐥 С детето",
};
const DURATION_LABEL: Record<string, string> = {
  short: "20 – 40мин",
  medium: "40 – 90мин",
  long: "1.5 – 3ч",
};
const EFFORT_LABEL: Record<string, string> = {
  zero: "без подготовка",
  low: "леко усилие",
  medium: "средно усилие",
};
const CATEGORY_LABEL: Record<string, string> = {
  "self-care": "ГРИЖА",
  movement: "ДВИЖЕНИЕ",
  calm: "СПОКОЙСТВИЕ",
  creative: "ТВОРЧЕСТВО",
  social: "СОЦИАЛНО",
  survival: "ОЦЕЛЯВАНЕ",
  "real-life": "РЕАЛЕН ЖИВОТ",
  reset: "ПАУЗА",
  explore: "ИЗСЛЕДВАНЕ",
  "life-admin": "ОРГАНИЗАЦИЯ",
};

export default function ResultScreen() {
  const router = useRouter();
  const store = useMomlyStore();
  const results = store.results;
  const filters = store.filters as Filters;
  const profile = store.profile;

  const [isSwitching, setIsSwitching] = useState(false);

  const primary = results[0];

  function handleAccept(activity: Activity) {
    store.likeIdea(activity.category);
    store.markCompleted(activity.id);
    store.addRecentId(activity.id);
    router.push("/decide");
  }

  function handleShuffle() {
    if (primary) store.skipIdea(primary.category);
    setIsSwitching(true);
    setTimeout(() => {
      const fresh = getBestIdeas(
        activities,
        filters,
        profile,
        store.recentIds,
        store.userPreferences,
      );
      store.setResults(fresh);
      if (fresh[0]) store.addRecentId(fresh[0].id);
      setIsSwitching(false);
    }, 200);
  }

  return (
    <div className={styles.wrap}>
      <Topbar showBack backHref="/decide" />
      <div className={styles.scrollBody}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className={`${styles.header} anim-fade-up`}>
          <h1 className={styles.headerTitle}>Може би имаш нужда от...</h1>
          <div className={styles.metaPills}>
            {filters.time && (
              <span className={styles.pill}>{TIME_LABEL[filters.time]}</span>
            )}
            {filters.energy && (
              <span className={styles.pill}>
                {ENERGY_LABEL[filters.energy]}
              </span>
            )}
            {filters.ctx && (
              <span className={styles.pill}>{CTX_LABEL[filters.ctx]}</span>
            )}
          </div>
        </div>

        {/* ── Primary card ─────────────────────────────────────────────────── */}
        {primary ? (
          <div
            className={isSwitching ? styles.cardSwitching : styles.cardReady}
          >
            <PrimaryCard
              activity={primary}
              filters={filters}
              onAccept={() => handleAccept(primary)}
              isFavorite={store.favorites.includes(primary.id)}
              onToggleFavorite={() => store.toggleFavorite(primary.id)}
              isCompleted={store.completedIds.includes(primary.id)}
            />
          </div>
        ) : (
          <div className={styles.empty}>
            <p>Хм, нищо точно не изникна. Опитай с различни отговори.</p>
            <Btn
              variant="outline"
              onClick={() => router.push("/decide")}
              className={styles.emptyBtn}
            >
              Да опитаме пак
            </Btn>
          </div>
        )}

        {primary && (
          <div className={styles.shuffleRow}>
            <button className={styles.shuffleBtn} onClick={handleShuffle}>
              <span className={styles.shuffleIcon}>🔄</span>
              <span>ПОКАЖИ ДРУГА ИДЕЯ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PrimaryCard({
  activity,
  filters,
  onAccept,
  isFavorite,
  onToggleFavorite,
  isCompleted,
}: {
  activity: Activity;
  filters: Filters;
  onAccept: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isCompleted: boolean;
}) {
  const [isPopping, setIsPopping] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Collapse when a new idea is loaded
  useEffect(() => {
    setExpanded(false);
  }, [activity.id]);

  function handleHeartClick() {
    onToggleFavorite();
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 250);
  }

  const steps = getSteps(activity, filters.energy);

  return (
    <div className={[styles.primaryCard, isCompleted ? styles.primaryCardCompleted : "", "anim-card-in"].join(" ")}>
      <button
        className={[styles.heartBtn, isPopping ? styles.heartBtnPop : ""].join(
          " ",
        )}
        onClick={handleHeartClick}
        aria-label={isFavorite ? "Премахни от любими" : "Запази идеята"}
      >
        {isFavorite ? "❤️" : "🤍"}
      </button>

      {isCompleted && (
        <p className={styles.completedBadge}>✨ Вече го направи</p>
      )}
      <div className={styles.cardCategoryRow}>
        {activity.emoji && (
          <span className={styles.cardCategoryEmoji}>{activity.emoji}</span>
        )}
        <p className={styles.cardCategory}>
          {CATEGORY_LABEL[activity.category[0]] ??
            activity.category[0].toUpperCase()}
        </p>
      </div>

      <h2 className={styles.cardTitle}>{activity.title}</h2>
      <p className={styles.cardDesc}>
        {getDescription(activity, filters.energy, filters.ctx)}
      </p>

      {expanded && steps.length > 0 && (
        <div className={styles.expandedContent}>
          <p className={styles.expandedLabel}>Как да започнеш:</p>
          <ul className={styles.stepsList}>
            {steps.slice(0, 3).map((step, i) => (
              <li key={i} className={styles.step}>
                <span className={styles.stepDot} />
                <span className={styles.stepText}>{step}</span>
              </li>
            ))}
          </ul>
          <p className={styles.expandedMeta}>
            {DURATION_LABEL[activity.duration[0]]} ·{" "}
            {EFFORT_LABEL[activity.effort]}
          </p>
        </div>
      )}

      <div className={styles.cardActions}>
        {!expanded ? (
          <button className={styles.btnDo} onClick={() => setExpanded(true)}>
            Научи повече
          </button>
        ) : (
          <button className={styles.btnDo} onClick={onAccept}>
            {isCompleted ? "Пак" : "Ще го направя"}
          </button>
        )}
      </div>
    </div>
  );
}
