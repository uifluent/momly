"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import type { ChildGender, Need } from "@/lib/types";
import { Topbar, Btn } from "./UI";
import styles from "./Onboarding.module.css";

const NEEDS: { value: Need; emoji: string; label: string }[] = [
  { value: "me-time",          emoji: "🛁", label: "Малко за себе си"      },
  { value: "meals",            emoji: "🍳", label: "Нещо бързо за ядене"   },
  { value: "child-activities", emoji: "🧸", label: "Занимание с детето"    },
  { value: "outside",          emoji: "🌿", label: "Навън на въздух"       },
  { value: "calm",             emoji: "🌙", label: "Спокойствие / почивка" },
  { value: "creative",         emoji: "🎨", label: "Нещо творческо"        },
];

const GENDER_OPTIONS: { value: ChildGender; label: string }[] = [
  { value: "boy", label: "Момче" },
  { value: "girl", label: "Момиче" },
  { value: "any", label: "Няма значение" },
];

function formatAge(birthDate: string) {
  const birth = new Date(birthDate);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return "";

  const years = Math.floor(months / 12);
  const restMonths = months % 12;
  if (years === 0) return `${restMonths} м.`;
  if (restMonths === 0) return `${years} г.`;
  return `${years} г. и ${restMonths} м.`;
}

export default function Onboarding() {
  const router = useRouter();
  const store = useMomlyStore();
  const [step, setStep] = useState(1);
  const [numChildren, setNumChildrenLocal] = useState<number | null>(null);

  const profile = store.profile;
  const children = profile.children ?? [];
  const childrenReady = !!numChildren && children.length >= numChildren && children.every((child) => child.birthDate);

  function next() { setStep((s) => s + 1); }
  function back() {
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }
    router.push("/");
  }

  function finishOnboarding() {
    store.completeOnboarding();
    router.push("/decide");
  }

  return (
    <div className={styles.wrap}>
      <Topbar showBack backHref={step === 1 ? "/" : undefined} />

      {/* ── Step 1: Children + DOB ────────────────────────────────────────── */}
      {step === 1 && (
        <div className={styles.body}>
          <div className={`${styles.header} anim-fade-up`}>
            <h2 className={styles.title}>Първо, за кого мислим?</h2>
            <p className={styles.meta}>1 от 2 · децата</p>
          </div>

          <div className={`${styles.card} anim-card-in delay-1`}>
            <p className={styles.cardLabel}>Колко деца имаш?</p>
            <div className={styles.chipRow}>
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
              <div className={styles.childrenList}>
                {children.map((child, index) => (
                  <section className={styles.childBlock} key={index}>
                    <div className={styles.childHeader}>
                      <p className={styles.childTitle}>Дете {index + 1}</p>
                      {child.birthDate && <span className={styles.childAge}>{formatAge(child.birthDate)}</span>}
                    </div>

                    <label className={styles.dobLabel} htmlFor={`child-birth-${index}`}>
                      Рождена дата
                    </label>
                    <input
                      id={`child-birth-${index}`}
                      type="date"
                      className={styles.dobInput}
                      value={child.birthDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => store.updateChild(index, { birthDate: e.target.value })}
                    />

                    {child.birthDate && (
                      <div className={styles.genderWrap}>
                        <p className={styles.dobLabel}>Пол (по желание)</p>
                        <div className={styles.genderRow}>
                          {GENDER_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              className={[
                                styles.genderChip,
                                child.gender === option.value ? styles.genderChipSel : "",
                              ].join(" ")}
                              onClick={() => store.updateChild(index, { gender: option.value })}
                              type="button"
                            >
                              <span>{option.label}</span>
                              {child.gender === option.value && <span className={styles.genderCheck}>✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                ))}

                {numChildren === 3 && (
                  <button className={styles.addChildBtn} onClick={store.addChild} type="button">
                    + Добави дете
                  </button>
                )}
              </div>
            )}
          </div>

          <Btn onClick={next} disabled={!childrenReady} className={styles.ctaBtn}>
            Продължи
          </Btn>
        </div>
      )}

      {/* ── Step 2: Needs ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className={styles.body}>
          <div className={`${styles.header} anim-fade-up`}>
            <h2 className={styles.title}>Какво ти липсва днес?</h2>
            <p className={styles.meta}>2 от 2 · {profile.needs.length}/3 избрани</p>
          </div>

          <div className={`${styles.card} anim-card-in delay-1`}>
            <p className={styles.cardLabel}>Избери близкото</p>
            <div className={styles.needsGrid}>
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
          </div>

          <Btn onClick={finishOnboarding} disabled={profile.needs.length < 2} className={styles.ctaBtn}>
            Готово
          </Btn>
          <Btn variant="ghost" onClick={back} className={styles.ghostBtn}>
            Назад
          </Btn>
        </div>
      )}

    </div>
  );
}
