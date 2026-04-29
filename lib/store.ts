"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Activity, Filters, Need, UserProfile, WeekFeel } from "./types";

interface MomlyState {
  // ── Onboarding ─────────────────────────────────────────────────────────────
  profile: UserProfile;
  setNumChildren: (n: number) => void;
  setChildDob: (dob: string) => void;
  toggleNeed: (need: Need) => void;
  setWeekFeel: (feel: WeekFeel) => void;
  completeOnboarding: () => void;

  // ── Decision filters ────────────────────────────────────────────────────────
  filters: Partial<Filters>;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearFilters: () => void;

  // ── Results ─────────────────────────────────────────────────────────────────
  results: Activity[];
  setResults: (activities: Activity[]) => void;
  recentIds: string[];
  addRecentId: (id: string) => void;

  // ── Accepted activity ────────────────────────────────────────────────────────
  acceptedActivity: Activity | null;
  setAccepted: (a: Activity | null) => void;
}

const defaultProfile: UserProfile = {
  numChildren: null,
  childDob: null,
  childAgeMonths: null,
  needs: [],
  weekFeel: null,
  onboardingComplete: false,
};

function calcAgeMonths(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

export const useMomlyStore = create<MomlyState>()(
  persist(
    (set, get) => ({
      // ── Profile ─────────────────────────────────────────────────────────────
      profile: defaultProfile,

      setNumChildren: (n) =>
        set((s) => ({ profile: { ...s.profile, numChildren: n } })),

      setChildDob: (dob) =>
        set((s) => ({
          profile: {
            ...s.profile,
            childDob: dob,
            childAgeMonths: calcAgeMonths(dob),
          },
        })),

      toggleNeed: (need) =>
        set((s) => {
          const current = s.profile.needs;
          const exists = current.includes(need);
          if (exists) {
            return { profile: { ...s.profile, needs: current.filter((n) => n !== need) } };
          }
          // Cap at 3 selections — drop oldest if over limit
          const next = current.length >= 3 ? [...current.slice(1), need] : [...current, need];
          return { profile: { ...s.profile, needs: next } };
        }),

      setWeekFeel: (feel) =>
        set((s) => ({ profile: { ...s.profile, weekFeel: feel } })),

      completeOnboarding: () =>
        set((s) => ({ profile: { ...s.profile, onboardingComplete: true } })),

      // ── Filters ─────────────────────────────────────────────────────────────
      filters: {},

      setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),

      clearFilters: () => set({ filters: {} }),

      // ── Results ─────────────────────────────────────────────────────────────
      results: [],
      setResults: (activities) => set({ results: activities }),

      recentIds: [],
      addRecentId: (id) =>
        set((s) => ({
          recentIds: [...s.recentIds.slice(-8), id],
        })),

      // ── Accepted ─────────────────────────────────────────────────────────────
      acceptedActivity: null,
      setAccepted: (a) => set({ acceptedActivity: a }),
    }),
    {
      name: "momly-state",
      // Only persist profile and recent IDs — filters are ephemeral
      partialize: (s) => ({ profile: s.profile, recentIds: s.recentIds }),
    }
  )
);
