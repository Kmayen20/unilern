import { Logo } from "@/components/Logo";

/** Cabecera simple de los flujos de cuenta (confirmar, recuperar). */
export function AuthHeader({ step }: { step: string }) {
  return (
    <header className="border-b-4 border-ink bg-surface">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-5 py-[18px] sm:px-10">
        <Logo />
        <span className="kicker text-muted">{step}</span>
      </div>
    </header>
  );
}
