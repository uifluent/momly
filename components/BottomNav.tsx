"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, User } from "lucide-react";
import styles from "./BottomNav.module.css";

const TABS = [
  { href: "/",         label: "Начало",  Icon: Home    },
  { href: "/explore",  label: "Открий",  Icon: Compass },
  { href: "/saved",    label: "Любими",  Icon: Heart   },
  { href: "/settings", label: "Профил",  Icon: User    },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.outer} aria-label="Навигация">
      <div className={styles.bar}>
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[styles.tab, active ? styles.tabActive : ""].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={2} />
              <span className={styles.label}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
