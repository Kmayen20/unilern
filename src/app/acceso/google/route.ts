import { cookies } from "next/headers";
import { signIn } from "@/auth";

/**
 * Reintento automático del inicio con Google.
 * Cuando Cognito vincula Google a una cuenta existente (disparador Pre sign-up), corta ese primer intento;
 * el segundo ya entra. La cookie evita reintentar en bucle si el error es otro.
 */
export async function GET(request: Request) {
  const volver = new URL(request.url).searchParams.get("volver") ?? "/";
  const safe = volver.startsWith("/") && !volver.startsWith("//") ? volver : "/";
  (await cookies()).set("google_reintento", "1", { maxAge: 120, httpOnly: true, sameSite: "lax", path: "/acceso" });
  await signIn("cognito", { redirectTo: safe });
}
