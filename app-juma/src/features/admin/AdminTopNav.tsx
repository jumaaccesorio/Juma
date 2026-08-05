import { useEffect, useMemo, useRef, useState } from "react";
import type { Client, Order, Product } from "../../types";

type AlertItem = {
  id: string;
  type: "order_new" | "order_completed" | "client_new" | "stock_low";
  icon: string;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  timestamp: number;
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  if (Number.isNaN(date)) return "";
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return new Date(dateStr).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export type AdminTopNavProps = {
  onOpenMenu: () => void;
  onPreview: () => void;
  onLogout: () => void;
  orders: Order[];
  clients: Client[];
  lowStockProducts: Product[];
};

export default function AdminTopNav({ onOpenMenu, onPreview, onLogout, orders, clients, lowStockProducts }: AdminTopNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("juma_dismissed_alerts");
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Recent pending orders (created in last 7 days)
    for (const order of orders) {
      if (order.status === "PENDIENTE") {
        const orderDate = new Date(order.date).getTime();
        if (!Number.isNaN(orderDate) && orderDate >= sevenDaysAgo) {
          items.push({
            id: `order_new_${order.id}`,
            type: "order_new",
            icon: "shopping_bag",
            iconBg: "bg-blue-50 text-blue-600",
            title: "Nuevo pedido pendiente",
            description: `Pedido #${String(order.id).padStart(5, "0")} · ${order.items.length} producto${order.items.length !== 1 ? "s" : ""}`,
            time: timeAgo(order.date),
            timestamp: orderDate,
          });
        }
      }
    }

    // Recent completed orders (sales)
    for (const order of orders) {
      if (order.status === "REALIZADO") {
        const orderDate = new Date(order.date).getTime();
        if (!Number.isNaN(orderDate) && orderDate >= sevenDaysAgo) {
          const total = order.items.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0);
          items.push({
            id: `order_completed_${order.id}`,
            type: "order_completed",
            icon: "check_circle",
            iconBg: "bg-emerald-50 text-emerald-600",
            title: "Venta realizada",
            description: `Pedido #${String(order.id).padStart(5, "0")} · $${total.toLocaleString("es-AR")}`,
            time: timeAgo(order.date),
            timestamp: orderDate,
          });
        }
      }
    }

    // New clients (created in last 7 days)
    for (const client of clients) {
      const createdDate = new Date(client.createdAt).getTime();
      if (!Number.isNaN(createdDate) && createdDate >= sevenDaysAgo) {
        items.push({
          id: `client_new_${client.id}`,
          type: "client_new",
          icon: "person_add",
          iconBg: "bg-violet-50 text-violet-600",
          title: "Nuevo perfil creado",
          description: client.name,
          time: timeAgo(client.createdAt),
          timestamp: createdDate,
        });
      }
    }

    // Low stock alerts
    for (const product of lowStockProducts) {
      items.push({
        id: `stock_low_${product.id}`,
        type: "stock_low",
        icon: "inventory",
        iconBg: "bg-amber-50 text-amber-600",
        title: "Stock bajo",
        description: `${product.name}${product.subName ? ` ${product.subName}` : ""} · ${product.stock === 0 ? "Agotado" : `${product.stock} restante${product.stock !== 1 ? "s" : ""}`}`,
        time: "",
        timestamp: 0,
      });
    }

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  }, [orders, clients, lowStockProducts]);

  const unseenAlerts = useMemo(() => alerts.filter((a) => !dismissedIds.has(a.id)), [alerts, dismissedIds]);
  const unseenCount = unseenAlerts.length;

  const handleDismissAll = () => {
    const newDismissed = new Set(dismissedIds);
    for (const alert of alerts) newDismissed.add(alert.id);
    setDismissedIds(newDismissed);
    try {
      localStorage.setItem("juma_dismissed_alerts", JSON.stringify(Array.from(newDismissed)));
    } catch { /* ignore */ }
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex min-h-16 items-center justify-between border-b border-line/50 glass-nav px-3 py-3 md:left-64 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar text-white md:hidden"
        >
          <span translate="no" className="material-symbols-outlined">menu</span>
        </button>
        <div className="min-w-0 md:hidden">
          <p className="truncate font-headline text-xl text-primary">Juma Accessory</p>
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">Panel de Control</p>
        </div>


      </div>

      {/* Right actions */}
      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-quaternary px-2.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white md:px-4"
          onClick={onPreview}
        >
          <span translate="no" className="material-symbols-outlined text-[18px]">preview</span>
          <span className="hidden font-body tracking-tight sm:inline">Preview</span>
        </button>

        {/* Notifications bell */}
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={handleToggle}
            className={`relative size-9 flex items-center justify-center rounded-lg transition-colors ${isOpen ? "text-primary bg-primary/10" : "text-ink/50 hover:text-primary hover:bg-primary/10"}`}
          >
            <span translate="no" className="material-symbols-outlined text-[20px]">notifications</span>
            {unseenCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white">
                {unseenCount > 99 ? "99+" : unseenCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-[min(92vw,400px)] rounded-xl border border-line/60 bg-white shadow-2xl shadow-black/10 overflow-hidden z-50 animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-line/40 bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Notificaciones</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {unseenCount > 0 ? `${unseenCount} sin leer` : "Todo al día"}
                  </p>
                </div>
                {unseenCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDismissAll}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              {/* Alert list */}
              <div className="max-h-[400px] overflow-y-auto divide-y divide-line/30">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4">
                    <span translate="no" className="material-symbols-outlined text-4xl text-slate-200 mb-2">notifications_off</span>
                    <p className="text-sm font-medium text-slate-400">No hay notificaciones</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const isSeen = dismissedIds.has(alert.id);
                    return (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${isSeen ? "bg-white" : "bg-primary/[0.03]"}`}
                      >
                        <div className={`flex-shrink-0 size-9 rounded-lg ${alert.iconBg} flex items-center justify-center mt-0.5`}>
                          <span translate="no" className="material-symbols-outlined text-[16px]">{alert.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${isSeen ? "text-slate-600" : "text-slate-900 font-semibold"}`}>
                              {alert.title}
                            </p>
                            {!isSeen && <div className="size-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{alert.description}</p>
                          {alert.time && (
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">{alert.time}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:block w-px h-6 bg-line/60" />
        <button
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-ink/60 hover:text-red-500 hover:bg-red-50 transition-colors"
          onClick={onLogout}
        >
          <span translate="no" className="material-symbols-outlined text-[20px]">logout</span>
          <span className="hidden font-body text-sm font-medium lg:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
