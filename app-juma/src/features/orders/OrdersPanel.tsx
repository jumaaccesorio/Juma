import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Client, NewOrderItem, Order, OrderStatus, Product } from "../../types";

type OrderForm = {
  clientId: string;
  date: string;
  status: OrderStatus;
  items: NewOrderItem[];
};

type OrdersPanelProps = {
  clients: Client[];
  products: Product[];
  orders: Order[];
  orderForm: OrderForm;
  pendingOrdersCount: number;
  completedOrdersCount: number;
  onOrderFormChange: (next: OrderForm) => void;
  onAddOrder: (event: FormEvent<HTMLFormElement>) => void;
  onAddProductToOrder: (productId: number) => void;
  onRemoveOrderItemRow: (index: number) => void;
  onUpdateOrderItemRow: (index: number, key: keyof NewOrderItem, value: string) => void;
  onMarkOrderAsRealized: (orderId: number) => void;
  getClientName: (clientId: number) => string;
  getOrderTotal: (order: Order) => number;
};

function OrdersPanel({
  clients,
  products,
  orders,
  orderForm,
  pendingOrdersCount,
  completedOrdersCount,
  onOrderFormChange,
  onAddOrder,
  onAddProductToOrder,
  onRemoveOrderItemRow,
  onUpdateOrderItemRow,
  onMarkOrderAsRealized,
  getClientName,
  getOrderTotal,
}: OrdersPanelProps) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const enabledProducts = useMemo(() => products.filter((product) => product.enabled), [products]);
  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return enabledProducts;
    return enabledProducts.filter((product) =>
      [product.name, product.category].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [enabledProducts, query]);

  const selectedRows = useMemo(
    () =>
      orderForm.items
        .map((item, index) => {
          const product = products.find((row) => row.id === Number(item.productId));
          if (!product) return null;
          return { index, item, product };
        })
        .filter((row): row is { index: number; item: NewOrderItem; product: Product } => row !== null),
    [orderForm.items, products],
  );

  return (
    <div className="flex-1 p-6 md:p-10 space-y-20 bg-secondary dark:bg-carbon min-h-screen">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Admin Pedidos</h2>
          <p className="text-slate-500 mt-1">Gestiona los pedidos de tus clientes y estados de envio.</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cerrar Formulario' : 'Nuevo Pedido'}
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
            <span className="material-symbols-outlined text-3xl">shopping_bag</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Pedidos</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{orders.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-lg">
            <span className="material-symbols-outlined text-3xl">pending_actions</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pendientes</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingOrdersCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Realizados</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{completedOrdersCount}</p>
          </div>
        </div>
      </div>

      {/* New Order Form */}
      {showForm && (
        <form className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-neutral-soft dark:border-slate-800 shadow-sm animate-fade-in" onSubmit={(e) => { onAddOrder(e); setShowForm(false); }}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-neutral-soft dark:border-slate-800 pb-4">Crear Nuevo Pedido</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Cliente</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" value={orderForm.clientId} onChange={(e) => onOrderFormChange({ ...orderForm, clientId: e.target.value })}>
                <option value="">Seleccionar Cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Fecha</label>
              <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" value={orderForm.date} onChange={(e) => onOrderFormChange({ ...orderForm, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Estado</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" value={orderForm.status} onChange={(e) => onOrderFormChange({ ...orderForm, status: e.target.value as OrderStatus })}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="REALIZADO">Realizado</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-slate-700">Agregar Productos</label>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="Buscar..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-h-64 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-slate-50/50">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onAddProductToOrder(product.id)}
                  disabled={product.stock <= 0}
                  className={`flex flex-col items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center transition-all ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-primary/50 hover:shadow-md active:scale-95 cursor-pointer'}`}
                >
                  <div className="h-16 w-16 mb-2 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-300">image</span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-900 line-clamp-1 w-full" title={product.name}>{product.name}</span>
                  <div className="flex justify-between w-full mt-1 items-center">
                    <span className="text-xs font-bold text-primary">${product.salePrice.toLocaleString("es-AR")}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${product.stock > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                      {product.stock > 0 ? `Stock: ${product.stock}` : "Agotado"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-sm font-bold text-slate-700 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between">
              <span>Productos Seleccionados</span>
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{selectedRows.length} items</span>
            </h4>
            
            {selectedRows.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-medium">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-300 block">shopping_cart</span>
                Selecciona productos desde la grilla de arriba para agregarlos al pedido.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedRows.map((row) => (
                  <div key={`row-${row.index}`} className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="h-12 w-12 rounded bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {row.product.image ? (
                        <img src={row.product.image} alt={row.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300">image</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900">{row.product.name}</p>
                      <p className="text-xs text-slate-500">${row.product.salePrice.toLocaleString("es-AR")} c/u</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CANTIDAD</label>
                        <input
                          type="number"
                          min={1}
                          max={row.product.stock}
                          value={row.item.quantity}
                          onChange={(e) => onUpdateOrderItemRow(row.index, "quantity", e.target.value)}
                          className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => onRemoveOrderItemRow(row.index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-4"
                        title="Quitar producto"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-neutral-soft dark:border-slate-800">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
            <button 
              type="submit" 
              disabled={selectedRows.length === 0}
              className={`px-8 py-3 rounded-lg font-bold shadow-lg transition-all ${selectedRows.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'}`}
            >
              Guardar Pedido
            </button>
          </div>
        </form>
      )}

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-soft dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-soft dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Listado de Pedidos</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID Pedido</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Cliente</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Fecha</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-soft dark:divide-slate-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">#{String(order.id).padStart(5, '0')}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {getClientName(order.clientId).substring(0, 2)}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{getClientName(order.clientId)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {new Date(order.date).toLocaleDateString("es-AR", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === "REALIZADO" 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${order.status === "REALIZADO" ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    ${getOrderTotal(order).toLocaleString("es-AR")}
                  </td>
                  <td className="p-4 text-right">
                    {order.status === "PENDIENTE" ? (
                      <button 
                        type="button" 
                        onClick={() => onMarkOrderAsRealized(order.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Marcar Envío
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg cursor-not-allowed">
                        <span className="material-symbols-outlined text-[16px]">done_all</span>
                        Completado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No se encontraron pedidos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OrdersPanel;

