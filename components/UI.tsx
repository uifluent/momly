"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import styles from "./UI.module.css";

// ── Topbar ────────────────────────────────────────────────────────────────────

interface TopbarProps {
  showBack?: boolean;
  backHref?: string;
}

export function Topbar({ showBack, backHref = "/" }: TopbarProps) {
  const router = useRouter();
  const hasSaved = useMomlyStore((s) => s.favorites.length > 0);

  return (
    <header className={styles.topbar}>
      {showBack ? (
        <button className={styles.backBtn} onClick={() => router.push(backHref)} aria-label="Назад">
          ←
        </button>
      ) : (
        <div className={styles.topbarSpacer} />
      )}
      <Image
        src="/logo.png"
        alt="Momly"
        height={30}
        width={90}
        className={styles.logo}
        priority
      />
      <button
        className={styles.favBtn}
        onClick={() => router.push("/saved")}
        aria-label="Запазени идеи"
      >
        {hasSaved ? (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="var(--primary)" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" fill="currentColor" />
          </svg>
        )}
      </button>
    </header>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────

interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
}

export function Btn({ children, onClick, disabled, variant = "primary", className = "" }: BtnProps) {
  const cls = [
    styles.btn,
    variant === "primary" ? styles.btnPrimary : "",
    variant === "ghost"   ? styles.btnGhost   : "",
    variant === "outline" ? styles.btnOutline  : "",
    className,
  ].join(" ");

  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// ── Chip (single-select and toggle) ──────────────────────────────────────────

interface ChipProps {
  label: string;
  sublabel?: string;
  selected?: boolean;
  onClick: () => void;
}

export function Chip({ label, sublabel, selected, onClick }: ChipProps) {
  return (
    <button
      className={[styles.chip, selected ? styles.chipSelected : ""].join(" ")}
      onClick={onClick}
    >
      <span className={styles.chipMain}>{label}</span>
      {sublabel && <span className={styles.chipSub}>{sublabel}</span>}
    </button>
  );
}

// ── Large row chip (with icon) ─────────────────────────────────────────────

interface LargeChipProps {
  icon: string;
  label: string;
  sublabel?: string;
  selected?: boolean;
  iconBg?: string;
  onClick: () => void;
}

export function LargeChip({ icon, label, sublabel, selected, iconBg, onClick }: LargeChipProps) {
  return (
    <button
      className={[styles.largeChip, selected ? styles.largeChipSelected : ""].join(" ")}
      onClick={onClick}
    >
      <span className={styles.largeChipIcon} style={iconBg ? { background: iconBg } : {}}>
        {icon}
      </span>
      <span className={styles.largeChipText}>
        <span className={styles.largeChipLabel}>{label}</span>
        {sublabel && <span className={styles.largeChipSub}>{sublabel}</span>}
      </span>
    </button>
  );
}

// ── Bottom nav ────────────────────────────────────────────────────────────────

interface NavItem {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const router = useRouter();
  return (
    <nav className={styles.bottomNav}>
      {items.map((item) => (
        <button
          key={item.label}
          className={[styles.navItem, item.active ? styles.navItemActive : ""].join(" ")}
          onClick={() => router.push(item.href)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span className={styles.navLabel}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
