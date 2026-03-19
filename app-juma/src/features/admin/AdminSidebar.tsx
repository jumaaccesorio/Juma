import type { Tab } from "../../types";

type AdminSidebarProps = {
  activeTab: Tab;
  onSetActiveTab: (tab: Tab) => void;
};

export default function AdminSidebar({ activeTab, onSetActiveTab }: AdminSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "catalogo", label: "Ver Tienda", icon: "visibility" },
    { id: "venta_rapida", label: "Venta Rápida", icon: "bolt" },
    { id: "inventario", label: "Inventario", icon: "inventory_2" },
    { id: "productos", label: "Productos", icon: "layers" },
    { id: "clientes", label: "Usuarios", icon: "group" },
    { id: "pedidos", label: "Pedidos", icon: "shopping_bag" },
    { id: "finanzas", label: "Finanzas", icon: "payments" },
    { id: "inicio_admin", label: "Configuración", icon: "settings" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-stone-200 dark:bg-stone-900 flex flex-col py-8 px-4 z-50">
      <div className="mb-10 px-2 flex flex-col items-start gap-4">
        <div>
          <h1 className="font-headline text-2xl italic text-amber-900 dark:text-amber-200 uppercase tracking-tighter">Juma Accessory</h1>
          <p className="font-body font-medium text-[10px] tracking-widest text-stone-500 uppercase mt-1">Panel de Control</p>
        </div>
        <button 
          onClick={() => onSetActiveTab("catalogo")}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/10 hover:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border border-amber-900/20"
        >
          <span className="material-symbols-outlined text-[14px]">visibility</span>
          Web Preview
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSetActiveTab(item.id as Tab)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors duration-150 ${
              activeTab === item.id
                ? "bg-stone-300 dark:bg-stone-800 text-amber-900 dark:text-amber-200 font-semibold"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-300/50 dark:hover:bg-stone-800/50"
            }`}
          >
            <span className={`material-symbols-outlined ${activeTab === item.id ? "text-amber-700 dark:text-amber-500" : ""}`} data-icon={item.icon}>
              {item.icon}
            </span>
            <span className="font-['Inter'] font-medium text-sm tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-4 py-4 bg-stone-300/30 rounded-lg flex items-center gap-3">
        <div className="size-10 rounded-full bg-amber-900 text-white flex items-center justify-center font-bold">J</div>
        <div>
          <p className="text-xs font-bold text-amber-900">Juma Accessory</p>
          <p className="text-[10px] text-stone-500 uppercase tracking-tighter">Plan Premium</p>
        </div>
      </div>
    </aside>
  );
}
