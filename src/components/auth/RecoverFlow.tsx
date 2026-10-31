"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { requestPasswordReset, resetPassword, type FormState } from "@/lib/actions/account";
import { CheckBadge, Field, FormError, primaryButton } from "@/components/auth/fields";

const box = "flex flex-col gap-4 border-2 border-ink bg-surface p-5 sm:p-7";

export function RecoverFlow() {
  const [reqState, request, requesting] = useActionState<FormState, FormData>(requestPasswordReset, {});
  const [resetState, reset, resetting] = useActionState<FormState, FormData>(resetPassword, {});
  const [restart, setRestart] = useState(0); // "Usar otro correo" vuelve al paso 1
  const email = reqState.values?.email ?? "";
  const step = resetState.done ? 3 : reqState.done && restart === 0 ? 2 : 1;

  return (
    <div className="flex w-full max-w-[520px] flex-col gap-6">
      <p className="kicker m-0 text-muted">{step === 3 ? "Listo" : `Recuperar contraseña · Paso ${step} de 2`}</p>
      <div aria-hidden="true" className="grid grid-cols-2 gap-1.5">
        <span className="h-1.5 bg-ink" />
        <span className={`h-1.5 ${step >= 2 ? "bg-ink" : "bg-line"}`} />
      </div>

      {step === 1 && (
        <>
          <div className="flex flex-col gap-2.5">
            <h1 className="display m-0 text-[56px] sm:text-[72px]">¿Olvidaste tu contraseña?</h1>
            <p className="m-0 text-muted">
              Escribe el correo de tu cuenta y te enviaremos un código para crear una nueva. Si entras con Google, no
              necesitas contraseña: usa “Continuar con Google”.
            </p>
          </div>
          <form action={(fd) => { setRestart(0); request(fd); }} className={box} noValidate>
            <Field id="rc-correo" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="tu@correo.com" required defaultValue={email} />
            <FormError>{reqState.error}</FormError>
            <button type="submit" disabled={requesting} className={primaryButton}>
              {requesting ? "Enviando…" : "Enviar código"}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div className="flex flex-col gap-2.5">
            <h1 className="display m-0 text-[56px] sm:text-[72px]">Nueva contraseña</h1>
            <p className="m-0 text-muted">
              Si <strong className="text-ink">{email}</strong> tiene una cuenta, ya le llegó un código de 6 dígitos.
            </p>
          </div>
          <form action={reset} className={box} noValidate>
            <input type="hidden" name="email" value={email} />
            <Field id="rc-codigo" name="code" label="Código" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" required className="h-12 w-full border-2 border-ink bg-white px-3 font-mono text-xl tracking-[0.3em] text-[#0F1B2D]" />
            <Field id="rc-nueva" name="password" label="Nueva contraseña" type="password" autoComplete="new-password" required hint="Mínimo 8 caracteres, con mayúscula, minúscula, número y un carácter especial." />
            <Field id="rc-repite" name="password2" label="Repite la contraseña" type="password" autoComplete="new-password" required />
            <FormError>{resetState.error}</FormError>
            <button type="submit" disabled={resetting} className={primaryButton}>
              {resetting ? "Guardando…" : "Guardar contraseña"}
            </button>
            <button type="button" onClick={() => setRestart((n) => n + 1)} className="min-h-11 self-start border-0 bg-transparent p-0 text-sm text-ink underline">
              Usar otro correo
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <div role="status" className="flex flex-col gap-5">
          <CheckBadge />
          <h1 className="display m-0 text-[56px] sm:text-[72px]">Contraseña actualizada</h1>
          <p className="m-0 text-muted">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Link href="/acceso?aviso=clave" className="inline-flex h-[52px] items-center self-start bg-accent px-6 font-semibold text-on-accent no-underline hover:text-on-accent">
            Iniciar sesión
          </Link>
        </div>
      )}

      {step !== 3 && <Link href="/acceso" className="text-sm">← Volver a iniciar sesión</Link>}
    </div>
  );
}
