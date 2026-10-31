"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginWithGoogle, loginWithPassword, register, type FormState } from "@/lib/actions/account";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Field, FormError, primaryButton } from "@/components/auth/fields";

export function AccessForm({ initialMode, volver, notice }: { initialMode: "login" | "signup"; volver: string; notice?: string }) {
  const [mode, setMode] = useState(initialMode);
  const [loginState, loginAction, loginPending] = useActionState<FormState, FormData>(loginWithPassword, {});
  const [signupState, signupAction, signupPending] = useActionState<FormState, FormData>(register, {});
  const signup = mode === "signup";
  const state = signup ? signupState : loginState;
  const pending = signup ? signupPending : loginPending;

  const tab = (m: "login" | "signup", label: string) => (
    <button
      type="button"
      aria-pressed={mode === m}
      onClick={() => setMode(m)}
      className={`-mb-px h-12 border-b-[3px] text-[17px] ${mode === m ? "border-accent font-semibold text-ink" : "border-transparent text-muted"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-6">
      <div role="group" aria-label="Elegir acción" className="flex gap-7 border-b border-line">
        {tab("login", "Iniciar sesión")}
        {tab("signup", "Crear cuenta")}
      </div>

      <h2 className="display m-0 text-[44px] leading-none font-extrabold">{signup ? "Crea tu cuenta" : "Bienvenido de vuelta"}</h2>

      {notice && (
        <p role="status" className="m-0 border-2 border-ink bg-surface p-3 text-sm">
          {notice}
        </p>
      )}

      <form action={loginWithGoogle}>
        <input type="hidden" name="volver" value={volver} />
        <button type="submit" className="flex h-[52px] w-full items-center justify-center gap-3 border-2 border-ink bg-surface font-semibold text-ink">
          <GoogleIcon />
          Continuar con Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-line" />
        <span>o con tu correo</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form key={mode} action={signup ? signupAction : loginAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="volver" value={volver} />
        {signup && (
          <Field
            id="nombre"
            name="name"
            label="Nombre de usuario"
            type="text"
            autoComplete="nickname"
            placeholder="Así te verán en tus reviews"
            maxLength={30}
            required
            defaultValue={state.values?.name}
          />
        )}
        <Field
          id="correo"
          name="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          maxLength={254}
          required
          defaultValue={state.values?.email}
        />
        <Field
          id="clave"
          name="password"
          label="Contraseña"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          required
          hint={signup ? "Mínimo 8 caracteres, con mayúscula, minúscula, número y un carácter especial." : undefined}
          aside={
            !signup && (
              <Link href="/acceso/recuperar" className="text-sm">
                ¿Olvidaste tu contraseña?
              </Link>
            )
          }
        />
        <FormError>{state.error}</FormError>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Un momento…" : signup ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </form>

      {signup && (
        <p className="m-0 text-[13px] text-muted">
          Te enviaremos un código a tu correo para confirmar la cuenta.
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4 text-sm">
        <Link href="/">← Volver al catálogo</Link>
        <Link href="/admin/login" className="text-muted">
          Acceso para administradores
        </Link>
      </div>
    </div>
  );
}
