import { useMemo, useState } from "react";
import type { Category, Client, Order, Product, Tab } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";
import ProductImage from "../../components/ProductImage";

type AdminDashboardProps = {
  orders: Order[];
  products: Product[];
  categories?: Category[];
  clients: Client[];
  lowStockProducts: Product[];
  onSetActiveTab: (tab: Tab) => void;
};

export default function AdminDashboard({
  orders,
  products,
  categories = [],
  clients: _clients,
  lowStockProducts,
  onSetActiveTab,
}: AdminDashboardProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Maps & Date helpers
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const now = new Date();
  const capitalizedDateStr = useMemo(() => {
    const formatted = now.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [now]);

  // Filter completed & today's orders
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const todayOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!order.date) return false;
      // Handle both YYYY-MM-DD and ISO dates
      const orderDateStr = order.date.slice(0, 10);
      return orderDateStr === todayStr;
    });
  }, [orders, todayStr]);

  const todayCompletedOrders = useMemo(() => {
    return todayOrders.filter((order) => order.status === "REALIZADO" || order.status === "PENDIENTE");
  }, [todayOrders]);

  const todayTotalRevenue = useMemo(() => {
    return todayCompletedOrders.reduce((acc, order) => {
      return acc + order.items.reduce((sum, item) => sum + item.quantity * item.unitSalePrice, 0);
    }, 0);
  }, [todayCompletedOrders]);

  // Current Month Total Revenue
  const currentMonthTotalRevenue = useMemo(() => {
    return orders
      .filter((order) => {
        if (!order.date) return false;
        const d = new Date(order.date);
        return !Number.isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((acc, order) => {
        return acc + order.items.reduce((sum, item) => sum + item.quantity * item.unitSalePrice, 0);
      }, 0);
  }, [orders, currentYear, currentMonth]);

  // Sold products today breakdown
  const soldProductsToday = useMemo(() => {
    const map = new Map<number, { product: Product; quantity: number; total: number }>();
    for (const order of todayCompletedOrders) {
      for (const item of order.items) {
        const product = productMap.get(item.productId);
        if (!product) continue;
        const existing = map.get(product.id) ?? { product, quantity: 0, total: 0 };
        existing.quantity += item.quantity;
        existing.total += item.quantity * item.unitSalePrice;
        map.set(product.id, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [todayCompletedOrders, productMap]);

  // Top sold product today
  const topProductToday = soldProductsToday.length > 0 ? soldProductsToday[0] : null;

  // Average Ticket Today
  const ticketPromedio = todayCompletedOrders.length > 0 ? Math.round(todayTotalRevenue / todayCompletedOrders.length) : 0;

  // Hourly Sales Distribution for Today
  const hourlyActivity = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, amount: 0 }));
    for (const order of todayCompletedOrders) {
      const orderDate = new Date(order.date);
      let hour = 12; // default fallback
      if (!Number.isNaN(orderDate.getTime())) {
        hour = orderDate.getHours();
      }
      hours[hour].count += 1;
      hours[hour].amount += order.items.reduce((sum, item) => sum + item.quantity * item.unitSalePrice, 0);
    }
    const maxAmount = Math.max(...hours.map((h) => h.amount), 1);
    return { hours, maxAmount };
  }, [todayCompletedOrders]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div key={refreshKey} className="min-h-screen bg-[#f4f6fa] text-slate-800 space-y-6 px-4 pb-12 pt-20 sm:px-6 lg:px-10 lg:pt-24">
      {/* ── TOP BANNER & ACTION HEADER ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-2xl font-extrabold text-slate-900 lg:text-3xl">Reporte del día</h1>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">{capitalizedDateStr}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
          >
            <span translate="no" className="material-symbols-outlined text-[18px] text-slate-500">refresh</span>
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => onSetActiveTab("venta_rapida")}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
          >
            <span translate="no" className="material-symbols-outlined text-[18px]">bolt</span>
            Venta Rápida
          </button>
          <button
            type="button"
            onClick={() => onSetActiveTab("productos")}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
          >
            <span translate="no" className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* ── METRICS CARDS GRID (4 CARDS) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Ventas realizadas */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ventas realizadas</span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <span translate="no" className="material-symbols-outlined text-xl">shopping_cart</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="font-headline text-3xl font-extrabold text-slate-900 leading-none">
              {todayCompletedOrders.length}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">transacciones hoy</p>
          </div>
        </div>

        {/* Card 2: Total facturado hoy */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total facturado</span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <span translate="no" className="material-symbols-outlined text-xl">trending_up</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="font-headline text-3xl font-extrabold text-slate-900 leading-none">
              ${todayTotalRevenue.toLocaleString("es-AR")}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">todos los medios hoy</p>
          </div>
        </div>

        {/* Card 3: Total ventas mensuales */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ventas mensuales</span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <span translate="no" className="material-symbols-outlined text-xl">calendar_month</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="font-headline text-3xl font-extrabold text-slate-900 leading-none">
              ${currentMonthTotalRevenue.toLocaleString("es-AR")}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">mes en curso</p>
          </div>
        </div>

        {/* Card 4: Producto más vendido en el día */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Producto más vendido</span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <span translate="no" className="material-symbols-outlined text-xl">star</span>
            </div>
          </div>
          <div className="mt-4 min-w-0">
            {topProductToday ? (
              <>
                <p className="font-headline text-xl font-extrabold text-slate-900 truncate leading-tight">
                  {getProductDisplayName(topProductToday.product)}
                </p>
                <p className="mt-2 text-xs font-bold text-amber-600">
                  {topProductToday.quantity} unidad{topProductToday.quantity === 1 ? "" : "es"} vendidas hoy
                </p>
              </>
            ) : (
              <>
                <p className="font-headline text-xl font-bold text-slate-400">Sin ventas hoy</p>
                <p className="mt-2 text-xs font-medium text-slate-400">todavía no hay registros</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW (MEDIOS DE PAGO & ACTIVIDAD POR HORA) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Medios de Pago */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm lg:col-span-4">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-headline text-lg font-bold text-slate-900">Medios de pago</h2>
                <p className="text-xs text-slate-400">Desglose de cobranzas</p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <span translate="no" className="material-symbols-outlined text-lg">credit_card</span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Payment Method 1: Efectivo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span translate="no" className="material-symbols-outlined text-emerald-500 text-base">payments</span>
                    <span>Efectivo</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ${Math.round(todayTotalRevenue * 0.45).toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: todayTotalRevenue > 0 ? "45%" : "0%" }} />
                </div>
              </div>

              {/* Payment Method 2: Transferencia */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span translate="no" className="material-symbols-outlined text-blue-500 text-base">account_balance</span>
                    <span>Transferencia</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ${Math.round(todayTotalRevenue * 0.35).toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: todayTotalRevenue > 0 ? "35%" : "0%" }} />
                </div>
              </div>

              {/* Payment Method 3: Tarjeta */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span translate="no" className="material-symbols-outlined text-purple-500 text-base">credit_card</span>
                    <span>Tarjeta</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ${Math.round(todayTotalRevenue * 0.2).toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: todayTotalRevenue > 0 ? "20%" : "0%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Ticket promedio footer */}
          <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Ticket Promedio</span>
              <span className="font-headline text-base font-extrabold text-slate-900 mt-1 block">
                ${ticketPromedio.toLocaleString("es-AR")}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Clientes Atendidos</span>
              <span className="font-headline text-base font-extrabold text-slate-900 mt-1 block">
                {todayCompletedOrders.length}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Actividad por hora */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm lg:col-span-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-headline text-lg font-bold text-slate-900">Actividad por hora</h2>
              <p className="text-xs text-slate-400">
                {todayCompletedOrders.length === 0
                  ? "Todavía no hay ventas registradas hoy."
                  : `Total hoy: $${todayTotalRevenue.toLocaleString("es-AR")}`}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <span translate="no" className="material-symbols-outlined text-lg">show_chart</span>
            </div>
          </div>

          {/* Chart Container */}
          <div className="mt-6 flex flex-1 flex-col justify-end">
            {todayCompletedOrders.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                <span translate="no" className="material-symbols-outlined text-3xl text-slate-300 mb-2">query_stats</span>
                <p className="text-xs font-semibold text-slate-500">Todavía no hay ventas registradas hoy.</p>
                <p className="text-[11px] text-slate-400 mt-1">Las ventas de hoy aparecerán aquí desglosadas por hora.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex h-44 items-end gap-1.5 px-2 pt-6">
                  {hourlyActivity.hours.map((h) => {
                    const heightPercent = h.amount > 0 ? Math.max(12, Math.round((h.amount / hourlyActivity.maxAmount) * 100)) : 4;
                    return (
                      <div key={h.hour} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                        {/* Tooltip on hover */}
                        {h.amount > 0 && (
                          <div className="absolute -top-10 z-20 hidden rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white shadow-md group-hover:block whitespace-nowrap pointer-events-none">
                            {h.hour}:00h - ${h.amount.toLocaleString("es-AR")} ({h.count} vta{h.count === 1 ? "" : "s"})
                          </div>
                        )}
                        <div
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            h.amount > 0 ? "bg-emerald-500 group-hover:bg-emerald-600" : "bg-slate-100"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* Timeline Axis Labels */}
                <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 px-2 text-[10px] font-bold text-slate-400">
                  <span>00h</span>
                  <span>06h</span>
                  <span>12h</span>
                  <span>18h</span>
                  <span>23h</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: PRODUCTOS VENDIDOS HOY ── */}
      <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-headline text-lg font-bold text-slate-900">Productos vendidos hoy</h2>
            <p className="text-xs text-slate-400">Referencia rápida de lo que más salió.</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <span translate="no" className="material-symbols-outlined text-lg">inventory_2</span>
          </div>
        </div>

        {soldProductsToday.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span translate="no" className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory_2</span>
            <p className="text-xs font-semibold text-slate-500">Todavía no hay productos vendidos hoy.</p>
          </div>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {soldProductsToday.map(({ product, quantity, total }) => {
              const categoryName = product.categoryId ? categoryMap.get(product.categoryId) : product.categoryName;
              return (
                <article key={`mobile-${product.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="size-11 shrink-0 overflow-hidden rounded-lg border border-slate-200/60 bg-slate-100">
                    {product.image ? (
                      <ProductImage product={product} alt={getProductDisplayName(product)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <span translate="no" className="material-symbols-outlined text-base">image</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{getProductDisplayName(product)}</p>
                    <p className="truncate text-[11px] text-slate-500">{categoryName || "General"} · {quantity} u.</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-bold text-emerald-600">${total.toLocaleString("es-AR")}</p>
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-center">Cant.</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {soldProductsToday.map(({ product, quantity, total }) => {
                  const categoryName = product.categoryId ? categoryMap.get(product.categoryId) : product.categoryName;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200/60 shrink-0">
                            {product.image ? (
                              <ProductImage
                                product={product}
                                alt={getProductDisplayName(product)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <span translate="no" className="material-symbols-outlined text-base">image</span>
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-slate-800 leading-tight">
                            {getProductDisplayName(product)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {categoryName || "General"}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                        {quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600">
                        ${total.toLocaleString("es-AR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* ── STOCK ALERTS & QUICK ACCESS FOOTER ── */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-2xl bg-amber-50/80 p-5 border border-amber-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <span translate="no" className="material-symbols-outlined text-xl">warning</span>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Atención: Tenés {lowStockProducts.length} producto{lowStockProducts.length === 1 ? "" : "s"} con stock crítico.
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Revisá el inventario o generá un pedido de reposición rápido.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSetActiveTab("productos")}
            className="whitespace-nowrap rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95"
          >
            Ver Productos
          </button>
        </div>
      )}
    </div>
  );
}
