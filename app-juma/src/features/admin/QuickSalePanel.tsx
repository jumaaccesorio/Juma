import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Client, Order, OrderItem, Product } from "../../types";
import { api } from "../../lib/api";
import { getProductDisplayName } from "../../lib/productLabel";

type QuickSaleItem = {
  product: Product;
  quantity: number;
};

type PaymentMethod = "efectivo" | "tarjeta" | "transferencia";

type QuickSalePanelProps = {
  products: Product[];
  categories: Category[];
  clients: Client[];
  onOrderPlaced: (order: Order) => void;
  onUpdateStock: (productId: number, newStock: number) => void;
};

function QuickSalePanel({ products, categories, clients, onOrderPlaced, onUpdateStock }: QuickSalePanelProps) {
  const MOBILE_PRODUCTS_PER_PAGE = 12;
  const DESKTOP_PRODUCTS_PER_PAGE = 24;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [cart, setCart] = useState<QuickSaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [mobilePage, setMobilePage] = useState(1);
  const [desktopPage, setDesktopPage] = useState(1);
  const mobileCatalogRef = useRef<HTMLElement | null>(null);
  const desktopCatalogRef = useRef<HTMLElement | null>(null);

  const scrollToSectionStart = (element: HTMLElement | null) => {
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  const enabledProducts = useMemo(() => products.filter(p => p.enabled && p.stock > 0), [products]);
  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );
  const categoryChips = useMemo(
    () =>
      categories
        .map((category) => {
          const parent = category.parentId ? categories.find((row) => row.id === category.parentId) ?? null : null;
          return {
            id: category.id,
            label: parent ? `${parent.name} / ${category.name}` : category.name,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [categories],
  );

  const filteredProducts = useMemo(() => {
    let list = enabledProducts;
    if (selectedCategoryId) list = list.filter(p => p.categoryId === selectedCategoryId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          getProductDisplayName(p).toLowerCase().includes(q) ||
          (p.subName || "").toLowerCase().includes(q) ||
          (p.categoryName || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [enabledProducts, selectedCategoryId, searchQuery]);

  const mobileTotalPages = Math.max(1, Math.ceil(filteredProducts.length / MOBILE_PRODUCTS_PER_PAGE));
  const desktopTotalPages = Math.max(1, Math.ceil(filteredProducts.length / DESKTOP_PRODUCTS_PER_PAGE));
  const mobileProductsPage = useMemo(
    () => filteredProducts.slice((mobilePage - 1) * MOBILE_PRODUCTS_PER_PAGE, mobilePage * MOBILE_PRODUCTS_PER_PAGE),
    [filteredProducts, mobilePage],
  );
  const desktopProductsPage = useMemo(
    () => filteredProducts.slice((desktopPage - 1) * DESKTOP_PRODUCTS_PER_PAGE, desktopPage * DESKTOP_PRODUCTS_PER_PAGE),
    [filteredProducts, desktopPage],
  );

  const renderPager = (page: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-line px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Pagina {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-lg border border-line px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (mobilePage > mobileTotalPages) setMobilePage(mobileTotalPages);
    if (desktopPage > desktopTotalPages) setDesktopPage(desktopTotalPages);
  }, [desktopPage, desktopTotalPages, mobilePage, mobileTotalPages]);

  useEffect(() => {
    scrollToSectionStart(mobileCatalogRef.current);
  }, [mobilePage]);

  useEffect(() => {
    scrollToSectionStart(desktopCatalogRef.current);
  }, [desktopPage]);

  useEffect(() => {
    setMobilePage(1);
    setDesktopPage(1);
  }, [searchQuery]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      const next = i.quantity + delta;
      if (next <= 0) return i;
      if (next > i.product.stock) return i;
      return { ...i, quantity: next };
    }));
  };

  const removeFromCart = (productId: number) => setCart(prev => prev.filter(i => i.product.id !== productId));

  const subtotal = useMemo(() => cart.reduce((acc, i) => acc + i.product.salePrice * i.quantity, 0), [cart]);
  const total = subtotal;
  const selectedClient = selectedClientId ? clients.find((client) => String(client.id) === selectedClientId) : null;

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const items: OrderItem[] = cart.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitSalePrice: i.product.salePrice,
        unitPurchasePrice: i.product.purchasePrice,
      }));

      const clientId = selectedClientId ? Number(selectedClientId) : undefined;
      const newOrder = await api.addOrder({
        clientId,
        date: new Date().toISOString().slice(0, 10),
        status: "REALIZADO",
        items,
      });

      // Update stock
      for (const item of cart) {
        const newStock = item.product.stock - item.quantity;
        await api.updateStock(item.product.id, Math.max(0, newStock));
        onUpdateStock(item.product.id, Math.max(0, newStock));
      }

      onOrderPlaced(newOrder);
      setCart([]);
      setSelectedClientId("");
      setSearchQuery("");
      setSuccessMsg(`¡Venta #${String(newOrder.id).padStart(5, "0")} registrada con éxito!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-md min-w-0 flex-1 flex-col overflow-x-hidden bg-surface px-4 py-4 pb-32 md:hidden">
        {successMsg && (
          <div className="mb-6 rounded-2xl border border-[#C5A37F]/25 bg-[#C5A37F]/10 px-4 py-3 text-sm font-medium text-primary shadow-[0_12px_30px_rgba(117,89,58,0.08)]">
            {successMsg}
          </div>
        )}

        <section ref={mobileCatalogRef} className="mb-8">
          <div className="mb-4 min-w-0">
            <h2 className="font-headline text-xl italic text-primary">Venta Rápida</h2>
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.2em] text-secondary">Boutique Admin</span>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-[0_12px_40px_rgba(45,45,45,0.06)]">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-secondary">
              Seleccionar Cliente
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 text-sm text-secondary">
                person_search
              </span>
              <select
                className="w-full rounded-lg border-none bg-surface-container-low py-3 pl-10 pr-4 text-sm text-on-surface outline-none ring-1 ring-transparent transition focus:ring-primary"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">Consumidor Final</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedClient && (
              <div className="mt-3 flex gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2">
                  <span className="text-xs font-medium text-primary">{selectedClient.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedClientId("")}
                    className="material-symbols-outlined text-xs text-primary"
                  >
                    close
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Catálogo Curado</h3>
            <span className="material-symbols-outlined shrink-0 text-secondary">filter_list</span>
          </div>

          <div className="relative mb-4">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary">
              search
            </span>
            <input
              className="w-full rounded-xl border border-outline-variant/20 bg-white py-3 pl-10 pr-4 text-sm text-on-surface outline-none transition focus:border-primary"
              placeholder="Buscar por nombre o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 pr-2 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                !selectedCategoryId
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-secondary hover:bg-secondary-container"
              }`}
            >
              All
            </button>
            {categoryChips.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id);
                  setMobilePage(1);
                  setDesktopPage(1);
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  selectedCategoryId === category.id
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-secondary hover:bg-secondary-container"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-[0_12px_40px_rgba(45,45,45,0.04)]">
              <span className="material-symbols-outlined text-4xl text-secondary">inventory_2</span>
              <p className="mt-3 text-sm text-secondary">No encontramos productos para ese filtro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {mobileProductsPage.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id)?.quantity ?? 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    className={`group min-w-0 overflow-hidden rounded-xl text-left transition ${
                      inCart > 0 ? "border border-primary/20 bg-primary/5" : "bg-surface-container-low"
                    }`}
                  >
                    <div className="relative aspect-square bg-surface-container-high">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={getProductDisplayName(product)}
                          className="h-full w-full object-cover opacity-90 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-secondary/40">image</span>
                        </div>
                      )}

                      {inCart > 0 ? (
                        <>
                          <div className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[8px] uppercase tracking-tighter text-on-primary">
                            {inCart} en bolsa
                          </div>
                          <div className="absolute bottom-2 right-2 rounded-full bg-primary p-1.5 shadow-sm">
                            <span className="material-symbols-outlined text-sm text-on-primary">check</span>
                          </div>
                        </>
                      ) : (
                        <div className="absolute bottom-2 right-2 rounded-full bg-surface-container-lowest/80 p-1.5 shadow-sm backdrop-blur-md">
                          <span className="material-symbols-outlined text-sm text-primary">add</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 p-3">
                      <h4 className="truncate font-headline text-sm italic text-on-surface">{getProductDisplayName(product)}</h4>
                      <p className="mt-0.5 text-[11px] font-medium tracking-tight text-secondary">
                        ${product.salePrice.toLocaleString("es-AR")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {renderPager(mobilePage, mobileTotalPages, setMobilePage)}
        </section>

        <section className="mb-12">
          <div className="rounded-2xl bg-surface-container-high/50 p-6">
            <div className="mb-6 flex items-baseline justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Resumen de Orden</span>
              <span className="font-headline text-2xl text-primary">${total.toLocaleString("es-AR")}</span>
            </div>

            <div className="mb-8 space-y-4">
              {cart.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant/20 px-4 py-5 text-center text-sm text-secondary">
                  Seleccioná productos para comenzar la venta.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-start justify-between gap-3 border-b border-outline-variant/10 pb-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-headline italic text-on-surface-variant">
                        {item.quantity}x {getProductDisplayName(item.product)}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(item.product.id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/20 text-primary"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQty(item.product.id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/20 text-primary"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] font-medium uppercase tracking-[0.1em] text-secondary"
                        >
                          quitar
                        </button>
                      </div>
                    </div>
                    <span className="shrink-0 font-medium">${(item.product.salePrice * item.quantity).toLocaleString("es-AR")}</span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-secondary/60">
                <span>Impuestos (Incl.)</span>
                <span>$0.00</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-secondary">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["efectivo", "tarjeta", "transferencia"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`flex flex-col items-center justify-center rounded-lg border bg-surface-container-lowest p-3 transition-colors ${
                      paymentMethod === method
                        ? "border-primary text-primary"
                        : "border-outline-variant/30 text-secondary hover:border-primary/50"
                    }`}
                  >
                    <span className="material-symbols-outlined mb-1">
                      {method === "efectivo" ? "payments" : method === "tarjeta" ? "credit_card" : "sync_alt"}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-tighter">
                      {method === "efectivo" ? "Cash" : method === "tarjeta" ? "Card" : "Transfer"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinalizeSale}
              disabled={cart.length === 0 || isSubmitting}
              className="mt-8 w-full rounded-sm bg-gradient-to-br from-[#75593a] to-[#c5a37f] py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Procesando..." : "Finalizar Venta"}
            </button>
          </div>
        </section>
      </div>

      <div className="hidden h-full flex-1 flex-col overflow-hidden bg-[#f8f6f6] md:flex xl:flex-row">

      {/* Left: Product Selector */}
      <section ref={desktopCatalogRef} className="flex flex-1 flex-col space-y-5 overflow-hidden p-4 md:p-6">
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>{successMsg}
          </div>
        )}

        {/* Search + Client row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary pointer-events-none">person_search</span>
            <select
              className="w-full pl-12 pr-4 h-14 bg-white border border-[#F3EDE2] rounded-xl appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-700 font-medium"
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
            >
              <option value="">Cliente Final / Público General</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary pointer-events-none">search</span>
            <input
              className="w-full pl-12 pr-4 h-14 bg-white border border-[#F3EDE2] rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-700"
              placeholder="Buscar producto por nombre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setSelectedCategoryId(null)}
            type="button"
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!selectedCategoryId ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-[#F3EDE2] text-slate-600 hover:border-primary"}`}
          >
            Todos
          </button>
          {categoryChips.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id);
                setMobilePage(1);
                setDesktopPage(1);
              }}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategoryId === cat.id ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-[#F3EDE2] text-slate-600 hover:border-primary"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <span className="material-symbols-outlined text-5xl">inventory_2</span>
              <p className="font-medium">No hay productos en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {desktopProductsPage.map(product => {
                const inCart = cart.find(i => i.product.id === product.id)?.quantity ?? 0;
                const lowStock = product.stock <= 3;
                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-2xl p-3 border border-[#F3EDE2] hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer flex flex-col h-full"
                  >
                    <div className="aspect-square rounded-xl bg-[#F3EDE2] mb-3 relative overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={getProductDisplayName(product)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                        </div>
                      )}
                      <div className={`absolute top-2 right-2 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold ${lowStock ? "bg-red-100 text-red-600" : "bg-white/90 text-primary"}`}>
                        {product.stock} EN STOCK
                      </div>
                      {inCart > 0 && (
                        <div className="absolute bottom-2 left-2 bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {inCart} en pedido
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1 group-hover:text-primary transition-colors">{getProductDisplayName(product)}</h3>
                    <p className="text-xs text-slate-400 mb-2">{product.categoryName || ""}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-primary font-bold">${product.salePrice.toLocaleString("es-AR")}</span>
                      <button
                        className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                        onClick={e => { e.stopPropagation(); addToCart(product); }}
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {renderPager(desktopPage, desktopTotalPages, setDesktopPage)}
        </div>
      </section>

      {/* Right: Order Summary */}
      <aside className="flex w-full flex-col border-t border-[#F3EDE2] bg-white shadow-xl xl:w-96 xl:border-l xl:border-t-0">
        <div className="border-b border-[#F3EDE2] p-4 md:p-6">
          <h3 className="font-serif text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">point_of_sale</span>
            Resumen del Pedido
          </h3>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 md:p-6" style={{ scrollbarWidth: "thin" }}>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-3">
              <span className="material-symbols-outlined text-5xl">shopping_cart</span>
              <p className="text-sm font-medium text-slate-400">Hacé clic en un producto para agregarlo</p>
            </div>
          ) : cart.map(item => (
            <div key={item.product.id} className="flex items-center gap-4">
              <div className="size-16 rounded-xl overflow-hidden bg-[#F3EDE2] flex-shrink-0">
                {item.product.image ? (
                  <img src={item.product.image} alt={getProductDisplayName(item.product)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-300">image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-800 truncate">{getProductDisplayName(item.product)}</h4>
                <p className="text-xs text-primary font-bold">${(item.product.salePrice * item.quantity).toLocaleString("es-AR")}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => updateQty(item.product.id, -1)}
                    className="size-6 rounded bg-[#F3EDE2] flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">remove</span>
                  </button>
                  <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.product.id, 1)}
                    className="size-6 rounded bg-[#F3EDE2] flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">add</span>
                  </button>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>

        {/* Totals + Payment */}
        <div className="space-y-6 bg-[#F3EDE2] p-4 md:p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-800 font-semibold">${subtotal.toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t border-white">
              <span className="font-serif font-bold text-slate-800">Total</span>
              <span className="text-primary font-bold text-xl">${total.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Método de Pago</p>
            <div className="grid grid-cols-3 gap-2">
              {(["efectivo", "tarjeta", "transferencia"] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl border-2 bg-white p-2 text-center transition-all sm:p-3 ${paymentMethod === method ? "border-primary text-primary shadow-md" : "border-transparent text-slate-500 hover:border-primary/30 hover:text-primary"}`}
                >
                  <span className="material-symbols-outlined">
                    {method === "efectivo" ? "payments" : method === "tarjeta" ? "credit_card" : "account_balance"}
                  </span>
                  <span className="text-[10px] font-bold capitalize">{method === "transferencia" ? "Transfer" : method.charAt(0).toUpperCase() + method.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFinalizeSale}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            <span>{isSubmitting ? "Procesando..." : "Finalizar Venta"}</span>
            <span className="material-symbols-outlined">{isSubmitting ? "autorenew" : "arrow_forward"}</span>
          </button>
        </div>
      </aside>
      </div>
    </>
  );
}

export default QuickSalePanel;
