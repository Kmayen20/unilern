"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmAccount, resendCode, type FormState } from "@/lib/actions/account";
import { CodeInputs } from "@/components/auth/CodeInputs";
import { CheckBadge, FormError, primaryButton } from "@/components/auth/fields";

export function ConfirmForm({ email, masked }: { email: string; masked: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(confirmAccount, {});
  const [resent, resend, resending] = useActionState<FormState, FormData>(resendCode, {});

  if (state.done) {
    return (
      <div role="status" className="flex w-full max-w-[520px] flex-col gap-5">
        <CheckBadge />
        <h1 className="display m-0 text-[56px] sm:text-[72px]">Cuenta activada</h1>
        <p className="m-0 text-muted">Inicia sesión y ya puedes calificar libros del 1 al 10 y publicar tus reseñas.</p>
        <Link
          href={`/acceso?aviso=activada`}
          className="inline-flex h-[52px] items-center self-start bg-accent px-6 font-semibold text-on-accent no-underline hover:text-on-accent"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[520px] flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="display m-0 text-[56px] sm:text-[72px]">Revisa tu correo</h1>
        <p className="m-0 text-muted">
          Enviamos un código de 6 dígitos a <strong className="text-ink">{masked}</strong>. Escríbelo para activar tu cuenta.
          Vence en 24 horas.
        </p>
      </div>

      <div className="flex flex-col gap-[18px] border-2 border-ink bg-surface p-5 sm:p-7">
        <form action={action} className="flex flex-col gap-[18px]">
          <input type="hidden" name="email" value={email} />
          <CodeInputs name="code" />
          <FormError>{state.error}</FormError>
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "Confirmando…" : "Confirmar cuenta"}
          </button>
        </form>
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <form action={resend}>
            <input type="hidden" name="email" value={email} />
            <button type="submit" disabled={resending} className="min-h-11 border-0 bg-transparent p-0 text-sm text-ink underline">
              {resending ? "Reenviando…" : "Reenviar código"}
            </button>
          </form>
          <Link href="/acceso?modo=crear" className="inline-flex min-h-11 items-center">
            Usar otro correo
          </Link>
        </div>
        {(resent.info || resent.error) && (
          <p role="status" className="m-0 text-sm text-muted">
            {resent.info ?? resent.error}
          </p>
        )}
      </div>
      <p className="m-0 text-sm text-muted">¿No llega? Revisa la carpeta de spam o promociones.</p>
    </div>
  );
}
