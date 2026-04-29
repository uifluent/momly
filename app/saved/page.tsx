"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { Topbar } from "@/components/UI";
import activitiesData from "@/data/activities.json";
import type { Activity } from "@/lib/types";
import styles from "./page.module.css";

const allActivities = activitiesData as Activity[];

const CATEGORY_LABEL: Record<string, string> = {
  "self-care":  "Грижа",
  "movement":   "Движение",
  "calm":       "Спокойствие",
  "creative":   "Творчество",
  "social":     "Социално",
  "survival":   "Оцеляване",
  "real-life":  "Реален живот",
  "reset":      "Пауза",
  "explore":    "Изследване",
  "life-admin": "Организация",
};

export default function SavedPage() {
  const router = useRouter();
  const favorites = useMomlyStore((s) => s.favorites);
  const toggleFavorite = useMomlyStore((s) => s.toggleFavorite);

  const savedActivities = allActivities.filter((a) => favorites.includes(a.id));

  return (
    <div className={styles.wrap}>
      <Topbar showBack backHref="/decide" />

      <div className={styles.scrollBody}>
        <div className={styles.header}>
          <h1 className={styles.title}>Любими</h1>
          {savedActivities.length > 0 && (
            <p className={styles.count}>{savedActivities.length} запазени</p>
          )}
        </div>

        {savedActivities.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🤍</span>
            <p className={styles.emptyTitle}>Нямаш запазени идеи</p>
            <p className={styles.emptySub}>
              Запази нещо, което ти харесва, за да го намериш по-късно
            </p>
            <button className={styles.emptyBtn} onClick={() => router.push("/decide")}>
              Намери идея
            </button>
          </div>
        ) : (
          <ul className={styles.list}>
            {savedActivities.map((activity) => (
              <SavedCard
                key={activity.id}
                activity={activity}
                onRemove={() => toggleFavorite(activity.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SavedCard({
  activity,
  onRemove,
}: {
  activity: Activity;
  onRemove: () => void;
}) {
  const [isPopping, setIsPopping] = useState(false);

  function handleRemove() {
    setIsPopping(true);
    setTimeout(() => {
      setIsPopping(false);
      onRemove();
    }, 200);
  }

  return (
    <li className={styles.card}>
      <button
        className={[styles.heartBtn, isPopping ? styles.heartBtnPop : ""].join(" ")}
        onClick={handleRemove}
        aria-label="Премахни от любими"
      >
        ❤️
      </button>
      <p className={styles.category}>
        {CATEGORY_LABEL[activity.category[0]] ?? activity.category[0]}
      </p>
      <h2 className={styles.cardTitle}>{activity.title}</h2>
      <p className={styles.cardDesc}>{activity.description}</p>
      {activity.steps.length > 0 && (
        <ul className={styles.steps}>
          {activity.steps.slice(0, 3).map((step, i) => (
            <li key={i} className={styles.step}>
              <span className={styles.stepDot} />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
