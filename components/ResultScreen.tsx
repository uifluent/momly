"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { getBestIdeas } from "@/lib/getBestIdeas";
import type { Activity, Filters } from "@/lib/types";
import activitiesData from "@/data/activities.json";
import { Btn } from "./UI";
import styles from "./ResultScreen.module.css";

const activities = activitiesData as Activity[];

const TIME_LABEL: Record<string, string> = {
  short:  "⏱ 20–40 мин",
  medium: "⏱ 40–90 мин",
  long:   "⏱ 1.5–3 ч",
};
const ENERGY_LABEL: Record<string, string> = {
  low:    "😴 Малко енергия",
  medium: "🙂 Ставам де",
  high:   "⚡ На вълна",
};
const CTX_LABEL: Record<string, string> = {
  alone: "🌙 Само аз",
  child: "👶 С детето",
};
const DURATION_LABEL: Record<string, string> = {
  short:  "20–40 мин",
  medium: "40–90 мин",
  long:   "1.5–3 ч",
};
const EFFORT_LABEL: Record<string, string> = {
  zero:   "без подготовка",
  low:    "леко усилие",
  medium: "средно усилие",
};

const CATEGORY_LABEL: Record<string, string> = {
  "self-care":  "ГРИЖА",
  "movement":   "ДВИЖЕНИЕ",
  "calm":       "СПОКОЙСТВИЕ",
  "creative":   "ТВОРЧЕСТВО",
  "social":     "СОЦИАЛНО",
  "survival":   "ОЦЕЛЯВАНЕ",
  "real-life":  "РЕАЛЕН ЖИВОТ",
  "reset":      "ПАУЗА",
  "explore":    "ИЗСЛЕДВАНЕ",
  "life-admin": "ОРГАНИЗАЦИЯ",
};

export default function ResultScreen() {
  const router = useRouter();
  const store = useMomlyStore();
  const results = store.results;
  const filters = store.filters as Filters;
  const profile = store.profile;

  const [chosenActivity, setChosenActivity] = useState<Activity | null>(null);

  const primary = results[0];
  const secondary = results[1] ?? null;

  function handleAccept(activity: Activity) {
    setChosenActivity(activity);
    store.addRecentId(activity.id);
  }

  function handleShuffle() {
    const fresh = getBestIdeas(activities, filters, profile, store.recentIds);
    store.setResults(fresh);
    if (fresh[0]) store.addRecentId(fresh[0].id);
    setChosenActivity(null);
  }

  if (chosenActivity) {
    return (
      <div className={styles.wrap}>
        <div className={styles.acceptedWrap}>
          <div className={styles.acceptedIcon}>✨</div>
          <h2 className={styles.acceptedTitle}>Добре. Това стига.</h2>
          <p className={styles.acceptedChosen}>{chosenActivity.title}</p>

          {chosenActivity.steps.length > 0 && (
            <div className={styles.acceptedCard}>
              <p className={styles.acceptedStepsLabel}>Как да започнеш:</p>
              <ul className={styles.acceptedSteps}>
                {chosenActivity.steps.slice(0, 3).map((step, i) => (
                  <li key={i} className={styles.acceptedStep}>
                    <span className={styles.acceptedStepDot} />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className={styles.acceptedContext}>
            {DURATION_LABEL[chosenActivity.duration[0]]} · {EFFORT_LABEL[chosenActivity.effort]}
          </p>

          <Btn onClick={() => { setChosenActivity(null); router.push("/decide"); }}>
            Готово
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.scrollBody}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className={`${styles.header} anim-fade-up`}>
          <h1 className={styles.headerTitle}>Ето едно нещо за теб.</h1>
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
            isFavorite={store.favorites.includes(primary.id)}
            onToggleFavorite={() => store.toggleFavorite(primary.id)}
          />
        ) : (
          <div className={styles.empty}>
            <p>Хм, нищо точно не изникна. Опитай с различни отговори.</p>
            <Btn variant="outline" onClick={() => router.push("/decide")} className={styles.emptyBtn}>
              Да опитаме пак
            </Btn>
          </div>
        )}

        {/* ── Secondary card ───────────────────────────────────────────────── */}
        {secondary && (
          <SecondaryCard
            activity={secondary}
            filters={filters}
            onAccept={() => handleAccept(secondary)}
            isFavorite={store.favorites.includes(secondary.id)}
            onToggleFavorite={() => store.toggleFavorite(secondary.id)}
          />
        )}

        {primary && (
          <div className={styles.shuffleRow}>
            <button className={styles.shuffleBtn} onClick={handleShuffle}>
              Покажи друга идея
            </button>
          </div>
        )}

        <div className={styles.backRow}>
          <Btn variant="ghost" onClick={() => router.push("/decide")}>
            Промени отговорите
          </Btn>
        </div>
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
}: {
  activity: Activity;
  filters: Filters;
  onAccept: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const [isPopping, setIsPopping] = useState(false);

  function handleHeartClick() {
    onToggleFavorite();
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 250);
  }

  return (
    <div className={`${styles.primaryCard} anim-card-in`}>
      <button
        className={[styles.heartBtn, isPopping ? styles.heartBtnPop : ""].join(" ")}
        onClick={handleHeartClick}
        aria-label={isFavorite ? "Премахни от любими" : "Запази идеята"}
      >
        {isFavorite ? "❤️" : "🤍"}
      </button>
      <p className={styles.cardCategory}>{CATEGORY_LABEL[activity.category[0]] ?? activity.category[0].toUpperCase()}</p>
      <h2 className={styles.cardTitle}>{activity.title}</h2>
      <p className={styles.cardDesc}>{activity.description}</p>

      <div className={styles.cardActions}>
        <button className={styles.btnDo} onClick={onAccept}>Това е</button>
      </div>
    </div>
  );
}

function SecondaryCard({
  activity,
  filters,
  onAccept,
  isFavorite,
  onToggleFavorite,
}: {
  activity: Activity;
  filters: Filters;
  onAccept: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const [isPopping, setIsPopping] = useState(false);

  function handleHeartClick() {
    onToggleFavorite();
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 250);
  }

  return (
    <div className={`${styles.secondaryCard} anim-card-in delay-2`}>
      <p className={styles.secondaryLabel}>{TIME_LABEL[filters.time]} · {CATEGORY_LABEL[activity.category[0]] ?? activity.category[0]}</p>
      <h3 className={styles.secondaryTitle}>{activity.title}</h3>
      <div className={styles.secondaryFooter}>
        <span className={styles.secondaryTime}>Друга идея</span>
        <div className={styles.secondaryActions}>
          <button
            className={[styles.heartBtnSm, isPopping ? styles.heartBtnPop : ""].join(" ")}
            onClick={handleHeartClick}
            aria-label={isFavorite ? "Премахни от любими" : "Запази идеята"}
          >
            {isFavorite ? "❤️" : "🤍"}
          </button>
          <button className={styles.secondaryBtn} onClick={onAccept}>Това</button>
        </div>
      </div>
    </div>
  );
}
