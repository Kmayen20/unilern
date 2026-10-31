"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { GENRES } from "@/lib/genres";

export type AdminFormState = { ok?: boolean; error?: string; message?: string };

/** Toda acción de admin vuelve a verificar el rol en el servidor (no basta con el middleware). */
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/admin/login");
}

export async function adminLogin(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Escribe tu usuario y tu contraseña." };
  try {
    await signIn("admin", { username, password, redirectTo: "/admin" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Usuario o contraseña incorrectos. Verifica mayúsculas y vuelve a intentarlo." };
    throw e;
  }
  return {};
}

const bookSchema = z.object({
  title: z.string().trim().min(1, "Escribe el título del libro.").max(160, "El título puede tener hasta 160 caracteres."),
  author: z.string().trim().min(1, "Escribe el autor.").max(120, "El autor puede tener hasta 120 caracteres."),
  genre: z.enum(GENRES, { error: "Elige un área o género de la lista." }),
  imageUrl: z
    .string()
    .trim()
    .max(500, "La URL es demasiado larga.")
    .refine((u) => {
      try {
        const url = new URL(u);
        return url.protocol === "https:" && url.hostname === "covers.openlibrary.org";
      } catch {
        return false;
      }
    }, "Usa una URL https de covers.openlibrary.org (portada del libro)."),
});

function readBook(formData: FormData) {
  return bookSchema.safeParse({
    title: formData.get("title") ?? "",
    author: formData.get("author") ?? "",
    genre: formData.get("genre") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
  });
}

function revalidateAll(id?: number) {
  revalidatePath("/");
  revalidatePath("/admin");
  if (id) revalidatePath(`/libros/${id}`);
}

function isUniqueError(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function createBook(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = readBook(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let id: number;
  try {
    id = (await prisma.book.create({ data: parsed.data, select: { id: true } })).id;
  } catch (e) {
    if (isUniqueError(e)) return { error: "Ya existe un libro con ese título." };
    throw e;
  }
  revalidateAll(id);
  redirect(`/admin?libro=${id}&msg=creado`);
}

export async function updateBook(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return { error: "Libro no válido." };
  const parsed = readBook(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    // Solo título, autor, área e imagen: la calificación nunca se edita, se calcula de las reseñas.
    await prisma.book.update({ where: { id: id.data }, data: parsed.data });
  } catch (e) {
    if (isUniqueError(e)) return { error: "Ya existe un libro con ese título." };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return { error: "Este libro ya no existe." };
    throw e;
  }
  revalidateAll(id.data);
  return { ok: true, message: "Cambios guardados." };
}

export async function deleteBook(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) redirect("/admin");
  // onDelete: Cascade borra también sus reseñas.
  const deleted = await prisma.book.delete({ where: { id: id.data }, select: { title: true } }).catch(() => null);
  revalidateAll(id.data);
  redirect(deleted ? `/admin?msg=eliminado&nombre=${encodeURIComponent(deleted.title)}` : "/admin");
}
