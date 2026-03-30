export type AdminTopNavProps = {
  onOpenMenu: () => void;
  onPreview: () => void;
  onLogout: () => void;
};

export default function AdminTopNav({ onOpenMenu, onPreview, onLogout }: AdminTopNavProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex min-h-16 items-center justify-between border-b border-line/50 glass-nav px-3 py-3 md:left-64 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar text-white md:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="min-w-0 md:hidden">
          <p className="truncate font-headline text-xl text-primary">Juma Accessory</p>
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">Panel de Control</p>
        </div>

        {/* Desktop search */}
        <div className="relative hidden w-full max-w-md min-w-0 group sm:block">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60 text-[18px] group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            className="w-full bg-secondary/60 border border-transparent focus:border-primary/20 focus:bg-white focus:shadow-sm py-2.5 pl-11 pr-4 text-sm font-body tracking-tight placeholder:text-muted/50 rounded-xl outline-none transition-all duration-200"
            placeholder="Buscar pedidos, productos o clientes..."
            type="text"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-quaternary px-2.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white md:px-4"
          onClick={onPreview}
        >
          <span className="material-symbols-outlined text-[18px]">preview</span>
          <span className="hidden font-body tracking-tight sm:inline">Preview</span>
        </button>
        <button className="relative size-9 flex items-center justify-center rounded-lg text-ink/50 hover:text-primary hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
        </button>
        <div className="hidden md:block w-px h-6 bg-line/60" />
        <button
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-ink/60 hover:text-red-500 hover:bg-red-50 transition-colors"
          onClick={onLogout}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="hidden font-body text-sm font-medium lg:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
