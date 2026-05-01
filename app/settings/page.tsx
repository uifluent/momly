"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { Topbar } from "@/components/UI";
import styles from "./page.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const store  = useMomlyStore();

  const [showConfirm, setShowConfirm] = useState(false);

  function handleLogout() {
    localStorage.removeItem("userName");
    router.replace("/login");
  }

  function handleReset() {
    localStorage.clear();
    router.replace("/login");
  }

  return (
    <div className={styles.wrap}>

      {/* ── Confirm modal ───────────────────────────────────────────────── */}
      {showConfirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <p className={styles.modalTitle}>Изчисти данните?</p>
            <p className={styles.modalSub}>
              Всичките ти любими и изпълнени идеи ще бъдат изтрити.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setShowConfirm(false)}>
                Отказ
              </button>
              <button className={styles.modalConfirm} onClick={handleReset}>
                Изтрий
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.body}>
        <h1 className={styles.title}>За теб</h1>

        {/* ── Needs section ───────────────────────────────────────────────── */}
        <div className={styles.section}>
          <button className={styles.row} onClick={() => router.push("/settings/needs")}>
            <span className={styles.rowLabel}>От какво имаш нужда</span>
            <span className={styles.rowArrow}>›</span>
          </button>
        </div>

        {/* ── Children ────────────────────────────────────────────────────── */}
        <div className={styles.section}>
          <button className={styles.row} onClick={() => router.push("/onboarding")}>
            <span className={styles.rowLabel}>Деца</span>
            <span className={styles.rowArrow}>›</span>
          </button>
        </div>

        {/* ── Account ─────────────────────────────────────────────────────── */}
        <div className={styles.section}>
          <button className={styles.row} onClick={handleLogout}>
            <span className={styles.rowLabel}>Смени профил</span>
            <span className={styles.rowArrow}>›</span>
          </button>
          <button
            className={[styles.row, styles.rowDanger].join(" ")}
            onClick={() => setShowConfirm(true)}
          >
            <span className={styles.rowLabel}>Изчисти данните</span>
          </button>
        </div>
      </div>
    </div>
  );
}
