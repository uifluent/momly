import type { Activity, Filters, UserProfile } from "./types";
import { isWeekend, getPreferredCats } from "./sessionPrefs";
import { getLocalPlacesAsActivities } from "./localPlaces";

type Scored = { idea: Activity; score: number };

interface Preferences {
  likedTags: Record<string, number>;
  skippedTags: Record<string, number>;
}

interface SelectionContext {
  favorites: string[];
  completedIds: Record<string, string>;
  city?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function calcAgeMonths(birthDate: string): number {
  const d = new Date(birthDate);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

// Derive a "milestone" from a child's age in months
function milestone(ageMonths: number): "sensory" | "exploration" | "play" | "learning" {
  if (ageMonths < 24)  return "sensory";
  if (ageMonths < 36)  return "exploration";
  if (ageMonths < 60)  return "play";
  return "learning";
}

// Which activity categories fit each milestone
const MILESTONE_CATS: Record<string, string[]> = {
  sensory:     ["calm", "self-care"],
  exploration: ["movement", "reset", "explore"],
  play:        ["creative", "movement", "social"],
  learning:    ["explore", "social", "real-life"],
};

// Which categories suit solo (1 child) vs group (2+ children) context
const SOLO_CATS  = ["calm", "self-care", "creative", "survival"];
const GROUP_CATS = ["social", "movement", "creative", "explore"];

function ageScore(a: Activity, profile: UserProfile): number {
  if (!a.withChild) return 0;  // not a child activity — skip

  const ages = (profile.children ?? [])
    .filter((c) => c.birthDate)
    .map((c) => calcAgeMonths(c.birthDate));

  if (ages.length === 0) return 0;

  const youngest   = Math.min(...ages);
  const oldest     = Math.max(...ages);
  const childCount = ages.length;
  let score        = 0;

  // ── Age range matching ────────────────────────────────────────────────────
  if (a.ageRange) {
    const [min, max] = a.ageRange;
    const allMatch  = ages.every((age) => age >= min && age <= max);
    const someMatch = ages.some((age)  => age >= min && age <= max);
    if (allMatch)        score += 3;  // every child fits
    else if (someMatch)  score += 1;  // at least one child fits
    else                 score -= 2;  // no child fits
  }

  // ── Solo vs multiple children ─────────────────────────────────────────────
  if (childCount === 1) {
    if (a.category.some((c) => SOLO_CATS.includes(c)))  score += 1;
  } else {
    if (a.category.some((c) => GROUP_CATS.includes(c))) score += 2;
    // Penalise ideas with a very narrow age window when ages span wide
    if (a.ageRange && (oldest - youngest) > 24) {
      const [min, max] = a.ageRange;
      if (max - min < 18) score -= 1;  // narrow window, wide age spread
    }
  }

  // ── Milestone matching ────────────────────────────────────────────────────
  const primaryMilestone = milestone(youngest);
  const fitsCats         = MILESTONE_CATS[primaryMilestone];
  if (a.category.some((c) => fitsCats.includes(c))) score += 2;

  return score;
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
  preferredCats: Set<string>,
): number {
  const withChild = filters.ctx === "child";
  let score = 0;

  // ── Core match ──────────────────────────────────────────────────────────────
  if (a.energy.includes(filters.energy))  score += 3;
  if (a.duration.includes(filters.time))  score += 2;
  if (a.withChild === withChild)           score += 3;

  // ── Age relevance ────────────────────────────────────────────────────────────
  score += ageScore(a, profile);

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

  // ── Weekend boost ─────────────────────────────────────────────────────────────
  if (isWeekend()) {
    const outdoor = cats.some((c) => ["movement", "reset", "explore"].includes(c));
    if (outdoor)                       score += 2;
    if (a.duration.includes("long"))   score += 1;
  }

  // ── Preference learning (explicit signals) ────────────────────────────────────
  score += a.category.reduce((acc, tag) => {
    return acc + (preferences.likedTags[tag] ?? 0) - (preferences.skippedTags[tag] ?? 0);
  }, 0);

  // ── Preference learning (from favorited activities) ───────────────────────────
  score += a.category.filter((c) => preferredCats.has(c)).length;

  // ── Tag-based energy alignment ────────────────────────────────────────────────
  if (a.tags) {
    if (filters.energy === "low" && (a.tags.includes("easy") || a.tags.includes("default"))) {
      score += 2;
    }
    if (filters.energy === "high" && (a.tags.includes("active") || a.tags.includes("outdoor") || a.tags.includes("adventure"))) {
      score += 2;
    }
  }

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
  const { favorites, completedIds, city } = context;

  // Merge local places into the idea pool so they compete equally
  const allIdeas = city
    ? [...ideas, ...getLocalPlacesAsActivities(city)]
    : ideas;
  const withChild = filters.ctx === "child";

  const recentCats    = new Set(
    recentIds.flatMap((id) => allIdeas.find((a) => a.id === id)?.category ?? [])
  );
  const preferredCats = getPreferredCats(favorites, allIdeas);

  // Persist cross-session
  try {
    localStorage.setItem("recentIdeas",    JSON.stringify(recentIds.slice(-10)));
    localStorage.setItem("favorites",      JSON.stringify(favorites));
    localStorage.setItem("completedIdeas", JSON.stringify(completedIds));
  } catch { /* SSR / quota — safe to ignore */ }

  const today = new Date().toDateString();
  const completedToday = new Set(
    Object.entries(completedIds)
      .filter(([, iso]) => iso && new Date(iso).toDateString() === today)
      .map(([id]) => id),
  );

  // ── Hard filters ─────────────────────────────────────────────────────────────
  let pool = allIdeas.filter((a) => {
    // Never show activities completed today
    if (completedToday.has(a.id)) return false;
    // City-specific activities only show for matching city
    if (a.city && context.city && a.city !== context.city) return false;
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

  // First fallback: relax duration and child-age filter, keep city + ctx
  if (pool.length === 0) {
    pool = allIdeas.filter((a) => {
      if (a.city && context.city && a.city !== context.city) return false;
      if (withChild && !a.withChild) return false;
      if (!withChild && a.withChild) return false;
      return a.duration.includes(filters.time);
    });
  }

  // Second fallback: isFallback items always available regardless of all filters
  if (pool.length === 0) {
    pool = allIdeas.filter((a) => a.isFallback === true);
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
      score: scoreIdea(a, filters, profile, recentIds, recentCats, favorites, completedIds, preferences, preferredCats),
    }))
    .sort((a, b) => b.score - a.score);

  const fillCount = forcedFav ? 2 : 3;
  const top = scored.slice(0, fillCount).map(({ idea }) => idea);

  const result = forcedFav ? [forcedFav, ...top] : top;
  return shuffle(result);
}
