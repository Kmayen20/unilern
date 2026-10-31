import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { ConfirmForm } from "@/components/auth/ConfirmForm";

export const metadata: Metadata = { title: "Confirmar correo" };

function mask(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 3)}•••@${domain}`;
}

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ correo?: string }> }) {
  const email = (await searchParams).correo?.trim().toLowerCase() ?? "";
  if (!/^[^@\s]+@[^@\s]+$/.test(email) || email.length > 254) redirect("/acceso?modo=crear");

  return (
    <div className="flex min-h-dvh flex-col">
      <AuthHeader step="Crear cuenta · Paso 2 de 2" />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <ConfirmForm email={email} masked={mask(email)} />
      </main>
    </div>
  );
}
