"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  ["nota", "Mejor calificación"],
  ["reviews", "Más reseñas"],
  ["az", "Nombre A–Z"],
] as const;

/** Cambia el orden del catálogo al seleccionar (y con botón si no hay JavaScript). */
export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <form action="/" method="get" className="flex items-center gap-2.5">
      {[...params.entries()]
        .filter(([k]) => k !== "orden" && k !== "pagina")
        .map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <label htmlFor="orden" className="text-sm text-muted">
        Ordenar por
      </label>
      <select
        id="orden"
        name="orden"
        defaultValue={value}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          next.set("orden", e.target.value);
          next.delete("pagina");
          router.push(`/?${next.toString()}#catalogo`, { scroll: false });
        }}
        className="h-10 border-2 border-ink bg-surface px-2.5 text-sm text-ink"
      >
        {OPTIONS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="h-10 border-2 border-ink px-3 text-sm font-semibold">
          Aplicar
        </button>
      </noscript>
    </form>
  );
}
