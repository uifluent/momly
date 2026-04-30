import type { Activity, Filters, UserProfile } from "./types";

type Scored = { idea: Activity; score: number };

interface Preferences {
  likedTags: Record<string, number>;
  skippedTags: Record<string, number>;
}

export function getBestIdeas(
  ideas: Activity[],
  filters: Filters,
  profile: UserProfile,
  recentIds: string[],
  preferences: Preferences = { likedTags: {}, skippedTags: {} },
): Activity[] {
  const withChild = filters.ctx === "child";

  // ── Hard filters ────────────────────────────────────────────────────────────
  let pool = ideas.filter((a) => {
    if (!a.duration.includes(filters.time)) return false;

    // Low-energy users skip ideas that are only high-energy
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

  // Graceful fallback: relax to duration-only if pool is empty
  if (pool.length === 0) {
    pool = ideas.filter((a) => a.duration.includes(filters.time));
  }

  // ── Scoring ─────────────────────────────────────────────────────────────────
  const scored: Scored[] = pool.map((a) => {
    let score = 0;

    if (a.duration.includes(filters.time)) score += 3;
    if (a.energy.includes(filters.energy)) score += 3;
    if (a.withChild === withChild) score += 2;

    // Each matching user need contributes +1
    const needs = profile.needs ?? [];
    const cats = a.category;
    for (const need of needs) {
      if (need === "calm"             && (cats.includes("calm") || cats.includes("self-care"))) score += 1;
      if (need === "me-time"          && !a.withChild)                                          score += 1;
      if (need === "creative"         && cats.includes("creative"))                             score += 1;
      if (need === "outside"          && (cats.includes("reset") || cats.includes("movement") || cats.includes("explore"))) score += 1;
      if (need === "child-activities" && a.withChild)                                           score += 1;
      if (need === "meals"            && cats.includes("real-life"))                            score += 1;
      if (need === "movement"         && cats.includes("movement"))                             score += 1;
    }

    // Novelty: push recently shown ideas to the back
    if (recentIds.includes(a.id)) score -= 5;

    // Preference learning: reward liked categories, penalise skipped ones
    const preferenceScore = a.category.reduce((acc, tag) => {
      return acc + (preferences.likedTags[tag] ?? 0) - (preferences.skippedTags[tag] ?? 0);
    }, 0);
    score += preferenceScore;

    return { idea: a, score };
  });

  // ── Sort + return top 3 ─────────────────────────────────────────────────────
  return scored
    .sort((a, b) => {
      if (b.score === a.score) return Math.random() - 0.5;
      return b.score - a.score;
    })
    .map(({ idea }) => idea)
    .slice(0, 3);
}
