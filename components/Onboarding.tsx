"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import type { Need, WeekFeel } from "@/lib/types";
import { Topbar, ProgressBar, Btn, LargeChip } from "./UI";
import styles from "./Onboarding.module.css";

const NEEDS: { value: Need; emoji: string; label: string }[] = [
  { value: "me-time",          emoji: "🛁", label: "Малко за себе си"      },
  { value: "meals",            emoji: "🍳", label: "Нещо бързо за ядене"   },
  { value: "child-activities", emoji: "🧸", label: "Занимание с детето"    },
  { value: "outside",          emoji: "🌿", label: "Навън на въздух"       },
  { value: "calm",             emoji: "🌙", label: "Спокойствие / почивка" },
  { value: "creative",         emoji: "🎨", label: "Нещо творческо"        },
];

const WEEK_FEELS: { value: WeekFeel; emoji: string; label: string; sub: string; bg: string }[] = [
  { value: "tough", emoji: "😮‍💨", label: "Доста тежко",      sub: "Газ на резерва",     bg: "#f8e4d4" },
  { value: "okay",  emoji: "🙂",   label: "Ставам де",         sub: "Горе-долу стабилно", bg: "#d6ead9" },
  { value: "good",  emoji: "✨",   label: "Изненадващо добре", sub: "Имам малко заряд",   bg: "#e8f3ea" },
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
          <p className="label-caps anim-fade-up">Стъпка 1 от 3</p>
          <h2 className={`${styles.title} anim-fade-up delay-1`}>
            Колко деца имаш?
          </h2>
          <p className={`${styles.sub} anim-fade-up delay-2`}>
            Помага ми да намеря нещо точно за теб.
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
                <span className={styles.numChipSub}>{n === 1 ? "дете" : "деца"}</span>
              </button>
            ))}
          </div>

          {numChildren && (
            <div className={`${styles.dobWrap} anim-fade-up`}>
              <label className={styles.dobLabel} htmlFor="dob">
                📅 Кога е роден/а най-малкото?
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
            Продължи
          </Btn>
        </div>
      )}

      {/* ── Step 2: Needs ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className={styles.body}>
          <p className="label-caps anim-fade-up">Стъпка 2 от 3</p>
          <h2 className={`${styles.title} anim-fade-up delay-1`}>
            Какво ти липсва в момента?
          </h2>
          <p className={`${styles.sub} anim-fade-up delay-2`}>
            Избери 2–3, които звучат вярно за днес.
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
            Продължи
          </Btn>
          <Btn variant="ghost" onClick={back} className={styles.ghostBtn}>
            Назад
          </Btn>
        </div>
      )}

      {/* ── Step 3: Week feel ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div className={styles.body}>
          <p className="label-caps anim-fade-up">Стъпка 3 от 3</p>
          <h2 className={`${styles.title} anim-fade-up delay-1`}>
            Как е тази седмица?
          </h2>
          <p className={`${styles.sub} anim-fade-up delay-2`}>
            Да знаем как си — без осъждане, обещаваме.
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
            Готово — да вървим →
          </Btn>
          <Btn variant="ghost" onClick={back} className={styles.ghostBtn}>
            Назад
          </Btn>
        </div>
      )}
    </div>
  );
}
