import type { Tab } from "../../types";

type AdminSidebarProps = {
  activeTab: Tab;
  onSetActiveTab: (tab: Tab) => void;
  isOpen: boolean;
  onClose: () => void;
};

export default function AdminSidebar({ activeTab, onSetActiveTab, isOpen, onClose }: AdminSidebarProps) {
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
    <>
      <button
        type="button"
        aria-label="Cerrar menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink/35 transition-opacity md:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[18rem] flex-col border-r border-line bg-secondary px-4 py-6 transition-transform duration-300 md:w-64 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-start justify-between px-2 md:mb-10">
          <div>
            <h1 className="font-headline text-2xl text-primary tracking-tight">Juma Accessory</h1>
            <p className="mt-1 font-body text-[10px] font-medium uppercase tracking-widest text-muted">Panel de Control</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-background text-muted md:hidden"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pb-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSetActiveTab(item.id as Tab);
                onClose();
              }}
              className={`flex w-full items-center gap-3 border-r-2 px-4 py-3 text-left transition-colors duration-150 ${
                activeTab === item.id
                  ? "border-r-primary bg-background font-semibold text-primary"
                  : "border-r-transparent text-muted hover:bg-background/70"
              }`}
            >
              <span className={`material-symbols-outlined ${activeTab === item.id ? "text-primary" : "text-muted"}`} data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="font-body text-sm font-medium tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded border border-line bg-background px-4 py-4 shadow-subtle">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-white">J</div>
          <div>
            <p className="text-xs font-bold text-primary">Juma Accessory</p>
            <p className="text-[10px] uppercase tracking-tighter text-muted">Plan Premium</p>
          </div>
        </div>
      </aside>
    </>
  );
}
