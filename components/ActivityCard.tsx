"use client";

import { useState } from "react";
import { CirclePlus, CircleMinus, Heart } from "lucide-react";
import type {
  Activity,
  Category,
  Duration,
  EnergyLevel,
  Filters,
} from "@/lib/types";
import { getDescription, getSteps } from "@/lib/getDescription";
import styles from "./ActivityCard.module.css";

const DURATION_LABEL: Record<Duration, string> = {
  short: "20 – 40мин",
  medium: "40 – 90мин",
  long: "1.5 – 3ч",
};

const NOTES: Record<string, string[]> = {
  "low:self-care": [
    "Само за теб. Нищо друго не е нужно.",
    "Малка грижа за себе си. Заслужена е.",
    "Изморена си — това е точно за сега.",
    "Не ти трябва много. Само малко.",
  ],
  "low:calm": [
    "Тихо и без усилие. Точно за сега.",
    "Нямаш нужда от много. Само малко пауза.",
    "Спокойно и лесно. Нищо повече.",
  ],
  "low:reset": [
    "Пауза. Заслужена е.",
    "Малко пространство само за теб.",
    "Рестарт без натиск.",
  ],
  "low:survival": [
    "Нищо сложно. Просто едно нещо.",
    "Малка крачка. Постижима е.",
    "Без усилие — точно за сега.",
  ],
  "low:creative": [
    "Нещо тихо и твое. Без очаквания.",
    "Малко творчество, нулево усилие.",
  ],
  "low:social": [
    "Лека връзка. Не те натоварва.",
    "Кратко и топло. Без натиск.",
  ],
  "low:real-life": ["Малка стъпка. Само едно нещо.", "Бързо и без стрес."],
  "low:life-admin": [
    "Едно малко нещо — и готово.",
    "Бързо, лесно, зад гърба ти.",
  ],
  "low:movement": [
    "Леко движение — без план, без усилие.",
    "Малко раздвижване. Само толкова.",
  ],
  "medium:self-care": [
    "Имаш малко енергия. Инвестирай я в себе си.",
    "Добър момент за малко грижа за теб.",
    "Точно достатъчно за нещо хубаво.",
  ],
  "medium:movement": [
    "Тялото ти ще ти благодари.",
    "Добро движение за добър ден.",
    "Раздвижи се — ще се почувстваш по-добре.",
  ],
  "medium:calm": [
    "Малко спокойствие за балансиран ден.",
    "Пауза, която зарежда.",
  ],
  "medium:creative": [
    "Творчеството зарежда. Пробвай.",
    "Нещо твое и различно.",
  ],
  "medium:explore": ["Нещо ново, нещо свежо.", "Малко изследване — хубаво е."],
  "medium:social": ["Добро за точно сега.", "Топла връзка — добра инвестиция."],
  "medium:real-life": [
    "Бързо и ефективно. Ще се почувстваш по-леко.",
    "Едно нещо по-малко за мислене.",
  ],
  "high:movement": [
    "Имаш енергия — използвай я добре.",
    "Добър ден за движение.",
  ],
  "high:explore": [
    "Ден за изследване. Ще се върнеш заредена.",
    "Нещо ново и вдъхновяващо.",
  ],
  "high:social": ["Добър момент за хора наоколо.", "Енергията е — сподели я."],
};

function getReasoningNote(
  activity: Activity,
  energy: EnergyLevel,
  ctx: "alone" | "child",
): string {
  const category = activity.category[0];
  const key = `${energy}:${category}`;
  const pool =
    NOTES[key] ??
    (ctx === "alone"
      ? ["Леко и само за теб.", "Добро за точно сега.", "Постижимо. Хайде."]
      : ["Лесно заедно.", "Хубав момент с детето.", "Просто и приятно."]);
  const hash = activity.id
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return pool[hash % pool.length];
}

const PRIMARY_RGB = "232,155,140";

const CATEGORY_CTA: Record<string, string> = {
  "self-care": "Дай си тези минути",
  calm:        "Влизам в това",
  movement:    "Тръгвам",
  reset:       "Да, почивам",
  creative:    "Пробвам",
  survival:    "Правя го сега",
  "real-life": "Хайде",
  "life-admin":"Правя го",
  social:      "Хайде",
  explore:     "Изследвам",
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
  onSkip?: () => void;
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
  onSkip,
}: ActivityCardProps) {
  const desc       = getDescription(activity, filters.energy, filters.ctx);
  const steps      = getSteps(activity, filters.energy);
  const reasonNote = getReasoningNote(activity, filters.energy, filters.ctx);
  const cta        = CATEGORY_CTA[activity.category[0]] ?? "Направи го";
  const energyCls  = filters.energy === "low" ? styles.energyLow
                   : filters.energy === "high" ? styles.energyHigh
                   : "";

  const [isExpanded, setIsExpanded] = useState(false);
  const [hearted,    setHearted]    = useState(false);

  function handleHeart() {
    onToggleFavorite();
    setHearted(false);
    requestAnimationFrame(() => setHearted(true));
    setTimeout(() => setHearted(false), 500);
  }

  return (
    <div
      className={[
        styles.card,
        isAnimating ? styles.cardExiting : "",
        done || isCompleted ? styles.cardCompleted : "",
        energyCls,
      ].join(" ")}
      style={{ "--cat-rgb": PRIMARY_RGB } as React.CSSProperties}
    >
      {/* Save / heart */}
      <button
        className={[styles.heartBtn, hearted ? styles.heartPopped : ""].join(" ")}
        onClick={handleHeart}
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
      <p className={`${styles.category} ${styles.animItem} ${styles.d0}`}>
        {activity.emoji && (
          <span className={styles.emoji}>{activity.emoji}</span>
        )}
        {CATEGORY_LABEL[activity.category[0]] ?? activity.category[0]}
      </p>

      {/* Title + description */}
      <h2 className={`${styles.title} ${styles.animItem} ${styles.d1}`}>{activity.title}</h2>
      <p className={`${styles.desc} ${styles.animItem} ${styles.d2}`}>{desc}</p>
      <p className={`${styles.reasonNote} ${styles.animItem} ${styles.d3}`}>{reasonNote}</p>

      {/* Collapsible "Как да започна" */}
      {steps.length > 0 && (
        <div className={`${styles.howTo} ${styles.animItem} ${styles.d4}`}>
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
      <div className={`${styles.actions} ${styles.animItem} ${styles.d4}`}>
        {done || isCompleted ? (
          <p className={styles.doneBadge}>✔ Готово 💛</p>
        ) : (
          <button className={styles.doBtn} onClick={onDone}>
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}
