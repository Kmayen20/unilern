import { formatRating, stampColors } from "@/lib/rating";

/** Sello cuadrado de nota. Sin reviews: "—" con borde punteado. */
export function Stamp({
  value,
  size = 56,
  fontSize,
  className = "",
  ringed = false,
}: {
  value: number | null;
  size?: number;
  fontSize?: number;
  className?: string;
  ringed?: boolean;
}) {
  const label = value == null ? "Sin calificaciones todavía" : `Calificación ${formatRating(value)} de 10`;
  const colors = value == null ? null : stampColors(value);
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center font-mono font-semibold tabular-nums ${
        colors ? "" : "border-2 border-dashed border-muted bg-surface text-muted"
      } ${ringed && colors ? "border-[3px] border-bg" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: fontSize ?? Math.round(size * 0.38),
        background: colors?.bg,
        color: colors?.fg,
      }}
    >
      {formatRating(value)}
    </span>
  );
}
