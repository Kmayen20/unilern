import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Stamp } from "@/components/Stamp";
import { Cover } from "@/components/Cover";
import { SortSelect } from "@/components/SortSelect";
import { getBooksWithStats, sortBooks, normalize, matchesQuery, type SortKey } from "@/lib/books";
import { formatCount } from "@/lib/rating";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
const collator = new Intl.Collator("es", { sensitivity: "base" });

type Params = { q?: string; genero?: string; orden?: string; pagina?: string };

function href(base: Params, patch: Partial<Params>) {
  const p = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
  const s = p.toString();
  return `/${s ? `?${s}` : ""}#catalogo`;
}

function reviewsText(n: number) {
  return n === 0 ? "Sin reseñas" : `${formatCount(n)} ${n === 1 ? "reseña" : "reseñas"}`;
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100);
  const sort: SortKey = sp.orden === "reviews" || sp.orden === "az" ? sp.orden : "nota";

  const all = await getBooksWithStats();
  const genres = [...new Set(all.map((g) => g.genre))].sort(collator.compare);
  const genre = sp.genero && genres.includes(sp.genero) ? sp.genero : "";

  const top = sortBooks(all.filter((g) => g.rating != null), "nota").slice(0, 5);
  const nq = normalize(q);
  const filtered = sortBooks(
    all.filter((g) => (!genre || g.genre === genre) && matchesQuery(g, nq)),
    sort,
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1));
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const base: Params = { q: q || undefined, genero: genre || undefined, orden: sort === "nota" ? undefined : sort };

  const [first, ...rest] = top;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader topBar search={{ defaultValue: q }} total={all.length} />

      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-12 px-5 pt-8 pb-16 sm:px-10 sm:pt-10">
        {first && !q && !genre && page === 1 && (
          <section aria-labelledby="top-titulo" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink pb-2">
              <h2 id="top-titulo" className="display text-[32px] font-extrabold sm:text-[40px]">
                Los mejor calificados
              </h2>
              <span className="kicker tracking-[0.06em] text-muted">Top {top.length} · promedio de la comunidad, escala 1–10</span>
            </div>

            <div className="flex flex-wrap items-start gap-10">
              <Link href={`/libros/${first.id}`} className="ig-card flex min-w-0 flex-[1_1_560px] flex-wrap gap-7 no-underline hover:text-ink">
                <Cover src={first.imageUrl} name={first.title} sizes="260px" priority titleSize={36} className="w-[180px] shrink-0 sm:w-[260px]" />
                <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3.5 pt-1">
                  <span aria-hidden="true" className="outline-num font-display text-[80px] leading-[0.8] font-black sm:text-[112px]">
                    01
                  </span>
                  <h3 className="display text-[40px] font-extrabold leading-[0.95] sm:text-[52px]">{first.title}</h3>
                  <span className="text-[15px] text-muted">
                    {first.author} · {first.genre}
                  </span>
                  <div className="flex items-center gap-4">
                    <Stamp value={first.rating} size={100} fontSize={40} />
                    <span className="text-sm leading-[1.4] text-muted">
                      Promedio de
                      <br />
                      <strong className="font-mono text-ink tabular-nums">{formatCount(first.reviewCount)}</strong> {first.reviewCount === 1 ? "reseña" : "reseñas"}
                    </span>
                  </div>
                  <span className="font-semibold underline underline-offset-4">Leer reseñas →</span>
                </div>
              </Link>

              {rest.length > 0 && (
                <ol className="m-0 flex min-w-0 flex-[1_1_420px] list-none flex-col p-0">
                  {rest.map((g, i) => (
                    <li key={g.id} className="border-t border-line">
                      <Link href={`/libros/${g.id}`} className="flex items-center gap-4 py-4 no-underline">
                        <span aria-hidden="true" className="w-14 shrink-0 font-display text-5xl leading-none font-black text-muted tabular-nums">
                          {String(i + 2).padStart(2, "0")}
                        </span>
                        <Cover src={g.imageUrl} name={g.title} sizes="44px" titleSize={8} className="w-11 shrink-0" />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-lg leading-tight font-semibold">{g.title}</span>
                          <span className="text-sm text-muted">
                            {g.author} · {reviewsText(g.reviewCount)}
                          </span>
                        </span>
                        <Stamp value={g.rating} size={56} fontSize={21} />
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        )}

        <section id="catalogo" aria-labelledby="cat-titulo" className="flex scroll-mt-4 flex-col gap-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink pb-2">
            <h2 id="cat-titulo" className="display text-[32px] font-extrabold sm:text-[40px]">
              {q ? `Resultados para “${q}”` : "Catálogo"}
            </h2>
            <span className="font-mono text-[13px] text-muted tabular-nums">
              Mostrando {list.length} de {filtered.length === all.length ? all.length : `${filtered.length} (${all.length} en total)`} libros
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav aria-label="Filtrar por área o género" className="-mx-5 w-[calc(100%+40px)] overflow-x-auto px-5 sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0 no-scrollbar">
              <ul className="m-0 flex w-max list-none gap-2 p-0 sm:w-auto sm:flex-wrap">
                {["", ...genres].map((g) => {
                  const active = g === genre;
                  return (
                    <li key={g || "todos"}>
                      <Link
                        href={href(base, { genero: g || undefined, pagina: undefined })}
                        aria-current={active ? "true" : undefined}
                        className={`inline-flex min-h-11 items-center border px-3.5 text-sm font-medium whitespace-nowrap no-underline sm:min-h-10 ${
                          active ? "border-ink bg-ink text-bg hover:text-bg" : "border-line bg-surface hover:border-ink"
                        }`}
                      >
                        {g || "Todos"}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <Suspense>
              <SortSelect value={sort} />
            </Suspense>
          </div>

          {filtered.length === 0 && (
            <p className="m-0 border-t border-line py-12 text-muted">
              Ningún libro coincide con {q ? `“${q}”` : "este filtro"}. Revisa la ortografía o elige{" "}
              <Link href={href({}, {})} className="text-ink underline">
                “Todos”
              </Link>{" "}
              en las áreas.
            </p>
          )}

          <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-x-5">
            {list.map((g, i) => (
              <li key={g.id}>
                <Link href={`/libros/${g.id}`} className="ig-card flex flex-col gap-2.5 no-underline hover:text-ink">
                  <Cover src={g.imageUrl} name={g.title} sizes="(max-width: 640px) 50vw, 220px" priority={i < 6 && !first}>
                    <Stamp value={g.rating} size={52} fontSize={19} ringed className="absolute -right-1.5 -bottom-3.5" />
                  </Cover>
                  <span className="flex flex-col pr-[52px]">
                    <span className="leading-tight font-semibold">{g.title}</span>
                    <span className="text-[13px] text-muted">
                      {g.author} · {reviewsText(g.reviewCount)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <nav aria-label="Páginas del catálogo" className="flex flex-wrap justify-center gap-1.5 pt-4 font-mono tabular-nums">
              {page > 1 && (
                <Link href={href(base, { pagina: String(page - 1) })} className="inline-flex h-11 items-center border border-line px-4 no-underline">
                  ← Anterior
                </Link>
              )}
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
                n === page ? (
                  <span key={n} aria-current="page" className="inline-flex h-11 min-w-11 items-center justify-center bg-ink text-bg">
                    {n}
                  </span>
                ) : (
                  <Link key={n} href={href(base, { pagina: n === 1 ? undefined : String(n) })} aria-label={`Página ${n}`} className="inline-flex h-11 min-w-11 items-center justify-center border border-line no-underline">
                    {n}
                  </Link>
                ),
              )}
              {page < pages && (
                <Link href={href(base, { pagina: String(page + 1) })} className="inline-flex h-11 items-center border border-line px-4 no-underline">
                  Siguiente →
                </Link>
              )}
            </nav>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
