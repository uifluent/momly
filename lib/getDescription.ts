import type { Activity, EnergyLevel } from "./types";

export function getDescription(
  activity: Activity,
  energy: EnergyLevel | undefined,
  ctx: "alone" | "child" | undefined,
): string {
  if (energy && activity.energyVariants?.[energy]) {
    const variant = activity.energyVariants[energy]!;
    const context = ctx === "child" ? "withChild" : "solo";
    // Prefer exact context, fall back to whichever side exists, then base description
    return variant[context] ?? variant.solo ?? variant.withChild ?? activity.description;
  }
  return activity.description;
}

export function getSteps(activity: Activity, energy: EnergyLevel | undefined): string[] {
  if (energy && activity.stepsVariants?.[energy]) {
    return activity.stepsVariants[energy]!;
  }
  return activity.steps;
}
