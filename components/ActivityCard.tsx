"use client";

import { useState } from "react";
import { CirclePlus, CircleMinus, Heart } from "lucide-react";
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
  isLocalPlace?: boolean;
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
  isLocalPlace,
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
        isAnimating ? styles.cardExiting : "",
        done || isCompleted ? styles.cardCompleted : "",
      ].join(" ")}
    >
      {/* Save / heart */}
      <button
        className={styles.heartBtn}
        onClick={onToggleFavorite}
        aria-label={isFavorite ? "Премахни от любими" : "Запази"}
      >
        <Heart
          size={18}
          strokeWidth={1.75}
          fill={isFavorite ? "currentColor" : "none"}
        />
      </button>

      {isLocalPlace && <p className={styles.localBadge}>📍 Близо до теб</p>}
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
      {steps.length > 0 && (
        <div className={styles.howTo}>
          <button
            className={styles.howToToggle}
            onClick={() => setIsExpanded((v) => !v)}
            aria-expanded={isExpanded}
          >
            <span>Как да започна</span>
            {isExpanded ? (
              <CircleMinus size={16} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <CirclePlus size={16} strokeWidth={1.5} aria-hidden="true" />
            )}
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

      {/* Primary action */}
      <div className={styles.actions}>
        {done || isCompleted ? (
          <p className={styles.doneBadge}>✔ Готово 💛</p>
        ) : (
          <button className={styles.doBtn} onClick={onDone}>Ще го направя →</button>
        )}
      </div>
    </div>
  );
}
