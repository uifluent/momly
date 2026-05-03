import type { EnergyLevel, Duration } from "./types";
import rawEvents from "./upcomingEventsData.json";

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
  isClear?:    boolean;   // well-organised, easy to navigate
  easyAccess?: boolean;   // central location / easy parking
  image?:      string;    // Unsplash or local /images/… URL
}

// Auto-updated weekly by GitHub Actions via scripts/fetch-plays.mjs --write
export const UPCOMING_EVENTS: UpcomingEvent[] = rawEvents as UpcomingEvent[];

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
  let score = 0;

  // Timing bonus
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(event.date);
  const days  = Math.floor((start.getTime() - today.getTime()) / 86_400_000);
  if (days <= 1)      score += 4;  // today or tomorrow
  else if (days <= 3) score += 2;  // within 3 days

  // Age match
  if (childAgeMonths !== null) {
    const minM = event.ageRange.min * 12;
    const maxM = event.ageRange.max * 12;
    if (childAgeMonths >= minM && childAgeMonths <= maxM)            score += 3;
    else if (childAgeMonths < minM && childAgeMonths >= minM - 12)  score += 1;
  }

  // Quality signals
  if (event.isClear)    score += 2;
  if (event.easyAccess) score += 2;

  return score;
}

export function getBestUpcomingEvent(
  city: string | undefined,
  childAgeMonths: number | null,
  windowDays = 7,
): (UpcomingEvent & { score: number }) | null {
  const all = getUpcomingEvents(city, childAgeMonths, windowDays);
  return all[0] ?? null;
}

/** True if the event's age range covers at least one of the given child ages. */
function fitsAnyChild(event: UpcomingEvent, childAgesMonths: number[]): boolean {
  if (childAgesMonths.length === 0) return true;
  const minM = event.ageRange.min * 12;
  const maxM = event.ageRange.max * 12;
  // Allow up to 6 months younger than the stated minimum (common edge rounding)
  return childAgesMonths.some((age) => age >= minM - 6 && age <= maxM);
}

/** Returns ALL upcoming events for the city, sorted by score. */
export function getUpcomingEvents(
  city: string | undefined,
  childAgeMonths: number | null,
  windowDays = 7,
  allChildAgesMonths: number[] = [],
): (UpcomingEvent & { score: number })[] {
  if (!city) return [];

  const hasAgeFilter = allChildAgesMonths.length > 0;

  const filtered = UPCOMING_EVENTS.filter((e) => {
    if (e.city !== city || !isUpcoming(e, windowDays)) return false;
    if (hasAgeFilter) return fitsAnyChild(e, allChildAgesMonths);
    return true;
  });

  // If age filter leaves nothing, fall back to unfiltered
  const pool = hasAgeFilter && filtered.length === 0
    ? UPCOMING_EVENTS.filter((e) => e.city === city && isUpcoming(e, windowDays))
    : filtered;

  return pool
    .map((e)  => ({ ...e, score: scoreUpcoming(e, childAgeMonths) }))
    .sort((a, b) => b.score - a.score);
}
