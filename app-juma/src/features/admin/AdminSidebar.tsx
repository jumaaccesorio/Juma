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
        className={`fixed left-0 top-0 z-50 flex h-screen w-[20rem] flex-col border-r border-outline-variant/10 bg-surface px-6 py-6 transition-transform duration-300 md:w-64 md:translate-x-0 md:border-line md:bg-secondary md:px-4 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-start justify-between md:mb-10 md:px-2">
          <div className="flex items-center gap-4 md:block">
            <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-surface-container-high md:hidden">
              <span className="font-body text-sm font-semibold text-primary">J</span>
            </div>
            <div>
              <h1 className="font-headline text-2xl italic tracking-tight text-primary md:text-2xl md:not-italic">Golden Admin</h1>
              <p className="mt-1 font-body text-[10px] font-medium uppercase tracking-[0.2em] text-secondary md:text-muted">
                Boutique Atelier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-low text-secondary md:hidden"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pb-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSetActiveTab(item.id as Tab);
                onClose();
              }}
              className={`group flex w-full items-center gap-4 rounded px-3 py-3 text-left transition-all duration-150 md:rounded-none md:border-r-2 md:px-4 ${
                activeTab === item.id
                  ? "bg-secondary-container text-primary md:border-r-primary md:bg-background md:font-semibold"
                  : "text-secondary hover:bg-surface-container-low md:border-r-transparent md:text-muted md:hover:bg-background/70"
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

        <div className="mt-auto border-t border-outline-variant/10 pt-6 md:border-line md:pt-4">
          <button
            type="button"
            className="group flex w-full items-center gap-4 rounded px-3 py-3 text-left text-error transition-all hover:bg-error/5 md:px-4"
          >
            <span className="material-symbols-outlined transition-transform group-hover:rotate-12">logout</span>
            <span className="font-body text-xs font-medium uppercase tracking-[0.14em]">Cerrar Sesion</span>
          </button>
          <div className="mt-4 flex items-center gap-3 rounded border border-outline-variant/10 bg-surface-container-lowest px-4 py-4 shadow-[0_12px_40px_rgba(45,45,45,0.04)] md:border-line md:bg-background md:shadow-subtle">
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
