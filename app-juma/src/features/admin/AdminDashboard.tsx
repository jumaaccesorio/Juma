import { useMemo } from "react";
import type { Client, Order, Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";
import ProductImage from "../../components/ProductImage";

type AdminDashboardProps = {
  orders: Order[];
  products: Product[];
  clients: Client[];
  lowStockProducts: Product[];
  onSetActiveTab: (tab: any) => void;
};

export default function AdminDashboard({ orders, clients, lowStockProducts, onSetActiveTab }: AdminDashboardProps) {
  const stats = useMemo(() => {
    const completedOrders = orders.filter((order) => order.status === "REALIZADO");
    const totalSales = completedOrders.reduce(
      (acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity * item.unitSalePrice, 0),
      0,
    );
    const pendingOrders = orders.filter((order) => order.status === "PENDIENTE").length;
    const stockAlerts = lowStockProducts.length;
    const totalClients = clients.length;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const previousYear = previousMonthDate.getFullYear();
    const previousMonth = previousMonthDate.getMonth();

    const currentMonthSales = completedOrders
      .filter((order) => {
        const date = new Date(order.date);
        return !Number.isNaN(date.getTime()) && date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      })
      .reduce((acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity * item.unitSalePrice, 0), 0);

    const previousMonthSales = completedOrders
      .filter((order) => {
        const date = new Date(order.date);
        return !Number.isNaN(date.getTime()) && date.getFullYear() === previousYear && date.getMonth() === previousMonth;
      })
      .reduce((acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity * item.unitSalePrice, 0), 0);

    const growthValue = previousMonthSales > 0 ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100 : 0;
    const growthLabel = `${growthValue >= 0 ? "+" : ""}${growthValue.toFixed(1)}%`;

    return { totalSales, pendingOrders, stockAlerts, totalClients, completedCount: completedOrders.length, growthLabel, currentMonthSales, previousMonthSales };
  }, [orders, lowStockProducts, clients]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const getClientName = (order: Order) => {
    if (order.clientId) {
      const client = clients.find((row) => row.id === order.clientId);
      return client?.name ?? "Cliente Desconocido";
    }
    return order.guestName ?? "Invitado";
  };

  const getOrderTotal = (order: Order) => order.items.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0);

  const chartData = useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const values = [32, 45, 40, 68, 58, 86, 64];
    const max = Math.max(...values);
    return days.map((day, i) => ({ day, value: values[i], pct: (values[i] / max) * 100 }));
  }, []);

  const statCards = [
    {
      label: "Total Ventas",
      value: `$${stats.totalSales.toLocaleString("es-AR")}`,
      icon: "trending_up",
      iconBg: "bg-emerald-50 text-emerald-600",
      sub: `${stats.growthLabel} vs mes anterior`,
      subColor: stats.growthLabel.startsWith("-") ? "text-warning" : "text-emerald-600",
    },
    {
      label: "Pedidos Pendientes",
      value: stats.pendingOrders.toString(),
      icon: "schedule",
      iconBg: "bg-amber-50 text-amber-600",
      sub: "Requieren atención",
      subColor: "text-amber-600",
    },
    {
      label: "Alertas de Stock",
      value: stats.stockAlerts.toString().padStart(2, "0"),
      icon: "warning",
      iconBg: "bg-red-50 text-red-500",
      sub: stats.stockAlerts === 0 ? "Todo en orden" : "Bajo stock mínimo",
      subColor: stats.stockAlerts === 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      label: "Clientes Activos",
      value: stats.totalClients.toString(),
      icon: "group",
      iconBg: "bg-blue-50 text-blue-600",
      sub: "Usuarios registrados",
      subColor: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-8 overflow-x-hidden px-4 pb-10 pt-20 sm:px-6 lg:px-10 lg:pb-16 lg:pt-24">
      {/* ── MOBILE LAYOUT ── */}
      <div className="space-y-6 md:hidden">
        <section>
          <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">Resumen</span>
          <h2 className="font-headline text-3xl italic text-primary leading-tight">Bienvenido, Admin</h2>
        </section>

        {/* Mobile quick actions */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSetActiveTab("venta_rapida")}
            className="flex aspect-square flex-col items-start justify-between rounded-xl bg-white p-5 text-left shadow-sm border border-line/40"
          >
            <span className="material-symbols-outlined text-primary">bolt</span>
            <div>
              <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">Rápido</span>
              <span className="font-body font-semibold text-primary">Venta Rápida</span>
            </div>
          </button>
          <button
            onClick={() => onSetActiveTab("productos")}
            className="flex aspect-square flex-col items-start justify-between rounded-xl bg-gradient-to-br from-primary to-accent p-5 text-left shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined text-white">add_circle</span>
            <div>
              <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/70">Catálogo</span>
              <span className="font-body font-semibold text-white">Nuevo Producto</span>
            </div>
          </button>
        </section>

        {/* Mobile stat cards */}
        <section className="grid grid-cols-2 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className="stat-card">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[9px] font-bold tracking-widest uppercase text-muted/70">{card.label}</p>
                <div className={`size-7 rounded-lg ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <span className="material-symbols-outlined text-[14px]">{card.icon}</span>
                </div>
              </div>
              <p className="font-headline text-xl text-ink leading-none">{card.value}</p>
              <p className={`mt-1.5 text-[9px] font-semibold ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </section>

        {/* Mobile chart */}
        <section className="rounded-xl bg-white p-5 shadow-sm border border-line/40">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-headline text-xl text-ink">Rendimiento</h3>
              <p className="text-xs text-muted">{stats.growthLabel} vs mes anterior</p>
            </div>
            <span className="font-headline text-2xl text-primary">${stats.currentMonthSales.toLocaleString("es-AR")}</span>
          </div>
          <div className="flex h-28 items-end justify-between gap-2">
            {chartData.map((item) => (
              <div
                key={item.day}
                className="w-full rounded-t-md"
                style={{
                  height: `${item.pct}%`,
                  background: item.pct > 70
                    ? "linear-gradient(180deg, #C5A37F, #D4A574)"
                    : "rgba(197,163,127,0.25)",
                }}
              />
            ))}
          </div>
        </section>

        {/* Mobile recent orders */}
        <section className="rounded-xl bg-white p-5 shadow-sm border border-line/40">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-xl text-ink">Pedidos recientes</h3>
            <button onClick={() => onSetActiveTab("pedidos")} className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Ver todo
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No hay pedidos recientes.</p>
            ) : (
              recentOrders.slice(0, 3).map((order) => (
                <div key={`dash-mobile-${order.id}`} className="flex items-center gap-3 rounded-xl bg-secondary/30 p-3.5" onClick={() => onSetActiveTab("pedidos")}>
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-primary/10 flex-shrink-0">
                    <span className="font-body text-xs font-bold uppercase text-primary">
                      {getClientName(order).slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{getClientName(order)}</p>
                    <p className="text-[10px] text-muted">#{order.id.toString().padStart(5, "0")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-headline text-lg text-primary">${getOrderTotal(order).toLocaleString("es-AR")}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${
                      order.status === "REALIZADO" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {order.status === "REALIZADO" ? "Completado" : "Pendiente"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden space-y-8 md:block">
        {/* Header */}
        <section className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-headline text-2xl text-ink lg:text-3xl">Bienvenido de nuevo, Admin</h2>
            <p className="font-body text-sm text-muted mt-1">Aquí tienes un resumen de tu atelier hoy.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onSetActiveTab("venta_rapida")}
              className="px-4 py-2 bg-white border border-line text-ink font-semibold text-xs tracking-wide uppercase rounded-lg hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[14px] mr-1 align-middle">bolt</span>
              Venta Rápida
            </button>
            <button
              onClick={() => onSetActiveTab("productos")}
              className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white font-semibold text-xs tracking-wide uppercase rounded-lg shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              <span className="material-symbols-outlined text-[14px] mr-1 align-middle">add</span>
              Nuevo Producto
            </button>
          </div>
        </section>

        {/* Stat Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] lg:text-[11px] font-bold tracking-widest uppercase text-muted/70">{card.label}</p>
                <div className={`size-8 rounded-lg ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <span className="material-symbols-outlined text-[16px]">{card.icon}</span>
                </div>
              </div>
              <p className="font-headline text-2xl lg:text-3xl text-ink leading-none">{card.value}</p>
              <p className={`mt-2 text-[10px] lg:text-xs font-semibold ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </section>

        {/* Chart + Stock Critical */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Chart */}
          <div className="col-span-12 lg:col-span-8 bg-white p-5 lg:p-6 rounded-xl border border-line/60 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-headline text-lg text-ink">Rendimiento de Ventas</h3>
                <p className="text-xs text-muted mt-0.5">Últimos 7 días de actividad</p>
              </div>
              <select className="bg-secondary/60 border-none text-[10px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-primary/30 text-primary cursor-pointer rounded-lg px-3 py-1.5">
                <option>Semanal</option>
                <option>Mensual</option>
              </select>
            </div>
            <div className="h-48 lg:h-56 flex items-end justify-between gap-2 lg:gap-4 px-2">
              {chartData.map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="w-full rounded-lg transition-all duration-500 cursor-pointer group relative hover:opacity-80"
                    style={{
                      height: `${item.pct}%`,
                      background: item.pct > 70
                        ? "linear-gradient(180deg, #C5A37F, #D4A574)"
                        : "linear-gradient(180deg, rgba(197,163,127,0.3), rgba(197,163,127,0.15))",
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-sidebar text-white text-[10px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                      {item.value}%
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-tight font-bold ${item.pct > 70 ? "text-primary" : "text-muted/60"}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Critical */}
          <div className="col-span-12 lg:col-span-4 bg-white p-5 lg:p-6 rounded-xl border border-line/60 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line/40">
              <h3 className="font-headline text-lg text-ink">Stock Crítico</h3>
              <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2.5 py-1 rounded-full">{lowStockProducts.length} items</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px] admin-scrollbar pr-1">
              {lowStockProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted/50">
                  <span className="material-symbols-outlined text-3xl mb-2">check_circle</span>
                  <p className="text-xs font-medium">Todo el inventario está al día</p>
                </div>
              ) : (
                lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                    onClick={() => onSetActiveTab("inventario")}
                  >
                    <div className="size-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <ProductImage product={product} alt={getProductDisplayName(product)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted/40">
                          <span className="material-symbols-outlined text-[16px]">image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors truncate">{getProductDisplayName(product)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-line/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${product.stock === 0 ? "bg-red-400" : "bg-amber-400"}`}
                            style={{ width: `${Math.min(100, (product.stock / Math.max(product.initialStock, 1)) * 100)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${product.stock === 0 ? "text-red-500" : "text-amber-600"}`}>
                          {product.stock === 0 ? "Agotado" : product.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => onSetActiveTab("inventario")}
              className="w-full mt-4 py-2.5 bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all rounded-lg"
            >
              Ver Inventario
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xl text-ink">Pedidos Recientes</h3>
            <button onClick={() => onSetActiveTab("pedidos")} className="text-xs font-bold text-primary hover:underline underline-offset-4">
              Ver todos →
            </button>
          </div>
          <div className="bg-white rounded-xl border border-line/60 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/40 border-b border-line/40">
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70">ID Pedido</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70">Cliente</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70">Estado</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70 text-right">Total</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/30">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted/60">No hay pedidos recientes.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-4 text-sm text-ink/70 font-mono font-medium">#ORD-{order.id.toString().padStart(5, "0")}</td>
                      <td className="px-5 py-4 text-sm text-ink font-semibold">{getClientName(order)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          order.status === "REALIZADO"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${order.status === "REALIZADO" ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-headline text-lg text-primary">${getOrderTotal(order).toLocaleString("es-AR")}</td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => onSetActiveTab("pedidos")} className="size-8 rounded-lg text-muted/50 hover:text-primary hover:bg-primary/10 transition-colors inline-flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
