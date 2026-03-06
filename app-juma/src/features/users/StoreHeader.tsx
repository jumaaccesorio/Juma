import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Tab } from "../../types";

type AdminForm = { user: string; password: string };

type StoreHeaderProps = {
  activeTab: Tab;
  isAdminLogged: boolean;
  adminForm: AdminForm;
  adminError: string;
  cartItemsCount: number;
  cartTotal: number;
  onSetActiveTab: (tab: Tab) => void;
  onAdminFormChange: (next: AdminForm) => void;
  onLoginAdmin: (event: FormEvent<HTMLFormElement>) => void;
  onLogoutAdmin: () => void;
};

function StoreHeader({
  activeTab,
  isAdminLogged,
  adminForm,
  adminError,
  cartItemsCount,
  cartTotal,
  onSetActiveTab,
  onAdminFormChange,
  onLoginAdmin,
  onLogoutAdmin,
}: StoreHeaderProps) {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (isAdminLogged) {
      setShowLogin(false);
    }
  }, [isAdminLogged]);

  return (
    <>
      <div className="mini-topbar">
        <p>Compra minima $60.000 // 10% OFF adicional con transferencia</p>
        <a href="https://www.instagram.com/juma.accessory/" target="_blank" rel="noreferrer">
          @juma.accessory
        </a>
      </div>

      <header className="store-topbar">
        <input className="search-input" placeholder="Buscar producto" />
        <div className="topbar-right">
          {isAdminLogged ? (
            <button type="button" className="ghost" onClick={onLogoutAdmin}>Cerrar admin</button>
          ) : (
            <>
              <button type="button" className="ghost" onClick={() => setShowLogin((prev) => !prev)}>
                Iniciar sesion
              </button>
              <button type="button" className="ghost">
                Registro
              </button>
            </>
          )}
          <button
            type="button"
            className="cart-pill"
            onClick={() => onSetActiveTab("carrito")}
            title="Ver carrito"
          >
            <span className="bag-icon" />
            <span className="cart-badge">{cartItemsCount}</span>
            <span className="cart-total">${cartTotal.toLocaleString("es-AR")}</span>
          </button>
        </div>
      </header>

      {!isAdminLogged && showLogin ? (
        <div className="alert">
          <form className="admin-inline" onSubmit={onLoginAdmin}>
            <input
              placeholder="@loginadmin"
              value={adminForm.user}
              onChange={(e) => onAdminFormChange({ ...adminForm, user: e.target.value })}
            />
            <input
              type="password"
              placeholder="Clave"
              value={adminForm.password}
              onChange={(e) => onAdminFormChange({ ...adminForm, password: e.target.value })}
            />
            <button type="submit">Entrar</button>
          </form>
        </div>
      ) : null}

      {adminError ? <div className="alert">{adminError}</div> : null}

      <div className="brand-row">
        <div className="brand-block">
          <h1>Juma Accessory</h1>
          <p>Plata 925 y accesorios</p>
        </div>
        <nav className="tabs">
          <button className={`tab ${activeTab === "catalogo" ? "active" : ""}`} onClick={() => onSetActiveTab("catalogo")}>Inicio</button>
          <button className={`tab ${activeTab === "carrito" ? "active" : ""}`} onClick={() => onSetActiveTab("carrito")}>Carrito</button>
          {isAdminLogged ? <button className={`tab ${activeTab === "inicio_admin" ? "active" : ""}`} onClick={() => onSetActiveTab("inicio_admin")}>Configurar inicio</button> : null}
          {isAdminLogged ? <button className={`tab ${activeTab === "pedidos" ? "active" : ""}`} onClick={() => onSetActiveTab("pedidos")}>Pedidos</button> : null}
          {isAdminLogged ? <button className={`tab ${activeTab === "productos" ? "active" : ""}`} onClick={() => onSetActiveTab("productos")}>Productos</button> : null}
          {isAdminLogged ? <button className={`tab ${activeTab === "clientes" ? "active" : ""}`} onClick={() => onSetActiveTab("clientes")}>Clientes</button> : null}
          {isAdminLogged ? <button className={`tab ${activeTab === "inventario" ? "active" : ""}`} onClick={() => onSetActiveTab("inventario")}>Inventario</button> : null}
          {isAdminLogged ? <button className={`tab ${activeTab === "finanzas" ? "active" : ""}`} onClick={() => onSetActiveTab("finanzas")}>Finanzas</button> : null}
        </nav>
      </div>
    </>
  );
}

export default StoreHeader;
