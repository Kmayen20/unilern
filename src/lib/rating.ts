/** Utilidades de calificación compartidas entre servidor y cliente. */

export type Stamp = { bg: string; fg: string };

export function roundRating(avg: number | null): number | null {
  return avg == null ? null : Math.round(avg * 10) / 10;
}

export function formatRating(value: number | null): string {
  return value == null ? "—" : value.toFixed(1);
}

/** Color del sello: ≥ 8 azul · 5–7.9 ámbar · < 5 rojo. */
export function stampColors(value: number): Stamp {
  if (value >= 8) return { bg: "#1F48C9", fg: "#FFFFFF" };
  if (value >= 5) return { bg: "#F2B705", fg: "#0F1B2D" };
  return { bg: "#B3261E", fg: "#FFFFFF" };
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}
