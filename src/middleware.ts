import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Protege /admin/* salvo /admin/login. Las server actions de admin vuelven a verificar el rol.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin/login")) return;
  if (req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  }
});

export const config = { matcher: ["/admin/:path*"] };
