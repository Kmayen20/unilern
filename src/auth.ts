import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Cognito from "next-auth/providers/cognito";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { signInWithPassword, cognitoErrorCode } from "@/lib/cognito";

/** Error de login con un código que la pantalla traduce a un mensaje. */
class LoginError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

const adminSchema = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(200) });
const userSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(256) });

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// Sin las variables de Cognito (p. ej. antes de crear el User Pool) solo queda el acceso de admin.
const cognitoReady = Boolean(process.env.AUTH_COGNITO_ID && process.env.AUTH_COGNITO_SECRET && process.env.AUTH_COGNITO_ISSUER);

const cognitoProviders = [
  // Usuarios con Google: OAuth en el dominio de Cognito, saltando directo al IdP de Google.
  Cognito({
    clientId: process.env.AUTH_COGNITO_ID,
    clientSecret: process.env.AUTH_COGNITO_SECRET,
    issuer: process.env.AUTH_COGNITO_ISSUER,
    // "profile" es necesario para que el ID token de un usuario de Google traiga "name".
    // prompt=select_account: Cognito lo reenvía a Google para que el usuario elija la cuenta.
    authorization: { params: { scope: "openid email profile", identity_provider: "Google", prompt: "select_account" } },
    // Cognito incluye "nonce" en el ID token de los inicios federados: hay que enviarlo y validarlo.
    checks: ["pkce", "state", "nonce"],
    profile(p) {
      const email = String(p.email ?? "");
      return { id: String(p.sub), email, name: String(p.name ?? email.split("@")[0]), role: "user" };
    },
  }),
  // Usuarios con correo + contraseña: validados contra la API de Cognito.
  Credentials({
    id: "password",
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = userSchema.safeParse(raw);
      if (!parsed.success) throw new LoginError("credenciales");
      try {
        const u = await signInWithPassword(parsed.data.email.toLowerCase(), parsed.data.password);
        return { id: u.sub, email: u.email, name: u.name, role: "user" };
      } catch (e) {
        throw new LoginError(cognitoErrorCode(e));
      }
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...(cognitoReady ? cognitoProviders : []),
    // Administrador: credenciales definidas en el servidor, no en Cognito.
    Credentials({
      id: "admin",
      credentials: { username: {}, password: {} },
      async authorize(raw) {
        const parsed = adminSchema.safeParse(raw);
        const expectedUser = process.env.ADMIN_USERNAME;
        const hash = process.env.ADMIN_PASSWORD_HASH;
        if (!parsed.success || !expectedUser || !hash) return null;
        const userOk = safeEqual(parsed.data.username, expectedUser);
        const passOk = await bcrypt.compare(parsed.data.password, hash);
        if (!userOk || !passOk) {
          console.warn(`[admin] intento fallido de inicio de sesión: usuario="${parsed.data.username.slice(0, 40)}"`);
          return null;
        }
        return { id: "admin", name: expectedUser, role: "admin" };
      },
    }),
  ],
});
