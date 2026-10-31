"use client";

import { useRef, useState } from "react";

/** Seis casillas para el código de Cognito. Avanza solo, acepta pegar el código completo. */
export function CodeInputs({ name }: { name: string }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function fill(from: number, text: string) {
    const clean = text.replace(/\D/g, "").slice(0, 6 - from);
    if (!clean) return;
    const next = [...digits];
    clean.split("").forEach((d, i) => (next[from + i] = d));
    setDigits(next);
    refs.current[Math.min(5, from + clean.length)]?.focus();
  }

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2.5 p-0 text-sm font-semibold">Código de verificación</legend>
      <input type="hidden" name={name} value={digits.join("")} />
      <div className="grid grid-cols-6 gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={6}
            aria-label={`Dígito ${i + 1}`}
            value={d}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (v.length > 1) return fill(i, v);
              const next = [...digits];
              next[i] = v;
              setDigits(next);
              if (v && i < 5) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
            }}
            onPaste={(e) => {
              e.preventDefault();
              fill(i, e.clipboardData.getData("text"));
            }}
            className="h-16 w-full border-2 border-ink bg-white text-center font-mono text-[28px] font-semibold text-[#0F1B2D]"
          />
        ))}
      </div>
    </fieldset>
  );
}
