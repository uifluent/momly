"use client";

import { useOgImage } from "@/hooks/useOgImage";
import styles from "./PlaceThumbnail.module.css";

interface Props {
  link?: string;
  staticImage?: string;   // local /images/… path takes priority
  alt: string;
  fallbackEmoji?: string; // shown when no image resolves
}

export function PlaceThumbnail({ link, staticImage, alt, fallbackEmoji }: Props) {
  const ogImage = useOgImage(staticImage ? undefined : link);
  const src     = staticImage ?? ogImage;

  if (!src) {
    if (!fallbackEmoji) return null;
    return (
      <div className={styles.fallback} aria-hidden="true">
        {fallbackEmoji}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={styles.thumb}
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        if (fallbackEmoji) {
          el.style.display = "none";
          const fb = el.parentElement?.querySelector(`.${styles.fallback}`);
          if (!fb) {
            const div = document.createElement("div");
            div.className = styles.fallback;
            div.textContent = fallbackEmoji;
            el.parentElement?.appendChild(div);
          }
        } else {
          el.style.display = "none";
        }
      }}
    />
  );
}
