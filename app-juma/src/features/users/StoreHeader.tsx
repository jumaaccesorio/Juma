import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Client, Tab } from "../../types";

type StoreHeaderProps = {
  activeTab: Tab;
  isAdminLogged: boolean;
  adminForm: { user: string; password: string };
  adminError: string;
  adminLockedUntil: number | null;
  showAdminLogin: boolean;
  cartItemsCount: number;
  cartTotal: number;
  categories: Category[];
  selectedCatalogCategoryId: number | null;
  catalogSearchQuery: string;
  catalogViewMode: "home" | "catalog" | "search";
  currentClient: Client | null;
  onSetActiveTab: (tab: Tab) => void;
  onOpenCatalogHome: () => void;
  onOpenFullCatalog: () => void;
  onSelectCatalogCategory: (categoryId: number | null) => void;
  onCatalogSearchChange: (value: string) => void;
  onCatalogSearchSubmit: () => void;
  onAdminFormChange: (form: { user: string; password: string }) => void;
  onLoginAdmin: (e: React.FormEvent<HTMLFormElement>) => void;
  onOpenAdminLogin: () => void;
  onCloseAdminLogin: () => void;
  onLoginClientClick: () => void;
  onLogoutClient: () => void;
};

export default function StoreHeader({
  activeTab,
  isAdminLogged,
  adminForm,
  adminError,
  adminLockedUntil,
  showAdminLogin,
  cartItemsCount,
  cartTotal,
  categories,
  selectedCatalogCategoryId,
  catalogSearchQuery,
  catalogViewMode,
  currentClient,
  onSetActiveTab,
  onOpenCatalogHome,
  onOpenFullCatalog,
  onSelectCatalogCategory,
  onCatalogSearchChange,
  onCatalogSearchSubmit,
  onAdminFormChange,
  onLoginAdmin,
  onOpenAdminLogin,
  onCloseAdminLogin,
  onLoginClientClick,
  onLogoutClient,
}: StoreHeaderProps) {
  const [showCatalogMenu, setShowCatalogMenu] = useState(false);
  const [showClientMenu, setShowClientMenu] = useState(false);
  const catalogMenuRef = useRef<HTMLDivElement | null>(null);

  const scrollToPageTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCatalogWithSearch = (value: string) => {
    onCatalogSearchChange(value);
    if (activeTab !== "catalogo") onSetActiveTab("catalogo");
  };

  const visibleCategories = useMemo(
    () => categories.filter((category) => !category.parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );
  const isHomeActive =
    activeTab === "catalogo" &&
    catalogViewMode === "home" &&
    selectedCatalogCategoryId == null &&
    !showCatalogMenu;
  const isCatalogActive =
    activeTab === "catalogo" &&
    (showCatalogMenu || catalogViewMode !== "home" || selectedCatalogCategoryId != null);

  useEffect(() => {
    setShowCatalogMenu(false);
  }, [activeTab]);

  useEffect(() => {
    if (!currentClient) {
      setShowClientMenu(false);
    }
  }, [currentClient]);

  useEffect(() => {
    if (!showCatalogMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!catalogMenuRef.current) return;
      if (catalogMenuRef.current.contains(event.target as Node)) return;
      setShowCatalogMenu(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showCatalogMenu]);

  return (
    <>
      <div className="w-full bg-primary px-4 py-2 text-center">
        <p className="flex items-center justify-center gap-4 text-xs font-medium uppercase tracking-wider text-white">
          Envio gratis en compras superiores a $50.000
          <a
            className="inline-flex items-center gap-1 decoration-white/50 hover:underline"
            href="https://www.instagram.com/juma.accessory/"
            target="_blank"
            rel="noreferrer"
          >
            <span className="material-symbols-outlined text-sm">brand_awareness</span>
            Instagram
          </a>
        </p>
      </div>

      <header className="sticky top-0 z-50 flex flex-col items-center gap-4 border-b border-primary/10 bg-background/80 px-6 py-4 shadow-sm backdrop-blur-md md:px-20">
        <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
          <div className="group flex cursor-pointer flex-col items-start" onClick={onOpenCatalogHome}>
            <h2 className="font-serif text-3xl font-black uppercase leading-tight tracking-tight text-primary transition-colors group-hover:text-primary/80">
              Juma Accessory
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
              Plata 925, accesorios de acero blanco y dorado
            </p>
          </div>

          <div className="flex w-full flex-1 items-center justify-end gap-4 md:w-auto md:gap-8">
            <label className="hidden h-10 min-w-40 max-w-64 flex-col md:flex">
              <div className="flex h-full w-full items-stretch rounded-full border border-primary/10 bg-primary/5">
                <div className="flex items-center justify-center pl-4 text-primary">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="form-input min-w-0 flex-1 border-none bg-transparent px-3 text-sm placeholder:text-primary/40 focus:ring-0"
                  placeholder="Buscar joyas..."
                  value={catalogSearchQuery}
                  onFocus={() => {
                    if (activeTab !== "catalogo") onSetActiveTab("catalogo");
                  }}
                  onChange={(e) => openCatalogWithSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onCatalogSearchSubmit();
                    }
                  }}
                />
              </div>
            </label>

            <div className="flex items-center gap-4">
              {currentClient ? (
                <div className="relative">
                  <button
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 pr-4 text-xs font-bold uppercase tracking-wider transition-colors ${
                      activeTab === "perfil" || showClientMenu
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                    }`}
                    onClick={() => setShowClientMenu((prev) => !prev)}
                    title="Mi Cuenta"
                  >
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary text-white">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                    </div>
                    {currentClient.name.split(" ")[0]}
                    <span className={`material-symbols-outlined text-[16px] transition-transform ${showClientMenu ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>

                  {showClientMenu ? (
                    <div className="absolute right-0 top-full z-[95] mt-3 min-w-[220px] overflow-hidden rounded-xl border border-primary/15 bg-white shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setShowClientMenu(false);
                          onSetActiveTab("perfil");
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-ink transition-colors hover:bg-secondary/40 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        Ver historial
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowClientMenu(false);
                          onLogoutClient();
                        }}
                        className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Cerrar sesion
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                  onClick={onLoginClientClick}
                >
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  Ingresar
                </button>
              )}

              <button
                className={`relative flex size-10 items-center justify-center rounded-full transition-colors ${
                  activeTab === "carrito" ? "bg-primary text-white" : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                }`}
                onClick={() => onSetActiveTab("carrito")}
                title={`Carrito ($${cartTotal.toLocaleString("es-AR")})`}
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                {cartItemsCount > 0 ? (
                  <span
                    className={`absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                      activeTab === "carrito" ? "border-primary bg-white text-primary" : "border-background bg-primary text-white"
                    }`}
                  >
                    {cartItemsCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>

        <nav className="relative z-20 mt-2 flex w-full items-center gap-8 overflow-visible py-2 pb-0 text-sm font-bold uppercase tracking-widest text-slate-400">
          <button
            className={`border-b-2 pb-2 transition-colors hover:text-primary ${isHomeActive ? "border-primary text-primary" : "border-transparent"}`}
            onClick={onOpenCatalogHome}
          >
            Inicio
          </button>
          <div ref={catalogMenuRef} className="relative shrink-0">
            <button
              type="button"
              className={`flex items-center gap-1 border-b-2 pb-2 transition-colors ${
                isCatalogActive ? "border-primary text-primary" : "border-transparent hover:text-primary"
              }`}
              onClick={() => {
                onOpenFullCatalog();
                setShowCatalogMenu((prev) => !prev);
              }}
            >
              Catalogo
              <span className={`material-symbols-outlined text-sm transition-transform ${showCatalogMenu ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>
            {showCatalogMenu ? (
              <div className="absolute left-0 top-full z-[90] mt-3 min-w-[240px] overflow-hidden border border-primary/20 bg-white shadow-xl">
                <div className="h-1.5 bg-primary" />
                <div className="py-4">
                  {visibleCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        onSelectCatalogCategory(category.id);
                        setShowCatalogMenu(false);
                      }}
                      className="block w-full px-6 py-3 text-left text-[15px] font-medium normal-case tracking-normal text-ink transition-colors hover:bg-secondary/40 hover:text-primary"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <button
            className={`border-b-2 pb-2 transition-colors hover:text-primary ${activeTab === "carrito" ? "border-primary text-primary" : "border-transparent"}`}
            onClick={() => {
              onSetActiveTab("carrito");
              scrollToPageTop();
            }}
          >
            Carrito
          </button>
        </nav>
      </header>

      {!isAdminLogged && showAdminLogin ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-carbon/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <button
              className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-primary"
              onClick={onCloseAdminLogin}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="mb-6 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
              </div>
            </div>
            <h3 className="mb-8 text-center font-serif text-3xl font-light text-slate-800">Acceso Administrador</h3>
            <form className="flex flex-col gap-5" onSubmit={onLoginAdmin}>
              <input
                className="w-full rounded-md border-primary/20 bg-background px-5 py-4 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary"
                placeholder="Usuario"
                value={adminForm.user}
                onChange={(e) => onAdminFormChange({ ...adminForm, user: e.target.value })}
              />
              <input
                className="w-full rounded-md border-primary/20 bg-background px-5 py-4 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary"
                type="password"
                placeholder="Contrasena"
                value={adminForm.password}
                onChange={(e) => onAdminFormChange({ ...adminForm, password: e.target.value })}
              />
              <button
                type="submit"
                className="mt-2 w-full rounded-md bg-primary py-4 font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-1 hover:bg-primary/90"
              >
                Ingresar
              </button>
              {adminLockedUntil && adminLockedUntil > Date.now() ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-4 text-center text-sm font-medium text-amber-700">
                  <span className="material-symbols-outlined text-sm">timer</span>
                  Acceso bloqueado temporalmente. Intenta nuevamente en unos minutos.
                </div>
              ) : null}
              {adminError ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-medium text-red-500">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {adminError}
                </div>
              ) : null}
            </form>
            {!isAdminLogged ? (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
              >
                Abrir acceso admin
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
