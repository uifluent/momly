"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Activity, ChildGender, ChildProfile, Filters, Need, UserProfile } from "./types";

interface MomlyState {
  // ── Onboarding ─────────────────────────────────────────────────────────────
  profile: UserProfile;
  setNumChildren: (n: number) => void;
  setChildDob: (dob: string) => void;
  setChildren: (children: ChildProfile[]) => void;
  updateChild: (index: number, child: Partial<ChildProfile>) => void;
  addChild: () => void;
  toggleNeed: (need: Need) => void;
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
  children: [],
  childDob: null,
  childAgeMonths: null,
  needs: [],
  onboardingComplete: false,
};

function calcAgeMonths(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

function emptyChild(): ChildProfile {
  return { birthDate: "", gender: "" };
}

function syncChildSummary(children: ChildProfile[]) {
  const datedChildren = children.filter((child) => child.birthDate);
  const childAgeMonths =
    datedChildren.length > 0
      ? Math.min(...datedChildren.map((child) => calcAgeMonths(child.birthDate)))
      : null;
  const youngest = datedChildren.reduce<ChildProfile | null>((current, child) => {
    if (!current) return child;
    return calcAgeMonths(child.birthDate) < calcAgeMonths(current.birthDate) ? child : current;
  }, null);

  return {
    children,
    numChildren: children.length || null,
    childDob: youngest?.birthDate ?? null,
    childAgeMonths,
  };
}

export const useMomlyStore = create<MomlyState>()(
  persist(
    (set) => ({
      // ── Profile ─────────────────────────────────────────────────────────────
      profile: defaultProfile,

      setNumChildren: (n) =>
        set((s) => {
          const current = s.profile.children ?? [];
          const children = Array.from({ length: n }, (_, index) => current[index] ?? emptyChild());
          return { profile: { ...s.profile, ...syncChildSummary(children), numChildren: n } };
        }),

      setChildDob: (dob) =>
        set((s) => ({
          profile: {
            ...s.profile,
            childDob: dob,
            childAgeMonths: calcAgeMonths(dob),
          },
        })),

      setChildren: (children) =>
        set((s) => ({ profile: { ...s.profile, ...syncChildSummary(children) } })),

      updateChild: (index, child) =>
        set((s) => {
          const children = [...(s.profile.children ?? [])];
          children[index] = {
            ...(children[index] ?? emptyChild()),
            ...child,
            gender: (child.gender ?? children[index]?.gender ?? "") as ChildGender,
          };
          return { profile: { ...s.profile, ...syncChildSummary(children) } };
        }),

      addChild: () =>
        set((s) => {
          const children = [...(s.profile.children ?? []), emptyChild()];
          return { profile: { ...s.profile, ...syncChildSummary(children) } };
        }),

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
