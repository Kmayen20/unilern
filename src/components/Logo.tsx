import Link from "next/link";

export function Logo({ size = 46, href = "/", dark = false }: { size?: number; href?: string | null; dark?: boolean }) {
  const content = (
    <>
      Uni<span className={dark ? "text-[#FF6B2C]" : "text-accent"}>Lern</span>
    </>
  );
  const className = "font-display font-black uppercase leading-[0.9] tracking-[-0.01em] no-underline";
  const style = { fontSize: size };
  if (href === null) return <span className={className} style={style}>{content}</span>;
  return (
    <Link href={href} className={`${className} hover:text-inherit`} style={style} aria-label="UniLern, ir al catálogo">
      {content}
    </Link>
  );
}
