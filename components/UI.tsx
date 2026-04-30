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
  onBack?: () => void;
  hideFav?: boolean;
}

export function Topbar({ showBack, backHref = "/", onBack, hideFav }: TopbarProps) {
  const router = useRouter();

  return (
    <header className={styles.topbar}>
      {showBack ? (
        <button
          className={styles.backBtn}
          onClick={onBack ?? (() => router.push(backHref))}
          aria-label="Назад"
        >
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
      {hideFav ? (
        <div className={styles.topbarSpacer} />
      ) : (
        <button
          className={styles.favBtn}
          onClick={() => router.push("/saved")}
          aria-label="Запазени идеи"
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>✨</span>
        </button>
      )}
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
