"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { Topbar, Btn } from "@/components/UI";
import { Heart, CirclePlus, CircleMinus, CheckCheck } from "lucide-react";
import activitiesData from "@/data/activities.json";
import type { Activity } from "@/lib/types";
import styles from "./page.module.css";

const allActivities = activitiesData as Activity[];

const CATEGORY_LABEL: Record<string, string> = {
  "self-care": "Грижа",
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

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

function formatRelative(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Днес";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `преди ${diffDays} дни`;
  if (diffDays < 14) return "миналата седмица";
  return date.toLocaleDateString("bg-BG", { day: "numeric", month: "long" });
}

function parseSafeDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

type Tab = "favorites" | "completed";

export default function SavedPage() {
  const router = useRouter();
  const favorites = useMomlyStore((s) => s.favorites);
  const completedIds = useMomlyStore((s) => s.completedIds);
  const toggleFavorite = useMomlyStore((s) => s.toggleFavorite);

  const [activeTab, setActiveTab] = useState<Tab>("favorites");

  const savedActivities = allActivities.filter((a) => favorites.includes(a.id));
  const completedActivities = allActivities.filter((a) => a.id in completedIds);

  const weeklyWins = completedActivities.filter((a) => {
    const date = parseSafeDate(completedIds[a.id]);
    return date ? isThisWeek(date) : false;
  });

  function weeklyWinsLabel(): string | null {
    if (weeklyWins.length === 0) return null;
    if (weeklyWins.length === 1) return "Първата малка победа ✨";
    return `Тази седмица: ${weeklyWins.length} малки победи 💛`;
  }

  const winsLabel = weeklyWinsLabel();

  return (
    <div className={styles.wrap}>

      <div className={styles.scrollBody}>
        <div className={styles.header}>
          <h1 className={styles.title}>Идеи</h1>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className={styles.tabs}>
          <button
            className={[styles.tab, activeTab === "favorites" ? styles.tabActive : ""].join(" ")}
            onClick={() => setActiveTab("favorites")}
          >
            Любими
          </button>
          <button
            className={[styles.tab, activeTab === "completed" ? styles.tabActive : ""].join(" ")}
            onClick={() => setActiveTab("completed")}
          >
            Изпълнени
          </button>
        </div>

        {/* ── Favorites tab ────────────────────────────────────────────────── */}
        {activeTab === "favorites" &&
          (savedActivities.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🤍</span>
              <p className={styles.emptyTitle}>Нямаш запазени идеи</p>
              <p className={styles.emptySub}>
                Запази идеи, за да ги намериш по-лесно
              </p>
              <Btn onClick={() => router.push("/decide")}>Намери идея</Btn>
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
          ))}

        {/* ── Completed tab ─────────────────────────────────────────────────── */}
        {activeTab === "completed" &&
          (completedActivities.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>✨</span>
              <p className={styles.emptyTitle}>Все още няма нищо тук</p>
              <p className={styles.emptySub}>
                Тук ще виждаш нещата, които си направила 💛
              </p>
              <Btn onClick={() => router.push("/decide")}>Намери идея</Btn>
            </div>
          ) : (
            <>
              {winsLabel && <p className={styles.winsLabel}>{winsLabel}</p>}
              <ul className={styles.list}>
                {completedActivities.map((activity) => (
                  <CompletedCard
                    key={activity.id}
                    activity={activity}
                    completedAt={completedIds[activity.id]}
                  />
                ))}
              </ul>
            </>
          ))}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SavedCard({
  activity,
  onRemove,
}: {
  activity: Activity;
  onRemove: () => void;
}) {
  const router = useRouter();
  const markCompleted = useMomlyStore((s) => s.markCompleted);
  const likeIdea = useMomlyStore((s) => s.likeIdea);
  const completedIds = useMomlyStore((s) => s.completedIds);

  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState(false);

  const isCompleted = activity.id in completedIds;

  function handleDo() {
    markCompleted(activity.id);
    likeIdea(activity.category);
    setDone(true);
    setTimeout(() => router.push("/"), 1200);
  }

  return (
    <li className={styles.card}>
      <button
        className={styles.heartBtn}
        onClick={onRemove}
        aria-label="Премахни от любими"
      >
        <Heart size={18} strokeWidth={1.75} fill="currentColor" />
      </button>

      <p className={styles.category}>
        {activity.emoji && (
          <span style={{ marginRight: 4 }}>{activity.emoji}</span>
        )}
        {CATEGORY_LABEL[activity.category[0]] ?? activity.category[0]}
      </p>
      <h2 className={styles.cardTitle}>{activity.title}</h2>
      <p className={styles.cardDesc}>{activity.description}</p>

      {activity.steps.length > 0 && (
        <div className={styles.howTo}>
          <button
            className={styles.howToToggle}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span>Как да започна</span>
            {expanded
              ? <CircleMinus size={16} strokeWidth={1.5} aria-hidden="true" />
              : <CirclePlus  size={16} strokeWidth={1.5} aria-hidden="true" />
            }
          </button>
          <div className={[styles.howToBody, expanded ? styles.howToBodyOpen : ""].join(" ")}>
            <ul className={styles.howToSteps}>
              {activity.steps.slice(0, 4).map((step, i) => (
                <li key={i} className={styles.howToStep}>
                  <span className={styles.stepDot} />
                  <span className={styles.stepText}>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Btn onClick={handleDo} disabled={done}>
        {done ? "✔ Направено" : "Ще го направя"}
      </Btn>
    </li>
  );
}

function CompletedCard({
  activity,
  completedAt,
}: {
  activity: Activity;
  completedAt: string;
}) {
  const router = useRouter();
  const markCompleted = useMomlyStore((s) => s.markCompleted);
  const likeIdea = useMomlyStore((s) => s.likeIdea);

  const [done, setDone] = useState(false);

  const date = parseSafeDate(completedAt);
  const dateLabel = date ? formatRelative(date) : null;

  function handleDoAgain() {
    markCompleted(activity.id);
    likeIdea(activity.category);
    setDone(true);
    setTimeout(() => router.push("/"), 1200);
  }

  return (
    <li className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.category}>
          {activity.emoji && (
            <span style={{ marginRight: 4 }}>{activity.emoji}</span>
          )}
          {CATEGORY_LABEL[activity.category[0]] ?? activity.category[0]}
        </p>
        {dateLabel && <span className={styles.cardDate}>{dateLabel}</span>}
      </div>
      <h2 className={styles.cardTitle}>{activity.title}</h2>
      <p className={styles.cardDesc}>{activity.description}</p>
      <Btn onClick={handleDoAgain} disabled={done}>
        {done ? "✔ Направено" : "Ще го направя пак"}
      </Btn>
    </li>
  );
}
