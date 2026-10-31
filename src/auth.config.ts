import type { NextAuthConfig } from "next-auth";

/**
 * Parte de la configuración que puede correr en el middleware (sin bcrypt, Prisma ni SDK de AWS).
 * Los proveedores reales se agregan en src/auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/acceso" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? "user";
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role === "admin" ? "admin" : "user";
      return session;
    },
  },
} satisfies NextAuthConfig;
