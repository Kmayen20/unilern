import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { AccessForm } from "@/components/auth/AccessForm";
import { stampColors } from "@/lib/rating";

export const metadata: Metadata = { title: "Iniciar sesión" };

const NOTICES: Record<string, string> = {
  activada: "Cuenta activada. Inicia sesión para publicar tu primera reseña.",
  clave: "Contraseña actualizada. Ya puedes iniciar sesión con la nueva.",
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; volver?: string; aviso?: string; error?: string; callbackUrl?: string }>;
}) {
  const sp = await searchParams;
  const volver = sp.volver?.startsWith("/") && !sp.volver.startsWith("//") ? sp.volver : "/";
  const session = await auth();
  if (session?.user?.role === "user") redirect(volver);

  // Auth.js redirige aquí con ?error=... si falla el flujo de Google.
  // Error al volver de Google: la primera vez que se vincula Google a una cuenta existente, Cognito corta ese
  // intento y el segundo ya entra. Se reintenta solo una vez (cookie de 2 min) y, si vuelve a fallar, se avisa.
  if (sp.error && !(await cookies()).has("google_reintento")) {
    const destino = sp.callbackUrl?.startsWith("/") && !sp.callbackUrl.startsWith("//") ? sp.callbackUrl : volver;
    redirect(`/acceso/google?volver=${encodeURIComponent(destino)}`);
  }
  const notice = sp.error ? "No pudimos iniciar sesión con Google. Inténtalo de nuevo en un momento." : sp.aviso ? NOTICES[sp.aviso] : undefined;

  return (
    <div className="flex min-h-dvh flex-wrap bg-bg">
      <section className="flex min-w-0 flex-[1_1_520px] flex-col justify-between gap-12 bg-navy px-6 py-10 text-paper sm:px-14 sm:py-12">
        <Logo size={44} dark />
        <div className="flex max-w-[560px] flex-col gap-7">
          <h1 className="display m-0 text-[56px] leading-[0.86] sm:text-[92px]">Tu nota mueve el promedio.</h1>
          <p className="m-0 max-w-[46ch] text-lg text-soft">
            Califica cada libro del 1 al 10 y deja tu opinión. La calificación que ves en el catálogo es el promedio de todas
            las reseñas de la comunidad de UniTec.
          </p>
          <div aria-hidden="true" className="flex flex-col gap-2">
            <div className="grid max-w-[480px] grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const c = stampColors(n);
                return (
                  <span key={n} className="flex h-10 items-center justify-center font-mono font-semibold" style={{ background: c.bg, color: c.fg }}>
                    {n}
                  </span>
                );
              })}
            </div>
            <div className="kicker flex max-w-[480px] justify-between tracking-[0.06em] text-soft">
              <span>Malo</span>
              <span>Regular</span>
              <span>Excelente</span>
            </div>
          </div>
        </div>
        <span className="font-mono text-xs text-soft">Una plataforma de UniTec</span>
      </section>

      <section className="flex min-w-0 flex-[1_1_480px] items-center justify-center px-6 py-12">
        <AccessForm initialMode={sp.modo === "crear" ? "signup" : "login"} volver={volver} notice={notice} />
      </section>
    </div>
  );
}
