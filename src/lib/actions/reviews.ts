"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type ReviewState = { ok: boolean; message: string; rating?: number; opinion?: string };

const reviewSchema = z.object({
  bookId: z.coerce.number().int().positive(),
  rating: z.coerce
    .number({ error: "Elige una nota del 1 al 10." })
    .int("La nota debe ser un número entero.")
    .min(1, "La nota mínima es 1.")
    .max(10, "La nota máxima es 10."),
  opinion: z
    .string()
    .trim()
    .min(1, "Escribe tu opinión antes de publicar.")
    .max(1000, "La opinión no puede pasar de 1000 caracteres."),
});

/** Crea o edita la reseña del usuario para un libro (una por usuario y libro). */
export async function saveReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || user.role !== "user") {
    return { ok: false, message: "Inicia sesión con tu cuenta de usuario para opinar." };
  }

  const parsed = reviewSchema.safeParse({
    bookId: formData.get("bookId"),
    rating: formData.get("rating"),
    opinion: formData.get("opinion") ?? "",
  });
  const echo = { rating: Number(formData.get("rating")) || undefined, opinion: String(formData.get("opinion") ?? "") };
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, ...echo };

  const { bookId, rating, opinion } = parsed.data;
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
  if (!book) return { ok: false, message: "Este libro ya no está en el catálogo.", ...echo };

  const existing = await prisma.review.findUnique({ where: { bookId_userId: { bookId, userId: user.id } }, select: { id: true } });
  await prisma.review.upsert({
    where: { bookId_userId: { bookId, userId: user.id } },
    update: { rating, opinion, userName: (user.name ?? "Usuario").slice(0, 60) },
    create: { bookId, userId: user.id, userName: (user.name ?? "Usuario").slice(0, 60), rating, opinion },
  });

  revalidatePath(`/libros/${bookId}`);
  revalidatePath("/");
  return {
    ok: true,
    message: existing ? "Reseña actualizada. El promedio ya incluye tu nueva nota." : "Reseña publicada. El promedio ya incluye tu nota.",
    rating,
    opinion,
  };
}
