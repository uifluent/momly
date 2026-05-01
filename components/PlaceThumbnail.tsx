"use client";

import { useOgImage } from "@/hooks/useOgImage";
import styles from "./PlaceThumbnail.module.css";

interface Props {
  link?: string;
  staticImage?: string;   // local /images/… path takes priority
  alt: string;
}

export function PlaceThumbnail({ link, staticImage, alt }: Props) {
  const ogImage = useOgImage(staticImage ? undefined : link);
  const src     = staticImage ?? ogImage;

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={styles.thumb}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}
