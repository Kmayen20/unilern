"use client";

import { useActionState, useState } from "react";
import { createBook, deleteBook, updateBook, type AdminFormState } from "@/lib/actions/admin";
import { GENRES } from "@/lib/genres";

type Book = { id: number; title: string; author: string; genre: string; imageUrl: string; rating: string; reviewCount: number };

const input = "h-[46px] w-full border border-line bg-surface px-3.5 text-ink";

export function BookForm({ book, flash }: { book: Book | null; flash?: string }) {
  const isEdit = book !== null;
  const [state, action, pending] = useActionState<AdminFormState, FormData>(isEdit ? updateBook : createBook, {});
  const [title, setTitle] = useState(book?.title ?? "");
  const [url, setUrl] = useState(book?.imageUrl ?? "");
  const [confirming, setConfirming] = useState(false);
  const [previewOk, setPreviewOk] = useState(true);
  const message = state.error ?? state.message ?? flash;

  return (
    <section aria-labelledby="form-titulo" className="flex min-w-0 flex-[1_1_360px] flex-col gap-[18px] border-2 border-ink bg-surface p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="form-titulo" className="display m-0 text-[30px] leading-none font-extrabold">
          {isEdit ? "Editar libro" : "Nuevo libro"}
        </h2>
        {isEdit && <span className="font-mono text-xs text-muted">ID {book.id}</span>}
      </div>

      <form action={action} className="flex flex-col gap-4">
        {isEdit && <input type="hidden" name="id" value={book.id} />}
        <div className="flex items-start gap-4">
          <div className="relative flex aspect-[2/3] w-[104px] shrink-0 items-end overflow-hidden bg-[#3A4152] p-2 font-display text-sm leading-none font-extrabold text-[#F4F6FA] uppercase">
            {url && previewOk ? (
              // Vista previa directa de la URL escrita (aún no validada), por eso <img> y no next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="absolute inset-0 size-full object-cover" onError={() => setPreviewOk(false)} onLoad={() => setPreviewOk(true)} />
            ) : (
              title || "Sin título"
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[13px] font-semibold">Vista previa de la portada</span>
            <span className="text-[13px] text-muted">Usa la URL de la portada en Open Library (covers.openlibrary.org, tamaño -L).</span>
            {url && !previewOk && <span className="text-[13px] font-semibold text-[#A3211A]">No se pudo cargar la imagen.</span>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="adm-titulo" className="text-sm font-semibold">Título del libro</label>
          <input id="adm-titulo" name="title" type="text" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Cien años de soledad" className={input} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="adm-autor" className="text-sm font-semibold">Autor</label>
          <input id="adm-autor" name="author" type="text" required maxLength={120} defaultValue={book?.author ?? ""} placeholder="Ej. Gabriel García Márquez" className={input} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="adm-genero" className="text-sm font-semibold">Área o género</label>
          <select id="adm-genero" name="genre" required defaultValue={book?.genre ?? "Programación"} className={`${input} px-3`}>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="adm-url" className="text-sm font-semibold">URL de la portada (Open Library)</label>
          <input
            id="adm-url"
            name="imageUrl"
            type="url"
            required
            maxLength={500}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setPreviewOk(true);
            }}
            placeholder="https://covers.openlibrary.org/b/id/…-L.jpg"
            className={`${input} font-mono text-[13px]`}
          />
        </div>

        <div className="flex items-center gap-3 border border-dashed border-line bg-bg p-3.5">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="shrink-0 text-muted">
            <rect x="5" y="11" width="14" height="9" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="text-[13px] text-muted">
            Calificación:{" "}
            <strong className="font-mono text-ink">
              {book && book.reviewCount > 0 ? `${book.rating} (${book.reviewCount.toLocaleString("en-US")} reseñas)` : "sin reseñas todavía"}
            </strong>
            . Se calcula sola con el promedio de las reseñas; no se puede editar.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button type="submit" disabled={pending} className="h-12 bg-ink px-[22px] font-semibold text-bg disabled:opacity-60">
            {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Agregar al catálogo"}
          </button>
          <a href="/admin?libro=nuevo" className="inline-flex h-12 items-center border border-line bg-bg px-[18px] font-semibold no-underline">
            Cancelar
          </a>
        </div>
        {message && (
          <p role="status" className={`m-0 text-sm font-semibold ${state.error ? "text-[#A3211A]" : "text-[#1F6B3A]"} dark:brightness-150`}>
            {message}
          </p>
        )}
      </form>

      {isEdit && (
        <div className="flex flex-col gap-2.5 border-t border-line pt-4">
          {!confirming ? (
            <button type="button" onClick={() => setConfirming(true)} className="h-11 self-start border border-[#F1C4C0] bg-[#FFF5F4] px-4 font-semibold text-[#A3211A]">
              Eliminar libro
            </button>
          ) : (
            <div role="alertdialog" aria-labelledby="borrar-texto" className="flex flex-col gap-2.5 border border-[#F1C4C0] bg-[#FFF5F4] p-3.5">
              <span id="borrar-texto" className="text-sm text-[#7A1913]">
                ¿Eliminar <strong>{book.title}</strong>? También se borrarán sus {book.reviewCount.toLocaleString("en-US")} reseñas. Esta acción no se puede deshacer.
              </span>
              <form action={deleteBook} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={book.id} />
                <button type="submit" className="h-10 bg-red px-3.5 font-semibold text-white">Sí, eliminar</button>
                <button type="button" autoFocus onClick={() => setConfirming(false)} className="h-10 border border-line bg-white px-3.5 font-semibold text-[#0F1B2D]">
                  No, conservar
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
