/** Campos de formulario con el estilo de las pantallas de cuenta. */
export const inputClass = "h-12 w-full border-2 border-ink bg-surface px-3 text-ink";
export const primaryButton =
  "h-[52px] w-full border-2 border-accent bg-accent font-semibold text-on-accent disabled:opacity-60";

export function Field({
  id,
  label,
  hint,
  aside,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {aside}
      </div>
      <input id={id} className={inputClass} aria-describedby={hint ? `${id}-ayuda` : undefined} {...input} />
      {hint && (
        <span id={`${id}-ayuda`} className="text-[13px] text-muted">
          {hint}
        </span>
      )}
    </div>
  );
}

export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="m-0 text-sm font-semibold text-[#A3211A] dark:text-[#FF8A80]">
      {children}
    </p>
  );
}

export function CheckBadge() {
  return (
    <span aria-hidden="true" className="inline-flex size-[88px] items-center justify-center bg-blue text-white">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}
