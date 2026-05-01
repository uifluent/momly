import type { EnergyLevel, Duration } from "./types";

export interface UpcomingEvent {
  id:          string;
  title:       string;
  description: string;
  city:        string;
  duration:    Duration;
  energy:      EnergyLevel[];
  ageRange:    { min: number; max: number };  // years
  link:        string;
  date:        string;    // ISO "YYYY-MM-DD" — first showing
  endDate?:    string;    // ISO "YYYY-MM-DD" — last showing (optional)
  dateLabel?:  string;    // human label shown in card
  source?:     string;    // e.g. "Plays.bg"
}

// ── Curated events — update manually as new events are confirmed ──────────────
// Source: plays.bg/детски-спектакли/sofia
// Rule: add only confirmed events; remove or update dates when shows change.

export const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: "plays-detski-spektakl-1",
    title: "Вълшебният свят на Шрек 🟢",
    description: "Мюзикъл за деца и семейства по любимия анимационен филм.",
    city: "София",
    duration: "medium",
    energy: ["medium"],
    ageRange: { min: 4, max: 12 },
    link: "https://www.plays.bg/детски-спектакли/sofia",
    date: "2026-05-03",
    endDate: "2026-05-04",
    dateLabel: "3–4 май",
    source: "Plays.bg",
  },
  {
    id: "plays-detski-spektakl-2",
    title: "Снежанка и седемте джуджета ❄️",
    description: "Класическа приказка на живо — магия за малките.",
    city: "София",
    duration: "medium",
    energy: ["low", "medium"],
    ageRange: { min: 3, max: 8 },
    link: "https://www.plays.bg/детски-спектакли/sofia",
    date: "2026-05-02",
    endDate: "2026-05-03",
    dateLabel: "2–3 май",
    source: "Plays.bg",
  },
  {
    id: "plays-baby-spektakl",
    title: "Бебешко представление 🎭",
    description: "Интерактивно шоу за бебета и техните родители.",
    city: "София",
    duration: "short",
    energy: ["low"],
    ageRange: { min: 0, max: 3 },
    link: "https://www.plays.bg/детски-спектакли/sofia",
    date: "2026-05-04",
    dateLabel: "4 май",
    source: "Plays.bg",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** True if the event starts (or is still running) within the next `windowDays`. */
export function isUpcoming(event: UpcomingEvent, windowDays = 3): boolean {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(event.date);
  const endDate   = event.endDate ? new Date(event.endDate) : startDate;

  // Event must not have ended yet
  if (endDate < today) return false;

  // Event must start within the window
  const daysUntilStart = Math.floor(
    (startDate.getTime() - today.getTime()) / 86_400_000,
  );
  return daysUntilStart <= windowDays;
}

function scoreUpcoming(
  event: UpcomingEvent,
  childAgeMonths: number | null,
): number {
  let score = 5;  // base upcoming bonus

  if (childAgeMonths !== null) {
    const minM = event.ageRange.min * 12;
    const maxM = event.ageRange.max * 12;
    if (childAgeMonths >= minM && childAgeMonths <= maxM)            score += 3;
    else if (childAgeMonths < minM && childAgeMonths >= minM - 12)  score += 1;
  }

  return score;
}

export function getBestUpcomingEvent(
  city: string | undefined,
  childAgeMonths: number | null,
  windowDays = 3,
): (UpcomingEvent & { score: number }) | null {
  if (!city) return null;

  const pool = UPCOMING_EVENTS.filter(
    (e) => e.city === city && isUpcoming(e, windowDays),
  );

  if (pool.length === 0) return null;

  const scored = pool
    .map((e) => ({ ...e, score: scoreUpcoming(e, childAgeMonths) }))
    .sort((a, b) => b.score - a.score);

  return scored[0];
}
