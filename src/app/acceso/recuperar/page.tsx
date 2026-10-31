import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { RecoverFlow } from "@/components/auth/RecoverFlow";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecoverPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b-4 border-ink bg-surface">
        <div className="mx-auto flex max-w-[1360px] items-center px-5 py-[18px] sm:px-10">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <RecoverFlow />
      </main>
    </div>
  );
}
