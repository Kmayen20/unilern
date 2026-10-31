"use client";

import { useActionState, useState } from "react";
import { saveReview, type ReviewState } from "@/lib/actions/reviews";

export function ReviewForm({
  bookId,
  userName,
  initial,
}: {
  bookId: number;
  userName: string;
  initial: { rating: number; opinion: string } | null;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(saveReview, {
    ok: true, // mensaje informativo, no error
    message: initial ? "Ya calificaste este libro: puedes editar tu reseña cuando quieras." : "Puedes editar tu reseña cuando quieras.",
  });
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [opinion, setOpinion] = useState(initial?.opinion ?? "");
  const [localError, setLocalError] = useState("");
  const editing = initial !== null || (state.ok && state.rating !== undefined);
  const message = localError || state.message;
  const isError = Boolean(localError) || !state.ok;

  return (
    <form action={action} className="flex flex-col gap-4 border-2 border-ink bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="m-0 text-xl font-semibold">Tu reseña</h3>
        <span className="text-sm text-muted">
          Publicas como <strong className="text-ink">{userName}</strong>
        </span>
      </div>
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="rating" value={rating ?? ""} />

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-sm font-semibold">Tu nota (1 a 10)</legend>
        <div className="grid max-w-[560px] grid-cols-5 gap-1.5 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={rating === n}
              aria-label={`Nota ${n}`}
              onClick={() => {
                setRating(n);
                setLocalError("");
              }}
              className={`h-12 border font-mono text-[17px] font-semibold ${
                rating === n ? "border-ink bg-ink text-bg" : "border-line bg-bg text-ink hover:border-ink"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="opinion" className="text-sm font-semibold">
          Tu opinión
        </label>
        <textarea
          id="opinion"
          name="opinion"
          rows={4}
          maxLength={1000}
          required
          value={opinion}
          onChange={(e) => setOpinion(e.target.value)}
          placeholder="¿Qué te aportó y qué no? Cuéntalo sin revelar el final."
          aria-describedby="opinion-contador"
          className="w-full resize-y border-2 border-ink bg-bg p-3 text-ink"
        />
        <span id="opinion-contador" className="font-mono text-[13px] text-muted">
          {opinion.length} / 1000
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          onClick={(e) => {
            if (rating === null) {
              e.preventDefault();
              setLocalError("Elige una nota del 1 al 10.");
            } else setLocalError("");
          }}
          className="h-12 border-2 border-accent bg-accent px-6 font-semibold text-on-accent disabled:opacity-60"
        >
          {pending ? "Guardando…" : editing ? "Guardar cambios" : "Publicar reseña"}
        </button>
        <span role="status" className={`text-sm ${isError ? "font-semibold text-[#A3211A] dark:text-[#FF8A80]" : "text-muted"}`}>
          {message}
        </span>
      </div>
    </form>
  );
}
