import { useMemo } from "react";
import type { Order, Product, Client } from "../../types";

type AdminDashboardProps = {
  orders: Order[];
  products: Product[];
  clients: Client[];
  lowStockProducts: Product[];
  onSetActiveTab: (tab: any) => void;
};

export default function AdminDashboard({ orders, products, clients, lowStockProducts, onSetActiveTab }: AdminDashboardProps) {
  const stats = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === "REALIZADO");
    const totalSales = completedOrders.reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + i.quantity * i.unitSalePrice, 0), 0);
    const pendingOrders = orders.filter((o) => o.status === "PENDIENTE").length;
    const stockAlerts = lowStockProducts.length;
    
    // Simulate growth or handle based on month
    const growth = "12.5%"; 

    return { totalSales, pendingOrders, stockAlerts, growth };
  }, [orders, products, lowStockProducts]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const getClientName = (order: Order) => {
    if (order.clientId) {
      const client = clients.find(c => c.id === order.clientId);
      return client?.name ?? "Cliente Desconocido";
    }
    return order.guestName ?? "Invitado";
  };

  const getOrderTotal = (order: Order) => order.items.reduce((acc, i) => acc + i.quantity * i.unitSalePrice, 0);

  return (
    <div className="pt-24 px-10 pb-16 space-y-12">
      {/* Welcome Banner Section */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200/30 pb-8">
        <div>
          <h2 className="font-headline text-4xl text-on-surface">Bienvenido de nuevo, Admin</h2>
          <p className="font-body text-stone-500 mt-2">Aquí tienes un resumen de tu atelier hoy.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onSetActiveTab("venta_rapida")}
            className="px-6 py-2.5 bg-white border border-stone-200 text-amber-900 font-bold text-xs tracking-widest uppercase hover:bg-stone-50 transition-colors shadow-sm"
          >
            Venta Rápida
          </button>
          <button 
            onClick={() => onSetActiveTab("productos")}
            className="px-6 py-2.5 bg-gradient-to-br from-amber-700 to-amber-900 text-white font-bold text-xs tracking-widest uppercase shadow-md hover:opacity-90 transition-opacity"
          >
            Nuevo Producto
          </button>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200 rounded overflow-hidden shadow-sm">
        <div className="bg-white p-8">
          <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">Total Ventas</p>
          <p className="font-headline text-3xl text-amber-900">${stats.totalSales.toLocaleString('es-AR')}</p>
          <div className="mt-4 flex items-center gap-1 text-xs text-green-600 font-bold">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>+8.2% vs mes anterior</span>
          </div>
        </div>
        <div className="bg-white p-8">
          <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">Pedidos Pendientes</p>
          <p className="font-headline text-3xl text-stone-900">{stats.pendingOrders}</p>
          <div className="mt-4 flex items-center gap-1 text-xs text-amber-600 font-bold">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>Requieren atención</span>
          </div>
        </div>
        <div className="bg-white p-8">
          <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">Alertas de Stock</p>
          <p className="font-headline text-3xl text-red-600">{stats.stockAlerts.toString().padStart(2, '0')}</p>
          <div className="mt-4 flex items-center gap-1 text-xs text-red-600 font-bold">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>Bajo stock mínimo</span>
          </div>
        </div>
        <div className="bg-white p-8">
          <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">Crecimiento Mensual</p>
          <p className="font-headline text-3xl text-stone-900">{stats.growth}</p>
          <div className="mt-4 flex items-center gap-1 text-xs text-stone-400 font-bold">
            <span className="material-symbols-outlined text-sm">insights</span>
            <span>Objetivo: 15%</span>
          </div>
        </div>
      </section>

      {/* Main Insights Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Sales Performance Chart Placeholder */}
        <div className="col-span-12 lg:col-span-8 bg-stone-50 p-8 rounded-xl border border-stone-200/50 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-headline text-xl text-stone-900">Rendimiento de Ventas</h3>
              <p className="text-xs text-stone-500 font-body">Últimos 7 días de actividad</p>
            </div>
            <select className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest focus:ring-0 text-amber-800 cursor-pointer">
              <option>Semanal</option>
              <option>Mensual</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {/* Simple CSS Bar Chart Simulation */}
            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-3 flex-1">
                <div 
                  className={`w-full bg-amber-800/20 rounded-t transition-all cursor-pointer group relative hover:bg-amber-800 ${i === 5 ? 'bg-amber-800 h-[85%] shadow-lg' : ''}`}
                  style={{ height: i === 5 ? '85%' : `${Math.floor(Math.random() * 50) + 20}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    $ {(Math.random() * 5000).toFixed(0)}
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-tighter font-bold ${i === 5 ? 'text-amber-800' : 'text-stone-400'}`}>{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alert Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200/50 h-full">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <h3 className="font-headline text-lg text-stone-900">Stock Crítico</h3>
              <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{lowStockProducts.length} Items</span>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-8">Todo el inventario está al día.</p>
              ) : (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => onSetActiveTab("inventario")}>
                    <div className="size-12 rounded bg-stone-100 overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <span className="material-symbols-outlined">image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-headline text-stone-900 group-hover:text-amber-700 transition-colors uppercase">{product.name}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">
                        {product.stock === 0 ? 'Agotado' : `Quedan ${product.stock} unidades`}
                      </p>
                    </div>
                    <span className={`material-symbols-outlined text-lg ${product.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                      {product.stock === 0 ? 'block' : 'priority_high'}
                    </span>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => onSetActiveTab("inventario")}
              className="w-full mt-6 py-2 border border-amber-800/20 text-amber-800 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-amber-800 hover:text-white transition-all rounded"
            >
              Reponer Inventario
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-stone-200/30 pb-4">
          <h3 className="font-headline text-2xl text-stone-900">Pedidos Recientes</h3>
          <button 
            onClick={() => onSetActiveTab("pedidos")}
            className="text-[10px] font-bold uppercase tracking-widest text-amber-800 hover:underline"
          >
            Ver todos los pedidos
          </button>
        </div>
        <div className="overflow-x-auto bg-white rounded-xl border border-stone-200/50 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">ID Pedido</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 text-right">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-stone-400">No hay pedidos recientes.</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-5 font-['Inter'] text-sm text-stone-600 font-medium">#ORD-{order.id.toString().padStart(5, '0')}</td>
                    <td className="px-6 py-5 font-['Inter'] text-sm text-stone-900 font-bold uppercase">{getClientName(order)}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        order.status === 'REALIZADO' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-headline text-lg text-amber-900">${getOrderTotal(order).toLocaleString('es-AR')}</td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => onSetActiveTab("pedidos")}
                        className="text-stone-400 hover:text-stone-900 transition-colors"
                      >
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
