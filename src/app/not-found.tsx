import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SearchForm } from "@/components/SearchForm";
import { prisma } from "@/lib/db";

export const metadata = { title: "Página no encontrada" };

export default async function NotFound() {
  const total = await prisma.book.count().catch(() => 100);
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-wrap items-center gap-x-[72px] gap-y-12 px-5 py-16 sm:px-10">
        <span aria-hidden="true" className="flex-[0_1_auto] font-display text-[160px] leading-[0.8] font-black tabular-nums sm:text-[320px]" style={{ color: "transparent", WebkitTextStroke: "3px var(--ink)" }}>
          404
        </span>
        <div className="flex max-w-[600px] min-w-0 flex-[1_1_460px] flex-col gap-5">
          <span className="kicker self-start border border-ink px-2.5 py-1">Error 404 · No encontrado</span>
          <h1 className="display m-0 text-[48px] sm:text-[72px]">Este libro no está en el catálogo</h1>
          <p className="m-0 max-w-[52ch] text-muted">
            Puede que lo hayan retirado o que el enlace esté mal escrito. Búscalo por título o autor, o vuelve al catálogo completo.
          </p>
          <SearchForm id="buscar-404" total={total} className="max-w-[520px]" inputClassName="bg-surface h-12" />
          <Link href="/" className="inline-flex h-[52px] items-center self-start bg-accent px-6 font-semibold text-on-accent no-underline hover:text-on-accent">
            Ir al catálogo
          </Link>
        </div>
      </main>
      <SiteFooter compact />
    </div>
  );
}
