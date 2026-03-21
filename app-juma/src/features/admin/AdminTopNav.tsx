export type AdminTopNavProps = {
  onPreview: () => void;
  onLogout: () => void;
};

export default function AdminTopNav({ onPreview, onLogout }: AdminTopNavProps) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-background/90 backdrop-blur-md flex justify-between items-center px-8 z-40 border-b border-line">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">search</span>
          <input
            className="w-full bg-background border border-line focus:ring-1 focus:ring-primary/30 focus:border-primary/20 py-2 pl-10 text-sm font-body tracking-tight placeholder:text-muted rounded"
            placeholder="Buscar pedidos, productos o clientes..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-quaternary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          onClick={onPreview}
        >
          <span className="material-symbols-outlined text-[18px]">preview</span>
          <span className="font-body tracking-tight">Preview</span>
        </button>
        <button className="relative text-ink/70 hover:text-primary transition-opacity">
          <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        <button className="flex items-center gap-2 text-ink/70 hover:text-primary transition-opacity" onClick={onLogout}>
          <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
          <span className="font-body text-sm tracking-tight font-medium">Cerrar Sesion</span>
        </button>
      </div>
    </header>
  );
}
