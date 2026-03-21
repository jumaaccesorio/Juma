export type AdminTopNavProps = {
  onOpenMenu: () => void;
  onPreview: () => void;
  onLogout: () => void;
};

export default function AdminTopNav({ onOpenMenu, onPreview, onLogout }: AdminTopNavProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex min-h-16 items-center justify-between border-b border-line bg-background/90 px-3 py-3 backdrop-blur-md md:left-64 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink md:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="min-w-0 md:hidden">
          <p className="truncate font-headline text-2xl italic text-primary">Golden Admin</p>
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-secondary">Boutique Atelier</p>
        </div>
        <div className="relative hidden w-full max-w-md min-w-0 group sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">search</span>
          <input
            className="w-full bg-background border border-line focus:ring-1 focus:ring-primary/30 focus:border-primary/20 py-2 pl-10 text-sm font-body tracking-tight placeholder:text-muted rounded"
            placeholder="Buscar pedidos, productos o clientes..."
            type="text"
          />
        </div>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-3 md:gap-6">
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-quaternary px-2.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white md:px-4"
          onClick={onPreview}
        >
          <span className="material-symbols-outlined text-[18px]">preview</span>
          <span className="hidden font-body tracking-tight sm:inline">Preview</span>
        </button>
        <button className="relative text-ink/70 hover:text-primary transition-opacity">
          <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        <button className="hidden items-center gap-2 text-ink/70 transition-opacity hover:text-primary md:flex" onClick={onLogout}>
          <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
          <span className="hidden font-body text-sm font-medium tracking-tight lg:inline">Cerrar Sesion</span>
        </button>
      </div>
    </header>
  );
}
