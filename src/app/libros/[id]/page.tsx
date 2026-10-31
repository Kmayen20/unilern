import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getBooksWithStats, sortBooks } from "@/lib/books";
import { formatCount, roundRating } from "@/lib/rating";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Stamp } from "@/components/Stamp";
import { Cover } from "@/components/Cover";
import { ReviewForm } from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ orden?: string; ver?: string }> };

const REVIEWS_STEP = 10;
const dateFmt = new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Guatemala" });

function parseId(raw: string) {
  return /^\d{1,9}$/.test(raw) ? Number(raw) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  const book = id ? await prisma.book.findUnique({ where: { id }, select: { title: true } }) : null;
  return { title: book?.title ?? "Libro no encontrado" };
}

export default async function BookPage({ params, searchParams }: Props) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const sp = await searchParams;
  const sort = sp.orden === "mejor" || sp.orden === "peor" ? sp.orden : "recientes";
  const limit = Math.min(500, Math.max(REVIEWS_STEP, Number.parseInt(sp.ver ?? "", 10) || REVIEWS_STEP));

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) notFound();

  const session = await auth();
  const user = session?.user;
  const isUser = user?.role === "user" && Boolean(user.id);

  const orderBy =
    sort === "mejor"
      ? [{ rating: "desc" as const }, { createdAt: "desc" as const }]
      : sort === "peor"
        ? [{ rating: "asc" as const }, { createdAt: "desc" as const }]
        : [{ createdAt: "desc" as const }];

  const [agg, dist, reviews, mine, all] = await Promise.all([
    prisma.review.aggregate({ where: { bookId: id }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.groupBy({ by: ["rating"], where: { bookId: id }, _count: { _all: true } }),
    prisma.review.findMany({ where: { bookId: id }, orderBy, take: limit + 1 }),
    isUser
      ? prisma.review.findUnique({ where: { bookId_userId: { bookId: id, userId: user!.id } }, select: { rating: true, opinion: true } })
      : null,
    getBooksWithStats(),
  ]);

  const total = agg._count._all;
  const avg = roundRating(agg._avg.rating ?? null);
  const counts = new Map(dist.map((d) => [d.rating, d._count._all]));
  const max = Math.max(1, ...counts.values());
  const hasMore = reviews.length > limit;
  const shown = reviews.slice(0, limit);

  const others = all.filter((g) => g.id !== id);
  const similar = [
    ...sortBooks(others.filter((g) => g.genre === book.genre), "nota"),
    ...sortBooks(others.filter((g) => g.genre !== book.genre && g.rating != null), "nota"),
  ].slice(0, 3);

  const sortHref = (o: string) => `/libros/${id}${o === "recientes" ? "" : `?orden=${o}`}#reviews`;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-10 px-5 pt-6 pb-16 sm:px-10">
        <nav aria-label="Ruta" className="flex flex-wrap gap-2 text-sm text-muted">
          <Link href="/">Catálogo</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/?genero=${encodeURIComponent(book.genre)}#catalogo`}>{book.genre}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-ink">
            {book.title}
          </span>
        </nav>

        <section className="flex flex-wrap items-start gap-8 lg:gap-12">
          <Cover src={book.imageUrl} name={book.title} sizes="(max-width: 640px) 70vw, 340px" priority titleSize={52} className="w-[min(340px,70vw)] shrink-0" />

          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-7">
            <div className="flex flex-col gap-2.5">
              <span className="kicker self-start border border-ink px-2.5 py-1">{book.genre}</span>
              <h1 className="display m-0 text-[48px] leading-[0.85] sm:text-[72px] lg:text-[96px]">{book.title}</h1>
              <p className="m-0 text-xl text-muted">
                por <span className="font-semibold text-ink">{book.author}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-stretch gap-10 border-t-2 border-ink pt-6">
              <div className="flex flex-col gap-2.5">
                <span className="kicker text-muted">Calificación de la comunidad</span>
                <div className="flex items-end gap-3">
                  <Stamp value={avg} size={140} fontSize={avg == null ? 72 : 60} />
                  {avg != null && <span className="font-mono text-xl text-muted">/ 10</span>}
                </div>
                {avg != null ? (
                  <span className="text-sm text-muted">
                    Promedio de <strong className="font-mono text-ink tabular-nums">{formatCount(total)}</strong> {total === 1 ? "reseña" : "reseñas"}
                  </span>
                ) : (
                  <span className="font-semibold">Sin calificaciones todavía</span>
                )}
              </div>

              <figure className="m-0 flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
                <figcaption className="kicker text-muted">Distribución de notas</figcaption>
                {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => {
                  const c = counts.get(n) ?? 0;
                  return (
                    <div key={n} className="grid grid-cols-[28px_minmax(0,1fr)_48px] items-center gap-2.5 font-mono text-[13px] tabular-nums">
                      <span className="text-right font-semibold">{n}</span>
                      <span className="block h-3 bg-line">
                        <span className="block h-3 bg-bar" style={{ width: c ? `${Math.max(1, Math.round((c / max) * 100))}%` : 0 }} />
                      </span>
                      <span className="text-muted">
                        <span className="sr-only">Nota {n}: </span>
                        {formatCount(c)}
                      </span>
                    </div>
                  );
                })}
              </figure>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-start gap-12">
          <section id="reviews" aria-labelledby="rev-titulo" className="flex min-w-0 flex-[999_1_640px] scroll-mt-4 flex-col gap-6">
            <h2 id="rev-titulo" className="display m-0 border-b-2 border-ink pb-2 text-[32px] leading-none font-extrabold sm:text-[40px]">
              Reseñas de la comunidad
            </h2>

            {isUser ? (
              <ReviewForm bookId={id} userName={user!.name ?? "Usuario"} initial={mine} />
            ) : user?.role === "admin" ? (
              <div className="border-2 border-ink bg-surface p-6 text-muted">
                Estás con la sesión de administrador. Las reseñas se publican con cuentas de estudiante o docente.
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-ink bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-semibold">{total === 0 ? "Sé el primero en calificarlo" : "¿Ya lo leíste?"}</span>
                  <span className="text-muted">Inicia sesión para calificarlo del 1 al 10 y dejar tu opinión.</span>
                </div>
                <Link
                  href={`/acceso?volver=${encodeURIComponent(`/libros/${id}`)}`}
                  className="inline-flex h-12 items-center bg-accent px-[22px] font-semibold text-on-accent no-underline hover:text-on-accent"
                >
                  Iniciar sesión para opinar
                </Link>
              </div>
            )}

            {total === 0 ? (
              <div className="flex flex-col gap-1 border-y border-dashed border-line py-10 text-center">
                <span className="display text-[32px] font-extrabold">Sin calificaciones todavía</span>
                <span className="text-muted">Sé el primero en calificarlo: tu nota será el primer promedio.</span>
              </div>
            ) : (
              <>
                <nav aria-label="Ordenar reviews" className="flex gap-6 border-b border-line">
                  {[
                    ["recientes", "Más recientes"],
                    ["mejor", "Mejor nota"],
                    ["peor", "Peor nota"],
                  ].map(([key, label]) => (
                    <Link
                      key={key}
                      href={sortHref(key)}
                      aria-current={sort === key ? "true" : undefined}
                      className={`-mb-px inline-flex h-11 items-center border-b-[3px] text-[15px] no-underline ${
                        sort === key ? "border-accent font-semibold text-ink" : "border-transparent text-muted"
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>

                <ol className="m-0 flex list-none flex-col p-0">
                  {shown.map((r) => {
                    const own = isUser && r.userId === user!.id;
                    return (
                      <li key={r.id} className="grid grid-cols-[56px_minmax(0,1fr)] gap-5 border-b border-line py-5">
                        <Stamp value={r.rating} size={56} fontSize={22} />
                        <div className="flex max-w-[68ch] flex-col gap-1.5">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="font-semibold">
                              {r.userName}
                              {own && " (tú)"}
                            </span>
                            <span className="font-mono text-[13px] text-muted">
                              {dateFmt.format(r.createdAt)}
                              {r.updatedAt.getTime() - r.createdAt.getTime() > 1000 && " · editada"}
                            </span>
                          </div>
                          <p className="m-0 break-words whitespace-pre-line">{r.opinion}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {hasMore && (
                  <Link
                    href={`/libros/${id}?${new URLSearchParams({ ...(sort !== "recientes" && { orden: sort }), ver: String(limit + REVIEWS_STEP) })}#reviews`}
                    className="inline-flex h-11 items-center self-start border-2 border-ink px-[18px] font-semibold no-underline"
                  >
                    Ver más reseñas
                  </Link>
                )}
              </>
            )}
          </section>

          {similar.length > 0 && (
            <aside aria-labelledby="mas-titulo" className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
              <h2 id="mas-titulo" className="display m-0 border-b-2 border-ink pb-2 text-[28px] leading-none font-extrabold">
                También te puede gustar
              </h2>
              {similar.map((m) => (
                <Link key={m.id} href={`/libros/${m.id}`} className="flex items-center gap-3.5 border-b border-line py-2 no-underline">
                  <Cover src={m.imageUrl} name={m.title} sizes="48px" titleSize={8} className="w-12 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">{m.title}</span>
                    <span className="text-[13px] text-muted">{m.author}</span>
                  </span>
                  <Stamp value={m.rating} size={44} fontSize={16} />
                </Link>
              ))}
            </aside>
          )}
        </div>
      </main>

      <SiteFooter compact />
    </div>
  );
}
