/** Straight-line distance in km between two GPS points. */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format km distance as a Bulgarian travel-time label. */
export function formatDistanceBg(km: number): string {
  if (km < 1)   return "на < 1 км";
  if (km < 2)   return "на 10–15 мин";
  if (km < 5)   return `на ${Math.round(km * 10) / 10} км`;
  return `на ${Math.round(km)} км`;
}
