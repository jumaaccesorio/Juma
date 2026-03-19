import { useEffect, useState } from "react";
import type { Tab, Client } from "../../types";

type StoreHeaderProps = {
  activeTab: Tab;
  isAdminLogged: boolean;
  adminForm: any;
  adminError: string;
  cartItemsCount: number;
  cartTotal: number;
  currentClient: Client | null;
  onSetActiveTab: (tab: Tab) => void;
  onAdminFormChange: (form: any) => void;
  onLoginAdmin: (e: React.FormEvent<HTMLFormElement>) => void;
  onLogoutAdmin: () => void;
  onLoginClientClick: () => void;
};

export default function StoreHeader({
  activeTab,
  isAdminLogged,
  adminForm,
  adminError,
  cartItemsCount,
  cartTotal,
  currentClient,
  onSetActiveTab,
  onAdminFormChange,
  onLoginAdmin,
  onLogoutAdmin,
  onLoginClientClick,
}: StoreHeaderProps) {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (isAdminLogged) {
      setShowLogin(false);
    }
  }, [isAdminLogged]);

  return (
    <>
      {/* Top Promo Bar */}
      <div className="w-full bg-primary py-2 px-4 text-center">
        <p className="text-white text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-4">
          Envío gratis en compras superiores a $50.000
          <a className="inline-flex items-center gap-1 hover:underline decoration-white/50" href="https://www.instagram.com/juma.accessory/" target="_blank" rel="noreferrer">
            <span className="material-symbols-outlined text-sm">brand_awareness</span>
            Instagram
          </a>
        </p>
      </div>
      
      {/* Header */}
      <header className="flex flex-col items-center gap-4 border-b border-primary/10 bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 md:px-20 py-4 shadow-sm">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-start cursor-pointer group" onClick={() => onSetActiveTab("catalogo")}>
            <h2 className="font-serif text-primary text-3xl font-black leading-tight tracking-tight uppercase group-hover:text-primary/80 transition-colors">Juma Accessory</h2>
            <p className="text-primary/60 text-[10px] tracking-[0.2em] uppercase font-bold">Plata 925 y accesorios</p>
          </div>
          
          <div className="flex flex-1 justify-end items-center gap-4 md:gap-8 w-full md:w-auto">
            <label className="hidden md:flex flex-col min-w-40 h-10 max-w-64">
              <div className="flex w-full flex-1 items-stretch rounded-full h-full bg-primary/5 border border-primary/10">
                <div className="text-primary flex items-center justify-center pl-4">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 placeholder:text-primary/40 px-3 text-sm" placeholder="Buscar joyas..." />
              </div>
            </label>
            
            <div className="flex items-center gap-4">
              {currentClient ? (
                <button 
                  className={`flex items-center gap-2 rounded-full pl-3 pr-4 py-1.5 transition-colors border ${activeTab === 'perfil' ? 'bg-primary/10 border-primary text-primary' : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'} font-bold text-xs uppercase tracking-wider`}
                  onClick={() => onSetActiveTab("perfil")}
                  title="Mi Cuenta"
                >
                  <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                  </div>
                  {currentClient.name.split(' ')[0]}
                </button>
              ) : (
                <button 
                  className="flex items-center gap-2 rounded-full px-4 py-2 border border-slate-200 text-slate-500 hover:bg-primary/5 hover:border-primary hover:text-primary transition-colors font-bold text-xs uppercase tracking-wider"
                  onClick={onLoginClientClick}
                >
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  Ingresar
                </button>
              )}

              <button 
                className={`flex items-center justify-center rounded-full size-10 transition-colors relative ${showLogin || isAdminLogged ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
                onClick={() => {
                  if (isAdminLogged) {
                    const confirmLogout = window.confirm("¿Seguro que deseas cerrar sesión?");
                    if (confirmLogout) onLogoutAdmin();
                  } else {
                    setShowLogin(prev => !prev);
                  }
                }}
                title={isAdminLogged ? "Cerrar sesión Admin" : "Administración"}
              >
                <span className="material-symbols-outlined">{isAdminLogged ? 'admin_panel_settings' : 'shield_person'}</span>
              </button>
              
              <button 
                className={`flex items-center justify-center rounded-full size-10 transition-colors relative ${activeTab === 'carrito' ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
                onClick={() => onSetActiveTab("carrito")}
                title={`Carrito ($${cartTotal.toLocaleString('es-AR')})`}
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                {cartItemsCount > 0 && (
                  <span className={`absolute -top-1 -right-1 text-[10px] font-bold rounded-full size-4 flex items-center justify-center border-2 ${activeTab === 'carrito' ? 'bg-white text-primary border-primary' : 'bg-primary text-white border-background'}`}>
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="w-full overflow-x-auto flex items-center gap-6 py-2 pb-0 mt-2 text-sm uppercase tracking-widest font-bold text-slate-400 whitespace-nowrap scrollbar-hide">
          <button className={`hover:text-primary transition-colors pb-2 border-b-2 ${activeTab === "catalogo" ? "text-primary border-primary" : "border-transparent"}`} onClick={() => onSetActiveTab("catalogo")}>Inicio</button>
          <button className={`hover:text-primary transition-colors pb-2 border-b-2 ${activeTab === "carrito" ? "text-primary border-primary" : "border-transparent"}`} onClick={() => onSetActiveTab("carrito")}>Carrito</button>
          {isAdminLogged && (
            <>
              <button className={`hover:text-primary transition-colors pb-2 border-b-2 ${activeTab === "venta_rapida" ? "text-primary border-primary" : "border-transparent"}`} onClick={() => onSetActiveTab("venta_rapida")}>Venta Rápida</button>
              <button className={`hover:text-primary transition-colors pb-2 border-b-2 ${activeTab === "inicio_admin" ? "text-primary border-primary" : "border-transparent"}`} onClick={() => onSetActiveTab("inicio_admin")}>Configurar</button>
              <button className={`hover:text-primary transition-colors pb-2 border-b-2 ${activeTab === "pedidos" ? "text-primary border-primary" : "border-transparent"}`} onClick={() => onSetActiveTab("pedidos")}>Pedidos</button>
              <button className={`hover:text-primary transition-colors pb-2 border-b-2 ${activeTab === "productos" ? "text-primary border-primary" : "border-transparent"}`} onClick={() => onSetActiveTab("productos")}>Productos</button>
              <button className={`hover:text-primary transition-colors pb-2 border-b-2 ${activeTab === "categorias" ? "text-primary border-primary" : "border-transparent"}`} onClick={() => onSetActiveTab("categorias")}>Categorías</button>
              <button className={`hover:text-primary transition-colors pb-2 border-b-2 ${activeTab === "clientes" ? "text-primary border-primary" : "border-transparent"}`} onClick={() => onSetActiveTab("clientes")}>Clientes</button>
              <button className={`hover:text-primary transition-colors pb-2 border-b-2 ${activeTab === "inventario" ? "text-primary border-primary" : "border-transparent"}`} onClick={() => onSetActiveTab("inventario")}>Inventario</button>
              <button className={`hover:text-primary transition-colors pb-2 border-b-2 ${activeTab === "finanzas" ? "text-primary border-primary" : "border-transparent"}`} onClick={() => onSetActiveTab("finanzas")}>Finanzas</button>
            </>
          )}
        </nav>
      </header>
      
      {/* Login Admin Form */}
      {!isAdminLogged && showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-carbon/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl relative">
            <button 
              className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors"
              onClick={() => setShowLogin(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex justify-center mb-6">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
              </div>
            </div>
            <h3 className="font-serif text-3xl font-light text-slate-800 mb-8 text-center">Acceso Administrador</h3>
            <form className="flex flex-col gap-5" onSubmit={(e) => { onLoginAdmin(e); if (!adminError && adminForm.user && adminForm.password) setShowLogin(false); }}>
              <input
                className="w-full rounded-md border-primary/20 bg-background px-5 py-4 focus:border-primary focus:ring-primary focus:ring-2 outline-none transition-all placeholder:text-slate-400"
                placeholder="Usuario"
                value={adminForm.user}
                onChange={(e) => onAdminFormChange({ ...adminForm, user: e.target.value })}
              />
              <input
                className="w-full rounded-md border-primary/20 bg-background px-5 py-4 focus:border-primary focus:ring-primary focus:ring-2 outline-none transition-all placeholder:text-slate-400"
                type="password"
                placeholder="Contraseña"
                value={adminForm.password}
                onChange={(e) => onAdminFormChange({ ...adminForm, password: e.target.value })}
              />
              <button type="submit" className="bg-primary text-white w-full py-4 rounded-md font-bold uppercase tracking-wider hover:bg-primary/90 transition-all transform hover:-translate-y-1 shadow-lg shadow-primary/30 mt-2">
                Ingresar
              </button>
              {adminError && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center text-sm font-medium border border-red-100 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {adminError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
