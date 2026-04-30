"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMomlyStore } from "@/lib/store";
import type { ChildGender, Need } from "@/lib/types";
import { Topbar, Btn } from "./UI";
import styles from "./Onboarding.module.css";

const NEEDS: { value: Need; emoji: string; label: string }[] = [
  { value: "me-time", emoji: "🛁", label: "Време за мен" },
  { value: "meals", emoji: "🍳", label: "Бързи рецепти" },
  {
    value: "child-activities",
    emoji: "🧸",
    label: "Занимания с детето",
  },
  { value: "outside", emoji: "🌤️", label: "Активности навън" },
  { value: "movement", emoji: "🧘‍♀️", label: "Движение" },
  { value: "calm", emoji: "🌙", label: "Спокойствие" },
  { value: "creative", emoji: "🎨", label: "Нещо творческо" },
];

const GENDER_OPTIONS: { value: ChildGender; label: string }[] = [
  { value: "boy", label: "Момче 🧒" },
  { value: "girl", label: "Момиче 👧" },
  { value: "any", label: "Няма значение 🧸" },
];

function formatAge(birthDate: string) {
  const birth = new Date(birthDate);
  const now = new Date();

  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    now.getMonth() -
    birth.getMonth();

  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return "";

  const years = Math.floor(months / 12);
  const restMonths = months % 12;

  if (years === 0) return `${restMonths} м.`;
  if (restMonths === 0) return `${years} г.`;
  return `${years}г. ${restMonths}м.`;
}

export default function Onboarding() {
  const router = useRouter();
  const store = useMomlyStore();

  const [step, setStep] = useState(1);

  const profile = store.profile;
  const children = profile.children ?? [];

  useEffect(() => {
    function maybeAddDefault() {
      if (useMomlyStore.getState().profile.children.length === 0) {
        useMomlyStore.getState().addChild();
      }
    }

    if (useMomlyStore.persist.hasHydrated()) {
      maybeAddDefault();
    } else {
      return useMomlyStore.persist.onFinishHydration(maybeAddDefault);
    }
  }, []);
  const childrenReady =
    children.length > 0 && children.every((child) => child.birthDate);

  function next() {
    try {
      localStorage.setItem("momly_children", JSON.stringify(children));
    } catch { /* quota / SSR */ }
    setStep((s) => s + 1);
  }

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

  // ✅ delete child
  function removeChild(index: number) {
    if (children.length === 1) return; // safeguard

    const updated = children.filter((_, i) => i !== index);
    store.setChildren(updated); // 👉 трябва да имаш този метод в store
  }

  return (
    <div className={styles.wrap}>
      <Topbar showBack={step === 2} onBack={back} hideFav />

      {/* STEP 1 */}
      {step === 1 && (
        <div className={styles.body}>
          <div className={`${styles.header} anim-fade-up`}>
            <h2 className={styles.title}>Добави децата си 🤍</h2>
          </div>

          {/* One card per child */}
          <motion.div layout className={styles.childrenList}>
            <AnimatePresence initial={false}>
              {children.map((child, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={styles.card}
                >
                  <div className={styles.childHeader}>
                    <input
                      type="text"
                      className={styles.nameInput}
                      value={child.name ?? ""}
                      placeholder={`Дете ${index + 1} (по желание: иme)`}
                      onChange={(e) =>
                        store.updateChild(index, { name: e.target.value })
                      }
                    />
                    <div className={styles.childHeaderRight}>
                      {child.birthDate && (
                        <span className={styles.childAge}>
                          {formatAge(child.birthDate)}
                        </span>
                      )}
                      {children.length > 1 && (
                        <button
                          className={styles.deleteBtn}
                          onClick={() => removeChild(index)}
                          type="button"
                          aria-label="Изтрий дете"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 14 14"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M1 3.5h12M5 3.5V2.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M5.5 6.5v4M8.5 6.5v4M2.5 3.5l.75 7.5A1 1 0 0 0 4.24 12h5.52a1 1 0 0 0 .99-.9l.75-7.6"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <label className={styles.dobLabel}>Рождена дата</label>
                  <input
                    type="date"
                    className={styles.dobInput}
                    value={child.birthDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      store.updateChild(index, { birthDate: e.target.value })
                    }
                  />

                  {child.birthDate && (
                    <div className={styles.genderWrap}>
                      <p className={styles.dobLabel}>Пол (по желание)</p>
                      <div className={styles.genderRow}>
                        {GENDER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={[
                              styles.genderChip,
                              child.gender === option.value
                                ? styles.genderChipSel
                                : "",
                            ].join(" ")}
                            onClick={() =>
                              store.updateChild(index, { gender: option.value })
                            }
                          >
                            <span>{option.label}</span>
                            {child.gender === option.value && (
                              <span className={styles.genderCheck}>✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Add child — outside and below cards */}
          <motion.button
            layout
            className={styles.addChildBtn}
            onClick={store.addChild}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            + Добави дете
          </motion.button>

          <Btn
            onClick={next}
            disabled={!childrenReady}
            className={styles.ctaBtn}
          >
            Продължи
          </Btn>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className={styles.body}>
          <div className={`${styles.header} anim-fade-up`}>
            <h2 className={styles.title}>От какво най-вече имаш нужда?</h2>
            <p className={styles.meta}>{profile.needs.length}/3 избрани</p>
          </div>

          <div className={`${styles.card} anim-card-in delay-1`}>
            <p className={styles.cardLabel}>Избери до 3</p>

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

          <Btn
            onClick={finishOnboarding}
            disabled={profile.needs.length < 2}
            className={styles.ctaBtn}
          >
            Напред
          </Btn>
        </div>
      )}
    </div>
  );
}
