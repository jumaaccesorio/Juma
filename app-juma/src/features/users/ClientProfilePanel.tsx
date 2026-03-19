import type { Order, Product } from "../../types";

type ClientProfilePanelProps = {
  clientName: string;
  myOrders: Order[];
  myFavorites: Product[];
  onLogout: () => void;
};

export default function ClientProfilePanel({ clientName, myOrders, myFavorites, onLogout }: ClientProfilePanelProps) {
  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-20 py-10 space-y-12 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-200 pb-10">
        <div>
          <h1 className="font-serif text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Mi Cuenta</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">¡Hola, {clientName}! Aquí puedes revisar el estado de todos tus pedidos.</p>
        </div>
        <button 
          onClick={onLogout}
          className="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">logout</span>
          Cerrar Sesión
        </button>
      </div>

      <section className="space-y-6">
        <h2 className="font-serif text-2xl font-black text-slate-900 dark:text-slate-100 border-b border-primary/5 pb-4">Historial de Pedidos</h2>
        
        {myOrders.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-4 block">receipt_long</span>
            <p className="text-slate-500 font-medium">Aún no tienes pedidos registrados en tu cuenta.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {myOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg text-slate-900 dark:text-white">Pedido #{String(order.id).padStart(5, '0')}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${order.status === 'REALIZADO' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    {new Date(order.date).toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                    {order.items.reduce((acc, item) => acc + item.quantity, 0)} productos
                  </p>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-black text-primary">${order.items.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0).toLocaleString("es-AR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Favorites */}
      <section className="space-y-6">
        <h2 className="font-serif text-2xl font-black text-slate-900 dark:text-slate-100 border-b border-primary/5 pb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          Mis Favoritos
        </h2>
        {myFavorites.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-4 block">favorite_border</span>
            <p className="text-slate-500 font-medium">Aún no guardaste ningún accesorio en favoritos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {myFavorites.map(product => (
              <div key={product.id} className="flex flex-col group">
                <div className="aspect-square overflow-hidden rounded-xl bg-slate-100 mb-3">
                  {product.image ? (
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={product.image} alt={product.name} />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-slate-300 flex items-center justify-center h-full">image</span>
                  )}
                </div>
                <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-0.5">{product.categoryName || ""}</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{product.name}</p>
                <p className="font-black text-primary mt-1">${product.salePrice.toLocaleString("es-AR")}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
