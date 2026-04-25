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
          setSaveError("No se pudo cargar el carrito de reposicion. Ejecuta la migracion SQL de restock_cart_items en Supabase.");
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
    { label: "En carrito", value: "IN_CART" },
    { label: "Pedido", value: "REQUESTED" },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-muted">Compras</p>
          <h2 className="font-headline text-3xl text-ink">Carrito Reposicion</h2>
          <p className="mt-1 text-sm text-muted">Productos vendidos agrupados para preparar la reposicion de stock.</p>
        </div>
        <button
          type="button"
          onClick={resetHiddenRows}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-xs font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary/10"
        >
          <span className="material-symbols-outlined text-[18px]">restore</span>
          Recuperar eliminados
        </button>
      </section>

      {isLoading ? (
        <div className="rounded-xl border border-line bg-white p-4 text-sm font-semibold text-muted shadow-sm">
          Cargando carrito de reposicion...
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 shadow-sm">
          {saveError}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Productos", value: totals.products, icon: "inventory_2" },
          { label: "Unidades sugeridas", value: totals.units, icon: "production_quantity_limits" },
          { label: "Pedido", value: totals.requested, icon: "check_circle" },
          { label: "En carrito", value: totals.inCart, icon: "shopping_cart_checkout" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{item.label}</p>
              <span className="material-symbols-outlined text-primary">{item.icon}</span>
            </div>
            <p className="mt-3 font-headline text-3xl text-ink">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 rounded-xl border border-line/60 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_120px_auto]">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted">search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto, categoria o URL..."
            className="h-11 w-full rounded-lg border border-line bg-secondary/40 pl-10 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <select
          value={addProductId}
          onChange={(event) => setAddProductId(event.target.value)}
          className="h-11 rounded-lg border border-line bg-secondary/40 px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        >
          <option value="">Agregar producto</option>
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
          className="h-11 rounded-lg border border-line bg-secondary/40 px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={addManualProduct}
          disabled={!addProductId}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Agregar
        </button>
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
              statusFilter === filter.value
                ? "bg-primary text-white"
                : "border border-line bg-white text-muted hover:text-primary"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-line/60 bg-white shadow-sm">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">Producto</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">Ventas</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">Stock</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">Estados</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-muted text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {rows.map((row) => (
                <tr key={row.product.id} className="transition-colors hover:bg-secondary/25">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        {row.product.image ? (
                          <ProductImage product={row.product} alt={row.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted/50">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenProductDetail(row.product.id)}
                          className="text-left text-sm font-bold text-ink transition-colors hover:text-primary"
                        >
                          {row.name}
                        </button>
                        <p className="mt-1 text-xs text-muted">{row.product.categoryName ?? "Sin categoria"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-ink">{row.suggestedQuantity} unidades</p>
                    <p className="text-xs text-muted">
                      Vendidas: {row.soldQuantity} / Pedidos: {row.orderCount || "-"}
                    </p>
                    <p className="text-xs text-muted">${row.salesAmount.toLocaleString("es-AR")} vendido</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${row.product.stock <= 2 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                      Stock {row.product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateRow(row.product.id, { requested: !row.requested })}
                        className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${
                          row.requested ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{row.requested ? "check_circle" : "radio_button_unchecked"}</span>
                        Pedido
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRow(row.product.id, { inCart: !row.inCart })}
                        className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${
                          row.inCart ? "bg-primary/15 text-primary" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{row.inCart ? "shopping_cart_checkout" : "add_shopping_cart"}</span>
                        En carrito
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <a
                        href={row.product.sourceUrl || undefined}
                        target="_blank"
                        rel="noreferrer"
                        aria-disabled={!row.product.sourceUrl}
                        className={`inline-flex min-h-9 items-center justify-center gap-1 rounded-lg px-3 text-xs font-bold uppercase tracking-[0.12em] ${
                          row.product.sourceUrl
                            ? "bg-primary text-white"
                            : "pointer-events-none bg-slate-100 text-slate-400"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        URL
                      </a>
                      <button
                        type="button"
                        onClick={() => removeRow(row.product.id)}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-red-50 px-3 text-red-600 transition-colors hover:bg-red-100"
                        title="Eliminar del carrito de reposicion"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {rows.map((row) => (
            <article key={`mobile-${row.product.id}`} className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {row.product.image ? (
                    <ProductImage product={row.product} alt={row.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted/50">
                      <span className="material-symbols-outlined">image</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => onOpenProductDetail(row.product.id)} className="text-left text-sm font-bold text-ink">
                    {row.name}
                  </button>
                  <p className="mt-1 text-xs text-muted">{row.suggestedQuantity} unidades sugeridas</p>
                  <p className="text-xs text-muted">Stock actual: {row.product.stock}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateRow(row.product.id, { requested: !row.requested })}
                  className={`min-h-10 rounded-lg text-xs font-bold ${row.requested ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                >
                  Pedido
                </button>
                <button
                  type="button"
                  onClick={() => updateRow(row.product.id, { inCart: !row.inCart })}
                  className={`min-h-10 rounded-lg text-xs font-bold ${row.inCart ? "bg-primary/15 text-primary" : "bg-slate-100 text-slate-500"}`}
                >
                  En carrito
                </button>
                <a
                  href={row.product.sourceUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex min-h-10 items-center justify-center rounded-lg text-xs font-bold ${
                    row.product.sourceUrl ? "bg-primary text-white" : "pointer-events-none bg-slate-100 text-slate-400"
                  }`}
                >
                  Abrir URL
                </a>
                <button type="button" onClick={() => removeRow(row.product.id)} className="min-h-10 rounded-lg bg-red-50 text-xs font-bold text-red-600">
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-muted/40">inventory</span>
            <p className="mt-3 text-sm font-semibold text-muted">No hay productos para reposicion con los filtros actuales.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default RestockCartPanel;
