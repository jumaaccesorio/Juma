export type AdminTopNavProps = {
  onLogout: () => void;
};

export default function AdminTopNav({ onLogout }: AdminTopNavProps) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md flex justify-between items-center px-8 z-40 border-b border-stone-200/50 dark:border-stone-800/50">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">search</span>
          <input
            className="w-full bg-stone-100 dark:bg-stone-900/50 border-none focus:ring-1 focus:ring-amber-200 py-2 pl-10 text-sm font-['Inter'] tracking-tight placeholder:text-stone-400 rounded-lg"
            placeholder="Buscar pedidos, productos o clientes..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="relative text-stone-500 hover:text-amber-600 transition-opacity">
          <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-amber-700 rounded-full"></span>
        </button>
        <button 
          className="flex items-center gap-2 text-stone-500 hover:text-amber-600 transition-opacity"
          onClick={onLogout}
        >
          <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
          <span className="font-['Inter'] text-sm tracking-tight font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}
