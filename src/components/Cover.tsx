import Image from "next/image";

/** Portada 2:3 (Open Library). Si no hay URL, muestra un marcador con el título. */
export function Cover({
  src,
  name,
  sizes,
  priority = false,
  className = "",
  titleSize = 24,
  children,
}: {
  src: string;
  name: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  titleSize?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className={`ig-cover relative aspect-[2/3] bg-[#24344D] text-[#F6F7F9] ${className}`}>
      {src ? (
        <Image src={src} alt={`Portada de ${name}`} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between p-3">
          <span className="font-mono text-[11px] tracking-[0.08em] opacity-80">SIN PORTADA</span>
          <span className="font-display font-black uppercase leading-[0.95]" style={{ fontSize: titleSize }}>
            {name}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
