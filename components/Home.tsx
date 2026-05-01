"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { Topbar, Btn } from "./UI";
import { ActivityCard } from "./ActivityCard";
import { getBestIdeas } from "@/lib/getBestIdeas";
import activitiesData from "@/data/activities.json";
import type { Activity, Duration, EnergyLevel, Filters } from "@/lib/types";
import styles from "./Home.module.css";

const allActivities = activitiesData as Activity[];

// ── Constants ─────────────────────────────────────────────────────────────────

const HEADLINES = [
  "Днес не е нужно да мислиш 💛",
  "Нещо малко за теб 🤍",
  "Ето нещо леко за момента",
  "Имаш малко свободно? Ето нещо",
];

const TIME_OPTS: { value: Duration; label: string }[] = [
  { value: "short", label: "20 – 40мин" },
  { value: "medium", label: "40 – 90мин" },
  { value: "long", label: "1.5 – 3ч" },
];
const ENERGY_OPTS: { value: EnergyLevel; label: string }[] = [
  { value: "low", label: "Изтощена съм 🪫" },
  { value: "medium", label: "Окей съм 👌" },
  { value: "high", label: "Имам енергия ⚡" },
];
const CTX_OPTS: { value: Filters["ctx"]; label: string }[] = [
  { value: "alone", label: "Сама 🙍‍♀️" },
  { value: "child", label: "С детето 🐥" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDailyHeadline(): string {
  return HEADLINES[new Date().getDate() % HEADLINES.length];
}

function resolveFilters(partial: Partial<Filters>): Filters {
  return {
    time: partial.time ?? "short",
    energy: partial.energy ?? "low",
    ctx: partial.ctx ?? "alone",
  };
}

function getTodayCompleted(completedIds: Record<string, string>): Activity[] {
  const today = new Date().toDateString();
  return Object.entries(completedIds)
    .filter(([, iso]) => iso && new Date(iso).toDateString() === today)
    .sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([id]) => allActivities.find((a) => a.id === id))
    .filter(Boolean) as Activity[];
}

function pickIdea(filters: Filters, excludeIds: string[]): Activity | null {
  const s = useMomlyStore.getState();
  const results = getBestIdeas(
    allActivities,
    filters,
    s.profile,
    s.recentIds,
    s.userPreferences,
    { favorites: s.favorites, completedIds: s.completedIds },
  );
  return results.find((a) => !excludeIds.includes(a.id)) ?? results[0] ?? null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const store = useMomlyStore();
  const displayName = store.profile.displayName;
  const favorites = store.favorites;
  const completedIds = store.completedIds;
  const totalDone    = Object.keys(completedIds).length;
  const todayDone    = getTodayCompleted(completedIds);

  const [filters, setFilters] = useState<Filters>(() =>
    resolveFilters(store.filters),
  );
  const [idea, setIdea] = useState<Activity | null>(null);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [showRefine, setShowRefine] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [done, setDone] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-pick on mount — store is guaranteed hydrated by page.tsx
  useEffect(() => {
    const resolved = resolveFilters(useMomlyStore.getState().filters);
    setFilters(resolved);
    const first = pickIdea(resolved, []);
    if (first) {
      setIdea(first);
      setShownIds([first.id]);
      useMomlyStore.getState().addRecentId(first.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function swapIdea(next: Activity) {
    setIsAnimating(true);
    setTimeout(() => {
      setIdea(next);
      store.addRecentId(next.id);
      setShowDetail(false);
      setDone(false);
      setIsAnimating(false);
    }, 180);
  }

  function handleShuffle() {
    if (!idea) return;
    store.skipIdea(idea.category);
    const nextShown = [...shownIds, idea.id].slice(-5);
    setShownIds(nextShown);
    setShuffleCount((c) => c + 1);
    const next = pickIdea(filters, nextShown);
    if (next) swapIdea(next);
  }

  function handleDone() {
    if (!idea) return;
    store.likeIdea(idea.category);
    store.markCompleted(idea.id);
    setDone(true);
    setTimeout(() => {
      const nextShown = [...shownIds, idea.id].slice(-5);
      setShownIds(nextShown);
      setShuffleCount((c) => c + 1);
      const next = pickIdea(filters, nextShown);
      if (next) swapIdea(next);
    }, 1400);
  }

  function handleRefineApply() {
    store.setFilter("time", filters.time);
    store.setFilter("energy", filters.energy);
    store.setFilter("ctx", filters.ctx);
    const s = useMomlyStore.getState();
    const results = getBestIdeas(
      allActivities,
      filters,
      s.profile,
      s.recentIds,
      s.userPreferences,
      { favorites: s.favorites, completedIds: s.completedIds },
    );
    store.setResults(results);
    if (results[0]) store.addRecentId(results[0].id);
    router.push("/result");
  }

  // ── Refine panel ──────────────────────────────────────────────────────────
  if (showRefine) {
    return (
      <div className={styles.wrap}>
        <Topbar showBack onBack={() => setShowRefine(false)} hideFav />
        <div className={styles.body}>
          <div className={`${styles.header} anim-fade-up`}>
            <h2 className={styles.refineTitle}>Да го нагласим за теб</h2>
            <p className={styles.mainSub}>Избери само това, което важи сега</p>
          </div>

          <div className={`${styles.refineSection} anim-card-in delay-1`}>
            <div className={styles.refineGroup}>
              <p className={styles.refineLabel}>С колко време разполагаш?</p>
              <div className={styles.chipRow}>
                {TIME_OPTS.map((o) => (
                  <button
                    key={o.value}
                    className={[
                      styles.chip,
                      filters.time === o.value ? styles.chipSel : "",
                    ].join(" ")}
                    onClick={() => setFilters((f) => ({ ...f, time: o.value }))}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.refineGroup}>
              <p className={styles.refineLabel}>Как се чувстваш?</p>
              <div className={styles.chipRow}>
                {ENERGY_OPTS.map((o) => (
                  <button
                    key={o.value}
                    className={[
                      styles.chip,
                      filters.energy === o.value ? styles.chipSel : "",
                    ].join(" ")}
                    onClick={() =>
                      setFilters((f) => ({ ...f, energy: o.value }))
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.refineGroup}>
              <p className={styles.refineLabel}>Сама ли си или с детето?</p>
              <div className={styles.chipRow}>
                {CTX_OPTS.map((o) => (
                  <button
                    key={o.value}
                    className={[
                      styles.chip,
                      filters.ctx === o.value ? styles.chipSel : "",
                    ].join(" ")}
                    onClick={() => setFilters((f) => ({ ...f, ctx: o.value }))}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`${styles.ctaWrap} anim-fade-up delay-2`}>
            <Btn onClick={handleRefineApply}>✨ Покажи ми идеи</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ── Main home ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrap}>
      <Topbar />
      <div className={styles.body}>
        <div className={`${styles.header} anim-fade-up`}>
          <p className={styles.greetingText}>
            {displayName ? `Здравей, ${displayName} 💛` : "Здравей 💛"}
          </p>
          <h1 className={styles.mainMessage}>{getDailyHeadline()}</h1>
        </div>

        {idea && (
          <ActivityCard
            activity={idea}
            filters={filters}
            isFavorite={favorites.includes(idea.id)}
            isCompleted={idea.id in completedIds}
            showDetail={showDetail}
            done={done}
            isAnimating={isAnimating}
            onStart={() => setShowDetail(true)}
            onDone={handleDone}
            onToggleFavorite={() => store.toggleFavorite(idea.id)}
          />
        )}

        {/* "Дай друга" — below the card, opens the refine panel */}
        {idea && (
          <button
            className={`${styles.shuffleBtn} anim-fade-up delay-2`}
            onClick={() => setShowRefine(true)}
          >
            🔄 Дай ми друга идея
          </button>
        )}

        {/* ── Today's wins ───────────────────────────────────────────────── */}
        {todayDone.length > 0 && (
          <div className={`${styles.wins} anim-fade-up delay-2`}>
            <p className={styles.winsLabel}>
              {todayDone.length === 1
                ? "Една малка победа днес 💛"
                : `${todayDone.length} малки победи днес 💛`}
            </p>
            <ul className={styles.winsList}>
              {todayDone.map((a) => (
                <li key={a.id} className={styles.winsItem}>
                  <span className={styles.winsCheck}>✔</span>
                  <span className={styles.winsTitle}>{a.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(favorites.length > 0 || totalDone > 0) && (
          <div className={`${styles.stats} anim-fade-up delay-2`}>
            {favorites.length > 0 && (
              <button
                className={styles.statBtn}
                onClick={() => router.push("/saved")}
              >
                💛 {favorites.length} любими
              </button>
            )}
            {favorites.length > 0 && totalDone > 0 && (
              <span className={styles.statSep}>·</span>
            )}
            {totalDone > 0 && (
              <button
                className={styles.statBtn}
                onClick={() => router.push("/saved")}
              >
                ✔ {totalDone} изпълнени
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
