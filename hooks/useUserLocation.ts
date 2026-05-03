"use client";

import { useState, useEffect } from "react";

export interface UserCoords {
  lat: number;
  lng: number;
}

/**
 * Requests the browser geolocation once and returns the result.
 * Returns null while pending or if permission was denied — never throws.
 */
export function useUserLocation(): UserCoords | null {
  const [coords, setCoords] = useState<UserCoords | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission denied or unavailable — silently ignore */ },
      { timeout: 6000, maximumAge: 300_000 },
    );
  }, []);

  return coords;
}
