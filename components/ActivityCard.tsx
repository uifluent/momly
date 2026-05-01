"use client";

import { useState } from "react";
import { Btn } from "./UI";
import type { Activity, Duration, Filters } from "@/lib/types";
import { getDescription, getSteps } from "@/lib/getDescription";
import styles from "./ActivityCard.module.css";

const DURATION_LABEL: Record<Duration, string> = {
  short: "20 – 40мин",
  medium: "40 – 90мин",
  long: "1.5 – 3ч",
};

const CATEGORY_LABEL: Record<string, string> = {
  "self-care": "Грижа за себе си",
  movement: "Движение",
  calm: "Спокойствие",
  creative: "Творчество",
  social: "Социално",
  survival: "Оцеляване",
  "real-life": "Реален живот",
  reset: "Пауза",
  explore: "Изследване",
  "life-admin": "Организация",
};

export interface ActivityCardProps {
  activity: Activity;
  filters: Filters;
  isFavorite: boolean;
  isCompleted: boolean;
  showDetail: boolean;
  done: boolean;
  isAnimating: boolean;
  onStart: () => void;
  onDone: () => void;
  onToggleFavorite: () => void;
}

export function ActivityCard({
  activity,
  filters,
  isFavorite,
  isCompleted,
  showDetail,
  done,
  isAnimating,
  onStart,
  onDone,
  onToggleFavorite,
}: ActivityCardProps) {
  const desc = getDescription(activity, filters.energy, filters.ctx);
  const steps = getSteps(activity, filters.energy);

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={[
        styles.card,
        isAnimating ? styles.cardHidden : styles.cardVisible,
      ].join(" ")}
    >
      {/* Save / heart */}
      <button
        className={styles.heartBtn}
        onClick={onToggleFavorite}
        aria-label={isFavorite ? "Премахни от любими" : "Запази"}
      >
        {isFavorite ? "❤️" : "🤍"}
      </button>

      {isCompleted && (
        <p className={styles.completedBadge}>✨ Вече го направи</p>
      )}

      {/* Category */}
      <p className={styles.category}>
        {activity.emoji && (
          <span className={styles.emoji}>{activity.emoji}</span>
        )}
        {CATEGORY_LABEL[activity.category[0]] ?? activity.category[0]}
      </p>

      {/* Title + description */}
      <h2 className={styles.title}>{activity.title}</h2>
      <p className={styles.desc}>{desc}</p>

      {/* Collapsible "Как да започна" */}
      {steps.length > 0 && !showDetail && (
        <div className={styles.howTo}>
          <button
            className={styles.howToToggle}
            onClick={() => setIsExpanded((v) => !v)}
            aria-expanded={isExpanded}
          >
            <span>Как да започна</span>
            <svg
              className={[
                styles.chevron,
                isExpanded ? styles.chevronOpen : "",
              ].join(" ")}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className={[
              styles.howToBody,
              isExpanded ? styles.howToBodyOpen : "",
            ].join(" ")}
          >
            <ul className={styles.howToSteps}>
              {steps.slice(0, 4).map((step, i) => (
                <li key={i} className={styles.howToStep}>
                  <span className={styles.stepDot} />
                  <span className={styles.stepText}>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Meta: time · context */}
      <div className={styles.meta}>
        <span>⏱ {DURATION_LABEL[activity.duration[0]]}</span>
        <span className={styles.metaDot}>·</span>
        <span>{filters.ctx === "child" ? "🐥 с детето" : "🙍‍♀️ сама"}</span>
      </div>

      {/* Steps — revealed after Започни */}
      {showDetail && steps.length > 0 && (
        <ul className={styles.steps}>
          {steps.slice(0, 4).map((step, i) => (
            <li key={i} className={styles.step}>
              <span className={styles.stepDot} />
              <span className={styles.stepText}>{step}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Primary action */}
      <div className={styles.actions}>
        {!showDetail ? (
          <Btn onClick={onStart}>Ще го направя</Btn>
        ) : (
          <Btn onClick={onDone} disabled={done}>
            {done ? "✔ Готово!" : isCompleted ? "Направи пак" : "Готово"}
          </Btn>
        )}
      </div>
    </div>
  );
}
