import type { Tab } from "../../types";

type AdminSidebarProps = {
  activeTab: Tab;
  onSetActiveTab: (tab: Tab) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export default function AdminSidebar({ activeTab, onSetActiveTab, isOpen, onClose, onLogout }: AdminSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    { id: "venta_rapida", label: "Venta rápida", icon: "bolt" },
    { id: "categorias", label: "Categorías", icon: "category" },
    { id: "inventario", label: "Inventario", icon: "inventory_2" },
    { id: "productos", label: "Productos", icon: "layers" },
    { id: "clientes", label: "Usuarios", icon: "group" },
    { id: "pedidos", label: "Pedidos", icon: "shopping_bag" },
    { id: "finanzas", label: "Finanzas", icon: "payments" },
    { id: "inicio_admin", label: "Configuración", icon: "settings" },
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
        className={`fixed left-0 top-0 z-50 flex h-screen w-[20rem] flex-col border-r border-line bg-secondary px-6 py-6 shadow-[18px_0_40px_rgba(45,45,45,0.16)] transition-transform duration-300 md:w-64 md:translate-x-0 md:px-4 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-start justify-between md:mb-10 md:px-2">
          <div className="flex items-center gap-4 md:block">
            <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-background shadow-sm md:hidden">
              <span className="font-body text-sm font-semibold text-primary">J</span>
            </div>
            <div>
              <h1 className="font-headline text-2xl italic tracking-tight text-primary md:text-2xl md:not-italic">Juma Accessory</h1>
              <p className="mt-1 font-body text-[10px] font-medium uppercase tracking-[0.2em] text-secondary md:text-muted">
                Panel de Control
              </p>
            </div>
          </div>
            <button
              type="button"
              onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-background text-secondary shadow-sm md:hidden"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSetActiveTab(item.id as Tab);
                onClose();
              }}
              className={`group flex w-full items-center gap-4 rounded px-3 py-3 text-left transition-all duration-150 md:rounded-none md:border-r-2 md:px-4 ${
                activeTab === item.id
                  ? "bg-background text-primary shadow-sm md:border-r-primary md:font-semibold"
                  : "text-secondary hover:bg-background/80 md:border-r-transparent md:text-muted md:hover:bg-background/70"
              }`}
            >
              <span
                className={`material-symbols-outlined transition-transform group-hover:scale-105 ${
                  activeTab === item.id ? "text-primary" : "text-secondary md:text-muted"
                }`}
                data-icon={item.icon}
              >
                {item.icon}
              </span>
              <span className="font-body text-xs font-medium uppercase tracking-[0.14em] md:text-sm md:normal-case md:tracking-wide">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-line pt-6 md:pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="mb-4 flex w-full items-center gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 md:hidden"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Cerrar sesión
          </button>
          <div className="mt-4 flex items-center gap-3 rounded border border-line bg-background px-4 py-4 shadow-[0_12px_40px_rgba(45,45,45,0.08)] md:shadow-subtle">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-white">J</div>
            <div>
              <p className="text-xs font-bold text-primary">Juma Accessory</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-secondary md:tracking-tighter md:text-muted">Plan Premium</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
