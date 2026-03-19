export type AdminTopNavProps = {
  onLogout: () => void;
  onOpenMenu: () => void;
};

export default function AdminTopNav({ onLogout, onOpenMenu }: AdminTopNavProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200/60 bg-stone-50/90 px-4 backdrop-blur-md dark:border-stone-800/60 dark:bg-stone-950/85 md:left-64 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={onOpenMenu}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white/70 text-stone-700 shadow-sm dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-200 md:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="hidden md:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-400">Administracion</p>
          <h2 className="text-sm font-semibold tracking-tight text-stone-800 dark:text-stone-100">Panel Juma Accessory</h2>
        </div>

        <div className="group relative w-full max-w-md min-w-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
            search
          </span>
          <input
            className="w-full rounded-lg border-none bg-stone-100 py-2 pl-10 pr-3 text-sm tracking-tight placeholder:text-stone-400 focus:ring-1 focus:ring-amber-200 dark:bg-stone-900/50"
            placeholder="Buscar pedidos, productos o clientes..."
            type="text"
          />
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2 md:gap-6">
        <button className="relative hidden text-stone-500 transition-opacity hover:text-amber-600 sm:block">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-amber-700" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-3 py-2 text-stone-600 transition-opacity hover:text-amber-600 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-300"
          onClick={onLogout}
        >
          <span className="material-symbols-outlined">account_circle</span>
          <span className="hidden text-sm font-medium tracking-tight sm:inline">Cerrar Sesion</span>
        </button>
      </div>
    </header>
  );
}
