import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logout } from "@/lib/actions/session";
import { getBooksWithStats, sortBooks, normalize, matchesQuery } from "@/lib/books";
import { formatCount, formatRating, stampColors } from "@/lib/rating";
import { Cover } from "@/components/Cover";
import { BookForm } from "@/components/admin/BookForm";

export const metadata: Metadata = { title: "Administración del catálogo", robots: { index: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type Params = { q?: string; libro?: string; pagina?: string; msg?: string; nombre?: string };

export default async function AdminPage({ searchParams }: { searchParams: Promise<Params> }) {
  // El middleware ya protege la ruta; se verifica de nuevo aquí.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/admin/login");

  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100);
  const all = sortBooks(await getBooksWithStats(), "az");
  const nq = normalize(q);
  const rows = all.filter((g) => matchesQuery(g, nq) || normalize(g.genre).includes(nq));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1));
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedId = sp.libro && /^\d+$/.test(sp.libro) ? Number(sp.libro) : null;
  const selected = selectedId ? all.find((g) => g.id === selectedId) ?? null : null;

  const flash =
    sp.msg === "creado" ? "El libro se agregó al catálogo." : sp.msg === "eliminado" && sp.nombre ? `“${sp.nombre.slice(0, 120)}” se eliminó del catálogo.` : undefined;

  const link = (patch: Partial<Params>) => {
    const p = new URLSearchParams();
    const merged: Params = { q: q || undefined, libro: sp.libro, pagina: page > 1 ? String(page) : undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && k !== "msg" && k !== "nombre") p.set(k, v);
    return `/admin${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="flex min-h-dvh flex-wrap gap-4 bg-bg p-4 text-[15px]">
      <aside className="flex min-w-[200px] flex-[0_1_240px] flex-col gap-7 bg-navy px-4 py-6 text-[#ECEFF4]">
        <div className="flex flex-col gap-2 px-2">
          <span className="font-display text-[32px] leading-[0.9] font-black uppercase">
            Uni<span className="text-[#FF6B2C]">Lern</span>
          </span>
          <span className="self-start bg-[#FF6B2C]/20 px-2.5 py-0.5 text-xs font-semibold text-[#FFB08A]">Administración</span>
        </div>
        <nav aria-label="Administración" className="flex flex-col gap-1">
          <Link href="/admin" aria-current="page" className="flex h-11 items-center bg-white px-3 font-semibold text-[#0F1B2D] no-underline hover:text-[#0F1B2D]">
            Catálogo de libros
          </Link>
          <Link href="/" className="flex h-11 items-center px-3 font-medium text-[#B4BDCB] no-underline hover:text-white">
            Ver sitio público
          </Link>
        </nav>
        <div className="mt-auto flex flex-col gap-2.5 px-2">
          <span className="text-[13px] text-[#9AA4B4]">
            Sesión: <strong className="text-[#ECEFF4]">{session.user.name}</strong>
          </span>
          <form action={logout}>
            <input type="hidden" name="to" value="/admin/login" />
            <button type="submit" className="flex h-11 w-full items-center justify-center bg-white/10 font-semibold text-[#ECEFF4]">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4 px-2 pt-3 pb-1">
          <div className="flex flex-col gap-1">
            <h1 className="display m-0 text-[44px] leading-[0.9] sm:text-[52px]">Catálogo de libros</h1>
            <span className="text-muted tabular-nums">
              {all.length} libros publicados. La calificación de cada libro la calculan las reseñas de los usuarios.
            </span>
          </div>
          <Link href={link({ libro: "nuevo" })} className="inline-flex h-12 items-center gap-2 bg-accent px-5 font-semibold text-on-accent no-underline hover:text-on-accent">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Agregar libro
          </Link>
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <section aria-label="Lista de libros" className="min-w-0 flex-[999_1_560px] overflow-hidden border-2 border-ink bg-surface">
            <form action="/admin" method="get" role="search" className="flex gap-2 border-b border-line p-4">
              <label htmlFor="adm-buscar" className="sr-only">Buscar en el catálogo</label>
              <input id="adm-buscar" name="q" type="search" defaultValue={q} maxLength={100} placeholder="Buscar por título, autor o área" className="h-[46px] min-w-0 flex-1 border border-line bg-bg px-3.5 text-ink" />
              <button type="submit" className="h-[46px] border-2 border-ink bg-ink px-4 font-semibold text-bg">Buscar</button>
            </form>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th scope="col" className="px-4 py-3 font-semibold">Libro</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Área</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Calificación</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Reseñas</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((g) => {
                    const c = g.rating == null ? null : stampColors(g.rating);
                    const sel = g.id === selected?.id;
                    return (
                      <tr key={g.id} aria-selected={sel} className={`border-t border-line ${sel ? "bg-[#DCE4F7] dark:bg-[#1A2A4A]" : "hover:bg-bg"}`}>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-3">
                            <Cover src={g.imageUrl} name={g.title} sizes="32px" titleSize={6} className="w-8 shrink-0" />
                            <span className="flex flex-col">
                              <span className="font-semibold">{g.title}</span>
                              <span className="text-[13px] text-muted">{g.author}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted">{g.genre}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`inline-flex h-7 min-w-11 items-center justify-center px-2 font-mono font-semibold tabular-nums ${c ? "" : "border border-dashed border-muted text-muted"}`}
                            style={c ? { background: c.bg, color: c.fg } : undefined}
                          >
                            {formatRating(g.rating)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-muted tabular-nums">{formatCount(g.reviewCount)}</td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <Link href={link({ libro: String(g.id) })} aria-label={`Editar ${g.title}`} className="inline-flex h-9 items-center border border-line bg-bg px-3 text-[13px] font-semibold no-underline">
                            Editar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {shown.length === 0 && <p className="m-0 p-6 text-muted">Ningún libro coincide con “{q}”.</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3.5 text-[13px] text-muted">
              <span className="tabular-nums">
                Mostrando {shown.length} de {rows.length}
              </span>
              <span className="flex gap-1.5">
                {page > 1 ? (
                  <Link href={link({ pagina: page - 1 > 1 ? String(page - 1) : undefined })} className="inline-flex h-9 items-center border border-line bg-bg px-3 no-underline">Anterior</Link>
                ) : (
                  <span className="inline-flex h-9 items-center border border-line px-3 opacity-50">Anterior</span>
                )}
                {page < pages ? (
                  <Link href={link({ pagina: String(page + 1) })} className="inline-flex h-9 items-center border border-line bg-bg px-3 no-underline">Siguiente</Link>
                ) : (
                  <span className="inline-flex h-9 items-center border border-line px-3 opacity-50">Siguiente</span>
                )}
              </span>
            </div>
          </section>

          <BookForm
            key={selected?.id ?? "nuevo"}
            book={selected && { ...selected, rating: formatRating(selected.rating) }}
            flash={flash}
          />
        </div>
      </main>
    </div>
  );
}
