"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { Btn } from "./UI";
import Image from "next/image";
import { X, Heart, RotateCcw, SlidersHorizontal } from "lucide-react";
import { ActivityCard } from "./ActivityCard";
import { getBestIdeas } from "@/lib/getBestIdeas";
import activitiesData from "@/data/activities.json";
import type {
  Activity,
  Duration,
  EnergyLevel,
  Filters,
  Need,
} from "@/lib/types";
import { useSurpriseIdea } from "@/hooks/useSurpriseIdea";
import styles from "./Home.module.css";

const allActivities = activitiesData as Activity[];

// ── Constants ─────────────────────────────────────────────────────────────────

const COMPLETION_MSGS = [
  "✨ Малка стъпка, но важна 💛",
  "✨ Браво. Това беше само за теб",
  "✨ Това има значение",
  "✨ Ти се справяш",
  "✨ Важно е, че го направи",
];


const TIME_OPTS: { value: Duration; label: string }[] = [
  { value: "short", label: "20 – 40мин" },
  { value: "medium", label: "40 – 90мин" },
  { value: "long", label: "1.5 – 3ч" },
];
const ENERGY_OPTS: { value: EnergyLevel; label: string; emoji: string }[] = [
  { value: "low", label: "Изморена", emoji: "🪫" },
  { value: "medium", label: "Окей", emoji: "👌" },
  { value: "high", label: "Енергична", emoji: "⚡" },
];
const CTX_OPTS: { value: Filters["ctx"]; label: string; emoji: string }[] = [
  { value: "alone", label: "Сама", emoji: "🙍‍♀️" },
  { value: "child", label: "С детето", emoji: "🐥" },
];

const NEED_OPTS: { value: Need; icon: string; label: string }[] = [
  { value: "me-time", icon: "🙍‍♀️", label: "Време за мен" },
  { value: "meals", icon: "🍳", label: "Бързи рецепти" },
  { value: "outside", icon: "🌿", label: "Активности навън" },
  { value: "movement", icon: "🏃‍♀️", label: "Движение" },
  { value: "calm", icon: "🧘", label: "Спокойствие" },
  { value: "creative", icon: "🎨", label: "Нещо творческо" },
  { value: "child-activities", icon: "🐥", label: "Занимания с детето" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getContextualGreeting(name: string): { greeting: string; subtitle: string } {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    const dayName = day === 6 ? "Събота" : "Неделя";
    return name
      ? { greeting: `${dayName} е, ${name} 💛`, subtitle: "Без план, без натиск. Просто едно предложение." }
      : { greeting: `${dayName} 💛`, subtitle: "Ако имаш 20 минути — имаме идея." };
  }
  if (hour >= 6 && hour < 11) {
    return name
      ? { greeting: `Добро утро, ${name} 💛`, subtitle: "Деня още не е започнал. Имаме нещо за теб." }
      : { greeting: "Добро утро 💛", subtitle: "Преди всичко друго — за теб." };
  }
  if (hour >= 11 && hour < 14) {
    return name
      ? { greeting: `Как мина сутринта, ${name} 💛`, subtitle: "Имаме идея за малко почивка." }
      : { greeting: "Обедна пауза 💛", subtitle: "Дори 20 минути са достатъчни." };
  }
  if (hour >= 14 && hour < 18) {
    return name
      ? { greeting: `Следобед вече е, ${name} 💛`, subtitle: "Намерихме нещо лесно за тази час." }
      : { greeting: "Следобедът е твой 💛", subtitle: "Намерихме нещо лесно." };
  }
  if (hour >= 18 && hour < 21) {
    return name
      ? { greeting: `Добър вечер, ${name} 💛`, subtitle: "Изглежда е дълъг ден. Избрахме нещо лесно." }
      : { greeting: "Добър вечер 💛", subtitle: "Не е нужно да мислиш. Ние вече направихме това." };
  }
  return name
    ? { greeting: `${name}, нощта е твоя 💛`, subtitle: "Нещо тихо и лесно преди сън." }
    : { greeting: "Нощта е твоя 💛", subtitle: "Нещо тихо и лесно преди сън." };
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
    {
      favorites: s.favorites,
      completedIds: s.completedIds,
      city: s.profile.city,
    },
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
  const totalDone = Object.keys(completedIds).length;
  const todayDone = getTodayCompleted(completedIds);

  const [filters, setFilters] = useState<Filters>(() =>
    resolveFilters(store.filters),
  );

  const city = store.profile.city;
  const childAge = store.profile.childAgeMonths;

  const surprise = useSurpriseIdea(filters);

  const [idea, setIdea] = useState<Activity | null>(null);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [done, setDone] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  // Auto-pick on mount — store is guaranteed hydrated by page.tsx
  useEffect(() => {
    const resolved = resolveFilters(useMomlyStore.getState().filters);
    setFilters(resolved);
    const s = useMomlyStore.getState();
    const results = getBestIdeas(
      allActivities,
      resolved,
      s.profile,
      s.recentIds,
      s.userPreferences,
      {
        favorites: s.favorites,
        completedIds: s.completedIds,
        city: s.profile.city,
      },
    );
    const [first] = results;
    if (first) {
      setIdea(first);
      setShownIds([first.id]);
      s.addRecentId(first.id);
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

  function handleDone() {
    if (!idea) return;
    store.likeIdea(idea.category);
    store.markCompleted(idea.id);
    setDone(true);
    showToast(
      COMPLETION_MSGS[Math.floor(Math.random() * COMPLETION_MSGS.length)],
    );
    setTimeout(() => {
      const nextShown = [...shownIds, idea.id].slice(-5);
      setShownIds(nextShown);
      const next = pickIdea(filters, nextShown);
      if (next) swapIdea(next);
    }, 1800);
  }

  function applyFilter(patch: Partial<Filters>) {
    const newFilters = { ...filters, ...patch };
    setFilters(newFilters);
    if (patch.energy !== undefined) store.setFilter("energy", patch.energy);
    if (patch.time   !== undefined) store.setFilter("time",   patch.time);
    if (patch.ctx    !== undefined) store.setFilter("ctx",    patch.ctx);
    setShownIds([]);
    surprise.reset();
    const s = useMomlyStore.getState();
    const results = getBestIdeas(
      allActivities,
      newFilters,
      s.profile,
      s.recentIds,
      s.userPreferences,
      { favorites: s.favorites, completedIds: s.completedIds, city: s.profile.city },
    );
    const [first] = results;
    if (first) {
      swapIdea(first);
      setShownIds([first.id]);
    }
  }

  function handleNeedsClose() {
    const s = useMomlyStore.getState();
    const results = getBestIdeas(
      allActivities,
      filters,
      s.profile,
      s.recentIds,
      s.userPreferences,
      { favorites: s.favorites, completedIds: s.completedIds, city: s.profile.city },
    );
    const [first] = results;
    if (first) swapIdea(first);
    setIsFilterModalOpen(false);
  }

  function handleSurprise() {
    if (surpriseLoading) return;
    setSurpriseLoading(true);
    const delay = 500 + Math.random() * 300;
    setTimeout(() => {
      const exclude = idea ? [idea.id, ...shownIds] : shownIds;
      const picked = surprise.pick(exclude);
      if (picked) {
        swapIdea(picked);
        setShownIds((prev) => [...prev, picked.id].slice(-5));
      }
      setSurpriseLoading(false);
    }, delay);
  }

  // ── Main home ─────────────────────────────────────────────────────────────
  const contextualGreeting = getContextualGreeting(displayName ?? "");

  return (
    <div className={styles.wrap}>
      <div className={styles.body}>
        <div className={`${styles.header} anim-fade-up`}>
          <div className={styles.headerRow}>
            <Image
              src="/momly-logotype.png"
              alt="Momly"
              width={32}
              height={32}
              className={styles.headerLogo}
              priority
            />
          </div>
          <h1 className={styles.mainMessage}>{contextualGreeting.greeting}</h1>
          <p className={styles.greetingSubtitle}>{contextualGreeting.subtitle}</p>
        </div>

        {/* ── Energy selector ───────────────────────────────────────────── */}
        <div className={`${styles.energySection} anim-fade-up`}>
          <div className={styles.energyHeader}>
            <p className={styles.energyTitle}>Как си днес?</p>
            <button
              className={styles.pillsFilterBtn}
              onClick={() => setIsFilterModalOpen(true)}
              aria-label="Филтри"
            >
              <SlidersHorizontal size={15} strokeWidth={2} />
            </button>
          </div>
          <div className={styles.energyChips}>
            {ENERGY_OPTS.map((o) => (
              <button
                key={o.value}
                className={[styles.energyChip, filters.energy === o.value ? styles.energyChipSel : ""].join(" ")}
                onClick={() => applyFilter({ energy: o.value })}
              >
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main card ────────────────────────────────────────────────── */}
        <div
          className={[
            styles.cardsSection,
            surpriseLoading ? styles.cardsSectionLoading : "",
          ].join(" ")}
        >
          {idea && (
            <ActivityCard
              key={idea.id}
              activity={idea}
              filters={filters}
              isFavorite={favorites.includes(idea.id)}
              isCompleted={idea.id in completedIds}
              showDetail={showDetail}
              done={done}
              isAnimating={isAnimating}
              isLocalPlace={idea.id.startsWith("place-")}
              onStart={() => setShowDetail(true)}
              onDone={handleDone}
              onToggleFavorite={() => store.toggleFavorite(idea.id)}
            />
          )}
        </div>

        {/* ── Surprise me ───────────────────────────────────────────────── */}
        <button
          className={["anim-fade-up delay-2", styles.surpriseBtn].join(" ")}
          onClick={handleSurprise}
          disabled={surpriseLoading}
          aria-label="Дай друга идея"
        >
          <RotateCcw
            size={20}
            strokeWidth={2}
            className={surpriseLoading ? styles.surpriseBtnSpin : ""}
          />
        </button>

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
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* ── Refine modal (bottom sheet) ───────────────────────────────────── */}
      {isFilterModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={handleNeedsClose}
        >
          <div
            className={styles.modalSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <h2 className={styles.refineTitle}>Нагласи за теб</h2>
              <button
                className={styles.closeBtn}
                onClick={handleNeedsClose}
                aria-label="Затвори"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className={styles.refineSection}>
              <div className={styles.refineGroup}>
                <p className={styles.refineLabel}>С колко време разполагаш?</p>
                <div className={styles.chipRow}>
                  {TIME_OPTS.map((o) => (
                    <button
                      key={o.value}
                      className={[styles.chip, filters.time === o.value ? styles.chipSel : ""].join(" ")}
                      onClick={() => setFilters((f) => ({ ...f, time: o.value }))}
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
                      className={[styles.chip, filters.ctx === o.value ? styles.chipSel : ""].join(" ")}
                      onClick={() => setFilters((f) => ({ ...f, ctx: o.value }))}
                    >
                      <span className={styles.chipEmoji}>{o.emoji}</span>
                      <span className={styles.chipText}>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Needs grid ──────────────────────────────────────────── */}
            <div className={styles.needsSection}>
              <div className={styles.needsHeader}>
                <p className={styles.refineLabel}>От какво имаш нужда</p>
                <p
                  className={[
                    styles.needsHint,
                    store.profile.needs.length >= 3 ? styles.needsHintFull : "",
                  ].join(" ")}
                >
                  {store.profile.needs.length} / 3 избрани
                </p>
              </div>
              <div className={styles.needsGrid}>
                {NEED_OPTS.map((o) => {
                  const selected = store.profile.needs.includes(o.value);
                  const disabled = !selected && store.profile.needs.length >= 3;
                  return (
                    <button
                      key={o.value}
                      className={[
                        styles.needTile,
                        selected ? styles.needTileSel : "",
                        disabled ? styles.needTileDisabled : "",
                      ].join(" ")}
                      onClick={() => store.toggleNeed(o.value)}
                      disabled={disabled}
                    >
                      <span className={styles.needIcon}>{o.icon}</span>
                      <span className={styles.needLabel}>{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.refineCta}>
              <Btn onClick={handleNeedsClose}>Готово</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
