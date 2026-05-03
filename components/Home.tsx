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
import { getUpcomingEvents } from "@/lib/upcomingEvents";
import {
  getNearbyPlaces,
  toggleSavedTrip,
  getSavedTrips,
} from "@/lib/localPlaces";
import {
  addToLocalHistory,
  getFavoriteLocalItems,
  toggleFavoriteLocalItem,
} from "@/lib/sessionPrefs";
import { useSurpriseIdea } from "@/hooks/useSurpriseIdea";
import { useUserLocation } from "@/hooks/useUserLocation";
import { haversineKm, formatDistanceBg } from "@/lib/haversine";
import { IdeaDetailModal } from "./IdeaDetailModal";
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
  const children = store.profile.children;

  const upcomingEvents = useMemo(() => {
    // Compute current age in months for every child with a known birthdate
    const now = new Date();
    const allChildAges = (children ?? [])
      .filter((c) => c.birthDate)
      .map((c) => {
        const dob = new Date(c.birthDate);
        return (now.getFullYear() - dob.getFullYear()) * 12 +
               (now.getMonth() - dob.getMonth());
      });

    const all = getUpcomingEvents(city, childAge ?? null, 7, allChildAges);
    // shuffle and cap at 5
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, 5);
  }, [city, childAge, children]);

  const nearbyPlaces = useMemo(
    () => getNearbyPlaces(city, childAge ?? null, filters, 3),
    [city, childAge, filters], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const weekendIdea = useMemo(() => {
    const day = new Date().getDay();
    if (day !== 0 && day !== 6) return null; // only Sat/Sun
    return getLocalIdea(filters, city) ?? null;
  }, [filters.time, filters.energy, filters.ctx, city]); // eslint-disable-line react-hooks/exhaustive-deps
  const surprise = useSurpriseIdea(filters);
  const userLocation = useUserLocation();

  function distLabel(place: { coords?: { lat: number; lng: number }; travelTime: string }): string {
    if (place.coords && userLocation) {
      const km = haversineKm(userLocation.lat, userLocation.lng, place.coords.lat, place.coords.lng);
      return formatDistanceBg(km);
    }
    return `на ${place.travelTime} от теб`;
  }

  const [idea, setIdea] = useState<Activity | null>(null);
  const [backupIdeas, setBackupIdeas] = useState<Activity[]>([]);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [done, setDone] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Activity | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Unified set of all locally-favorited IDs (events + places)
  const [favLocalIds, setFavLocalIds] = useState<Set<string>>(
    () => new Set(getFavoriteLocalItems()),
  );
  function toggleLocalFav(id: string) {
    const saved = toggleFavoriteLocalItem(id);
    setFavLocalIds((prev) => {
      const s = new Set(prev);
      saved ? s.add(id) : s.delete(id);
      return s;
    });
    if (saved) showToast("Запазено 💛");
  }

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
    showToast(
      COMPLETION_MSGS[Math.floor(Math.random() * COMPLETION_MSGS.length)],
    );
    setTimeout(() => {
      const nextShown = [...shownIds, idea.id].slice(-5);
      setShownIds(nextShown);
      setShuffleCount((c) => c + 1);
      const next = pickIdea(filters, nextShown);
      if (next) swapIdea(next);
    }, 1800);
  }

  function handleRefineApply() {
    store.setFilter("time", filters.time);
    store.setFilter("energy", filters.energy);
    store.setFilter("ctx", filters.ctx);
    setShownIds([]);
    setShuffleCount(0);

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
    const delay = 500 + Math.random() * 300;
    setTimeout(() => {
      const exclude = idea ? [idea.id, ...shownIds] : shownIds;
      const picked = surprise.pick(exclude);
      if (picked) {
        swapIdea(picked);
        const newShown = [...exclude, picked.id].slice(-5);
        setShownIds(newShown);
        const s = useMomlyStore.getState();
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
        ).filter((a) => !newShown.includes(a.id));
        setBackupIdeas(fresh.slice(0, 2));
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

        {/* ── Main card + backups with unified refresh transition ───────── */}
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

          {/* ── Backup ideas ────────────────────────────────────────────── */}
          {backupIdeas.length > 0 && (
            <div className={styles.backupsRow}>
              {backupIdeas.map((b) => (
                <button
                  key={b.id}
                  className={styles.backupCard}
                  onClick={() => setSelectedIdea(b)}
                >
                  <span className={styles.backupTitle}>
                    {b.emoji && (
                      <span style={{ marginRight: 6 }}>{b.emoji}</span>
                    )}
                    {b.title}
                  </span>
                  <span className={styles.backupArrow}>→</span>
                </button>
              ))}
            </div>
          )}
        </div>

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

        {/* ── Events carousel ───────────────────────────────────────────── */}
        {upcomingEvents.length > 0 && (
          <div className={`${styles.sectionHeader} anim-fade-up delay-2`}>
            <p className={styles.sectionTitle}>🎭 Събития за теб</p>
            <p className={styles.sectionSubtitle}>
              Подбрани активности за следващите дни
            </p>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className={`${styles.eventsCarousel} anim-fade-up delay-2`}>
            {upcomingEvents.map((ev) => (
              <div key={ev.id} className={styles.eventCard}>
                <div className={styles.cardLabelRow}>
                  <span
                    className={`${styles.typeChip} ${styles.typeChipEvent}`}
                  >
                    🎭 Събитие
                  </span>
                  <button
                    className={`${styles.miniHeart} ${styles.miniHeartEvent}`}
                    onClick={() => toggleLocalFav(ev.id)}
                    aria-label={
                      favLocalIds.has(ev.id) ? "Премахни от любими" : "Запази"
                    }
                  >
                    <Heart
                      size={15}
                      strokeWidth={2}
                      fill={favLocalIds.has(ev.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <div className={styles.eventCardTop}>
                  <PlaceThumbnail
                    staticImage={ev.image}
                    link={ev.link}
                    alt={ev.title}
                    fallbackEmoji="🎭"
                  />
                  <div className={styles.eventCardMeta}>
                    <p className={styles.eventTitle}>{ev.title}</p>
                    {ev.dateLabel && (
                      <p className={styles.eventDate}>📅 {ev.dateLabel}</p>
                    )}
                  </div>
                </div>
                <p className={styles.eventDesc}>{ev.description}</p>
                <a
                  href={ev.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.eventLink}
                >
                  Разгледай →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── Nearby places carousel ────────────────────────────────────── */}
        {nearbyPlaces.length > 0 && (
          <div className={`${styles.sectionHeader} anim-fade-up delay-2`}>
            <p className={styles.sectionTitle}>📍 Места около теб</p>
            <p className={styles.sectionSubtitle}>Подходящи за днес</p>
          </div>
        )}

        {nearbyPlaces.length > 0 && (
          <div className={`${styles.eventsCarousel} anim-fade-up delay-2`}>
            {nearbyPlaces.map((place) => (
              <div key={place.id} className={`${styles.eventCard} ${styles.placeCard}`}>
                <div className={styles.cardLabelRow}>
                  <span className={`${styles.typeChip} ${styles.typeChipPlace}`}>📍 Място</span>
                  <button
                    className={`${styles.miniHeart} ${styles.miniHeartPlace}`}
                    onClick={() => toggleLocalFav(place.id)}
                    aria-label={favLocalIds.has(place.id) ? "Премахни от любими" : "Запази"}
                  >
                    <Heart size={15} strokeWidth={2} fill={favLocalIds.has(place.id) ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className={styles.eventCardTop}>
                  <PlaceThumbnail staticImage={place.image} link={place.link} alt={place.title} fallbackEmoji="📍" />
                  <div className={styles.eventCardMeta}>
                    <p className={styles.eventTitle}>{place.title}</p>
                    <p className={styles.eventDate}>🕐 {distLabel(place)}</p>
                  </div>
                </div>
                <p className={styles.eventDesc}>{place.description}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.eventLink} ${styles.eventLinkPlace}`}
                >
                  Маршрут →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── Weekend idea (Sat/Sun only) ───────────────────────────────── */}
        {weekendIdea && (
          <div className={`${styles.sectionHeader} anim-fade-up delay-2`}>
            <p className={styles.sectionTitle}>🌤 Уикенд идея</p>
            <p className={styles.sectionSubtitle}>Нещо хубаво за днес</p>
          </div>
        )}

        {weekendIdea && (
          <div className={`${styles.weekendIdeaCard} anim-fade-up delay-2`}>
            <div className={styles.cardLabelRow}>
              <span className={`${styles.typeChip} ${styles.typeChipIdea}`}>💡 Идея</span>
              <button
                className={styles.miniHeart}
                onClick={() => toggleLocalFav(weekendIdea.id)}
                aria-label={favLocalIds.has(weekendIdea.id) ? "Премахни от любими" : "Запази"}
              >
                <Heart size={15} strokeWidth={2} fill={favLocalIds.has(weekendIdea.id) ? "currentColor" : "none"} />
              </button>
            </div>
            <p className={styles.weekendIdeaTitle}>{weekendIdea.title}</p>
            <p className={styles.weekendIdeaDesc}>{weekendIdea.description}</p>
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
