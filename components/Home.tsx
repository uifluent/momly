"use client";

import { useState, useEffect, useMemo } from "react";
import { PlaceThumbnail } from "./PlaceThumbnail";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { Btn } from "./UI";
import Image from "next/image";
import { X, Heart, Dice6, SlidersHorizontal } from "lucide-react";
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
import { getLocalIdea } from "@/lib/localIdeas";
import { getBestUpcomingEvent } from "@/lib/upcomingEvents";
import { getBestLocalEvent } from "@/lib/localEvents";
import {
  getBestLocalPlace,
  getBestNearbyPlace,
  toggleSavedTrip,
  getSavedTrips,
} from "@/lib/localPlaces";
import {
  addToLocalHistory,
  getFavoriteLocalItems,
  toggleFavoriteLocalItem,
} from "@/lib/sessionPrefs";
import { useSurpriseIdea } from "@/hooks/useSurpriseIdea";
import { IdeaDetailModal } from "./IdeaDetailModal";
import styles from "./Home.module.css";

const allActivities = activitiesData as Activity[];

// ── Constants ─────────────────────────────────────────────────────────────────

const HEADLINES: { text: string; highlight: string }[] = [
  { text: "Днес не е нужно да мислиш 👇", highlight: "мислиш" },
  { text: "Имаш малко време? Ето идея 👇", highlight: "идея" },
  { text: "Нещо малко, което може да ти дойде добре 🤍", highlight: "добре" },
  { text: "За теб, точно сега 👇", highlight: "теб" },
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

function dailyHeadline(): { text: string; highlight: string } {
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

  const upcomingEvent = useMemo(
    () => getBestUpcomingEvent(city, childAge ?? null),
    [city, childAge],
  );

  const nearbyPlace = useMemo(
    () => getBestNearbyPlace(city, childAge ?? null),
    [city, childAge],
  );

  // localItem is memoised so toggling a heart (or any unrelated state change)
  // doesn't re-roll the random tie-breaking inside getBestLocalPlace.
  const localItem = useMemo(() => {
    const localEvent = getBestLocalEvent(filters, city);
    const localPlace = getBestLocalPlace(filters, city, childAge ?? null);
    const localIdea = getLocalIdea(filters, city);

    const candidates = [
      localEvent && {
        id: localEvent.id,
        title: localEvent.title,
        description: localEvent.description,
        link: (localEvent as { link?: string }).link,
        image: (localEvent as { image?: string }).image,
        score: localEvent.score,
      },
      localPlace && {
        id: localPlace.id,
        title: localPlace.title,
        description: localPlace.description,
        link: localPlace.link,
        image: localPlace.image,
        score: localPlace.score,
      },
      localIdea && {
        id: localIdea.id,
        title: localIdea.title,
        description: localIdea.description,
        link: undefined,
        image: undefined,
        score: localIdea.score,
      },
    ].filter(Boolean) as {
      id: string;
      title: string;
      description: string;
      link?: string;
      image?: string;
      score: number;
    }[];

    return candidates.sort((a, b) => b.score - a.score)[0] ?? null;
  }, [filters.time, filters.energy, filters.ctx, city, childAge]); // eslint-disable-line react-hooks/exhaustive-deps
  const surprise = useSurpriseIdea(filters);

  const [idea, setIdea] = useState<Activity | null>(null);
  const [backupIdeas, setBackupIdeas] = useState<Activity[]>([]);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [done, setDone] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [isSurprise, setIsSurprise] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Activity | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tripSaved, setTripSaved] = useState(() =>
    nearbyPlace ? getFavoriteLocalItems().includes(nearbyPlace.id) : false,
  );
  const [localFav, setLocalFav] = useState(() =>
    localItem ? getFavoriteLocalItems().includes(localItem.id) : false,
  );
  const [eventFav, setEventFav] = useState(() =>
    upcomingEvent ? getFavoriteLocalItems().includes(upcomingEvent.id) : false,
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  // Track which local item was shown for anti-repeat
  useEffect(() => {
    if (localItem) addToLocalHistory(localItem.id);
  }, [localItem?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const [first, ...rest] = results;
    if (first) {
      setIdea(first);
      setBackupIdeas(rest.slice(0, 2));
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
    setShownIds([]);
    setShuffleCount(0);
    setIsSurprise(false);
    surprise.reset();
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
    const [first, ...rest] = results;
    if (first) {
      swapIdea(first);
      setBackupIdeas(rest.slice(0, 2));
    }
    setIsFilterModalOpen(false);
  }

  function handleConfirmBackup(b: Activity) {
    const s = useMomlyStore.getState();
    const exclude = [b.id, ...shownIds];
    swapIdea(b);
    const fresh = getBestIdeas(
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
    ).filter((a) => !exclude.includes(a.id));
    setBackupIdeas(fresh.slice(0, 2));
    setSelectedIdea(null);
  }

  function handleSurprise() {
    if (surpriseLoading) return;
    setSurpriseLoading(true);
    const delay = 500 + Math.random() * 300; // 500–800 ms
    setTimeout(() => {
      const picked = surprise.pick(idea ? [idea.id, ...shownIds] : shownIds);
      if (picked) {
        swapIdea(picked);
        setIsSurprise(true);
        setShownIds((prev) => [...prev, picked.id].slice(-5));
      }
      setSurpriseLoading(false);
    }, delay);
  }

  // ── Main home ─────────────────────────────────────────────────────────────
  const headline = dailyHeadline();
  const hlIdx = headline.text.indexOf(headline.highlight);

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
            <p className={styles.greetingText}>
              {displayName ? `Здравей, ${displayName} 💛` : "Здравей 💛"}
            </p>
          </div>
          <h1 className={styles.mainMessage}>
            {hlIdx >= 0 ? (
              <>
                {headline.text.slice(0, hlIdx)}
                <span className={styles.headlineAccent}>
                  {headline.highlight}
                </span>
                {headline.text.slice(hlIdx + headline.highlight.length)}
              </>
            ) : (
              headline.text
            )}
          </h1>
        </div>

        {/* ── Context pills ─────────────────────────────────────────────── */}
        <div className={`${styles.pillsOuter} anim-fade-up`}>
          <div className={styles.pillsRow}>
            <span className={styles.pill}>
              {ENERGY_OPTS.find((o) => o.value === filters.energy)?.emoji}{" "}
              {ENERGY_OPTS.find((o) => o.value === filters.energy)?.label ??
                filters.energy}
            </span>
            <span className={styles.pill}>
              {TIME_OPTS.find((o) => o.value === filters.time)?.label ??
                filters.time}
            </span>
            <span className={styles.pill}>
              {CTX_OPTS.find((o) => o.value === filters.ctx)?.emoji}{" "}
              {CTX_OPTS.find((o) => o.value === filters.ctx)?.label ??
                filters.ctx}
            </span>
          </div>
          <button
            className={styles.pillsFilterBtn}
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Отвори филтри"
          >
            <SlidersHorizontal size={15} strokeWidth={2} />
          </button>
        </div>

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

        {/* ── Backup ideas ──────────────────────────────────────────────── */}
        {backupIdeas.length > 0 && (
          <div className={`${styles.backupsRow} anim-fade-up delay-2`}>
            {backupIdeas.map((b) => (
              <button
                key={b.id}
                className={styles.backupCard}
                onClick={() => setSelectedIdea(b)}
              >
                <span className={styles.backupTitle}>{b.title}</span>
                <span className={styles.backupArrow}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Surprise me ───────────────────────────────────────────────── */}
        <button
          className={[
            styles.surpriseBtn,
            surpriseLoading ? styles.surpriseBtnLoading : "",
            "anim-fade-up delay-2",
          ].join(" ")}
          onClick={handleSurprise}
          disabled={surpriseLoading}
        >
          <Dice6 size={18} strokeWidth={2} />
          {surpriseLoading ? "Търся нещо..." : "Изненадай ме"}
        </button>

        {isSurprise && !surpriseLoading && (
          <button
            className={`${styles.surpriseAgainBtn} anim-fade-up`}
            onClick={handleSurprise}
          >
            🎲 Ощe веднъж
          </button>
        )}

        {/* ── Upcoming event ─────────────────────────────────────────────── */}
        {upcomingEvent && (
          <div className={`${styles.eventCard} anim-fade-up delay-2`}>
            <div className={styles.cardLabelRow}>
              <p className={styles.eventLabel}>
                {upcomingEvent.source
                  ? `🎭 ${upcomingEvent.source}`
                  : "🎭 Нещо интересно скоро"}
              </p>
              <button
                className={`${styles.miniHeart} ${styles.miniHeartEvent}`}
                onClick={() => {
                  const saved = toggleFavoriteLocalItem(upcomingEvent.id);
                  setEventFav(saved);
                  if (saved) showToast("Запазено 💛");
                }}
                aria-label={eventFav ? "Премахни от любими" : "Запази"}
              >
                <Heart
                  size={15}
                  strokeWidth={2}
                  fill={eventFav ? "currentColor" : "none"}
                />
              </button>
            </div>
            <p className={styles.eventTitle}>{upcomingEvent.title}</p>
            <p className={styles.eventDesc}>{upcomingEvent.description}</p>
            {upcomingEvent.dateLabel && (
              <p className={styles.eventDate}>📅 {upcomingEvent.dateLabel}</p>
            )}
            <a
              href={upcomingEvent.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.eventLink}
            >
              Виж повече →
            </a>
          </div>
        )}

        {/* ── Weekend nearby suggestion ──────────────────────────────────── */}
        {nearbyPlace && (
          <div className={`${styles.weekendCard} anim-fade-up delay-2`}>
            <p className={styles.weekendLabel}>🌤 Уикенд идея</p>
            <div className={styles.cardRow}>
              <PlaceThumbnail
                link={nearbyPlace.link}
                staticImage={nearbyPlace.image}
                alt={nearbyPlace.title}
              />
              <div className={styles.cardRowText}>
                <p className={styles.weekendTitle}>{nearbyPlace.title}</p>
                <p className={styles.weekendDesc}>{nearbyPlace.description}</p>
                <div className={styles.weekendFooter}>
                  <p className={styles.weekendDist}>
                    🕐 На {nearbyPlace.travelTime} от теб
                  </p>
                  <button
                    className={styles.weekendSaveBtn}
                    onClick={() => {
                      const saved = toggleSavedTrip(nearbyPlace.id);
                      setTripSaved(saved);
                    }}
                  >
                    {tripSaved ? "✔ Запазено" : "💾 Запази"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Local idea / event ─────────────────────────────────────────── */}
        {localItem && (
          <div className={`${styles.localCard} anim-fade-up delay-2`}>
            <div className={styles.cardLabelRow}>
              <p className={styles.localLabel}>
                {localItem.link ? "Днес около теб" : "Нещо близо до теб"}
              </p>
              <button
                className={`${styles.miniHeart} ${styles.miniHeartPlace}`}
                onClick={() => {
                  const saved = toggleFavoriteLocalItem(localItem.id);
                  setLocalFav(saved);
                  if (saved) showToast("Запазено 💛");
                }}
                aria-label={localFav ? "Премахни от любими" : "Запази"}
              >
                <Heart
                  size={15}
                  strokeWidth={2}
                  fill={localFav ? "currentColor" : "none"}
                />
              </button>
            </div>
            <div className={styles.cardRow}>
              <PlaceThumbnail
                link={localItem.link}
                staticImage={localItem.image}
                alt={localItem.title}
              />
              <div className={styles.cardRowText}>
                <p className={styles.localTitle}>{localItem.title}</p>
                <p className={styles.localDesc}>{localItem.description}</p>
                {localItem.link && (
                  <a
                    href={localItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.localLink}
                  >
                    Виж повече →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

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

      {/* ── Idea detail modal ────────────────────────────────────────────── */}
      {selectedIdea && (
        <IdeaDetailModal
          idea={selectedIdea}
          isFavorite={favorites.includes(selectedIdea.id)}
          onClose={() => setSelectedIdea(null)}
          onConfirm={() => handleConfirmBackup(selectedIdea)}
          onToggleFavorite={() => store.toggleFavorite(selectedIdea.id)}
        />
      )}

      {/* ── Refine modal (bottom sheet) ───────────────────────────────────── */}
      {isFilterModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div
            className={styles.modalSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <h2 className={styles.refineTitle}>Да го нагласим за теб</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setIsFilterModalOpen(false)}
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
                      className={[
                        styles.chip,
                        filters.time === o.value ? styles.chipSel : "",
                      ].join(" ")}
                      onClick={() =>
                        setFilters((f) => ({ ...f, time: o.value }))
                      }
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
                      <span className={styles.chipEmoji}>{o.emoji}</span>
                      <span className={styles.chipText}>{o.label}</span>
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
                      onClick={() =>
                        setFilters((f) => ({ ...f, ctx: o.value }))
                      }
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
              <Btn onClick={handleRefineApply}>Запази</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
