import { useState } from "react";
import type { Order, Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";
import ProductImage from "../../components/ProductImage";

type ClientProfilePanelProps = {
  clientName: string;
  myOrders: Order[];
  myFavorites: Product[];
  products: Product[];
  onLogout: () => void;
};

export default function ClientProfilePanel({ clientName, myOrders, myFavorites, products, onLogout }: ClientProfilePanelProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl space-y-10 px-4 py-8 sm:px-6 md:px-20 md:py-10">
      <div className="flex flex-col items-start justify-between gap-6 border-b border-slate-200 pb-8 md:flex-row md:items-center md:pb-10">
        <div>
          <h1 className="font-serif text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Mi Cuenta</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">¡Hola, {clientName}! Aquí puedes revisar el estado de todos tus pedidos.</p>
        </div>
        <button 
          id="client-profile-logout"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-red-50 px-6 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 sm:w-auto"
        >
          <span translate="no" className="material-symbols-outlined">logout</span>
          Cerrar Sesión
        </button>
      </div>

      <section className="space-y-6">
        <h2 className="font-serif text-2xl font-black text-slate-900 dark:text-slate-100 border-b border-primary/5 pb-4">Historial de Pedidos</h2>
        
        {myOrders.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200">
            <span translate="no" className="material-symbols-outlined text-4xl text-slate-300 mb-4 block">receipt_long</span>
            <p className="text-slate-500 font-medium">Aún no tienes pedidos registrados en tu cuenta.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                <div 
                  className="group flex cursor-pointer flex-col items-start justify-between gap-4 p-4 sm:p-6 md:flex-row md:items-center"
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-black text-lg text-slate-900 dark:text-white">Pedido #{String(order.id).padStart(5, '0')}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${order.status === 'REALIZADO' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm flex items-center gap-2">
                      <span translate="no" className="material-symbols-outlined text-[16px]">calendar_month</span>
                      {new Date(order.date).toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex flex-col items-start md:items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                      <span className="text-xl font-black text-primary">${order.items.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0).toLocaleString("es-AR")}</span>
                    </div>
                    <button className="text-slate-400 group-hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full group-hover:bg-primary/5">
                      <span translate="no" className="material-symbols-outlined" style={{ transform: expandedOrderId === order.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>expand_more</span>
                    </button>
                  </div>
                </div>

                {expandedOrderId === order.id && (
                  <div className="animate-fade-in border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80 sm:p-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <span translate="no" className="material-symbols-outlined text-[18px] text-primary">shopping_bag</span>
                      Detalle de productos
                    </h4>
                    <div className="space-y-3">
                      {order.items.map((item) => {
                        const product = products.find((p) => p.id === item.productId);
                        return (
                          <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/60 bg-white p-3 shadow-sm dark:bg-slate-800">
                            <div className="flex items-center gap-3 min-w-0">
                               <div className="h-12 w-12 rounded bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                 {product?.image ? (
                                    <ProductImage product={product} className="h-full w-full object-cover" alt="Producto" />
                                 ) : (
                                    <span translate="no" className="material-symbols-outlined text-slate-300">image</span>
                                 )}
                               </div>
                               <div className="min-w-0">
                                 <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                                   {product ? getProductDisplayName(product) : `Producto #${item.productId}`}
                                 </p>
                                 <p className="text-xs text-slate-500 font-medium">
                                   {item.quantity} un. <span className="mx-1 text-slate-300">•</span> ${item.unitSalePrice.toLocaleString("es-AR")} c/u
                                 </p>
                               </div>
                            </div>
                            <p className="shrink-0 text-sm font-black text-primary">
                              ${(item.quantity * item.unitSalePrice).toLocaleString("es-AR")}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Favorites */}
      <section className="space-y-6">
        <h2 className="font-serif text-2xl font-black text-slate-900 dark:text-slate-100 border-b border-primary/5 pb-4 flex items-center gap-2">
          <span translate="no" className="material-symbols-outlined text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          Mis Favoritos
        </h2>
        {myFavorites.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200">
            <span translate="no" className="material-symbols-outlined text-4xl text-slate-300 mb-4 block">favorite_border</span>
            <p className="text-slate-500 font-medium">Aún no guardaste ningún accesorio en favoritos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4">
            {myFavorites.map(product => (
              <div key={product.id} className="flex flex-col group">
                <div className="aspect-square overflow-hidden rounded-xl bg-slate-100 mb-3">
                  {product.image ? (
                    <ProductImage
                      product={product}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt={getProductDisplayName(product)}
                    />
                  ) : (
                    <span translate="no" className="material-symbols-outlined text-5xl text-slate-300 flex items-center justify-center h-full">image</span>
                  )}
                </div>
                <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-0.5">{product.categoryName || ""}</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{getProductDisplayName(product)}</p>
                <p className="font-black text-primary mt-1">${product.salePrice.toLocaleString("es-AR")}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
