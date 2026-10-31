/** Buscador del catálogo (GET a "/"). Funciona sin JavaScript. */
export function SearchForm({
  id,
  defaultValue = "",
  total,
  className = "",
  inputClassName = "bg-bg",
}: {
  id: string;
  defaultValue?: string;
  total: number;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <form action="/" method="get" role="search" className={`flex min-w-0 ${className}`}>
      <label htmlFor={id} className="sr-only">
        Buscar libro
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={`Buscar entre ${total} libros por título o autor…`}
        maxLength={100}
        className={`h-[46px] min-w-0 flex-1 border-2 border-r-0 border-ink px-3.5 text-base text-ink ${inputClassName}`}
      />
      <button type="submit" className="h-[46px] border-2 border-ink bg-ink px-[18px] font-semibold text-bg">
        Buscar
      </button>
    </form>
  );
}
