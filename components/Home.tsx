"use client";

import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { Topbar, Btn } from "./UI";
import activitiesData from "@/data/activities.json";
import type { Activity } from "@/lib/types";
import styles from "./Home.module.css";

const allActivities = activitiesData as Activity[];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTodayCompleted(completedIds: Record<string, string>): Activity[] {
  const today = new Date().toDateString();
  return Object.entries(completedIds)
    .filter(([, iso]) => iso && new Date(iso).toDateString() === today)
    .sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([id]) => allActivities.find((a) => a.id === id))
    .filter(Boolean) as Activity[];
}

// ── Illustration ──────────────────────────────────────────────────────────────

function MugIllustration() {
  return (
    <svg
      viewBox="0 0 200 165"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="illus-svg"
    >
      <circle cx="100" cy="95" r="62" fill="#FFF5F3" />
      <path
        d="M84 80 Q80 68 84 56 Q88 44 84 32"
        stroke="#F4A79D"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M100 78 Q96 66 100 54 Q104 42 100 30"
        stroke="#F4A79D"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M116 80 Q112 68 116 56 Q120 44 116 32"
        stroke="#F4A79D"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <rect
        x="62"
        y="84"
        width="76"
        height="50"
        rx="10"
        fill="#F4A79D"
        fillOpacity="0.42"
      />
      <path
        d="M138 97 Q160 97 160 109 Q160 121 138 121"
        stroke="#F4A79D"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.42"
      />
      <ellipse
        cx="100"
        cy="136"
        rx="46"
        ry="6"
        fill="#F4A79D"
        fillOpacity="0.18"
      />
      <circle cx="44" cy="68" r="2.5" fill="#F4A79D" fillOpacity="0.32" />
      <circle cx="156" cy="72" r="2" fill="#F4A79D" fillOpacity="0.26" />
      <circle cx="36" cy="105" r="1.5" fill="#F4A79D" fillOpacity="0.18" />
      <circle cx="163" cy="108" r="2" fill="#F4A79D" fillOpacity="0.22" />
      <circle cx="55" cy="140" r="1.5" fill="#F4A79D" fillOpacity="0.15" />
      <circle cx="147" cy="143" r="1.5" fill="#F4A79D" fillOpacity="0.15" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const completedIds = useMomlyStore((s) => s.completedIds);
  const favorites = useMomlyStore((s) => s.favorites);
  const displayName = useMomlyStore((s) => s.profile.displayName);

  const todayDone = getTodayCompleted(completedIds);
  const todayWins = todayDone.length;
  const totalDone = Object.keys(completedIds).length;

  const greetingLine = displayName
    ? `Здравей, ${displayName} 💛`
    : "Здравей 💛";

  return (
    <div className={styles.wrap}>
      <Topbar />

      <div className={styles.body}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className={`${styles.header} anim-fade-up`}>
          <p className={styles.greetingText}>{greetingLine}</p>
          <h1 className={styles.mainMessage}>Хайде да измислим нещо за теб</h1>
          <p className={styles.mainSub}>Само една малка идея е достатъчна.</p>
        </div>

        {/* ── Illustration ───────────────────────────────────────────────── */}
        <div className={`${styles.illus} anim-fade-up delay-1`}>
          <MugIllustration />
        </div>

        {/* ── Wins + completed list ───────────────────────────────────────── */}
        {(todayWins > 0 || todayDone.length > 0) && (
          <div className={`${styles.progress} anim-fade-up delay-1`}>
            {todayWins > 0 && (
              <p className={styles.wins}>
                {todayWins === 1
                  ? "Една малка победа днес"
                  : `${todayWins} малки победи днес`}
              </p>
            )}
            {todayDone.length > 0 && (
              <ul className={styles.todayDoneList}>
                {todayDone.map((a) => (
                  <li key={a.id} className={styles.todayDoneItem}>
                    <span className={styles.todayDoneDot}>✔</span>
                    <button
                      className={styles.todayDoneTitle}
                      onClick={() => router.push("/saved")}
                    >
                      {a.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Primary CTA ────────────────────────────────────────────────── */}
        <div className={`${styles.ctaWrap} anim-fade-up delay-2`}>
          <Btn onClick={() => router.push("/decide")}>✨ ДАЙ МИ ИДЕЯ</Btn>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        {(favorites.length > 0 || totalDone > 0) && (
          <div className={`${styles.stats} anim-fade-up delay-2`}>
            {favorites.length > 0 && (
              <button
                className={styles.statBtn}
                onClick={() => router.push("/saved")}
              >
                💛 {favorites.length} любими
              </button>
            )}
            {favorites.length > 0 && totalDone > 0 && (
              <span className={styles.statSep}>·</span>
            )}
            {totalDone > 0 && (
              <button
                className={styles.statBtn}
                onClick={() => router.push("/saved")}
              >
                ✔ {totalDone} изпълнени
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
