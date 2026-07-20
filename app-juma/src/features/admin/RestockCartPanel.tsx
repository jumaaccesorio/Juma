import { useEffect, useMemo, useState } from "react";
import ProductImage from "../../components/ProductImage";
import { api } from "../../lib/api";
import { getProductDisplayName } from "../../lib/productLabel";
import type { Order, Product } from "../../types";

type RestockCartPanelProps = {
  orders: Order[];
  products: Product[];
  onOpenProductDetail: (productId: number) => void;
};

type RestockState = {
  requested?: boolean;
  inCart?: boolean;
  hidden?: boolean;
  manual?: boolean;
  quantity?: number;
};

type RestockStateByProduct = Record<string, RestockState>;

function RestockCartPanel({ orders, products, onOpenProductDetail }: RestockCartPanelProps) {
  const [stateByProduct, setStateByProduct] = useState<RestockStateByProduct>({});
  const [query, setQuery] = useState("");
  const [addProductId, setAddProductId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "IN_CART" | "REQUESTED">("PENDING");
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRestockState() {
      try {
        setIsLoading(true);
        setSaveError("");
        const rows = await api.getRestockCartItems();
        if (cancelled) return;
        setStateByProduct(
          Object.fromEntries(
            rows.map((row) => [
              String(row.productId),
              {
                requested: row.requested,
                inCart: row.inCart,
                hidden: row.hidden,
                manual: row.manual,
                quantity: row.quantity,
              },
            ]),
          ),
        );
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setSaveError("No se pudo cargar el carrito de reposición. Verifica los permisos o el esquema de Supabase.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadRestockState();

    return () => {
      cancelled = true;
    };
  }, []);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const soldByProduct = useMemo(() => {
    const map = new Map<number, { quantity: number; orderCount: number; lastDate: string; salesAmount: number }>();

    orders
      .filter((order) => order.status === "REALIZADO")
      .forEach((order) => {
        order.items.forEach((item) => {
          const previous = map.get(item.productId) ?? { quantity: 0, orderCount: 0, lastDate: "", salesAmount: 0 };
          const orderDate = order.date || "";
          map.set(item.productId, {
            quantity: previous.quantity + item.quantity,
            orderCount: previous.orderCount + 1,
            lastDate: previous.lastDate && previous.lastDate > orderDate ? previous.lastDate : orderDate,
            salesAmount: previous.salesAmount + item.quantity * item.unitSalePrice,
          });
        });
      });

    return map;
  }, [orders]);

  const rows = useMemo(() => {
    const ids = new Set<number>([
      ...Array.from(soldByProduct.keys()),
      ...Object.entries(stateByProduct)
        .filter(([, state]) => state.manual)
        .map(([productId]) => Number(productId))
        .filter(Number.isFinite),
    ]);

    const normalizedQuery = query.trim().toLowerCase();

    return Array.from(ids)
      .map((productId) => {
        const product = productMap.get(productId);
        if (!product) return null;
        const savedState = stateByProduct[String(productId)] ?? {};
        if (savedState.hidden) return null;

        const sold = soldByProduct.get(productId) ?? { quantity: 0, orderCount: 0, lastDate: "", salesAmount: 0 };
        const suggestedQuantity = Math.max(1, sold.quantity + Number(savedState.quantity ?? 0));
        const name = getProductDisplayName(product);

        return {
          product,
          name,
          soldQuantity: sold.quantity,
          orderCount: sold.orderCount,
          lastDate: sold.lastDate,
          salesAmount: sold.salesAmount,
          suggestedQuantity,
          requested: Boolean(savedState.requested),
          inCart: Boolean(savedState.inCart),
          manual: Boolean(savedState.manual),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .filter((row) => {
        if (statusFilter === "PENDING" && (row.requested || row.inCart)) return false;
        if (statusFilter === "REQUESTED" && !row.requested) return false;
        if (statusFilter === "IN_CART" && !row.inCart) return false;
        if (!normalizedQuery) return true;

        return [row.name, row.product.categoryName ?? "", row.product.sourceUrl ?? ""].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .sort((a, b) => {
        if (a.inCart !== b.inCart) return Number(b.inCart) - Number(a.inCart);
        if (a.requested !== b.requested) return Number(b.requested) - Number(a.requested);
        return b.soldQuantity - a.soldQuantity;
      });
  }, [productMap, query, soldByProduct, stateByProduct, statusFilter]);

  const totals = useMemo(
    () => ({
      products: rows.length,
      units: rows.reduce((acc, row) => acc + row.suggestedQuantity, 0),
      requested: rows.filter((row) => row.requested).length,
      inCart: rows.filter((row) => row.inCart).length,
    }),
    [rows],
  );

  const updateRow = async (productId: number, updates: RestockState) => {
    const key = String(productId);
    const previous = stateByProduct[key] ?? {};
    const next = { ...previous, ...updates };

    setSaveError("");
    setStateByProduct((prev) => ({ ...prev, [key]: next }));

    try {
      const saved = await api.upsertRestockCartItem(productId, {
        requested: Boolean(next.requested),
        inCart: Boolean(next.inCart),
        hidden: Boolean(next.hidden),
        manual: Boolean(next.manual),
        quantity: Number(next.quantity ?? 0),
      });
      setStateByProduct((prev) => ({
        ...prev,
        [key]: {
          requested: saved.requested,
          inCart: saved.inCart,
          hidden: saved.hidden,
          manual: saved.manual,
          quantity: saved.quantity,
        },
      }));
    } catch (error) {
      console.error(error);
      setSaveError("No se pudo guardar el cambio en Supabase.");
      setStateByProduct((prev) => ({ ...prev, [key]: previous }));
    }
  };

  const removeRow = (productId: number) => {
    void updateRow(productId, { hidden: true, requested: false, inCart: false });
  };

  const addManualProduct = () => {
    const productId = Number(addProductId);
    if (!productId || !productMap.has(productId)) return;

    const quantity = Math.max(1, Number(addQuantity) || 1);
    void updateRow(productId, { hidden: false, manual: true, quantity });
    setAddProductId("");
    setAddQuantity("1");
  };

  const resetHiddenRows = () => {
    Object.entries(stateByProduct).forEach(([productId, state]) => {
      if (state.hidden) void updateRow(Number(productId), { hidden: false });
    });
  };

  const selectableProducts = useMemo(
    () =>
      products
        .filter((product) => !stateByProduct[String(product.id)]?.hidden)
        .sort((a, b) => getProductDisplayName(a).localeCompare(getProductDisplayName(b))),
    [products, stateByProduct],
  );

  const filters: Array<{ label: string; value: typeof statusFilter }> = [
    { label: "Pendiente", value: "PENDING" },
    { label: "En Carrito", value: "IN_CART" },
    { label: "Pedido", value: "REQUESTED" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 space-y-6 px-4 pb-12 pt-20 sm:px-6 lg:px-10 lg:pt-24">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-slate-900 lg:text-3xl">Carrito Reposición</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Productos vendidos agrupados para preparar la reposición de stock.</p>
        </div>

        <button
          type="button"
          onClick={resetHiddenRows}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px] text-slate-500">restore</span>
          Recuperar eliminados
        </button>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs font-bold text-slate-500 shadow-2xs">
          Cargando carrito de reposición...
        </div>
      )}

      {saveError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600 shadow-2xs">
          {saveError}
        </div>
      )}

      {/* ── METRICS CARDS (4 CARDS) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <span className="material-symbols-outlined text-xl">inventory_2</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Productos</span>
            <p className="font-headline text-2xl font-extrabold text-slate-900 leading-none mt-1">{totals.products}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <span className="material-symbols-outlined text-xl">production_quantity_limits</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Unidades sugeridas</span>
            <p className="font-headline text-2xl font-extrabold text-amber-600 leading-none mt-1">{totals.units}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <span className="material-symbols-outlined text-xl">shopping_cart_checkout</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">En carrito</span>
            <p className="font-headline text-2xl font-extrabold text-purple-600 leading-none mt-1">{totals.inCart}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <span className="material-symbols-outlined text-xl">check_circle</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Pedido</span>
            <p className="font-headline text-2xl font-extrabold text-emerald-600 leading-none mt-1">{totals.requested}</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH & MANUAL ADD ROW ── */}
      <div className="grid gap-3 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm lg:grid-cols-[1fr_220px_100px_auto]">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto o categoría..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
          />
        </div>
        <select
          value={addProductId}
          onChange={(event) => setAddProductId(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-primary shadow-2xs"
        >
          <option value="">+ Agregar ítem manual</option>
          {selectableProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {getProductDisplayName(product)}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={addQuantity}
          onChange={(event) => setAddQuantity(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-center text-slate-900 outline-none focus:border-primary shadow-2xs"
        />
        <button
          type="button"
          onClick={addManualProduct}
          disabled={!addProductId}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Agregar
        </button>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div className="flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              statusFilter === filter.value
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* ── RESTOCK TABLE DIRECTORY ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="font-headline text-lg font-bold text-slate-900">Items para Reposición</h2>
          <span className="text-xs font-bold text-slate-500">{rows.length} ítems</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Ventas</th>
                <th className="px-4 py-3">Stock Actual</th>
                <th className="px-4 py-3">Estados</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rows.map((row) => (
                <tr key={row.product.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/60 shrink-0">
                        {row.product.image ? (
                          <ProductImage product={row.product} alt={row.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <span className="material-symbols-outlined text-base">image</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenProductDetail(row.product.id)}
                          className="font-bold text-slate-900 hover:text-primary transition-colors text-left block truncate"
                        >
                          {row.name}
                        </button>
                        <span className="text-[11px] text-slate-400 font-medium block truncate">
                          {row.product.categoryName ?? "General"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900">{row.suggestedQuantity} uds. sugeridas</p>
                    <p className="text-[11px] text-slate-400">Vendidas: {row.soldQuantity} ({row.orderCount} vtas)</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      row.product.stock <= 2 ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}>
                      Stock {row.product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateRow(row.product.id, { requested: !row.requested })}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          row.requested ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{row.requested ? "check_circle" : "radio_button_unchecked"}</span>
                        Pedido
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRow(row.product.id, { inCart: !row.inCart })}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          row.inCart ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{row.inCart ? "shopping_cart_checkout" : "add_shopping_cart"}</span>
                        En carrito
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={row.product.sourceUrl || undefined}
                        target="_blank"
                        rel="noreferrer"
                        className={`p-1.5 rounded-lg transition-colors ${
                          row.product.sourceUrl ? "text-primary hover:bg-primary/10" : "text-slate-300 pointer-events-none"
                        }`}
                        title="Ver URL original"
                      >
                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => removeRow(row.product.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Quitar ítem"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                    No hay productos para reposición con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RestockCartPanel;
