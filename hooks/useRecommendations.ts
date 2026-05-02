"use client";

import { useState, useEffect, useCallback } from "react";
import { useMomlyStore } from "@/lib/store";
import { getBestIdeas } from "@/lib/getBestIdeas";
import activitiesData from "@/data/activities.json";
import type { Activity, Filters } from "@/lib/types";

const allActivities = activitiesData as Activity[];

function fetchIdeas(filters: Filters, excludeIds: string[] = []): Activity[] {
  const s = useMomlyStore.getState();
  return getBestIdeas(
    allActivities,
    filters,
    s.profile,
    s.recentIds,
    s.userPreferences,
    { favorites: s.favorites, completedIds: s.completedIds, city: s.profile.city },
  ).filter((a) => !excludeIds.includes(a.id));
}

export function useRecommendations(filters: Filters) {
  const [main,    setMain]    = useState<Activity | null>(null);
  const [backups, setBackups] = useState<Activity[]>([]);

  const refresh = useCallback((excludeMain?: string) => {
    const results = fetchIdeas(filters, excludeMain ? [excludeMain] : []);
    const [first, ...rest] = results;
    setMain(first ?? null);
    setBackups(rest.slice(0, 2));
  }, [filters]);

  useEffect(() => {
    const resolved = { ...filters };
    const results  = fetchIdeas(resolved);
    const [first, ...rest] = results;
    setMain(first ?? null);
    setBackups(rest.slice(0, 2));
    if (first) useMomlyStore.getState().addRecentId(first.id);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return { main, backups, refresh };
}
