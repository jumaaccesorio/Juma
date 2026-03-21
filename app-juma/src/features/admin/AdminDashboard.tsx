import { useMemo } from "react";
import type { Client, Order, Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";

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

    return { totalSales, pendingOrders, stockAlerts, growthLabel, currentMonthSales, previousMonthSales };
  }, [orders, lowStockProducts]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const getClientName = (order: Order) => {
    if (order.clientId) {
      const client = clients.find((row) => row.id === order.clientId);
      return client?.name ?? "Cliente Desconocido";
    }
    return order.guestName ?? "Invitado";
  };

  const getOrderTotal = (order: Order) => order.items.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0);

  return (
    <div className="space-y-8 px-4 pb-10 pt-20 sm:px-6 lg:px-10 lg:pb-16 lg:pt-24">
      <section className="flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-headline text-3xl text-ink sm:text-4xl">Bienvenido de nuevo, Admin</h2>
          <p className="font-body text-muted mt-2">Aqui tienes un resumen de tu atelier hoy.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => onSetActiveTab("venta_rapida")}
            className="bg-background px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink shadow-sm transition-colors hover:bg-secondary border border-line"
          >
            Venta Rapida
          </button>
          <button
            onClick={() => onSetActiveTab("productos")}
            className="px-6 py-2.5 bg-primary text-white font-bold text-xs tracking-widest uppercase shadow-md hover:opacity-90 transition-opacity"
          >
            Nuevo Producto
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-line rounded overflow-hidden shadow-sm">
        <div className="bg-background p-8">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">Total Ventas</p>
          <p className="font-headline text-3xl text-primary">${stats.totalSales.toLocaleString("es-AR")}</p>
          <div className={`mt-4 flex items-center gap-1 text-xs font-bold ${stats.growthLabel.startsWith("-") ? "text-warning" : "text-green-600"}`}>
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>{stats.growthLabel} vs mes anterior</span>
          </div>
        </div>
        <div className="bg-background p-8">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">Pedidos Pendientes</p>
          <p className="font-headline text-3xl text-ink">{stats.pendingOrders}</p>
          <div className="mt-4 flex items-center gap-1 text-xs text-primary font-bold">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>Requieren atencion</span>
          </div>
        </div>
        <div className="bg-background p-8">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">Alertas de Stock</p>
          <p className="font-headline text-3xl text-red-600">{stats.stockAlerts.toString().padStart(2, "0")}</p>
          <div className="mt-4 flex items-center gap-1 text-xs text-red-600 font-bold">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>Bajo stock minimo</span>
          </div>
        </div>
        <div className="bg-background p-8">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">Crecimiento Mensual</p>
          <p className="font-headline text-3xl text-ink">{stats.growthLabel}</p>
          <div className="mt-4 flex items-center gap-1 text-xs text-tertiary font-bold">
            <span className="material-symbols-outlined text-sm">insights</span>
            <span>
              {stats.previousMonthSales > 0
                ? `Mes actual $${stats.currentMonthSales.toLocaleString("es-AR")}`
                : "Sin base previa para comparar"}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        <div className="col-span-12 lg:col-span-8 bg-secondary/45 p-8 rounded-xl border border-line shadow-sm relative overflow-hidden">
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-headline text-xl text-ink">Rendimiento de Ventas</h3>
              <p className="text-xs text-muted font-body">Ultimos 7 dias de actividad</p>
            </div>
            <select className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest focus:ring-0 text-primary cursor-pointer">
              <option>Semanal</option>
              <option>Mensual</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((day, index) => (
              <div key={day} className="flex flex-col items-center gap-3 flex-1">
                <div
                  className={`w-full bg-primary/25 rounded-t transition-all cursor-pointer group relative hover:bg-primary ${index === 5 ? "bg-primary h-[85%] shadow-lg" : ""}`}
                  style={{ height: index === 5 ? "85%" : `${Math.floor(Math.random() * 50) + 20}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    $ {(Math.random() * 5000).toFixed(0)}
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-tighter font-bold ${index === 5 ? "text-primary" : "text-muted"}`}>{day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-background p-6 rounded-xl shadow-sm border border-line h-full">
            <div className="flex items-center justify-between mb-6 border-b border-line pb-4">
              <h3 className="font-headline text-lg text-ink">Stock Critico</h3>
              <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{lowStockProducts.length} Items</span>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-muted text-center py-8">Todo el inventario esta al dia.</p>
              ) : (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => onSetActiveTab("inventario")}>
                    <div className="size-12 rounded bg-secondary overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <img src={product.image} alt={getProductDisplayName(product)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-tertiary">
                          <span className="material-symbols-outlined">image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-headline text-ink group-hover:text-primary transition-colors uppercase">{getProductDisplayName(product)}</p>
                      <p className="text-[10px] text-muted uppercase tracking-widest mt-0.5">
                        {product.stock === 0 ? "Agotado" : `Quedan ${product.stock} unidades`}
                      </p>
                    </div>
                    <span className={`material-symbols-outlined text-lg ${product.stock === 0 ? "text-red-500" : "text-primary"}`}>
                      {product.stock === 0 ? "block" : "priority_high"}
                    </span>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => onSetActiveTab("inventario")}
              className="w-full mt-6 py-2 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all rounded"
            >
              Reponer Inventario
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="font-headline text-2xl text-ink">Pedidos Recientes</h3>
          <button onClick={() => onSetActiveTab("pedidos")} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
            Ver todos los pedidos
          </button>
        </div>
        <div className="space-y-3 md:hidden">
          {recentOrders.length === 0 ? (
            <div className="rounded-xl border border-line bg-background px-5 py-8 text-center text-sm text-muted shadow-sm">
              No hay pedidos recientes.
            </div>
          ) : (
            recentOrders.map((order) => (
              <div key={`mobile-${order.id}`} className="rounded-xl border border-line bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Pedido</p>
                    <p className="mt-1 font-['Inter'] text-sm font-bold text-ink">#ORD-{order.id.toString().padStart(5, "0")}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-tighter ${
                      order.status === "REALIZADO" ? "bg-green-50 text-green-700" : "bg-primary/15 text-primary"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted">Cliente</span>
                    <span className="font-bold uppercase text-ink">{getClientName(order)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted">Total</span>
                    <span className="font-headline text-xl text-primary">${getOrderTotal(order).toLocaleString("es-AR")}</span>
                  </div>
                </div>
                <button
                  onClick={() => onSetActiveTab("pedidos")}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-quaternary px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary"
                >
                  Ver pedido
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto rounded-xl border border-line bg-background shadow-sm md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/60">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">ID Pedido</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted text-right">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted">No hay pedidos recientes.</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/35 transition-colors">
                    <td className="px-6 py-5 font-['Inter'] text-sm text-ink/80 font-medium">#ORD-{order.id.toString().padStart(5, "0")}</td>
                    <td className="px-6 py-5 font-['Inter'] text-sm text-ink font-bold uppercase">{getClientName(order)}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                          order.status === "REALIZADO" ? "bg-green-50 text-green-700" : "bg-primary/15 text-primary"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-headline text-lg text-primary">${getOrderTotal(order).toLocaleString("es-AR")}</td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => onSetActiveTab("pedidos")} className="text-muted hover:text-ink transition-colors">
                        <span className="material-symbols-outlined text-lg">more_horiz</span>
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
  );
}
