"use client";

import { useActionState } from "react";
import { adminLogin, type AdminFormState } from "@/lib/actions/admin";

const input = "h-12 border-2 border-ink bg-bg px-3 text-ink";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(adminLogin, {});
  return (
    <>
      {state.error && (
        <div role="alert" className="flex flex-col gap-0.5 border-2 border-red bg-[#FFF5F4] px-4 py-3.5">
          <strong className="text-[#7A1913]">No pudimos iniciar sesión</strong>
          <span className="text-sm text-[#A3211A]">{state.error}</span>
        </div>
      )}
      <form action={action} className="flex flex-col gap-4 border-2 border-ink bg-surface p-6 sm:p-7">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="adm-usuario" className="text-sm font-semibold">
            Usuario
          </label>
          <input id="adm-usuario" name="username" type="text" autoComplete="username" required maxLength={100} className={`${input} font-mono text-[15px]`} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="adm-clave" className="text-sm font-semibold">
            Contraseña
          </label>
          <input id="adm-clave" name="password" type="password" autoComplete="current-password" required maxLength={200} className={input} />
        </div>
        <button type="submit" disabled={pending} className="h-[52px] border-2 border-accent bg-accent font-semibold text-on-accent disabled:opacity-60">
          {pending ? "Verificando…" : "Entrar al panel"}
        </button>
      </form>
    </>
  );
}
