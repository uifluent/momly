"use client";

import { useState } from "react";
import { useMomlyStore } from "@/lib/store";
import { getBestIdeas } from "@/lib/getBestIdeas";
import activitiesData from "@/data/activities.json";
import type { Activity, Filters } from "@/lib/types";

const allActivities = activitiesData as Activity[];

// Assigns a weight to each candidate for weighted-random selection.
// Higher weight = higher probability — but nothing is guaranteed,
// which keeps the feature feeling genuinely surprising.
function surpriseWeight(a: Activity): number {
  let w = 1;
  if (a.tags?.includes("event"))   w += 2;  // weekend events feel fresh
  if (a.tags?.includes("fun"))     w += 2;  // fun tag → extra lift
  if (a.tags?.includes("default")) w += 1;  // easy/default: slight push
  return w;
}

function weightedPick(items: Activity[]): Activity {
  const weights = items.map(surpriseWeight);
  const total   = weights.reduce((s, w) => s + w, 0);
  let   rand    = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return items[i];
  }
  return items[items.length - 1]; // rounding-error fallback
}

/**
 * Provides a context-aware weighted-random pick from the recommendation pool.
 * Tracks its own session history to prevent immediate repeats.
 * Always returns at least one idea (isFallback safety net).
 */
export function useSurpriseIdea(filters: Filters) {
  const [sessionIds, setSessionIds] = useState<string[]>([]);

  /**
   * Pick one surprising idea.
   * @param alsoExclude  Additional IDs to skip (e.g. idea currently shown).
   */
  function pick(alsoExclude: string[] = []): Activity | null {
    const s       = useMomlyStore.getState();
    const exclude = new Set([...sessionIds, ...alsoExclude]);

    // Full scored pool through existing engine — preserves all scoring logic
    const ranked = getBestIdeas(
      allActivities,
      filters,
      s.profile,
      s.recentIds,
      s.userPreferences,
      { favorites: s.favorites, completedIds: s.completedIds, city: s.profile.city },
    ).filter((a) => !exclude.has(a.id));

    // If the filtered pool is empty fall back to isFallback items
    const candidates = ranked.length > 0
      ? ranked
      : allActivities.filter((a) => a.isFallback === true && !exclude.has(a.id));

    if (candidates.length === 0) return null;

    const selected = weightedPick(candidates);
    setSessionIds((prev) => [...prev, selected.id].slice(-10));
    return selected;
  }

  /** Call when the user resets context (filter change, page nav). */
  function reset() {
    setSessionIds([]);
  }

  return { pick, reset };
}
