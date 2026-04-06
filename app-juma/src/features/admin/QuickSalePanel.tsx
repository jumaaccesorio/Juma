import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Client, Order, OrderItem, Product } from "../../types";
import { api } from "../../lib/api";
import { getProductDisplayName } from "../../lib/productLabel";
import ProductImage from "../../components/ProductImage";

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
  onRequestProductImages: (productIds: number[]) => void;
};

function QuickSalePanel({ products, categories, clients, onOrderPlaced, onUpdateStock, onRequestProductImages }: QuickSalePanelProps) {
  const MOBILE_PRODUCTS_PER_PAGE = 12;
  const DESKTOP_PRODUCTS_PER_PAGE = 24;
  const [isDesktopLayout, setIsDesktopLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<number | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [cart, setCart] = useState<QuickSaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [mobilePage, setMobilePage] = useState(1);
  const [desktopPage, setDesktopPage] = useState(1);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const mobileCatalogRef = useRef<HTMLElement | null>(null);
  const desktopCatalogRef = useRef<HTMLElement | null>(null);

  const scrollToSectionStart = (element: HTMLElement | null) => {
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncLayout = () => setIsDesktopLayout(mediaQuery.matches);
    syncLayout();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncLayout);
      return () => mediaQuery.removeEventListener("change", syncLayout);
    }

    mediaQuery.addListener(syncLayout);
    return () => mediaQuery.removeListener(syncLayout);
  }, []);

  const enabledProducts = useMemo(() => products.filter(p => p.enabled && p.stock > 0), [products]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  
  const mainCategories = useMemo(
    () => categories.filter((c) => !c.parentId && c.name.trim() !== "").sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const subCategories = useMemo(
    () => {
      if (!selectedMainCategoryId) return [];
      return categories.filter((c) => c.parentId === selectedMainCategoryId && c.name.trim() !== "").sort((a, b) => a.name.localeCompare(b.name));
    },
    [categories, selectedMainCategoryId]
  );

  const filteredProducts = useMemo(() => {
    let list = enabledProducts;
    
    if (selectedSubCategoryId) {
      list = list.filter(p => p.categoryId === selectedSubCategoryId);
    } else if (selectedMainCategoryId) {
      list = list.filter(p => {
        if (p.categoryId === selectedMainCategoryId) return true;
        const cat = p.categoryId ? categoryById.get(p.categoryId) : null;
        return cat?.parentId === selectedMainCategoryId;
      });
    }

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
  }, [categoryById, enabledProducts, selectedMainCategoryId, selectedSubCategoryId, searchQuery]);

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

  const visibleProductsPage = isDesktopLayout ? desktopProductsPage : mobileProductsPage;

  useEffect(() => {
    const idsToRequest = Array.from(new Set(
      visibleProductsPage
        .filter((product) => !product.image)
        .map((product) => product.id),
    ));
    if (idsToRequest.length > 0) {
      onRequestProductImages(idsToRequest);
    }
  }, [onRequestProductImages, visibleProductsPage]);

  const renderPager = (page: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-line px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-muted">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-lg border border-line px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary disabled:cursor-not-allowed disabled:opacity-40"
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
    if (isDesktopLayout) return;
    scrollToSectionStart(mobileCatalogRef.current);
  }, [isDesktopLayout, mobilePage]);

  useEffect(() => {
    if (!isDesktopLayout) return;
    scrollToSectionStart(desktopCatalogRef.current);
  }, [desktopPage, isDesktopLayout]);

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
      setIsMobileCartOpen(false);
      setSuccessMsg(`¡Venta #${String(newOrder.id).padStart(5, "0")} registrada con éxito!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartItemCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <>
      {/* ══════════════════════════════════════════════════
          MOBILE LAYOUT
          ══════════════════════════════════════════════════ */}
      <div className="mx-auto flex w-full max-w-md min-w-0 flex-1 flex-col overflow-x-hidden bg-background px-4 py-4 pb-32 md:hidden">
        {/* Success message */}
        {successMsg && (
          <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {successMsg}
          </div>
        )}

        {/* Compact Header */}
        <section ref={mobileCatalogRef} className="mb-4 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="font-headline text-xl text-ink leading-tight">Venta Rápida</h2>
          </div>
          <div className="relative shrink-0 w-[160px]">
            <select
              className="w-full appearance-none rounded-lg border border-line bg-white py-1.5 pl-3 pr-8 text-[11px] font-bold text-ink/80 outline-none focus:border-primary/50 shadow-sm truncate"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">👤 Cliente Final</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  👤 {client.name}
                </option>
              ))}
            </select>
            {selectedClient ? (
              <button
                type="button"
                onClick={() => setSelectedClientId("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center rounded p-1 text-red-400 hover:text-red-500 hover:bg-red-50"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            ) : (
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-muted pointer-events-none">expand_more</span>
            )}
          </div>
        </section>

        {/* Product Catalog */}
        <section className="mb-8">
          {/* Search */}
          <div className="relative mb-3">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted/60">
              search
            </span>
            <input
              className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-[13px] text-ink placeholder:text-muted/50 outline-none transition focus:border-primary/40 focus:shadow-sm"
              placeholder="Buscar producto o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category chips */}
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => {
                  setSelectedMainCategoryId(null);
                  setSelectedSubCategoryId(null);
                  setMobilePage(1);
                  setDesktopPage(1);
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  !selectedMainCategoryId
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-line text-ink/60 hover:border-primary/40"
                }`}
              >
                Todos
              </button>
              {mainCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    const isSelected = selectedMainCategoryId === category.id;
                    setSelectedMainCategoryId(isSelected ? null : category.id);
                    setSelectedSubCategoryId(null);
                    setMobilePage(1);
                    setDesktopPage(1);
                  }}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    selectedMainCategoryId === category.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white border border-line text-ink/60 hover:border-primary/40"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {selectedMainCategoryId && subCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 pr-2 pl-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubCategoryId(null);
                    setMobilePage(1);
                    setDesktopPage(1);
                  }}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    !selectedSubCategoryId
                      ? "bg-secondary text-primary"
                      : "bg-background border border-line text-muted hover:border-primary/30"
                  }`}
                >
                  Todo en {mainCategories.find(c => c.id === selectedMainCategoryId)?.name || 'Categoría'}
                </button>
                {subCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubCategoryId(selectedSubCategoryId === category.id ? null : category.id);
                      setMobilePage(1);
                      setDesktopPage(1);
                    }}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                      selectedSubCategoryId === category.id
                        ? "bg-secondary text-primary"
                        : "bg-white border border-line/60 text-muted hover:border-primary/30"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product grid */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-xl bg-white px-5 py-10 text-center border border-line/50">
              <span className="material-symbols-outlined text-3xl text-muted/30 mb-2 block">inventory_2</span>
              <p className="text-sm text-muted">No encontramos productos para ese filtro.</p>
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
                    className="group relative flex flex-col w-full overflow-hidden rounded-xl text-left transition-all border border-line bg-secondary/30 hover:border-primary/50 shadow-sm"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-square w-full bg-white overflow-hidden">
                      {product.image ? (
                        <ProductImage
                          product={product}
                          alt={getProductDisplayName(product)}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="material-symbols-outlined text-3xl text-muted/20">image</span>
                        </div>
                      )}

                      {/* Top Left Price Pill */}
                      <div className="absolute top-0 left-0 bg-secondary/95 backdrop-blur-sm rounded-br-lg px-2 py-1 shadow-sm border-b border-r border-line/50">
                        <span className="text-[11px] font-black text-primary tracking-wide">
                          ${product.salePrice.toLocaleString("es-AR")}
                        </span>
                      </div>

                      {/* Top Right Quantity Pill */}
                      {inCart > 0 && (
                        <div className="absolute top-0 right-0 bg-primary rounded-bl-lg px-2 py-1 shadow-md z-10 transition-transform active:scale-95">
                          <span className="text-[11px] font-black text-white">{inCart}x</span>
                        </div>
                      )}

                      {/* Stock Badge (Low Stock) - Positioned below quantity if needed, or top right if empty */}
                      {product.stock <= 3 && inCart === 0 && (
                        <div className="absolute top-2 right-2 rounded-md bg-red-500 px-1.5 py-0.5 shadow-sm">
                          <span className="text-[9px] font-bold text-white">¡{product.stock} left!</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Title Bar */}
                    <div className={`w-full p-2.5 transition-colors border-t border-line/50 ${inCart > 0 ? "bg-primary text-white" : "bg-white text-ink hover:text-primary"}`}>
                      <h4 className="truncate text-[11px] font-bold text-center uppercase tracking-wider">{getProductDisplayName(product)}</h4>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {renderPager(mobilePage, mobileTotalPages, setMobilePage)}
        </section>

        {/* Mobile Floating Sticky Footer */}
        {cartItemCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary to-accent p-4 shadow-xl shadow-primary/30 text-white transform transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined text-white/90">shopping_bag</span>
                  <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-primary border border-primary/20">
                    {cartItemCount}
                  </span>
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] uppercase font-bold text-white/80 tracking-widest">Ver Pedido</span>
                  <span className="font-semibold text-sm">Finalizar Venta</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="font-headline font-bold text-[17px]">${total.toLocaleString("es-AR")}</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </div>
            </button>
          </div>
        )}

        {/* Order Summary Modal (Mobile) */}
        {isMobileCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm md:hidden p-2 transition-opacity">
            <div className="w-full max-h-[90vh] bg-background rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-line">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/50 bg-white">
                <div>
                  <h3 className="font-headline text-lg text-ink font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">shopping_cart_checkout</span>
                    Resumen de Orden
                  </h3>
                  <p className="text-[11px] font-medium text-muted mt-0.5">{cartItemCount} productos seleccionados</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-secondary/60 text-ink/60 hover:bg-line transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Cart Items Mapping */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
                {cart.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-line p-6 text-center text-sm text-muted">
                    No hay productos en el carrito.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-start justify-between gap-3 border-b border-line/40 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="size-16 shrink-0 rounded-lg bg-secondary border border-line overflow-hidden">
                        {item.product.image ? (
                          <ProductImage product={item.product} className="h-full w-full object-cover" alt={getProductDisplayName(item.product)} />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted/30">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink leading-tight mb-2">
                          {getProductDisplayName(item.product)}
                        </span>
                        <div className="flex items-center gap-3 bg-secondary/30 rounded-lg p-1 w-fit border border-line">
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, -1)}
                            className="flex size-7 items-center justify-center rounded-md bg-white text-ink shadow-sm border border-line/50 hover:border-primary/40"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <span className="text-sm font-bold text-ink w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, 1)}
                            className="flex size-7 items-center justify-center rounded-md bg-white text-ink shadow-sm border border-line/50 hover:border-primary/40"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="font-semibold text-sm text-primary">${(item.product.salePrice * item.quantity).toLocaleString("es-AR")}</span>
                        <button
                          type="button"
                          onClick={() => {
                            removeFromCart(item.product.id);
                            if (cart.length === 1) setIsMobileCartOpen(false);
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-50 px-2 py-1 rounded-md"
                        >
                          <span className="material-symbols-outlined text-[12px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Footer */}
              <div className="bg-secondary/30 p-5 border-t border-line/60">
                <div className="mb-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted font-medium">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-line">
                    <span className="font-bold text-sm text-ink uppercase tracking-widest">Total</span>
                    <span className="font-headline text-2xl text-primary font-bold">${total.toLocaleString("es-AR")}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
                    Método de Pago
                  </label>
                  <div className="flex bg-white rounded-xl border border-line p-1 gap-1">
                    {(["efectivo", "tarjeta", "transferencia"] as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition-all text-[11px] font-bold ${
                          paymentMethod === method
                            ? "bg-primary text-white shadow-md"
                            : "bg-transparent text-ink/60 hover:bg-secondary"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {method === "efectivo" ? "payments" : method === "tarjeta" ? "credit_card" : "account_balance"}
                        </span>
                        <span className="capitalize">{method === "transferencia" ? "Transf." : method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFinalizeSale}
                  disabled={cart.length === 0 || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
                      Confirmar Venta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          DESKTOP LAYOUT
          ══════════════════════════════════════════════════ */}
      <div className="hidden h-full flex-1 flex-col overflow-hidden bg-secondary/20 md:flex xl:flex-row">

      {/* Left: Product Selector */}
      <section ref={desktopCatalogRef} className="flex flex-1 flex-col space-y-5 overflow-hidden p-4 md:p-6">
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>{successMsg}
          </div>
        )}

        {/* Search + Client row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary pointer-events-none">person_search</span>
            <select
              className="w-full pl-12 pr-4 h-14 bg-white border border-line rounded-xl appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-ink font-medium"
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
              className="w-full pl-12 pr-4 h-14 bg-white border border-line rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-ink"
              placeholder="Buscar producto por nombre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => {
                setSelectedMainCategoryId(null);
                setSelectedSubCategoryId(null);
                setMobilePage(1);
                setDesktopPage(1);
              }}
              type="button"
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!selectedMainCategoryId ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-line text-ink/60 hover:border-primary"}`}
            >
              Todos
            </button>
            {mainCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  const isSelected = selectedMainCategoryId === cat.id;
                  setSelectedMainCategoryId(isSelected ? null : cat.id);
                  setSelectedSubCategoryId(null);
                  setMobilePage(1);
                  setDesktopPage(1);
                }}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedMainCategoryId === cat.id ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-line text-ink/60 hover:border-primary"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          {selectedMainCategoryId && subCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 pl-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubCategoryId(null);
                  setMobilePage(1);
                  setDesktopPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${!selectedSubCategoryId ? "bg-secondary text-primary" : "bg-white/50 border border-line/60 text-muted hover:border-primary/50"}`}
              >
                Todo en {mainCategories.find(c => c.id === selectedMainCategoryId)?.name}
              </button>
              {subCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubCategoryId(selectedSubCategoryId === cat.id ? null : cat.id);
                    setMobilePage(1);
                    setDesktopPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${selectedSubCategoryId === cat.id ? "bg-secondary text-primary" : "bg-white/50 border border-line/60 text-muted hover:border-primary/50"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto pr-1 admin-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted/40 gap-3">
              <span className="material-symbols-outlined text-5xl">inventory_2</span>
              <p className="font-medium text-muted">No hay productos en esta categoría</p>
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
                    className="bg-white rounded-2xl p-3 border border-line/60 hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer flex flex-col h-full"
                  >
                    <div className="aspect-square rounded-xl bg-secondary mb-3 relative overflow-hidden">
                      {product.image ? (
                        <ProductImage product={product} alt={getProductDisplayName(product)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-muted/25">image</span>
                        </div>
                      )}
                      <div className={`absolute top-2 right-2 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold ${lowStock ? "bg-red-100 text-red-600" : "bg-white/90 text-ink/70"}`}>
                        {product.stock} EN STOCK
                      </div>
                      {inCart > 0 && (
                        <div className="absolute bottom-2 left-2 bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          {inCart} en pedido
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-ink text-sm leading-tight mb-1 group-hover:text-primary transition-colors">{getProductDisplayName(product)}</h3>
                    <p className="text-xs text-muted mb-2">{product.categoryName || ""}</p>
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
      <aside className="flex w-full flex-col border-t border-line bg-white shadow-xl xl:w-96 xl:border-l xl:border-t-0">
        <div className="border-b border-line p-4 md:p-6">
          <h3 className="font-headline text-xl font-bold text-ink flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">point_of_sale</span>
            Resumen del Pedido
          </h3>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 md:p-6 admin-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted/30 gap-3">
              <span className="material-symbols-outlined text-5xl">shopping_cart</span>
              <p className="text-sm font-medium text-muted">Hacé clic en un producto para agregarlo</p>
            </div>
          ) : cart.map(item => (
            <div key={item.product.id} className="flex items-center gap-4">
              <div className="size-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                {item.product.image ? (
                  <ProductImage product={item.product} alt={getProductDisplayName(item.product)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-muted/30">image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-ink truncate">{getProductDisplayName(item.product)}</h4>
                <p className="text-xs text-primary font-bold">${(item.product.salePrice * item.quantity).toLocaleString("es-AR")}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => updateQty(item.product.id, -1)}
                    className="size-6 rounded-lg bg-secondary flex items-center justify-center text-ink/60 hover:bg-primary hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">remove</span>
                  </button>
                  <span className="text-sm font-bold w-5 text-center text-ink">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.product.id, 1)}
                    className="size-6 rounded-lg bg-secondary flex items-center justify-center text-ink/60 hover:bg-primary hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">add</span>
                  </button>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.product.id)} className="text-muted/40 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>

        {/* Totals + Payment */}
        <div className="space-y-6 bg-secondary/60 p-4 md:p-6 border-t border-line/50">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="text-ink font-semibold">${subtotal.toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t border-white/80">
              <span className="font-headline font-bold text-ink">Total</span>
              <span className="text-primary font-bold text-xl">${total.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted uppercase tracking-widest">Método de Pago</p>
            <div className="grid grid-cols-3 gap-2">
              {(["efectivo", "tarjeta", "transferencia"] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl border-2 bg-white p-2 text-center transition-all sm:p-3 ${paymentMethod === method ? "border-primary text-primary shadow-md" : "border-line/50 text-muted hover:border-primary/30 hover:text-primary"}`}
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
            className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95"
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
