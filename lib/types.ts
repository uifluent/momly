// ─── Activity ────────────────────────────────────────────────────────────────

export type Duration = "short" | "medium" | "long";
export type EnergyLevel = "low" | "medium" | "high";
export type Category =
  | "self-care"
  | "movement"
  | "calm"
  | "creative"
  | "social"
  | "survival"
  | "real-life"
  | "reset"
  | "explore"
  | "life-admin";
export type Effort = "zero" | "low" | "medium";
export type Interruptibility = "high" | "medium" | "low";
export type MentalLoad = "light" | "medium" | "heavy";

export interface Activity {
  id: string;
  title: string;
  /** Dataset uses "description" (not "desc") */
  description: string;
  steps: string[];
  duration: Duration[];
  energy: EnergyLevel[];
  withChild: boolean;
  /** [minMonths, maxMonths] or null for adult-only activities */
  ageRange: [number, number] | null;
  /** Array of categories in the new dataset */
  category: Category[];
  effort: Effort;
  interruptibility: Interruptibility;
  mentalLoad: MentalLoad;
}

// ─── Filters (decision screen) ───────────────────────────────────────────────

export interface Filters {
  time: Duration;
  energy: EnergyLevel;
  ctx: "alone" | "child";
}

// ─── User profile (collected during onboarding) ──────────────────────────────

export type Need =
  | "me-time"
  | "meals"
  | "child-activities"
  | "outside"
  | "calm"
  | "creative"
  | "movement";

export type ChildGender = "" | "boy" | "girl" | "any";

export interface ChildProfile {
  birthDate: string;
  gender: ChildGender;
  name?: string;
}

export interface UserProfile {
  numChildren: number | null;
  children: ChildProfile[];
  childDob: string | null; // ISO date string "YYYY-MM-DD"
  childAgeMonths: number | null;
  needs: Need[];
  onboardingComplete: boolean;
}

// ─── App state ───────────────────────────────────────────────────────────────

export interface AppState {
  profile: UserProfile;
  filters: Partial<Filters>;
  results: Activity[];
  recentIds: number[];
}
