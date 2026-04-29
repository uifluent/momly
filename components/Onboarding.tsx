"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import type { Need, WeekFeel } from "@/lib/types";
import { Topbar, ProgressBar, Btn, LargeChip } from "./UI";
import styles from "./Onboarding.module.css";

const NEEDS: { value: Need; emoji: string; label: string }[] = [
  { value: "me-time",          emoji: "🛁", label: "Time for myself"      },
  { value: "meals",            emoji: "🍳", label: "Quick meals"          },
  { value: "child-activities", emoji: "🧸", label: "Activities with child" },
  { value: "outside",          emoji: "🌿", label: "Going outside"        },
  { value: "calm",             emoji: "🌙", label: "Calm / rest"          },
  { value: "creative",         emoji: "🎨", label: "Creative activities"  },
];

const WEEK_FEELS: { value: WeekFeel; emoji: string; label: string; sub: string; bg: string }[] = [
  { value: "tough", emoji: "😮‍💨", label: "Pretty tough",   sub: "Running on empty",  bg: "#f8e4d4" },
  { value: "okay",  emoji: "🙂",   label: "Getting by",    sub: "Steady and okay",   bg: "#d6ead9" },
  { value: "good",  emoji: "✨",   label: "Actually good", sub: "I have some energy", bg: "#e8f3ea" },
];

export default function Onboarding() {
  const router = useRouter();
  const store = useMomlyStore();
  const [step, setStep] = useState(1);
  const [numChildren, setNumChildrenLocal] = useState<number | null>(null);
  const [dob, setDob] = useState("");

  const profile = store.profile;
  const progress = (step / 3) * 100;

  function next() { setStep((s) => s + 1); }
  function back() { step > 1 ? setStep((s) => s - 1) : router.push("/"); }

  function finishOnboarding() {
    store.completeOnboarding();
    router.push("/decide");
  }

  return (
    <div className={styles.wrap}>
      <Topbar showBack backHref={step === 1 ? "/" : undefined} />
      <ProgressBar value={progress} />

      {/* ── Step 1: Children + DOB ────────────────────────────────────────── */}
      {step === 1 && (
        <div className={styles.body}>
          <p className="label-caps anim-fade-up">Step 1 of 3</p>
          <h2 className={`${styles.title} anim-fade-up delay-1`}>
            How many children do you have?
          </h2>
          <p className={`${styles.sub} anim-fade-up delay-2`}>
            We'll tailor suggestions to your family.
          </p>

          <div className={`${styles.chipRow} anim-fade-up delay-2`}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={[styles.numChip, numChildren === n ? styles.numChipSel : ""].join(" ")}
                onClick={() => {
                  setNumChildrenLocal(n);
                  store.setNumChildren(n);
                }}
              >
                <span className={styles.numChipMain}>{n === 3 ? "3+" : n}</span>
                <span className={styles.numChipSub}>{n === 1 ? "child" : "children"}</span>
              </button>
            ))}
          </div>

          {numChildren && (
            <div className={`${styles.dobWrap} anim-fade-up`}>
              <label className={styles.dobLabel} htmlFor="dob">
                📅 Date of birth of youngest child
              </label>
              <input
                id="dob"
                type="date"
                className={styles.dobInput}
                value={dob}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setDob(e.target.value);
                  store.setChildDob(e.target.value);
                }}
              />
            </div>
          )}

          <Btn onClick={next} disabled={!numChildren || !dob} className={styles.ctaBtn}>
            Continue
          </Btn>
        </div>
      )}

      {/* ── Step 2: Needs ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className={styles.body}>
          <p className="label-caps anim-fade-up">Step 2 of 3</p>
          <h2 className={`${styles.title} anim-fade-up delay-1`}>
            What do you need more of right now?
          </h2>
          <p className={`${styles.sub} anim-fade-up delay-2`}>
            Pick 2 or 3 that feel most true today.
          </p>

          <div className={`${styles.needsGrid} anim-fade-up delay-2`}>
            {NEEDS.map((n) => (
              <button
                key={n.value}
                className={[
                  styles.needChip,
                  profile.needs.includes(n.value) ? styles.needChipSel : "",
                ].join(" ")}
                onClick={() => store.toggleNeed(n.value)}
              >
                <span className={styles.needEmoji}>{n.emoji}</span>
                {n.label}
              </button>
            ))}
          </div>

          <Btn onClick={next} disabled={profile.needs.length < 2} className={styles.ctaBtn}>
            Continue
          </Btn>
          <Btn variant="ghost" onClick={back} className={styles.ghostBtn}>
            Back
          </Btn>
        </div>
      )}

      {/* ── Step 3: Week feel ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div className={styles.body}>
          <p className="label-caps anim-fade-up">Step 3 of 3</p>
          <h2 className={`${styles.title} anim-fade-up delay-1`}>
            How does this week feel?
          </h2>
          <p className={`${styles.sub} anim-fade-up delay-2`}>
            This helps us understand your baseline, not judge you.
          </p>

          <div className={`${styles.largeChips} anim-fade-up delay-2`}>
            {WEEK_FEELS.map((w) => (
              <LargeChip
                key={w.value}
                icon={w.emoji}
                label={w.label}
                sublabel={w.sub}
                iconBg={w.bg}
                selected={profile.weekFeel === w.value}
                onClick={() => store.setWeekFeel(w.value)}
              />
            ))}
          </div>

          <Btn onClick={finishOnboarding} disabled={!profile.weekFeel} className={styles.ctaBtn}>
            Done — let's go →
          </Btn>
          <Btn variant="ghost" onClick={back} className={styles.ghostBtn}>
            Back
          </Btn>
        </div>
      )}
    </div>
  );
}
