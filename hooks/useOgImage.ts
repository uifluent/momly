"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, string | null>();

export function useOgImage(link?: string): string | null {
  const [src, setSrc] = useState<string | null>(link ? (cache.get(link) ?? null) : null);

  useEffect(() => {
    if (!link) return;
    if (cache.has(link)) { setSrc(cache.get(link) ?? null); return; }

    fetch(`/api/og-image?url=${encodeURIComponent(link)}`)
      .then((r) => r.json())
      .then(({ image }: { image: string | null }) => {
        cache.set(link, image);
        setSrc(image);
      })
      .catch(() => cache.set(link, null));
  }, [link]);

  return src;
}
