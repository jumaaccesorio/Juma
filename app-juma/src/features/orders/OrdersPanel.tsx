import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Client, NewOrderItem, Order, OrderStatus, Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";

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
  hasInsufficientStock: (items: Order["items"]) => boolean;
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
  hasInsufficientStock,
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
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");

  const enabledProducts = useMemo(() => products.filter((product) => product.enabled), [products]);
  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return enabledProducts;
    return enabledProducts.filter((product) =>
      [product.name, product.subName, product.categoryName || ""].some((value) => (value || "").toLowerCase().includes(normalized)),
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

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      if (!normalized) return true;

      const clientName = order.clientId ? getClientName(order.clientId) : order.guestName || "Invitado";
      const orderId = `#${String(order.id).padStart(5, "0")}`;

      return [clientName, orderId, order.status].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [orders, statusFilter, query, getClientName]);

  const statusTabs: Array<{ label: string; value: "ALL" | OrderStatus }> = [
    { label: "All", value: "ALL" },
    { label: "Processing", value: "PENDIENTE" },
    { label: "Delivered", value: "REALIZADO" },
  ];

  return (
    <div className="flex-1 min-h-screen space-y-8 bg-secondary p-4 md:p-8 dark:bg-carbon">
      <div className="mx-auto max-w-lg space-y-6 md:hidden">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest text-secondary">Archive</p>
            <h2 className="font-headline text-4xl font-bold text-on-surface">Orders</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-sm bg-gradient-to-br from-primary to-primary-container px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-opacity hover:opacity-80"
          >
            {showForm ? "Close" : "New Order"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="group relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full rounded-sm bg-surface-container-lowest py-4 pl-12 pr-4 text-sm shadow-sm transition-all placeholder:text-outline-variant focus:ring-1 focus:ring-primary"
              placeholder="Search orders..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                  statusFilter === tab.value
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-secondary hover:bg-surface-container-high"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {showForm && (
          <form
            className="space-y-5 rounded-sm border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(45,45,45,0.02)]"
            onSubmit={(event) => {
              onAddOrder(event);
              setShowForm(false);
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-secondary">Cliente</label>
                <select
                  required
                  className="w-full rounded-sm bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                  value={orderForm.clientId}
                  onChange={(event) => onOrderFormChange({ ...orderForm, clientId: event.target.value })}
                >
                  <option value="">Seleccionar Cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-secondary">Fecha</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-sm bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                    value={orderForm.date}
                    onChange={(event) => onOrderFormChange({ ...orderForm, date: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-secondary">Estado</label>
                  <select
                    required
                    className="w-full rounded-sm bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                    value={orderForm.status}
                    onChange={(event) => onOrderFormChange({ ...orderForm, status: event.target.value as OrderStatus })}
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="REALIZADO">Realizado</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Productos</label>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  {selectedRows.length}
                </span>
              </div>
              <div className="grid max-h-56 grid-cols-2 gap-3 overflow-y-auto rounded-sm bg-surface-container-low p-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onAddProductToOrder(product.id)}
                    disabled={product.stock <= 0}
                    className={`rounded-sm bg-white p-3 text-left shadow-sm transition ${
                      product.stock <= 0 ? "cursor-not-allowed opacity-50 grayscale" : "active:scale-[0.98]"
                    }`}
                  >
                    <p className="line-clamp-1 font-headline text-base italic text-on-surface">
                      {getProductDisplayName(product)}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-primary">
                      ${product.salePrice.toLocaleString("es-AR")}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-secondary">
                      {product.stock > 0 ? `Stock ${product.stock}` : "Agotado"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {selectedRows.length === 0 ? (
                <div className="rounded-sm border border-dashed border-outline-variant/20 px-4 py-5 text-center text-sm text-secondary">
                  Seleccioná productos para el pedido.
                </div>
              ) : (
                selectedRows.map((row) => (
                  <div key={`mobile-row-${row.index}`} className="flex items-center justify-between rounded-sm bg-surface-container-low p-3">
                    <div>
                      <p className="font-headline text-base italic text-on-surface">{getProductDisplayName(row.product)}</p>
                      <p className="text-[11px] text-secondary">${row.product.salePrice.toLocaleString("es-AR")} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={row.product.stock}
                        value={row.item.quantity}
                        onChange={(event) => onUpdateOrderItemRow(row.index, "quantity", event.target.value)}
                        className="w-16 rounded-sm bg-white px-2 py-1 text-center text-sm font-bold outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveOrderItemRow(row.index)}
                        className="text-secondary transition-colors hover:text-error"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-sm border border-outline-variant/20 px-4 py-3 text-xs font-bold uppercase tracking-widest text-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={selectedRows.length === 0}
                className="flex-1 rounded-sm bg-primary px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {filteredOrders.map((order, index) => {
            const clientName = order.clientId ? getClientName(order.clientId) : order.guestName || "Invitado";
            const total = getOrderTotal(order);
            const isCompleted = order.status === "REALIZADO";
            const accent = isCompleted
              ? "bg-primary-container/20 text-on-primary-container"
              : "bg-tertiary-container/20 text-on-tertiary-container";

            if (index === 2 && filteredOrders.length > 3) {
              const nextOrder = filteredOrders[index + 1];
              if (!nextOrder) return null;
              const nextClientName = nextOrder.clientId ? getClientName(nextOrder.clientId) : nextOrder.guestName || "Invitado";
              const nextTotal = getOrderTotal(nextOrder);
              return (
                <div key={`pair-${order.id}-${nextOrder.id}`} className="grid grid-cols-2 gap-4">
                  {[{ order, clientName, total }, { order: nextOrder, clientName: nextClientName, total: nextTotal }].map(
                    ({ order: currentOrder, clientName: currentClientName, total: currentTotal }, pairIndex) => (
                      <div
                        key={currentOrder.id}
                        className={`flex h-32 flex-col justify-between rounded-sm p-4 ${
                          pairIndex === 0 ? "bg-surface-container-lowest shadow-sm" : "bg-surface-container-low"
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase text-outline">
                          #{String(currentOrder.id).padStart(5, "0")}
                        </span>
                        <div>
                          <h3 className="truncate font-headline text-lg italic">{currentClientName}</h3>
                          <p className="text-sm font-bold text-primary">${currentTotal.toLocaleString("es-AR")}</p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              );
            }

            if (index === 3 && filteredOrders.length > 3) return null;

            return (
              <div
                key={order.id}
                className={`rounded-sm p-5 ${
                  index % 2 === 1
                    ? "bg-surface-container-low shadow-none"
                    : "border-l-4 border-primary/20 bg-surface-container-lowest shadow-[0_4px_20px_rgba(45,45,45,0.02)]"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-tighter text-outline">
                      #{String(order.id).padStart(5, "0")}
                    </span>
                    <h3 className="font-headline text-xl italic text-on-surface">{clientName}</h3>
                  </div>
                  <div className={`rounded-full px-3 py-1 ${accent}`}>
                    <span className="text-[10px] font-bold uppercase">
                      {isCompleted ? "Delivered" : "Processing"}
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-headline text-lg text-primary">${total.toLocaleString("es-AR")}</p>
                    <p className="text-[10px] uppercase tracking-widest text-outline">
                      {new Date(order.date).toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  {order.status === "PENDIENTE" ? (
                    <button
                      type="button"
                      onClick={() => onMarkOrderAsRealized(order.id)}
                      className="rounded-full bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white"
                    >
                      Enviado
                    </button>
                  ) : (
                    <span className="rounded-full bg-secondary-container px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                      Cerrado
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="rounded-sm bg-surface-container-lowest px-5 py-10 text-center shadow-[0_4px_20px_rgba(45,45,45,0.02)]">
              <p className="font-headline text-xl italic text-on-surface">No hay pedidos</p>
              <p className="mt-2 text-sm text-secondary">Probá con otro filtro o creá uno nuevo.</p>
            </div>
          )}
        </div>
      </div>

      <div className="hidden space-y-8 md:block">
      {/* Header Actions */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
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
        <form className="animate-fade-in rounded-xl border border-neutral-soft bg-white p-5 shadow-sm md:p-8 dark:border-slate-800 dark:bg-slate-900" onSubmit={(e) => { onAddOrder(e); setShowForm(false); }}>
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
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-95"
                >
                  <div className="h-16 w-16 mb-2 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={getProductDisplayName(product)} className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-300">image</span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-900 line-clamp-1 w-full" title={getProductDisplayName(product)}>{getProductDisplayName(product)}</span>
                  <div className="flex justify-between w-full mt-1 items-center">
                    <span className="text-xs font-bold text-primary">${product.salePrice.toLocaleString("es-AR")}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${product.stock > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                      {product.stock > 0 ? `Stock: ${product.stock}` : "Por encargo"}
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
                        <img src={row.product.image} alt={getProductDisplayName(row.product)} className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300">image</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900">{getProductDisplayName(row.product)}</p>
                      <p className="text-xs text-slate-500">${row.product.salePrice.toLocaleString("es-AR")} c/u</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CANTIDAD</label>
                        <input
                          type="number"
                          min={1}
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

        <div className="space-y-3 p-4 lg:hidden">
          {orders.map((order) => {
            const clientName = order.clientId ? getClientName(order.clientId) : order.guestName || "Invitado";
            const needsRestock = order.status === "PENDIENTE" && hasInsufficientStock(order.items);
            return (
              <div key={`mobile-${order.id}`} className="rounded-xl border border-line bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Pedido</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">#{String(order.id).padStart(5, "0")}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    order.status === "REALIZADO" ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${order.status === "REALIZADO" ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    {order.status}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Cliente</span>
                    <span className="font-medium text-slate-700">{clientName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Fecha</span>
                    <span className="font-medium text-slate-700">{new Date(order.date).toLocaleDateString("es-AR", { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Total</span>
                    <span className="font-bold text-slate-900">${getOrderTotal(order).toLocaleString("es-AR")}</span>
                  </div>
                </div>
                {needsRestock ? (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-warning/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#9a6d48]">
                    <span className="material-symbols-outlined text-[14px]">inventory</span>
                    Requiere reposicion
                  </div>
                ) : null}
                <div className="mt-4">
                  {order.status === "PENDIENTE" ? (
                    <button 
                      type="button" 
                      onClick={() => onMarkOrderAsRealized(order.id)}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Marcar envio
                    </button>
                  ) : (
                    <span className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-400">
                      <span className="material-symbols-outlined text-[16px]">done_all</span>
                      Completado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {orders.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No se encontraron pedidos registrados.</div> : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {(() => {
                    const clientName = order.clientId ? getClientName(order.clientId) : order.guestName || "Invitado";
                    const needsRestock = order.status === "PENDIENTE" && hasInsufficientStock(order.items);
                    return (
                      <>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">#{String(order.id).padStart(5, '0')}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {clientName.substring(0, 2)}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{clientName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {new Date(order.date).toLocaleDateString("es-AR", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-start gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === "REALIZADO" 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${order.status === "REALIZADO" ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {order.status}
                    </span>
                    {needsRestock ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#9a6d48]">
                        <span className="material-symbols-outlined text-[14px]">inventory</span>
                        Requiere reposicion
                      </span>
                    ) : null}
                    </div>
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
                      </>
                    );
                  })()}
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No se encontraron pedidos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

export default OrdersPanel;

