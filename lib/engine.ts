import type { Activity, Filters, UserProfile } from "./types";

/**
 * Filter activities based on hard constraints.
 */
export function filterActivities(
  activities: Activity[],
  filters: Filters,
  profile: UserProfile
): Activity[] {
  const withChild = filters.ctx === "child";
  const childAgeMonths = profile.childAgeMonths;

  return activities.filter((a) => {
    if (!a.duration.includes(filters.time)) return false;
    if (!a.energy.includes(filters.energy)) return false;
    if (withChild && !a.withChild) return false;
    if (!withChild && a.withChild) return false;
    if (withChild && a.ageRange && childAgeMonths != null) {
      if (childAgeMonths < a.ageRange[0] || childAgeMonths > a.ageRange[1]) return false;
    }
    return true;
  });
}

/**
 * Score and sort activities. Higher score = better match.
 * category is now string[] in the new dataset.
 * id is now a string.
 */
export function scoreActivities(
  pool: Activity[],
  filters: Filters,
  profile: UserProfile,
  recentIds: string[]
): Activity[] {
  const scored = pool.map((a) => {
    let score = 0;

    if (a.energy[0] === filters.energy) score += 3;
    if (a.duration[0] === filters.time) score += 2;

    if (filters.energy === "low") {
      if (a.effort === "zero") score += 4;
      if (a.effort === "low") score += 2;
    }

    if (filters.energy === "low" && a.mentalLoad === "light") score += 2;

    // Needs alignment — category is now an array
    const needs = profile.needs ?? [];
    const cats = a.category;
    if (needs.includes("calm") && (cats.includes("calm") || cats.includes("self-care"))) score += 2;
    if (needs.includes("me-time") && !a.withChild) score += 2;
    if (needs.includes("creative") && cats.includes("creative")) score += 2;
    if (needs.includes("outside") && (cats.includes("movement") || cats.includes("reset") || cats.includes("explore"))) score += 1;
    if (needs.includes("child-activities") && a.withChild) score += 2;
    if (needs.includes("meals") && cats.includes("real-life")) score += 1;

    // Novelty: de-prioritise recently shown (id is string)
    if (recentIds.includes(a.id)) score -= 5;

    // Small jitter for freshness
    score += Math.random() * 1.5;

    return { ...a, _score: score };
  });

  return scored
    .sort((a, b) => (b as any)._score - (a as any)._score)
    .map(({ _score, ...rest }: any) => rest);
}

/**
 * Top-level entry: filter + score + return top N.
 * Falls back gracefully if filtered set is empty.
 */
export function decide(
  activities: Activity[],
  filters: Filters,
  profile: UserProfile,
  recentIds: string[],
  limit = 4
): Activity[] {
  const filtered = filterActivities(activities, filters, profile);

  const pool =
    filtered.length > 0
      ? filtered
      : activities.filter(
          (a) =>
            a.duration.includes(filters.time) &&
            a.energy.includes(filters.energy)
        );

  const sorted = scoreActivities(pool, filters, profile, recentIds);
  return sorted.slice(0, limit);
}
