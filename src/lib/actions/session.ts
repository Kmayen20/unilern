"use server";

import { signOut } from "@/auth";

export async function logout(formData: FormData) {
  const to = formData.get("to") === "/admin/login" ? "/admin/login" : "/";
  await signOut({ redirectTo: to });
}
