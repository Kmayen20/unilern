"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import {
  cognitoErrorCode,
  signUp,
  confirmSignUp,
  resendConfirmation,
  forgotPassword,
  confirmForgotPassword,
} from "@/lib/cognito";

export type FormState = { error?: string; done?: boolean; info?: string; values?: Record<string, string> };

const MESSAGES: Record<string, string> = {
  credenciales: "Correo o contraseña incorrectos.",
  existe: "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.",
  cuenta_google: "Ese correo ya entra con Google. Usa «Continuar con Google».",
  clave_debil: "La contraseña necesita 8 caracteres o más, con mayúscula, minúscula, número y un carácter especial.",
  codigo: "El código no es correcto. Revísalo e inténtalo de nuevo.",
  codigo_vencido: "El código venció. Pide uno nuevo.",
  limite: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  parametro: "Revisa los datos e inténtalo de nuevo.",
  desconocido: "No pudimos completar la operación. Inténtalo de nuevo en un momento.",
};
const message = (code: string) => MESSAGES[code] ?? MESSAGES.desconocido;

const email = z.email("Escribe un correo válido, por ejemplo tu@correo.com.").max(254).transform((s) => s.trim().toLowerCase());
const password = z
  .string()
  .min(8, MESSAGES.clave_debil)
  .max(256)
  .regex(/[0-9]/, MESSAGES.clave_debil)
  .regex(/[A-Z]/, MESSAGES.clave_debil)
  .regex(/[a-z]/, MESSAGES.clave_debil)
  // Mismos caracteres especiales que acepta Cognito.
  .regex(/[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`=+\- ]/, MESSAGES.clave_debil);
const code = z.string().trim().regex(/^\d{6}$/, "El código tiene 6 dígitos.");

/** Solo rutas internas para evitar redirecciones abiertas. */
function safeReturn(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function loginWithGoogle(formData: FormData) {
  await signIn("cognito", { redirectTo: safeReturn(formData.get("volver")) });
}

export async function loginWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: str(formData, "email") };
  const parsed = z.object({ email, password: z.string().min(1, "Escribe tu contraseña.") }).safeParse({
    email: values.email,
    password: str(formData, "password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };

  try {
    await signIn("password", { ...parsed.data, redirectTo: safeReturn(formData.get("volver")) });
  } catch (e) {
    if (e instanceof AuthError) {
      const c = (e as AuthError & { code?: string }).code ?? "credenciales";
      if (c === "no_confirmado") {
        await resendConfirmation(parsed.data.email).catch(() => {});
        redirect(`/acceso/confirmar?correo=${encodeURIComponent(parsed.data.email)}`);
      }
      return { error: message(c), values };
    }
    throw e; // incluye la redirección de éxito
  }
  return {};
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { name: str(formData, "name"), email: str(formData, "email") };
  const parsed = z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Tu nombre de usuario necesita al menos 2 caracteres.")
        .max(30, "Tu nombre de usuario puede tener hasta 30 caracteres.")
        .regex(/^[\p{L}\p{N} ._-]+$/u, "Usa solo letras, números, espacios, puntos, guiones o guion bajo."),
      email,
      password,
    })
    .safeParse({ ...values, password: str(formData, "password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };

  try {
    await signUp(parsed.data.name, parsed.data.email, parsed.data.password);
  } catch (e) {
    return { error: message(cognitoErrorCode(e)), values };
  }
  redirect(`/acceso/confirmar?correo=${encodeURIComponent(parsed.data.email)}`);
}

export async function confirmAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email, code }).safeParse({ email: str(formData, "email"), code: str(formData, "code") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await confirmSignUp(parsed.data.email, parsed.data.code);
  } catch (e) {
    return { error: message(cognitoErrorCode(e)) };
  }
  return { done: true };
}

export async function resendCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = email.safeParse(str(formData, "email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await resendConfirmation(parsed.data);
  } catch (e) {
    return { error: message(cognitoErrorCode(e)) };
  }
  return { info: "Código reenviado. Revisa tu bandeja de entrada." };
}

/** Paso 1: siempre responde igual, exista o no la cuenta. */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: str(formData, "email") };
  const parsed = email.safeParse(values.email);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  try {
    await forgotPassword(parsed.data);
  } catch (e) {
    const c = cognitoErrorCode(e);
    if (c === "limite") return { error: message(c), values };
    // Cualquier otro error (p. ej. usuario inexistente) se oculta para no revelar qué correos tienen cuenta.
  }
  return { done: true, values: { email: parsed.data } };
}

/** Paso 2: código + nueva contraseña. */
export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const p1 = str(formData, "password");
  if (p1 !== str(formData, "password2")) return { error: "Las contraseñas no coinciden." };
  const parsed = z.object({ email, code, password }).safeParse({
    email: str(formData, "email"),
    code: str(formData, "code"),
    password: p1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await confirmForgotPassword(parsed.data.email, parsed.data.code, parsed.data.password);
  } catch (e) {
    return { error: message(cognitoErrorCode(e)) };
  }
  return { done: true };
}
