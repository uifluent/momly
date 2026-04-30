import type { Activity, Filters, UserProfile } from "./types";

type Scored = { idea: Activity; score: number };

interface Preferences {
  likedTags: Record<string, number>;
  skippedTags: Record<string, number>;
}

interface SelectionContext {
  favorites: string[];
  completedIds: Record<string, string>;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function daysSinceCompleted(completedIds: Record<string, string>, id: string): number | null {
  const iso = completedIds[id];
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const doneMs  = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((todayMs - doneMs) / 86_400_000);
}

function scoreIdea(
  a: Activity,
  filters: Filters,
  profile: UserProfile,
  recentIds: string[],
  recentCats: Set<string>,
  favorites: string[],
  completedIds: Record<string, string>,
  preferences: Preferences,
): number {
  const withChild = filters.ctx === "child";
  let score = 0;

  // ── Core match ──────────────────────────────────────────────────────────────
  if (a.energy.includes(filters.energy))  score += 3;
  if (a.duration.includes(filters.time))  score += 2;
  if (a.withChild === withChild)           score += 3;

  // ── Novelty ─────────────────────────────────────────────────────────────────
  if (!recentIds.includes(a.id))                                score += 3;
  if (a.category.every((cat) => !recentCats.has(cat)))          score += 2;

  // ── Effort-energy alignment ──────────────────────────────────────────────────
  if (filters.energy === "low" && a.effort === "zero")          score += 2;

  // ── Repeatable bonus ─────────────────────────────────────────────────────────
  if (a.repeatable && filters.energy === "low")                 score += 2;

  // ── Favorites ───────────────────────────────────────────────────────────────
  if (favorites.includes(a.id))                                 score += 2;

  // ── Completion cooldown ──────────────────────────────────────────────────────
  const daysAgo = daysSinceCompleted(completedIds, a.id);
  if (daysAgo !== null) {
    if (daysAgo === 0)      score -= 5;  // completed today
    else if (daysAgo < 3)   score -= 2;  // completed recently
    else                    score += 1;  // tried it, came back → fine
  }

  // ── User needs ───────────────────────────────────────────────────────────────
  const needs = profile.needs ?? [];
  const cats  = a.category;
  for (const need of needs) {
    if (need === "calm"             && (cats.includes("calm") || cats.includes("self-care"))) score += 1;
    if (need === "me-time"          && !a.withChild)                                          score += 1;
    if (need === "creative"         && cats.includes("creative"))                             score += 1;
    if (need === "outside"          && (cats.includes("reset") || cats.includes("movement") || cats.includes("explore"))) score += 1;
    if (need === "child-activities" && a.withChild)                                           score += 1;
    if (need === "meals"            && cats.includes("real-life"))                            score += 1;
    if (need === "movement"         && cats.includes("movement"))                             score += 1;
  }

  // ── Preference learning ──────────────────────────────────────────────────────
  score += a.category.reduce((acc, tag) => {
    return acc + (preferences.likedTags[tag] ?? 0) - (preferences.skippedTags[tag] ?? 0);
  }, 0);

  return score;
}

export function getBestIdeas(
  ideas: Activity[],
  filters: Filters,
  profile: UserProfile,
  recentIds: string[],
  preferences: Preferences = { likedTags: {}, skippedTags: {} },
  context: SelectionContext = { favorites: [], completedIds: {} },
): Activity[] {
  const { favorites, completedIds } = context;
  const withChild = filters.ctx === "child";

  const recentCats = new Set(
    recentIds.flatMap((id) => ideas.find((a) => a.id === id)?.category ?? [])
  );

  // Persist cross-session
  try {
    localStorage.setItem("recentIdeas",    JSON.stringify(recentIds.slice(-10)));
    localStorage.setItem("favorites",      JSON.stringify(favorites));
    localStorage.setItem("completedIdeas", JSON.stringify(completedIds));
  } catch { /* SSR / quota — safe to ignore */ }

  // ── Hard filters ─────────────────────────────────────────────────────────────
  let pool = ideas.filter((a) => {
    if (!a.duration.includes(filters.time)) return false;
    if (
      filters.energy === "low" &&
      a.energy.includes("high") &&
      !a.energy.includes("low") &&
      !a.energy.includes("medium")
    ) return false;
    if (withChild && !a.withChild) return false;
    if (!withChild && a.withChild) return false;
    if (withChild && a.ageRange && profile.childAgeMonths != null) {
      const age = profile.childAgeMonths;
      if (age < a.ageRange[0] || age > a.ageRange[1]) return false;
    }
    return true;
  });

  if (pool.length === 0) {
    pool = ideas.filter((a) => a.duration.includes(filters.time));
  }

  // ── 80 / 20: 20% chance to lead with a random favorite ───────────────────────
  let forcedFav: Activity | null = null;
  const favPool = pool.filter((a) => favorites.includes(a.id));
  if (favPool.length > 0 && Math.random() < 0.2) {
    forcedFav = favPool[Math.floor(Math.random() * favPool.length)];
  }

  // ── Score + rank ─────────────────────────────────────────────────────────────
  const scored: Scored[] = pool
    .filter((a) => !forcedFav || a.id !== forcedFav.id)
    .map((a) => ({
      idea: a,
      score: scoreIdea(a, filters, profile, recentIds, recentCats, favorites, completedIds, preferences),
    }))
    .sort((a, b) => b.score - a.score);

  const fillCount = forcedFav ? 2 : 3;
  const top = scored.slice(0, fillCount).map(({ idea }) => idea);

  const result = forcedFav ? [forcedFav, ...top] : top;
  return shuffle(result);
}
