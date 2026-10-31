/**
 * Carga los 100 libros de data/books.json (o, si aún no existe, de data/books-list.json sin portada).
 * Idempotente: hace upsert por título, no toca las reseñas.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

type SeedBook = { title: string; author: string; genre: string; imageUrl?: string };

const prisma = new PrismaClient();

async function main() {
  const dataDir = join(__dirname, "..", "data");
  const withImages = join(dataDir, "books.json");
  const file = existsSync(withImages) ? withImages : join(dataDir, "books-list.json");
  if (file !== withImages) {
    console.warn("data/books.json no existe: se cargan los libros SIN portada. Corre `npm run fetch-covers`.");
  }
  const books = JSON.parse(readFileSync(file, "utf8")) as SeedBook[];

  for (const b of books) {
    await prisma.book.upsert({
      where: { title: b.title },
      update: { author: b.author, genre: b.genre, ...(b.imageUrl ? { imageUrl: b.imageUrl } : {}) },
      create: { title: b.title, author: b.author, genre: b.genre, imageUrl: b.imageUrl ?? "" },
    });
  }
  console.log(`${books.length} libros cargados desde ${file.split("/").pop()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
