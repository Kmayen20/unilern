import "server-only";
import { prisma } from "@/lib/db";
import { roundRating } from "@/lib/rating";

export type BookWithStats = {
  id: number;
  title: string;
  author: string;
  genre: string;
  imageUrl: string;
  rating: number | null; // promedio redondeado a 1 decimal; null si no hay reseñas
  reviewCount: number;
};

export type SortKey = "nota" | "reviews" | "az";

/**
 * Todos los libros con su promedio y número de reseñas.
 * El catálogo es pequeño (≈100), así que filtrar/ordenar en memoria es más simple que SQL dinámico.
 */
export async function getBooksWithStats(): Promise<BookWithStats[]> {
  const [books, stats] = await Promise.all([
    prisma.book.findMany({ select: { id: true, title: true, author: true, genre: true, imageUrl: true } }),
    prisma.review.groupBy({ by: ["bookId"], _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const byBook = new Map(stats.map((s) => [s.bookId, s]));
  return books.map((b) => {
    const s = byBook.get(b.id);
    return { ...b, rating: roundRating(s?._avg.rating ?? null), reviewCount: s?._count._all ?? 0 };
  });
}

const collator = new Intl.Collator("es", { sensitivity: "base" });

export function sortBooks(list: BookWithStats[], sort: SortKey): BookWithStats[] {
  const byTitle = (a: BookWithStats, b: BookWithStats) => collator.compare(a.title, b.title);
  const copy = [...list];
  if (sort === "az") return copy.sort(byTitle);
  if (sort === "reviews") return copy.sort((a, b) => b.reviewCount - a.reviewCount || byTitle(a, b));
  // Mejor nota: los libros sin reseñas van al final.
  return copy.sort(
    (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount || byTitle(a, b),
  );
}

/** Normaliza para buscar sin importar mayúsculas ni tildes. */
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** ¿El libro coincide con la búsqueda (título o autor)? */
export function matchesQuery(b: { title: string; author: string }, normalizedQuery: string): boolean {
  return !normalizedQuery || normalize(b.title).includes(normalizedQuery) || normalize(b.author).includes(normalizedQuery);
}
