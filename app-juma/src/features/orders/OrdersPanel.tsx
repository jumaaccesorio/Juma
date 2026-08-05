import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Client, NewOrderItem, Order, OrderStatus, Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";
import ProductImage from "../../components/ProductImage";

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
  onDeleteOrder: (orderId: number) => void;
  onOpenProductDetail: (productId: number) => void;
  getClientName: (clientId: number) => string;
  getOrderTotal: (order: Order) => number;
  getOrderCost: (order: Order) => number;
  getOrderProfit: (order: Order) => number;
  packagingCostPerOrder: number;
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
  onDeleteOrder,
  onOpenProductDetail,
  getClientName,
  getOrderTotal,
  getOrderCost,
  getOrderProfit,
  packagingCostPerOrder,
}: OrdersPanelProps) {
  const MOBILE_PRODUCTS_PER_PAGE = 10;
  const DESKTOP_PRODUCTS_PER_PAGE = 20;
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [mobileProductsPage, setMobileProductsPage] = useState(1);
  const [desktopProductsPage, setDesktopProductsPage] = useState(1);
  const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([]);
  const mobileProductsRef = useRef<HTMLDivElement | null>(null);
  const desktopProductsRef = useRef<HTMLDivElement | null>(null);

  const toggleOrderExpanded = (orderId: number) => {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  };

  const getOrderItemsDetail = (order: Order) =>
    order.items
      .map((item) => {
        const product = products.find((row) => row.id === item.productId);
        return {
          ...item,
          productName: product ? getProductDisplayName(product) : `Producto #${item.productId}`,
          productImage: product?.image ?? "",
          subtotal: item.quantity * item.unitSalePrice,
        };
      })
      .filter((item) => item.quantity > 0);

  const scrollToSectionStart = (element: HTMLDivElement | null) => {
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  const enabledProducts = useMemo(() => products.filter((product) => product.enabled), [products]);
  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return enabledProducts;
    return enabledProducts.filter((product) =>
      [product.name, product.subName, product.categoryName || ""].some((value) => (value || "").toLowerCase().includes(normalized)),
    );
  }, [enabledProducts, query]);

  const mobileProductsTotalPages = Math.max(1, Math.ceil(filteredProducts.length / MOBILE_PRODUCTS_PER_PAGE));
  const desktopProductsTotalPages = Math.max(1, Math.ceil(filteredProducts.length / DESKTOP_PRODUCTS_PER_PAGE));
  const desktopVisibleProducts = useMemo(
    () => filteredProducts.slice((desktopProductsPage - 1) * DESKTOP_PRODUCTS_PER_PAGE, desktopProductsPage * DESKTOP_PRODUCTS_PER_PAGE),
    [filteredProducts, desktopProductsPage],
  );

  useEffect(() => {
    if (mobileProductsPage > mobileProductsTotalPages) setMobileProductsPage(mobileProductsTotalPages);
    if (desktopProductsPage > desktopProductsTotalPages) setDesktopProductsPage(desktopProductsTotalPages);
  }, [desktopProductsPage, desktopProductsTotalPages, mobileProductsPage, mobileProductsTotalPages]);

  useEffect(() => {
    scrollToSectionStart(mobileProductsRef.current);
  }, [mobileProductsPage]);

  useEffect(() => {
    scrollToSectionStart(desktopProductsRef.current);
  }, [desktopProductsPage]);

  useEffect(() => {
    setMobileProductsPage(1);
    setDesktopProductsPage(1);
  }, [query, showForm]);

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
    { label: "Todos", value: "ALL" },
    { label: "Pendientes", value: "PENDIENTE" },
    { label: "Realizados", value: "REALIZADO" },
  ];

  const renderPager = (page: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-[10px] font-bold text-slate-400">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 space-y-6 px-0 pb-12 pt-20 sm:px-0 lg:px-0 lg:pt-24">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-xl sm:text-2xl font-extrabold text-slate-900 lg:text-3xl">Admin Pedidos</h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">Gestioná los pedidos de tus clientes y estados de envío.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
          >
            <span translate="no" className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cerrar Formulario' : 'Nuevo Pedido'}
          </button>
        </div>
      </div>

      {/* ── SUMMARY METRICS CARDS ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 rounded-2xl bg-white p-3 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-9 sm:size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <span translate="no" className="material-symbols-outlined text-lg sm:text-2xl">shopping_bag</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">Total</span>
            <p className="font-headline text-lg sm:text-2xl font-extrabold text-slate-900 leading-none mt-0.5">{orders.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 rounded-2xl bg-white p-3 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-9 sm:size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <span translate="no" className="material-symbols-outlined text-lg sm:text-2xl">pending_actions</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">Pendientes</span>
            <p className="font-headline text-lg sm:text-2xl font-extrabold text-amber-600 leading-none mt-0.5">{pendingOrdersCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 rounded-2xl bg-white p-3 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-9 sm:size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <span translate="no" className="material-symbols-outlined text-lg sm:text-2xl">check_circle</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">Realizados</span>
            <p className="font-headline text-lg sm:text-2xl font-extrabold text-emerald-600 leading-none mt-0.5">{completedOrdersCount}</p>
          </div>
        </div>
      </div>

      {/* ── NEW ORDER FORM ── */}
      {showForm && (
        <form className="space-y-4 sm:space-y-6 rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm" onSubmit={(e) => { onAddOrder(e); setShowForm(false); }}>
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-headline text-base sm:text-lg font-bold text-slate-900">Crear Nuevo Pedido</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <span translate="no" className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Cliente</label>
              <select required className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm" value={orderForm.clientId} onChange={(e) => onOrderFormChange({ ...orderForm, clientId: e.target.value })}>
                <option value="">Seleccionar Cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Fecha</label>
              <input required type="date" className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm" value={orderForm.date} onChange={(e) => onOrderFormChange({ ...orderForm, date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Estado</label>
              <select required className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm" value={orderForm.status} onChange={(e) => onOrderFormChange({ ...orderForm, status: e.target.value as OrderStatus })}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="REALIZADO">Realizado</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Seleccionar Productos</label>
              <div className="relative w-full sm:w-64">
                <span translate="no" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs outline-none focus:border-primary" 
                  placeholder="Buscar producto..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div ref={desktopProductsRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 max-h-60 overflow-y-auto p-2 sm:p-3 border border-slate-200/60 rounded-xl bg-slate-50/50">
              {desktopVisibleProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-white p-2 sm:p-2.5 text-center shadow-2xs transition-all hover:border-primary/50"
                >
                  <div className="size-10 sm:size-14 mb-1.5 sm:mb-2 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {product.image ? (
                      <ProductImage product={product} alt={getProductDisplayName(product)} className="h-full w-full object-cover" />
                    ) : (
                      <span translate="no" className="material-symbols-outlined text-slate-300 text-base sm:text-lg">image</span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate w-full">{getProductDisplayName(product)}</span>
                  <div className="flex justify-between w-full mt-1 items-center">
                    <span className="text-[10px] sm:text-xs font-bold text-primary">${product.salePrice.toLocaleString("es-AR")}</span>
                    <span className={`text-[8px] sm:text-[9px] font-bold px-1 rounded ${product.stock > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} stk` : "Sin stock"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddProductToOrder(product.id)}
                    className="mt-1.5 sm:mt-2.5 w-full rounded-lg bg-primary py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white hover:bg-primary/90"
                  >
                    + Agregar
                  </button>
                </div>
              ))}
            </div>
            {renderPager(desktopProductsPage, desktopProductsTotalPages, setDesktopProductsPage)}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between">
              <span>Productos Seleccionados</span>
              <span className="text-primary font-bold">{selectedRows.length} ítem{selectedRows.length === 1 ? "" : "s"}</span>
            </h4>
            
            {selectedRows.length === 0 ? (
              <div className="text-center p-4 sm:p-6 border border-dashed border-slate-200 rounded-xl text-xs font-semibold text-slate-400">
                Seleccioná productos de la lista superior para agregarlos al pedido.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedRows.map((row) => (
                  <div key={`row-${row.index}`} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <div className="size-9 sm:size-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {row.product.image ? (
                        <ProductImage product={row.product} alt={getProductDisplayName(row.product)} className="h-full w-full object-cover" />
                      ) : (
                        <span translate="no" className="material-symbols-outlined text-slate-300">image</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">{getProductDisplayName(row.product)}</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500">${row.product.salePrice.toLocaleString("es-AR")} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <input
                        type="number"
                        min={1}
                        value={row.item.quantity}
                        onChange={(e) => onUpdateOrderItemRow(row.index, "quantity", e.target.value)}
                        className="w-12 sm:w-16 rounded-lg border border-slate-200 bg-white px-1.5 sm:px-2 py-1 text-center font-bold text-xs outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => onRemoveOrderItemRow(row.index)}
                        className="p-1 sm:p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <span translate="no" className="material-symbols-outlined text-base sm:text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 sm:px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
            <button 
              type="submit" 
              disabled={selectedRows.length === 0}
              className="rounded-xl bg-slate-900 px-5 sm:px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-slate-800 disabled:opacity-50"
            >
              Guardar Pedido
            </button>
          </div>
        </form>
      )}

      {/* ── ORDERS LIST & SEARCH ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-headline text-base sm:text-lg font-bold text-slate-900">Listado de Pedidos</h2>
            <p className="text-xs text-slate-400">Filtrá y gestioná las compras registradas.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:w-60">
              <span translate="no" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-primary shadow-2xs"
                placeholder="Buscar pedido..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-lg px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold transition-all ${
                    statusFilter === tab.value ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── MOBILE CARD VIEW ── */}
        <div className="md:hidden space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold text-xs">No se encontraron pedidos registrados.</div>
          ) : (
            filteredOrders.map((order) => {
              const clientName = order.clientId ? getClientName(order.clientId) : order.guestName || "Invitado";
              const needsRestock = order.status === "PENDIENTE" && hasInsufficientStock(order.items);
              const isExpanded = expandedOrderIds.includes(order.id);
              const itemsDetail = isExpanded ? getOrderItemsDetail(order) : [];
              const total = getOrderTotal(order);
              const profit = getOrderProfit(order);

              return (
                <div key={order.id} className="rounded-xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">#{String(order.id).padStart(5, '0')}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          order.status === "REALIZADO" 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          <span className={`size-1.5 rounded-full ${order.status === "REALIZADO" ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {order.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(order.date).toLocaleDateString("es-AR", { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] uppercase shrink-0">
                        {clientName.substring(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-slate-900 truncate">{clientName}</span>
                    </div>

                    {needsRestock && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <span translate="no" className="material-symbols-outlined text-[12px]">inventory</span>
                        Stock bajo
                      </span>
                    )}

                    {/* Totals Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Total</span>
                        <span className="font-mono text-sm font-bold text-slate-900">${total.toLocaleString("es-AR")}</span>
                      </div>
                      {order.status === "REALIZADO" && (
                        <div className="text-right">
                          <span className="text-[9px] font-bold uppercase text-slate-400 block">Ganancia</span>
                          <span className={`font-mono text-sm font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            ${Math.round(profit).toLocaleString("es-AR")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center border-t border-slate-200/60 divide-x divide-slate-200/60">
                    <button
                      type="button"
                      onClick={() => toggleOrderExpanded(order.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold transition-colors ${
                        isExpanded ? 'text-primary bg-primary/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span translate="no" className="material-symbols-outlined text-[14px]">{isExpanded ? 'expand_less' : 'receipt_long'}</span>
                      {isExpanded ? "Ocultar" : "Detalle"}
                    </button>

                    {order.status === "PENDIENTE" ? (
                      <button 
                        type="button" 
                        onClick={() => onMarkOrderAsRealized(order.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <span translate="no" className="material-symbols-outlined text-[14px]">check_circle</span>
                        Envío
                      </button>
                    ) : (
                      <span className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold text-slate-400">
                        <span translate="no" className="material-symbols-outlined text-[14px]">done_all</span>
                        Listo
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteOrder(order.id)}
                      className="px-4 py-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar pedido"
                    >
                      <span translate="no" className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-200/60 bg-white p-3 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Productos</div>
                      {itemsDetail.map((item, itemIndex) => (
                        <button
                          key={`${order.id}-mobile-item-${itemIndex}`}
                          type="button"
                          onClick={() => onOpenProductDetail(item.productId)}
                          className="flex items-center gap-2.5 w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-left hover:border-primary/40"
                        >
                          <div className="size-8 rounded-md bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                            ) : (
                              <span translate="no" className="material-symbols-outlined text-slate-300 text-sm">image</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[11px] text-slate-900 truncate">{item.productName}</p>
                            <p className="text-[10px] text-slate-500">{item.quantity} x ${item.unitSalePrice.toLocaleString("es-AR")}</p>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-emerald-600">${item.subtotal.toLocaleString("es-AR")}</span>
                        </button>
                      ))}
                      {order.status === "REALIZADO" && (
                        <div className="pt-2 mt-1 border-t border-slate-100 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Venta total</span>
                            <span className="font-bold text-slate-700">${total.toLocaleString("es-AR")}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Costo reposición</span>
                            <span className="font-bold text-red-500">-${getOrderCost(order).toLocaleString("es-AR")}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Packaging</span>
                            <span className="font-bold text-red-500">-${Math.round(packagingCostPerOrder).toLocaleString("es-AR")}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="font-bold text-slate-700">Ganancia neta</span>
                            <span className={`font-mono font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>${Math.round(profit).toLocaleString("es-AR")}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── DESKTOP TABLE VIEW ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">ID Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Ganancia</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map((order) => {
                const clientName = order.clientId ? getClientName(order.clientId) : order.guestName || "Invitado";
                const needsRestock = order.status === "PENDIENTE" && hasInsufficientStock(order.items);
                const isExpanded = expandedOrderIds.includes(order.id);
                const itemsDetail = isExpanded ? getOrderItemsDetail(order) : [];
                const profit = getOrderProfit(order);
                return (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 font-mono">
                        #{String(order.id).padStart(5, '0')}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {clientName.substring(0, 2)}
                          </div>
                          <span className="font-bold text-slate-900">{clientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        {new Date(order.date).toLocaleDateString("es-AR", { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === "REALIZADO" 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            <span className={`size-1.5 rounded-full ${order.status === "REALIZADO" ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {order.status}
                          </span>
                          {needsRestock && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <span translate="no" className="material-symbols-outlined text-[12px]">inventory</span>
                              Stock bajo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        ${getOrderTotal(order).toLocaleString("es-AR")}
                      </td>
                      <td className="px-4 py-3.5">
                        {order.status === "REALIZADO" ? (
                          <span className={`font-mono font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            ${Math.round(profit).toLocaleString("es-AR")}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[10px] font-bold">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleOrderExpanded(order.id)}
                            className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                              isExpanded ? 'text-primary bg-primary/10' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                            }`}
                          >
                            <span translate="no" className="material-symbols-outlined text-[16px]">{isExpanded ? 'expand_less' : 'receipt_long'}</span>
                            {isExpanded ? "Ocultar" : "Detalle"}
                          </button>

                          {order.status === "PENDIENTE" ? (
                            <button 
                              type="button" 
                              onClick={() => onMarkOrderAsRealized(order.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-100 transition-colors"
                            >
                              <span translate="no" className="material-symbols-outlined text-[16px]">check_circle</span>
                              Marcar Envío
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                              <span translate="no" className="material-symbols-outlined text-[16px]">done_all</span>
                              Completado
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteOrder(order.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Eliminar pedido"
                          >
                            <span translate="no" className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expanded Detail */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <div className="border-t border-slate-100 bg-slate-50/70 p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                              <span>Detalle de productos en pedido #{String(order.id).padStart(5, "0")}</span>
                              <span>Total: ${getOrderTotal(order).toLocaleString("es-AR")}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {itemsDetail.map((item, itemIndex) => (
                                <button
                                  key={`${order.id}-inline-item-${itemIndex}`}
                                  type="button"
                                  onClick={() => onOpenProductDetail(item.productId)}
                                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-2xs hover:border-primary/40"
                                >
                                  <div className="size-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                    {item.productImage ? (
                                      <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                                    ) : (
                                      <span translate="no" className="material-symbols-outlined text-slate-300">image</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs text-slate-900 truncate">{item.productName}</p>
                                    <p className="text-[11px] text-slate-500">{item.quantity} x ${item.unitSalePrice.toLocaleString("es-AR")}</p>
                                  </div>
                                  <span className="font-mono text-xs font-bold text-emerald-600">${item.subtotal.toLocaleString("es-AR")}</span>
                                </button>
                              ))}
                            </div>
                            {order.status === "REALIZADO" && (
                              <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-100 px-3 py-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Costo repos.</span>
                                  <span className="font-mono text-xs font-bold text-red-500">-${getOrderCost(order).toLocaleString("es-AR")}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-100 px-3 py-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Packaging</span>
                                  <span className="font-mono text-xs font-bold text-red-500">-${Math.round(packagingCostPerOrder).toLocaleString("es-AR")}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Ganancia neta</span>
                                  <span className={`font-mono text-xs font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>${Math.round(profit).toLocaleString("es-AR")}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">No se encontraron pedidos registrados.</td>
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
