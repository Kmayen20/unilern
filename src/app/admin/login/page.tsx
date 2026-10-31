import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "Acceso de administración", robots: { index: false } };

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.role === "admin") redirect("/admin");

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <header className="border-b-4 border-ink bg-surface">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-5 py-[18px] sm:px-10">
          <Logo size={36} />
          <span className="kicker text-muted">UniTec · Área restringida</span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-[460px] flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="kicker self-start border border-accent px-2.5 py-1 text-[#B23E06]">Administración</span>
            <h1 className="display m-0 text-[56px] sm:text-[72px]">Panel del catálogo</h1>
            <p className="m-0 text-muted">
              Ingresa con las credenciales de administrador que te entregó el equipo de TI de UniTec. Las cuentas de Google o
              de estudiante no sirven aquí.
            </p>
          </div>
          <AdminLoginForm />
          <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
            <Link href="/">← Volver al sitio público</Link>
            <span className="font-mono text-xs">Los intentos de acceso quedan registrados</span>
          </div>
        </div>
      </main>
    </div>
  );
}
