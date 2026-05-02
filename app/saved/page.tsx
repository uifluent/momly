"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { Btn } from "@/components/UI";
import { Heart, CirclePlus, CircleMinus } from "lucide-react";
import activitiesData from "@/data/activities.json";
import type { Activity } from "@/lib/types";
import { getFavoriteLocalItems, toggleFavoriteLocalItem } from "@/lib/sessionPrefs";
import { LOCAL_PLACES } from "@/lib/localPlaces";
import { LOCAL_EVENTS } from "@/lib/localEvents";
import { LOCAL_IDEAS } from "@/lib/localIdeas";
import { UPCOMING_EVENTS } from "@/lib/upcomingEvents";
import styles from "./page.module.css";

const allActivities = activitiesData as Activity[];

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
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

// ── Unified local-item lookup ─────────────────────────────────────────────────

type LocalFavType = "event" | "place" | "idea";
interface LocalFavItem {
  id:          string;
  type:        LocalFavType;
  title:       string;
  description: string;
  link?:       string;
}

function buildLocalFavItems(ids: string[]): LocalFavItem[] {
  const result: LocalFavItem[] = [];
  for (const id of ids) {
    const upEv = UPCOMING_EVENTS.find((e) => e.id === id);
    if (upEv) { result.push({ id, type: "event", title: upEv.title, description: upEv.description, link: upEv.link }); continue; }

    const locEv = LOCAL_EVENTS.find((e) => e.id === id);
    if (locEv) { result.push({ id, type: "event", title: locEv.title, description: locEv.description, link: locEv.link }); continue; }

    const pl = LOCAL_PLACES.find((p) => p.id === id);
    if (pl) { result.push({ id, type: "place", title: pl.title, description: pl.description, link: pl.link }); continue; }

    const li = LOCAL_IDEAS.find((i) => i.id === id);
    if (li) { result.push({ id, type: "idea", title: li.title, description: li.description }); continue; }
  }
  return result;
}

const TYPE_LABEL: Record<LocalFavType, string> = {
  event: "Събитие",
  place: "Място",
  idea:  "Идея",
};

// ── Page ──────────────────────────────────────────────────────────────────────

type MainTab   = "favorites" | "completed";
type TypeFilter = "all" | "ideas" | "events" | "places";

export default function SavedPage() {
  const router         = useRouter();
  const favorites      = useMomlyStore((s) => s.favorites);
  const completedIds   = useMomlyStore((s) => s.completedIds);
  const toggleFavorite = useMomlyStore((s) => s.toggleFavorite);

  const [activeTab,   setActiveTab]   = useState<MainTab>("favorites");
  const [typeFilter,  setTypeFilter]  = useState<TypeFilter>("all");
  const [localFavIds, setLocalFavIds] = useState<string[]>(() => getFavoriteLocalItems());

  const savedActivities    = allActivities.filter((a) => favorites.includes(a.id));
  const localFavItems      = buildLocalFavItems(localFavIds);
  const localEvents        = localFavItems.filter((i) => i.type === "event");
  const localPlaces        = localFavItems.filter((i) => i.type === "place");

  const completedActivities = allActivities.filter((a) => a.id in completedIds);
  const weeklyWins = completedActivities.filter((a) => {
    const date = parseSafeDate(completedIds[a.id]);
    return date ? isThisWeek(date) : false;
  });

  function winsLabel(): string | null {
    if (weeklyWins.length === 0) return null;
    if (weeklyWins.length === 1) return "Първата малка победа ✨";
    return `Тази седмица: ${weeklyWins.length} малки победи 💛`;
  }

  // Filtered lists based on typeFilter
  const showActivities = typeFilter === "all" || typeFilter === "ideas";
  const showEvents     = typeFilter === "all" || typeFilter === "events";
  const showPlaces     = typeFilter === "all" || typeFilter === "places";

  const filteredActivities = showActivities ? savedActivities : [];
  const filteredEvents     = showEvents     ? localEvents     : [];
  const filteredPlaces     = showPlaces     ? localPlaces     : [];

  const totalFiltered = filteredActivities.length + filteredEvents.length + filteredPlaces.length;
  const totalFavs     = savedActivities.length + localFavItems.length;

  function handleRemoveLocal(id: string) {
    toggleFavoriteLocalItem(id);
    setLocalFavIds((prev) => prev.filter((i) => i !== id));
  }

  const label = winsLabel();

  return (
    <div className={styles.wrap}>
      <div className={styles.scrollBody}>
        <div className={styles.header}>
          <h1 className={styles.title}>Идеи</h1>
        </div>

        {/* ── Main tabs ──────────────────────────────────────────────────────── */}
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

        {/* ── Favorites tab ──────────────────────────────────────────────────── */}
        {activeTab === "favorites" && (
          <>
            {/* Type filter pills */}
            {totalFavs > 0 && (
              <div className={styles.typeFilter}>
                {(["all", "ideas", "events", "places"] as TypeFilter[]).map((f) => (
                  <button
                    key={f}
                    className={[styles.typeChip, typeFilter === f ? styles.typeChipSel : ""].join(" ")}
                    onClick={() => setTypeFilter(f)}
                  >
                    {{ all: "Всички", ideas: "Идеи", events: "Събития", places: "Места" }[f]}
                  </button>
                ))}
              </div>
            )}

            {totalFiltered === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🤍</span>
                <p className={styles.emptyTitle}>
                  {typeFilter === "all"    ? "Нямаш запазени идеи"    :
                   typeFilter === "ideas"  ? "Нямаш запазени идеи"    :
                   typeFilter === "events" ? "Нямаш запазени събития" :
                                            "Нямаш запазени места"}
                </p>
                <p className={styles.emptySub}>Запази идеи, за да ги намериш по-лесно</p>
                <Btn onClick={() => router.push("/")}>Намери идея</Btn>
              </div>
            ) : (
              <ul className={styles.list}>
                {filteredActivities.map((activity) => (
                  <SavedCard
                    key={activity.id}
                    activity={activity}
                    onRemove={() => toggleFavorite(activity.id)}
                  />
                ))}
                {filteredEvents.map((item) => (
                  <LocalFavCard
                    key={item.id}
                    item={item}
                    onRemove={() => handleRemoveLocal(item.id)}
                  />
                ))}
                {filteredPlaces.map((item) => (
                  <LocalFavCard
                    key={item.id}
                    item={item}
                    onRemove={() => handleRemoveLocal(item.id)}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {/* ── Completed tab ──────────────────────────────────────────────────── */}
        {activeTab === "completed" &&
          (completedActivities.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>✨</span>
              <p className={styles.emptyTitle}>Все още няма нищо тук</p>
              <p className={styles.emptySub}>Тук ще виждаш нещата, които си направила 💛</p>
              <Btn onClick={() => router.push("/")}>Намери идея</Btn>
            </div>
          ) : (
            <>
              {label && <p className={styles.winsLabel}>{label}</p>}
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

// ── SavedCard (activity) ──────────────────────────────────────────────────────

function SavedCard({ activity, onRemove }: { activity: Activity; onRemove: () => void }) {
  const router       = useRouter();
  const markCompleted = useMomlyStore((s) => s.markCompleted);
  const likeIdea     = useMomlyStore((s) => s.likeIdea);
  const completedIds = useMomlyStore((s) => s.completedIds);

  const [expanded, setExpanded] = useState(false);
  const [done, setDone]         = useState(false);

  function handleDo() {
    markCompleted(activity.id);
    likeIdea(activity.category);
    setDone(true);
    setTimeout(() => router.push("/"), 1200);
  }

  const isCompleted = done || activity.id in completedIds;

  return (
    <li className={[styles.ideaCard, isCompleted ? styles.cardDone : ""].join(" ")}>
      <button className={styles.heartBtn} onClick={onRemove} aria-label="Премахни от любими">
        <Heart size={18} strokeWidth={1.75} fill="currentColor" />
      </button>

      <p className={styles.ideaCategory}>
        {activity.emoji && <span style={{ marginRight: 4 }}>{activity.emoji}</span>}
        {CATEGORY_LABEL[activity.category[0]] ?? activity.category[0]}
      </p>
      <h2 className={styles.cardTitle}>{activity.title}</h2>
      <p className={styles.cardDesc}>{activity.description}</p>

      {!isCompleted && activity.steps.length > 0 && (
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

      {isCompleted ? (
        <p className={styles.doneBadge}>✔ Направено</p>
      ) : (
        <button className={styles.doBtn} onClick={handleDo}>Ще го направя →</button>
      )}
    </li>
  );
}

// ── LocalFavCard (event / place / local idea) ─────────────────────────────────

function LocalFavCard({ item, onRemove }: { item: LocalFavItem; onRemove: () => void }) {
  const accentClass =
    item.type === "event" ? styles.localFavCardEvent :
    item.type === "place" ? styles.localFavCardPlace :
    styles.localFavCardIdea;

  const chipClass =
    item.type === "event" ? styles.typeChipEvent :
    item.type === "place" ? styles.typeChipPlace :
    styles.typeChipIdea;

  const emoji = item.type === "event" ? "🎭" : item.type === "place" ? "📍" : "💡";

  const heartClass =
    item.type === "event" ? styles.miniHeartEvent :
    item.type === "place" ? styles.miniHeartPlace :
    "";

  return (
    <li className={`${styles.localFavCard} ${accentClass}`}>
      <div className={styles.localFavLabelRow}>
        <span className={`${styles.typeChip} ${chipClass}`}>
          {emoji} {TYPE_LABEL[item.type]}
        </span>
        <button
          className={`${styles.miniHeart} ${heartClass}`}
          onClick={onRemove}
          aria-label="Премахни от любими"
        >
          <Heart size={15} strokeWidth={2} fill="currentColor" />
        </button>
      </div>
      <h2 className={styles.localFavTitle}>{item.title}</h2>
      <p className={styles.localFavDesc}>{item.description}</p>

      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.localLink}
        >
          Виж повече →
        </a>
      )}
    </li>
  );
}

// ── CompletedCard ─────────────────────────────────────────────────────────────

function CompletedCard({ activity, completedAt }: { activity: Activity; completedAt: string }) {
  const router        = useRouter();
  const markCompleted = useMomlyStore((s) => s.markCompleted);
  const likeIdea      = useMomlyStore((s) => s.likeIdea);

  const [done, setDone] = useState(false);

  const date      = parseSafeDate(completedAt);
  const dateLabel = date ? formatRelative(date) : null;

  function handleDoAgain() {
    markCompleted(activity.id);
    likeIdea(activity.category);
    setDone(true);
    setTimeout(() => router.push("/"), 1200);
  }

  return (
    <li className={styles.ideaCard}>
      <div className={styles.cardHeader}>
        <p className={styles.ideaCategory}>
          {activity.emoji && <span style={{ marginRight: 4 }}>{activity.emoji}</span>}
          {CATEGORY_LABEL[activity.category[0]] ?? activity.category[0]}
        </p>
        {dateLabel && <span className={styles.cardDate}>{dateLabel}</span>}
      </div>
      <h2 className={styles.cardTitle}>{activity.title}</h2>
      <p className={styles.cardDesc}>{activity.description}</p>
      {done ? (
        <p className={styles.doneBadge}>✔ Направено</p>
      ) : (
        <button className={styles.doBtn} onClick={handleDoAgain}>Ще го направя пак →</button>
      )}
    </li>
  );
}
