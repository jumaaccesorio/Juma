import { useMemo, useState } from "react";
import type { Category, Client, Order, OrderItem, Product } from "../../types";
import { api } from "../../lib/api";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [cart, setCart] = useState<QuickSaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const enabledProducts = useMemo(() => products.filter(p => p.enabled && p.stock > 0), [products]);

  const filteredProducts = useMemo(() => {
    let list = enabledProducts;
    if (selectedCategoryId) list = list.filter(p => p.categoryId === selectedCategoryId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.categoryName || "").toLowerCase().includes(q));
    }
    return list;
  }, [enabledProducts, selectedCategoryId, searchQuery]);

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
    <div className="flex flex-1 overflow-hidden h-full bg-[#f8f6f6]">

      {/* Left: Product Selector */}
      <section className="flex-1 flex flex-col p-6 space-y-5 overflow-hidden">
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>{successMsg}
          </div>
        )}

        {/* Search + Client row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!selectedCategoryId ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-[#F3EDE2] text-slate-600 hover:border-primary"}`}
          >
            Todos
          </button>
          {categories.filter(c => !c.parentId).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
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
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
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
        </div>
      </section>

      {/* Right: Order Summary */}
      <aside className="w-96 bg-white border-l border-[#F3EDE2] flex flex-col shadow-xl">
        <div className="p-6 border-b border-[#F3EDE2]">
          <h3 className="font-serif text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">point_of_sale</span>
            Resumen del Pedido
          </h3>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: "thin" }}>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-3">
              <span className="material-symbols-outlined text-5xl">shopping_cart</span>
              <p className="text-sm font-medium text-slate-400">Hacé clic en un producto para agregarlo</p>
            </div>
          ) : cart.map(item => (
            <div key={item.product.id} className="flex items-center gap-4">
              <div className="size-16 rounded-xl overflow-hidden bg-[#F3EDE2] flex-shrink-0">
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-300">image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-800 truncate">{item.product.name}</h4>
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
        <div className="p-6 bg-[#F3EDE2] space-y-6">
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
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white border-2 transition-all ${paymentMethod === method ? "border-primary text-primary shadow-md" : "border-transparent text-slate-500 hover:border-primary/30 hover:text-primary"}`}
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
  );
}

export default QuickSalePanel;
