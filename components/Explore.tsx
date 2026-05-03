"use client";

import { useState, useMemo, useRef } from "react";
import { Heart, ChevronDown } from "lucide-react";
import { useMomlyStore } from "@/lib/store";
import { getUpcomingEvents } from "@/lib/upcomingEvents";
import { getNearbyPlaces, getVenues } from "@/lib/localPlaces";
import { getFavoriteLocalItems, toggleFavoriteLocalItem } from "@/lib/sessionPrefs";
import { useUserLocation } from "@/hooks/useUserLocation";
import { haversineKm, formatDistanceBg } from "@/lib/haversine";
import type { UpcomingEvent } from "@/lib/upcomingEvents";
import type { LocalPlace } from "@/lib/localPlaces";
import styles from "./Explore.module.css";

// ── Tag config ────────────────────────────────────────────────────────────────

type TagName = keyof typeof TAG_STYLES;

const TAG_STYLES = {
  "Навън":       { bg: "#F0FDF4", text: "#16A34A", border: "#86EFAC" },
  "Приключение": { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  "Движение":    { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  "Активност":   { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  "Игри":        { bg: "#FAF5FF", text: "#9333EA", border: "#E9D5FF" },
  "Животни":     { bg: "#FEFCE8", text: "#CA8A04", border: "#FDE68A" },
  "Кафе":        { bg: "#FDF2F8", text: "#DB2777", border: "#FBCFE8" },
  "Творческо":   { bg: "#FDF4FF", text: "#A21CAF", border: "#F5D0FE" },
  "Театър":      { bg: "#FAF5FF", text: "#7C3AED", border: "#DDD6FE" },
  "Плуване":     { bg: "#EFF6FF", text: "#0369A1", border: "#BAE6FD" },
  "Музика":      { bg: "#FDF4FF", text: "#A21CAF", border: "#F5D0FE" },
  "Наука":       { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  "Спокойно":    { bg: "#F0FDF4", text: "#16A34A", border: "#86EFAC" },
  "Четене":      { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  "Кино":        { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" },
} as const;


function getTagStyle(tag: string): { bg: string; text: string; border: string } {
  return TAG_STYLES[tag as TagName] ?? TAG_STYLES["Активност"];
}

// ── Idea tabs ─────────────────────────────────────────────────────────────────

const IDEA_TABS = [
  { key: "all",        label: "Всички"       },
  { key: "Навън",      label: "🌳 Навън"     },
  { key: "Активност",  label: "🧩 Активност" },
  { key: "Животни",    label: "🐐 Животни"   },
  { key: "Кафе",       label: "☕ Кафе"      },
  { key: "Творческо",  label: "🎨 Творческо" },
  { key: "Движение",   label: "⚡ Движение"  },
] as const;

type IdeaTabKey = typeof IDEA_TABS[number]["key"];

// ── Tag derivation ─────────────────────────────────────────────────────────────

type ScoredPlaceBase = LocalPlace & { score: number; travelTime: string };

function getPlaceTags(place: ScoredPlaceBase): string[] {
  if (place.tags?.length) return place.tags.slice(0, 2);
  const t = place.title.toLowerCase();
  const primary: string =
    /въжен|приключен|катерен/.test(t)    ? "Приключение" :
    /зоо|животн|пони|кон\b/.test(t)      ? "Животни"     :
    /кино/.test(t)                        ? "Кино"        :
    /театър|куклен|приказк/.test(t)      ? "Театър"      :
    /плуван|басейн/.test(t)              ? "Плуване"     :
    /музика/.test(t)                      ? "Музика"      :
    /наук|роботик/.test(t)               ? "Наука"       :
    /йога|сензор/.test(t)                ? "Спокойно"    :
    /арт|творч|рисув|работилниц/.test(t) ? "Творческо"   :
    /кафе|mplay|gush/.test(t)            ? "Кафе"        :
    /библ|книж/.test(t)                  ? "Четене"      :
    /музей/.test(t)                      ? "Активност"   :
    place.energy === "high"              ? "Приключение" :
    place.milestone === "learning"       ? "Активност"   :
    place.section === "venue"            ? "Игри"        :
                                           "Навън";

  const tags = [primary];
  if (place.section === "outdoor" && primary !== "Навън") tags.push("Навън");
  return tags.slice(0, 2);
}

// ── Constants ──────────────────────────────────────────────────────────────────

const IDEAS_INITIAL   = 8;
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
  const store    = useMomlyStore();
  const city     = store.profile.city;
  const childAge = store.profile.childAgeMonths;
  const children = store.profile.children;

  const [activeTab,  setActiveTab]  = useState<IdeaTabKey>("all");
  const [ideasLimit, setIdeasLimit] = useState(IDEAS_INITIAL);
  const [gridKey,    setGridKey]    = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  const [favLocalIds, setFavLocalIds] = useState<Set<string>>(
    () => new Set(getFavoriteLocalItems()),
  );

  const userLocation = useUserLocation();

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

  function distLabel(place: { coords?: { lat: number; lng: number }; travelTime: string }) {
    if (place.coords && userLocation) {
      const km = haversineKm(userLocation.lat, userLocation.lng, place.coords.lat, place.coords.lng);
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
        return (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
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
    if (activeTab === "Движение")
      return allIdeas.filter((i) => i.energy === "high" || getPlaceTags(i).includes("Приключение"));
    return allIdeas.filter((i) => getPlaceTags(i).includes(activeTab));
  }, [allIdeas, activeTab]);

  const visibleIdeas = filteredIdeas.slice(0, ideasLimit);

  function renderIdeaCard(item: typeof allIdeas[number]) {
    const tags    = getPlaceTags(item);
    const primary = tags[0];
    const s       = getTagStyle(primary);
    const isFav   = favLocalIds.has(item.id);
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
            className={styles.heartBtn}
            onClick={() => toggleFav(item.id)}
            aria-label="Запази"
            style={isFav ? { color: s.text } : undefined}
          >
            <Heart size={13} strokeWidth={2} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
        <div className={styles.cardPadded}>
          <p className={styles.cardTitle}>{item.title}</p>
          {item.distance !== undefined && (
            <p className={styles.distLabel}>🕐 {distLabel(item)}</p>
          )}
          <div className={styles.ideaLinks}>
            {item.link && (
              <a href={item.link} target="_blank" rel="noopener noreferrer"
                className={styles.ctaLink} style={{ color: s.text }}>
                Разгледай →
              </a>
            )}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className={styles.ctaLink} style={{ color: s.text }}>
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
                      className={styles.heartOverlay}
                      onClick={(e) => { e.preventDefault(); toggleFav(ev.id); }}
                      aria-label="Запази"
                    >
                      <Heart
                        size={12} strokeWidth={2}
                        fill={favLocalIds.has(ev.id) ? "currentColor" : "none"}
                        style={favLocalIds.has(ev.id) ? { color: "#059669" } : undefined}
                      />
                    </button>
                  </div>
                  <div className={styles.eventCardCompactBody}>
                    <p className={styles.eventCardCompactTitle}>{ev.title}</p>
                    {ev.dateLabel && (
                      <span className={styles.eventCardCompactDate}>📅 {ev.dateLabel}</span>
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
            <h2 className={styles.sectionTitle}>💡 Идеи около теб</h2>

            {/* Tab bar */}
            <div ref={tabsRef} className={styles.tabsBar}>
              {IDEA_TABS.map(({ key, label }) => {
                const active = activeTab === key;
                const s = key !== "all" ? getTagStyle(key) : null;
                return (
                  <button
                    key={key}
                    className={`${styles.tab} ${active ? styles.tabActive : ""}`}
                    style={active && s ? { background: s.bg, color: s.text, borderColor: s.border } : undefined}
                    onClick={() => changeTab(key as IdeaTabKey)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {filteredIdeas.length === 0 ? (
              <div className={styles.emptyTab}>
                <p className={styles.emptyTabText}>Няма точно това, но може да ти хареса 👇</p>
                <div className={styles.grid}>
                  {allIdeas.slice(0, IDEAS_INITIAL).map((item) => renderIdeaCard(item))}
                </div>
              </div>
            ) : (
              <>
                <div key={gridKey} className={`${styles.grid} ${styles.gridFade}`}>
                  {visibleIdeas.map((item) => renderIdeaCard(item))}
                </div>
                {ideasLimit < filteredIdeas.length && (
                  <ShowAllBtn onClick={() => setIdeasLimit((n) => n + IDEAS_LOAD_MORE)} />
                )}
              </>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
