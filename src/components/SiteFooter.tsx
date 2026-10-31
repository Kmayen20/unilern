import Link from "next/link";

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer className="bg-navy text-soft">
        <div className="mx-auto flex max-w-[1360px] flex-wrap justify-between gap-3 px-5 py-6 font-mono text-xs sm:px-10">
          <span>© 2026 UniTec · UniLern</span>
          <span>Portadas: Open Library</span>
        </div>
      </footer>
    );
  }
  return (
    <footer className="bg-navy text-paper">
      <div className="mx-auto flex max-w-[1360px] flex-wrap justify-between gap-6 p-5 sm:p-10">
        <div className="flex max-w-[420px] flex-col gap-2">
          <span className="font-display text-[32px] leading-none font-black uppercase">
            Uni<span className="text-[#FF6B2C]">Lern</span>
          </span>
          <span className="text-sm text-soft">
            Reseñas de libros de la comunidad universitaria. Una plataforma de UniTec.
          </span>
        </div>
        <nav aria-label="Pie de página" className="flex flex-wrap items-start gap-x-7 gap-y-3 text-sm">
          <Link href="/" className="text-paper">Catálogo</Link>
          <Link href="/acceso" className="text-paper">Iniciar sesión</Link>
          <Link href="/admin/login" className="text-paper">Administración</Link>
        </nav>
        <span className="w-full border-t border-navy-line pt-4 font-mono text-xs text-soft">
          © 2026 UniTec · Portadas: Open Library
        </span>
      </div>
    </footer>
  );
}
