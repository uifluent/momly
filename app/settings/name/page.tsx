"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import styles from "./page.module.css";

export default function NamePage() {
  const router        = useRouter();
  const setDisplayName = useMomlyStore((s) => s.setDisplayName);
  const current       = useMomlyStore((s) => s.profile.displayName);

  const [name, setName] = useState(current ?? "");

  function handleSave() {
    setDisplayName(name.trim() || "");
    router.push("/settings");
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>←</button>
        <h1 className={styles.title}>Твоето име</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.body}>
        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как да те наричаме?"
          autoFocus
          maxLength={40}
        />
        <p className={styles.hint}>Ще се показва на началния екран.</p>
      </div>

      <div className={styles.footer}>
        <button className={styles.saveBtn} onClick={handleSave}>
          Запази
        </button>
      </div>
    </div>
  );
}
