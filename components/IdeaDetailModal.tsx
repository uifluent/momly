"use client";

import { useState } from "react";
import { Heart, X } from "lucide-react";
import type { Activity } from "@/lib/types";
import styles from "./IdeaDetailModal.module.css";

interface Props {
  idea:              Activity;
  isFavorite:        boolean;
  onClose:           () => void;
  onConfirm:         () => void;
  onToggleFavorite:  () => void;
}

const DURATION_LABEL: Record<string, string> = {
  short:  "20–40 мин",
  medium: "40–90 мин",
  long:   "1.5–3 ч",
};

const ENERGY_LABEL: Record<string, string> = {
  low:    "🪫 Ниска",
  medium: "👌 Средна",
  high:   "⚡ Висока",
};

export function IdeaDetailModal({ idea, isFavorite, onClose, onConfirm, onToggleFavorite }: Props) {
  const [hearted, setHearted] = useState(false);

  function handleHeart() {
    onToggleFavorite();
    setHearted(false);
    requestAnimationFrame(() => setHearted(true));
    setTimeout(() => setHearted(false), 650);
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            {idea.emoji && <span className={styles.emoji}>{idea.emoji}</span>}
            <h2 className={styles.title}>{idea.title}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Затвори">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Description */}
        <p className={styles.description}>{idea.description}</p>

        {/* Motivational reason */}
        {idea.reason && <p className={styles.reason}>✨ {idea.reason}</p>}

        {/* Meta chips: time + energy + context */}
        <div className={styles.metaRow}>
          {idea.duration.map((d) => (
            <span key={d} className={styles.metaChip}>{DURATION_LABEL[d] ?? d}</span>
          ))}
          {idea.energy.map((e) => (
            <span key={e} className={styles.metaChip}>{ENERGY_LABEL[e] ?? e}</span>
          ))}
          {idea.withChild && (
            <span className={styles.metaChip}>С детето 🐥</span>
          )}
        </div>

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className={styles.tagsRow}>
            {idea.tags.map((t) => (
              <span key={t} className={styles.tag}>#{t}</span>
            ))}
          </div>
        )}

        {/* Steps */}
        {idea.steps.length > 0 && (
          <div className={styles.steps}>
            <p className={styles.stepsLabel}>Как да започна</p>
            <ol className={styles.stepsList}>
              {idea.steps.map((step, i) => (
                <li key={i} className={styles.stepsItem}>
                  <span className={styles.stepsNum}>{i + 1}</span>
                  <span className={styles.stepsText}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* CTAs */}
        <div className={styles.ctaRow}>
          <button
            className={[styles.favoriteBtn, hearted ? "heart-popped" : ""].join(" ")}
            onClick={handleHeart}
            aria-label={isFavorite ? "Премахни от любими" : "Запази"}
          >
            <Heart size={18} strokeWidth={2} fill={isFavorite ? "currentColor" : "none"} />
          </button>
<button className={styles.confirmBtn} onClick={onConfirm}>
            Ще го направя →
          </button>
        </div>
      </div>
    </div>
  );
}
