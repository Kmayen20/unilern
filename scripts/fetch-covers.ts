/**
 * Genera data/books.json a partir de data/books-list.json usando la API pública de Open Library (sin API key).
 * Uso: npm run fetch-covers
 *
 * Flujo por libro: /search.json?title=…&author=… → primer resultado con portada (cover_i)
 *                  → https://covers.openlibrary.org/b/id/{cover_i}-L.jpg
 * Si data/books.json ya existe, conserva las portadas encontradas y solo reintenta las vacías.
 * `coverId` opcional en books-list.json fija la portada cuando la búsqueda elige mal.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

type ListItem = { title: string; author: string; genre: string; coverId?: number };
type BookOut = { title: string; author: string; genre: string; imageUrl: string; coverId: number | null };

const root = join(__dirname, "..");
const listPath = join(root, "data", "books-list.json");
const outPath = join(root, "data", "books.json");

const coverUrl = (id: number) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function search(params: Record<string, string>): Promise<number | null> {
  const qs = new URLSearchParams({ ...params, fields: "title,author_name,cover_i,edition_count", limit: "10" });
  // Open Library pide identificarse con un User-Agent descriptivo.
  const res = await fetch(`https://openlibrary.org/search.json?${qs}`, {
    headers: { "User-Agent": "InfoLibros.org (proyecto academico UMG)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const body = (await res.json()) as { docs: { cover_i?: number; edition_count?: number }[] };
  // La obra con más ediciones suele ser la correcta (evita resúmenes o guías de estudio).
  const withCover = body.docs.filter((d) => d.cover_i).sort((a, b) => (b.edition_count ?? 0) - (a.edition_count ?? 0));
  return withCover[0]?.cover_i ?? null;
}

async function findCover(item: ListItem): Promise<number | null> {
  if (item.coverId) return item.coverId;
  const lastName = item.author.split(" ").at(-1) ?? item.author;
  const shortTitle = item.title.split(":")[0].trim();
  // De más a menos estricta: título + autor, título sin subtítulo + apellido, búsqueda libre.
  const attempts: Record<string, string>[] = [
    { title: item.title, author: item.author },
    { title: shortTitle, author: lastName },
    { q: `${shortTitle} ${lastName}` },
  ];
  for (const params of attempts) {
    const id = await search(params);
    if (id) return id;
    await sleep(300);
  }
  return null;
}

async function main() {
  const list = JSON.parse(readFileSync(listPath, "utf8")) as ListItem[];
  const previous = new Map<string, BookOut>();
  if (existsSync(outPath)) {
    for (const b of JSON.parse(readFileSync(outPath, "utf8")) as BookOut[]) previous.set(b.title, b);
  }

  const out: BookOut[] = [];
  const missing: string[] = [];
  for (const item of list) {
    const prev = previous.get(item.title);
    if (prev?.imageUrl && (!item.coverId || item.coverId === prev.coverId)) {
      out.push({ ...prev, author: item.author, genre: item.genre });
      continue;
    }
    const base = { title: item.title, author: item.author, genre: item.genre };
    try {
      const id = await findCover(item);
      out.push({ ...base, imageUrl: id ? coverUrl(id) : "", coverId: id });
      if (!id) missing.push(item.title);
      console.log(`${id ? "✓" : "✗"} ${item.title}`);
    } catch (e) {
      out.push({ ...base, imageUrl: "", coverId: null });
      missing.push(item.title);
      console.log(`✗ ${item.title}: ${(e as Error).message}`);
    }
    await sleep(400); // ser amables con la API
  }

  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`\n${out.length - missing.length}/${out.length} libros con portada → data/books.json`);
  if (missing.length) {
    console.log("Sin portada (ajusta título/autor en books-list.json o fija coverId):");
    for (const m of missing) console.log(`  - ${m}`);
  }
}

main();
