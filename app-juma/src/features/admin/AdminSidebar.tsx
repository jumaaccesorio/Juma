import type { Tab } from "../../types";

type AdminSidebarProps = {
  activeTab: Tab;
  isOpen: boolean;
  onClose: () => void;
  onSetActiveTab: (tab: Tab) => void;
};

export default function AdminSidebar({
  activeTab,
  isOpen,
  onClose,
  onSetActiveTab,
}: AdminSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "catalogo", label: "Ver Tienda", icon: "visibility" },
    { id: "venta_rapida", label: "Venta Rapida", icon: "bolt" },
    { id: "categorias", label: "Categorias", icon: "category" },
    { id: "inventario", label: "Inventario", icon: "inventory_2" },
    { id: "productos", label: "Productos", icon: "layers" },
    { id: "clientes", label: "Usuarios", icon: "group" },
    { id: "pedidos", label: "Pedidos", icon: "shopping_bag" },
    { id: "finanzas", label: "Finanzas", icon: "payments" },
    { id: "inicio_admin", label: "Configuracion", icon: "settings" },
  ] as const;

  const handleTabClick = (tab: Tab) => {
    onSetActiveTab(tab);
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-stone-950/45 backdrop-blur-[1px] transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[17rem] flex-col bg-stone-200 px-4 py-6 text-stone-900 transition-transform duration-300 dark:bg-stone-900 dark:text-stone-100 md:px-4 md:py-8 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="mb-8 flex items-start justify-between gap-4 px-2 md:mb-10 md:flex-col md:items-start">
          <div>
            <h1 className="font-headline text-xl italic uppercase tracking-tighter text-amber-900 dark:text-amber-200 md:text-2xl">
              Juma Accessory
            </h1>
            <p className="mt-1 font-body text-[10px] font-medium uppercase tracking-widest text-stone-500">
              Panel de Control
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar menu"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full border border-stone-400/40 text-stone-600 md:hidden"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("catalogo")}
            className="hidden items-center gap-2 rounded-full border border-amber-900/20 bg-amber-900/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-900 transition-all hover:bg-amber-900/20 dark:text-amber-200 md:flex"
          >
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            Web Preview
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id as Tab)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                activeTab === item.id
                  ? "bg-stone-300 font-semibold text-amber-900 dark:bg-stone-800 dark:text-amber-200"
                  : "text-stone-600 hover:bg-stone-300/50 dark:text-stone-400 dark:hover:bg-stone-800/50"
              }`}
            >
              <span className={`material-symbols-outlined ${activeTab === item.id ? "text-amber-700 dark:text-amber-500" : ""}`}>
                {item.icon}
              </span>
              <span className="font-['Inter'] text-sm font-medium tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => handleTabClick("catalogo")}
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-amber-900/20 bg-amber-900/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.22em] text-amber-900 transition-all hover:bg-amber-900/20 dark:text-amber-200 md:hidden"
        >
          <span className="material-symbols-outlined text-base">storefront</span>
          Ir a la tienda
        </button>

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-stone-300/30 px-4 py-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-900 font-bold text-white">J</div>
          <div>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Juma Accessory</p>
            <p className="text-[10px] uppercase tracking-tighter text-stone-500">Plan Premium</p>
          </div>
        </div>
      </aside>
    </>
  );
}
