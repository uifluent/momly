"use client";

import { useState, useMemo, useRef } from "react";
import { Heart, ChevronDown } from "lucide-react";
import { useMomlyStore } from "@/lib/store";
import { getUpcomingEvents } from "@/lib/upcomingEvents";
import { getNearbyPlaces, getVenues } from "@/lib/localPlaces";
import {
  getFavoriteLocalItems,
  toggleFavoriteLocalItem,
} from "@/lib/sessionPrefs";
import { useUserLocation } from "@/hooks/useUserLocation";
import { haversineKm, formatDistanceBg } from "@/lib/haversine";
import type { UpcomingEvent } from "@/lib/upcomingEvents";
import type { LocalPlace } from "@/lib/localPlaces";
import styles from "./Explore.module.css";

// ── Tag config ────────────────────────────────────────────────────────────────

// Tags inherit the color of the tab they belong to.
// getTagStyle resolves this at call time (after all module-level consts are ready).
function getTagStyle(tag: string): {
  bg: string;
  text: string;
  border: string;
} {
  for (const { key, bg, text, border } of IDEA_TABS) {
    if (bg && text && border && TAB_TAG_MAP[key]?.includes(tag)) {
      return { bg, text, border };
    }
  }
  // fallback — use Активност blue
  return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
}

// ── Idea tabs ─────────────────────────────────────────────────────────────────

const IDEA_TABS = [
  { key: "all", label: "Всички", bg: null, text: null, border: null },
  {
    key: "Навън",
    label: "🌳 Навън",
    bg: "#F0FDF4",
    text: "#16A34A",
    border: "#86EFAC",
  },
  {
    key: "Активност",
    label: "🏃 Активност",
    bg: "#EFF6FF",
    text: "#2563EB",
    border: "#BFDBFE",
  },
  {
    key: "Изкуство",
    label: "🎭 Изкуство",
    bg: "#FAF5FF",
    text: "#7C3AED",
    border: "#DDD6FE",
  },
  {
    key: "Животни",
    label: "🐐 Животни",
    bg: "#FEFCE8",
    text: "#CA8A04",
    border: "#FDE68A",
  },
  {
    key: "Семейни",
    label: "🧸 Семейни",
    bg: "#FDF2F8",
    text: "#DB2777",
    border: "#FBCFE8",
  },
  {
    key: "Творческо",
    label: "🎨 Творческо",
    bg: "#FDF4FF",
    text: "#A21CAF",
    border: "#F5D0FE",
  },
] as const;

type IdeaTabKey = (typeof IDEA_TABS)[number]["key"];

// tab key → which card tags belong to it
const TAB_TAG_MAP: Record<string, string[]> = {
  Навън: ["Навън"],
  Активност: ["Движение", "Плуване", "Приключение"],
  Изкуство: ["Театър", "Музика", "Кино"],
  Животни: ["Животни"],
  Семейни: ["Семейни", "Игри"],
  Творческо: ["Творческо", "Наука", "Четене", "Спокойно", "Активност"],
};

// ── Tag derivation ─────────────────────────────────────────────────────────────

type ScoredPlaceBase = LocalPlace & { score: number; travelTime: string };

function getPlaceTags(place: ScoredPlaceBase): string[] {
  if (place.tags?.length) return place.tags.slice(0, 2);
  const t = place.title.toLowerCase();
  const primary: string =
    // Arts first — clear matches
    /кино/.test(t)
      ? "Кино"
      : /театър|куклен|приказк/.test(t)
        ? "Театър"
        : /музика|ритъм/.test(t)
          ? "Музика"
          : // Animals — zoos/farms (check before пони so яздене на пони hits Движение below)
            /зоо|зоокът|ферма|животн/.test(t)
            ? "Животни"
            : // Physical activities
              /въжен|катерен|climbing|walltopia|funtopia|приключен/.test(t)
              ? "Движение"
              : /яздене|конна|езда/.test(t)
                ? "Движение"
                : /плуван|басейн|aquapark/.test(t)
                  ? "Плуване"
                  : /скачане|тенис|gym/.test(t)
                    ? "Движение"
                    : // Creative / educational
                      /наук|роботик|музейко/.test(t)
                      ? "Наука"
                      : /музей/.test(t)
                        ? "Наука"
                        : /йога|сензор/.test(t)
                          ? "Спокойно"
                          : /арт|творч|рисув|работилниц/.test(t)
                            ? "Творческо"
                            : /библ|книж/.test(t)
                              ? "Четене"
                              : // Cafés / play cafés
                                /кафе|mplay|gush/.test(t)
                                ? "Семейни"
                                : // Ponies without riding context = animal
                                  /пони/.test(t)
                                  ? "Животни"
                                  : // Fallbacks via data fields
                                    place.energy === "high"
                                    ? "Движение"
                                    : place.milestone === "learning"
                                      ? "Активност"
                                      : place.section === "venue"
                                        ? "Игри"
                                        : "Навън";

  const tags = [primary];
  if (place.section === "outdoor" && primary !== "Навън") tags.push("Навън");
  return tags.slice(0, 2);
}

// ── Constants ──────────────────────────────────────────────────────────────────

const IDEAS_INITIAL = 10;
const IDEAS_LOAD_MORE = 6;

// ── Sub-components ─────────────────────────────────────────────────────────────

function TagPill({ tag }: { tag: string }) {
  const s = getTagStyle(tag);
  return (
    <span
      className={styles.tagPill}
      style={{ background: s.bg, color: s.text }}
    >
      {tag}
    </span>
  );
}

function EventTopImage({ ev }: { ev: UpcomingEvent }) {
  if (!ev.image) return <div className={styles.eventImgFallback}>🎭</div>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ev.image}
      alt={ev.title}
      className={styles.eventImg}
      loading="lazy"
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        el.style.display = "none";
        const fb = document.createElement("div");
        fb.className = styles.eventImgFallback;
        fb.textContent = "🎭";
        el.parentElement?.appendChild(fb);
      }}
    />
  );
}

function ShowAllBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className={styles.showAllBtn} onClick={onClick}>
      <ChevronDown size={14} strokeWidth={2} />
      Виж още
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Explore() {
  const store = useMomlyStore();
  const city = store.profile.city;
  const childAge = store.profile.childAgeMonths;
  const children = store.profile.children;

  const [activeTab, setActiveTab] = useState<IdeaTabKey>("all");
  const [ideasLimit, setIdeasLimit] = useState(IDEAS_INITIAL);
  const [gridKey, setGridKey] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  const [favLocalIds, setFavLocalIds] = useState<Set<string>>(
    () => new Set(getFavoriteLocalItems()),
  );
  const [heartedId, setHeartedId] = useState<string | null>(null);

  const userLocation = useUserLocation();

  function handleFavHeart(id: string) {
    toggleFav(id);
    setHeartedId(null);
    requestAnimationFrame(() => setHeartedId(id));
    setTimeout(() => setHeartedId(null), 650);
  }

  function changeTab(tab: IdeaTabKey) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setIdeasLimit(IDEAS_INITIAL);
    setGridKey((k) => k + 1);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function toggleFav(id: string) {
    const saved = toggleFavoriteLocalItem(id);
    setFavLocalIds((prev) => {
      const s = new Set(prev);
      saved ? s.add(id) : s.delete(id);
      return s;
    });
  }

  function distLabel(place: {
    coords?: { lat: number; lng: number };
    travelTime: string;
  }) {
    if (place.coords && userLocation) {
      const km = haversineKm(
        userLocation.lat,
        userLocation.lng,
        place.coords.lat,
        place.coords.lng,
      );
      return formatDistanceBg(km);
    }
    return `на ${place.travelTime}`;
  }

  // Events
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const allChildAges = (children ?? [])
      .filter((c) => c.birthDate)
      .map((c) => {
        const dob = new Date(c.birthDate);
        return (
          (now.getFullYear() - dob.getFullYear()) * 12 +
          (now.getMonth() - dob.getMonth())
        );
      });
    const all = getUpcomingEvents(city, childAge ?? null, 7, allChildAges);
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  }, [city, childAge, children]);

  // All ideas = places + venues combined and sorted by score
  const allIdeas = useMemo(() => {
    const p = getNearbyPlaces(city, childAge ?? null, {}, 40);
    const v = getVenues(city, childAge ?? null, {}, 40);
    return [...p, ...v].sort((a, b) => b.score - a.score);
  }, [city, childAge]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredIdeas = useMemo(() => {
    if (activeTab === "all") return allIdeas;
    const matchTags = TAB_TAG_MAP[activeTab] ?? [activeTab];
    return allIdeas.filter((i) =>
      getPlaceTags(i).some((tag) => matchTags.includes(tag)),
    );
  }, [allIdeas, activeTab]);

  const visibleIdeas = filteredIdeas.slice(0, ideasLimit);

  function renderIdeaCard(item: (typeof allIdeas)[number]) {
    const tags = getPlaceTags(item);
    const primary = tags[0];
    const s = getTagStyle(primary);
    const isFav = favLocalIds.has(item.id);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`;
    return (
      <div
        key={item.id}
        className={styles.card}
        style={{ borderLeft: `4px solid ${s.border}` }}
      >
        <div className={styles.cardTopRow}>
          <TagPill tag={primary} />
          <button
            className={[styles.heartBtn, heartedId === item.id ? "heart-popped" : ""].join(" ")}
            onClick={() => handleFavHeart(item.id)}
            aria-label="Запази"
            style={isFav ? { color: s.text } : undefined}
          >
            <Heart
              size={13}
              strokeWidth={2}
              fill={isFav ? "currentColor" : "none"}
            />
          </button>
        </div>
        <div className={styles.cardPadded}>
          <p className={styles.cardTitle}>{item.title}</p>
          {item.distance !== undefined && (
            <p className={styles.distLabel}>🕐 {distLabel(item)}</p>
          )}
          <div className={styles.ideaLinks}>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaLink}
                style={{ color: s.text }}
              >
                Разгледай →
              </a>
            )}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaLink}
              style={{ color: s.text }}
            >
              Маршрут →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.body}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Открий нещо ново</h1>
          <p className={styles.subtitle}>Места и идеи за теб и детето</p>
        </div>

        {/* ── EVENTS — compact carousel ── */}
        {upcomingEvents.length > 0 && (
          <section className={styles.eventsSection}>
            <h2 className={styles.sectionTitle}>🎭 Събития тази седмица</h2>
            <div className={styles.eventsCarousel}>
              {upcomingEvents.map((ev) => (
                <a
                  key={ev.id}
                  href={ev.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.eventCardCompact}
                >
                  <div className={styles.eventImgWrap}>
                    <EventTopImage ev={ev} />
                    <button
                      className={[styles.heartOverlay, heartedId === ev.id ? "heart-popped" : ""].join(" ")}
                      onClick={(e) => {
                        e.preventDefault();
                        handleFavHeart(ev.id);
                      }}
                      aria-label="Запази"
                    >
                      <Heart
                        size={12}
                        strokeWidth={2}
                        fill={favLocalIds.has(ev.id) ? "currentColor" : "none"}
                        style={
                          favLocalIds.has(ev.id)
                            ? { color: "#059669" }
                            : undefined
                        }
                      />
                    </button>
                  </div>
                  <div className={styles.eventCardCompactBody}>
                    {ev.dateLabel && (
                      <span className={styles.eventCardCompactDate}>
                        📅 {ev.dateLabel}
                      </span>
                    )}
                    <p className={styles.eventCardCompactTitle}>{ev.title}</p>
                    {ev.description && (
                      <p className={styles.eventCardCompactDesc}>
                        {ev.description}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── IDEAS (places + venues unified) ── */}
        {allIdeas.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>💡 Идеи за теб</h2>

            {/* Tab bar */}
            <div ref={tabsRef} className={styles.tabsBar}>
              {IDEA_TABS.map(({ key, label, bg, text, border }) => {
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    className={`${styles.tab} ${active ? styles.tabActive : ""}`}
                    style={
                      active && bg
                        ? { background: bg, color: text, borderColor: border }
                        : undefined
                    }
                    onClick={() => changeTab(key as IdeaTabKey)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {filteredIdeas.length === 0 ? (
              <div className={styles.emptyTab}>
                <p className={styles.emptyTabText}>
                  Няма точно това, но може да ти хареса 👇
                </p>
                <div className={styles.grid}>
                  {allIdeas
                    .slice(0, IDEAS_INITIAL)
                    .map((item) => renderIdeaCard(item))}
                </div>
              </div>
            ) : (
              <>
                <div
                  key={gridKey}
                  className={`${styles.grid} ${styles.gridFade}`}
                >
                  {visibleIdeas.map((item) => renderIdeaCard(item))}
                </div>
                {ideasLimit < filteredIdeas.length && (
                  <ShowAllBtn
                    onClick={() => setIdeasLimit((n) => n + IDEAS_LOAD_MORE)}
                  />
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
