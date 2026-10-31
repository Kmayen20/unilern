import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/lib/actions/session";
import { Logo } from "@/components/Logo";
import { SearchForm } from "@/components/SearchForm";

function initials(name: string) {
  const parts = name.replace(/[^\p{L}\p{N} ._-]/gu, "").split(/[ ._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const btn = "inline-flex h-[46px] items-center border-2 px-[18px] font-semibold no-underline";

export async function SiteHeader({
  search,
  topBar,
  total = 100,
}: {
  search?: { defaultValue: string };
  topBar?: boolean;
  total?: number;
}) {
  const session = await auth();
  const user = session?.user;
  const returnTo = "/";

  return (
    <header className="border-b-4 border-ink bg-surface">
      {topBar && (
        <div className="border-b border-line">
          <div className="mx-auto flex max-w-[1360px] flex-wrap justify-between gap-2 px-5 py-1.5 font-mono text-xs tracking-[0.06em] text-muted uppercase sm:px-10">
            <span>Una plataforma de UniTec</span>
            <span className="hidden sm:inline">Catálogo · {total} libros · Reseñas de la comunidad</span>
          </div>
        </div>
      )}
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-[18px] sm:px-10">
        <Logo />
        {search && <SearchForm id="buscar-cabecera" defaultValue={search.defaultValue} total={total} className="order-last w-full sm:order-none sm:w-auto sm:flex-[1_1_320px]" />}
        {user ? (
          <div className="flex flex-wrap items-center gap-3.5">
            <span aria-hidden="true" className="inline-flex size-10 items-center justify-center bg-ink font-mono font-semibold text-bg">
              {initials(user.name ?? "?")}
            </span>
            <span className="font-semibold">{user.name}</span>
            {user.role === "admin" && (
              <Link href="/admin" className={`${btn} h-11 border-ink`}>
                Panel
              </Link>
            )}
            <form action={logout}>
              <input type="hidden" name="to" value={returnTo} />
              <button type="submit" className={`${btn} h-11 border-ink bg-transparent text-ink hover:text-accent`}>
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : (
          <nav aria-label="Cuenta" className="flex flex-wrap gap-2.5">
            <Link href="/acceso" className={`${btn} border-ink`}>
              Iniciar sesión
            </Link>
            <Link href="/acceso?modo=crear" className={`${btn} border-accent bg-accent text-on-accent hover:text-on-accent`}>
              Crear cuenta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
