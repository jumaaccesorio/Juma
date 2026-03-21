import type { Tab } from "../../types";

type AdminSidebarProps = {
  activeTab: Tab;
  onSetActiveTab: (tab: Tab) => void;
};

export default function AdminSidebar({ activeTab, onSetActiveTab }: AdminSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "venta_rapida", label: "Venta Rapida", icon: "bolt" },
    { id: "categorias", label: "Categorias", icon: "category" },
    { id: "inventario", label: "Inventario", icon: "inventory_2" },
    { id: "productos", label: "Productos", icon: "layers" },
    { id: "clientes", label: "Usuarios", icon: "group" },
    { id: "pedidos", label: "Pedidos", icon: "shopping_bag" },
    { id: "finanzas", label: "Finanzas", icon: "payments" },
    { id: "inicio_admin", label: "Configuracion", icon: "settings" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-secondary border-r border-line flex flex-col py-8 px-4 z-50">
      <div className="mb-10 px-2">
        <h1 className="font-headline text-2xl text-primary tracking-tight">Juma Accessory</h1>
        <p className="font-body font-medium text-[10px] tracking-widest text-muted uppercase mt-1">Panel de Control</p>
      </div>

      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSetActiveTab(item.id as Tab)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors duration-150 border-r-2 ${
              activeTab === item.id
                ? "bg-background text-primary font-semibold border-r-primary"
                : "text-muted hover:bg-background/70 border-r-transparent"
            }`}
          >
            <span className={`material-symbols-outlined ${activeTab === item.id ? "text-primary" : "text-muted"}`} data-icon={item.icon}>
              {item.icon}
            </span>
            <span className="font-body font-medium text-sm tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-4 py-4 bg-background rounded border border-line flex items-center gap-3 shadow-subtle">
        <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">J</div>
        <div>
          <p className="text-xs font-bold text-primary">Juma Accessory</p>
          <p className="text-[10px] text-muted uppercase tracking-tighter">Plan Premium</p>
        </div>
      </div>
    </aside>
  );
}
