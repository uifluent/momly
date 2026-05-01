"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMomlyStore } from "@/lib/store";
import { Topbar } from "@/components/UI";
import styles from "./page.module.css";

const CITIES = [
  "София", "Пловдив", "Варна", "Бургас", "Стара Загора",
  "Русе", "Плевен", "Велико Търново", "Сливен", "Шумен",
  "Добрич", "Хасково", "Ямбол", "Пазарджик", "Благоевград",
  "Враца", "Монтана", "Перник", "Кюстендил", "Ловеч",
  "Търговище", "Силистра", "Разград", "Видин",
];

export default function CityPage() {
  const router   = useRouter();
  const setCity  = useMomlyStore((s) => s.setCity);
  const current  = useMomlyStore((s) => s.profile.city);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? CITIES.filter((c) => c.toLowerCase().startsWith(query.toLowerCase()))
    : CITIES;

  function handleSelect(city: string) {
    setCity(city);
    router.push("/settings");
  }

  function handleClear() {
    setCity("");
    router.push("/settings");
  }

  return (
    <div className={styles.wrap}>
      <Topbar showBack onBack={() => router.push("/settings")} hideFav />
      <div className={styles.body}>
        <h2 className={styles.title}>Избери град</h2>

        <input
          className={styles.search}
          type="text"
          placeholder="Търси..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {current && (
          <button className={styles.clearRow} onClick={handleClear}>
            <span className={styles.clearLabel}>Премахни: {current}</span>
            <span className={styles.clearX}>✕</span>
          </button>
        )}

        <ul className={styles.list}>
          {filtered.map((city) => (
            <li key={city}>
              <button
                className={[styles.cityRow, current === city ? styles.cityRowActive : ""].join(" ")}
                onClick={() => handleSelect(city)}
              >
                {city}
                {current === city && <span className={styles.check}>✔</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
