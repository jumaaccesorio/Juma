import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_PASS,
  ADMIN_SESSION_KEY,
  ADMIN_USER,
  CART_ADMIN_KEY,
  CART_GUEST_KEY,
  LS_KEY,
} from "./constants";
import AdminHomePanel from "./features/admin/AdminHomePanel";
import CartPanel from "./features/cart/CartPanel";
import CatalogPanel from "./features/catalog/CatalogPanel";
import InventoryPanel from "./features/catalog/InventoryPanel";
import ProductsPanel from "./features/catalog/ProductsPanel";
import FinancePanel from "./features/finance/FinancePanel";
import OrdersPanel from "./features/orders/OrdersPanel";
import ClientsPanel from "./features/users/ClientsPanel";
import StoreHeader from "./features/users/StoreHeader";
import type { CartItem, Client, FeaturedPanel, HeroBanner, NewOrderItem, Order, OrderItem, Product, Tab } from "./types";

const DEFAULT_FEATURED_PANELS: FeaturedPanel[] = [
  {
    id: "blanco",
    title: "Acero Quirurgico Blanco",
    cta: "Mira mas",
    className: "card-left",
    image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "dorado",
    title: "Acero Dorado",
    cta: "Mira mas",
    className: "card-top",
    image: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "quirurgico",
    title: "Acero Quirurgico",
    cta: "Mira mas",
    className: "card-bottom-left",
    image: "https://images.unsplash.com/photo-1588444650700-6d6db1f6f7fd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "charms",
    title: "Pulseras Charms",
    cta: "Mira mas",
    className: "card-bottom-right",
    image: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=80",
  },
];
const PANEL_SLOTS: FeaturedPanel["className"][] = ["card-left", "card-top", "card-bottom-left", "card-bottom-right"];
const DEFAULT_HERO_BANNER: HeroBanner = {
  tag: "Tienda online minorista",
  title: "3 Cuotas Sin Interes",
  subtitle: "20% off efectivo / 10% off transferencia",
  image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1800&q=80",
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("catalogo");
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [featuredPanels, setFeaturedPanels] = useState<FeaturedPanel[]>(DEFAULT_FEATURED_PANELS);
  const [heroBanner, setHeroBanner] = useState<HeroBanner>(DEFAULT_HERO_BANNER);
  const [error, setError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [adminForm, setAdminForm] = useState({ user: "", password: "" });

  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "" });
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    salePrice: "",
    stock: "",
    sourceUrl: "",
  });
  const [productImageData, setProductImageData] = useState("");
  const [orderForm, setOrderForm] = useState({
    clientId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "PENDIENTE" as "PENDIENTE" | "REALIZADO",
    items: [] as NewOrderItem[],
  });

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { clients: Client[]; products: Product[]; orders: Order[]; featuredPanels?: FeaturedPanel[]; heroBanner?: HeroBanner };
      setClients(parsed.clients ?? []);
      setProducts((parsed.products ?? []).map((product) => ({ ...product, enabled: product.enabled ?? true, image: product.image ?? "" })));
      setOrders(parsed.orders ?? []);
      setFeaturedPanels(parsed.featuredPanels?.length ? parsed.featuredPanels : DEFAULT_FEATURED_PANELS);
      setHeroBanner(parsed.heroBanner ?? DEFAULT_HERO_BANNER);
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    setIsAdminLogged(raw === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ clients, products, orders, featuredPanels, heroBanner }));
  }, [clients, products, orders, featuredPanels, heroBanner]);

  useEffect(() => {
    localStorage.setItem(ADMIN_SESSION_KEY, isAdminLogged ? "1" : "0");
  }, [isAdminLogged]);

  useEffect(() => {
    const key = isAdminLogged ? CART_ADMIN_KEY : CART_GUEST_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) {
      setCartItems([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as CartItem[];
      setCartItems(parsed ?? []);
    } catch {
      localStorage.removeItem(key);
      setCartItems([]);
    }
  }, [isAdminLogged]);

  useEffect(() => {
    const key = isAdminLogged ? CART_ADMIN_KEY : CART_GUEST_KEY;
    localStorage.setItem(key, JSON.stringify(cartItems));
  }, [isAdminLogged, cartItems]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const clientMap = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const isRestrictedTab = !isAdminLogged && activeTab !== "catalogo" && activeTab !== "carrito";

  useEffect(() => {
    if (!isAdminLogged && isRestrictedTab) {
      setActiveTab("catalogo");
    }
  }, [isAdminLogged, isRestrictedTab]);

  const lowStockProducts = useMemo(() => products.filter((product) => product.stock <= 2), [products]);
  const cartRows = useMemo(
    () =>
      cartItems
        .map((item) => {
          const product = productMap.get(item.productId);
          if (!product) return null;
          return { product, quantity: item.quantity, subtotal: item.quantity * product.salePrice };
        })
        .filter((row): row is { product: Product; quantity: number; subtotal: number } => row !== null),
    [cartItems, productMap],
  );
  const cartTotal = useMemo(() => cartRows.reduce((acc, row) => acc + row.subtotal, 0), [cartRows]);
  const cartItemsCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const catalogProducts = useMemo(() => products.filter((product) => product.enabled), [products]);

  const addClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientForm.name.trim()) return;
    setClients((prev) => [{ id: prev.length + 1, name: clientForm.name.trim(), phone: clientForm.phone.trim(), email: clientForm.email.trim(), createdAt: new Date().toISOString() }, ...prev]);
    setClientForm({ name: "", phone: "", email: "" });
  };

  const addProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!productForm.name.trim() || !productForm.purchasePrice || !productForm.salePrice || !productForm.stock) return;
    const stock = Number(productForm.stock);
    if (Number.isNaN(stock) || stock < 0) return;
    setProducts((prev) => [
      {
        id: prev.length + 1,
        name: productForm.name.trim(),
        category: productForm.category.trim() || "Sin categoria",
        purchasePrice: Number(productForm.purchasePrice),
        salePrice: Number(productForm.salePrice),
        stock,
        initialStock: stock,
        enabled: true,
        image: productImageData,
        sourceUrl: productForm.sourceUrl.trim(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setProductForm({ name: "", category: "", purchasePrice: "", salePrice: "", stock: "", sourceUrl: "" });
    setProductImageData("");
    setActiveTab("catalogo");
  };

  const removeOrderItemRow = (index: number) => {
    setOrderForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateOrderItemRow = (index: number, key: keyof NewOrderItem, value: string) => {
    setOrderForm((prev) => ({ ...prev, items: prev.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)) }));
  };

  const addProductToOrder = (productId: number) => {
    const product = productMap.get(productId);
    if (!product || product.stock <= 0) return;

    setOrderForm((prev) => {
      const existingIndex = prev.items.findIndex((item) => Number(item.productId) === productId);
      if (existingIndex === -1) {
        return { ...prev, items: [...prev.items, { productId: String(productId), quantity: "1" }] };
      }

      const existing = prev.items[existingIndex];
      const nextQty = Math.min(Number(existing.quantity || "1") + 1, product.stock);
      return {
        ...prev,
        items: prev.items.map((item, index) => (index === existingIndex ? { ...item, quantity: String(nextQty) } : item)),
      };
    });
  };

  const buildOrderItems = (items: NewOrderItem[]) => {
    const normalized: OrderItem[] = [];
    for (const row of items) {
      const productId = Number(row.productId);
      const quantity = Number(row.quantity);
      const product = productMap.get(productId);
      if (!product || Number.isNaN(quantity) || quantity <= 0) continue;
      normalized.push({ productId, quantity, unitSalePrice: product.salePrice, unitPurchasePrice: product.purchasePrice });
    }
    return normalized;
  };

  const canDeductStock = (items: OrderItem[]) => items.every((item) => {
    const product = productMap.get(item.productId);
    return product != null && product.stock >= item.quantity;
  });

  const deductStock = (items: OrderItem[]) => {
    setProducts((prev) => prev.map((product) => {
      const row = items.find((item) => item.productId === product.id);
      if (!row) return product;
      return { ...product, stock: Math.max(0, product.stock - row.quantity) };
    }));
  };

  const addOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const clientId = Number(orderForm.clientId);
    if (!clientId || !clientMap.get(clientId)) {
      setError("Selecciona un cliente valido.");
      return;
    }
    const items = buildOrderItems(orderForm.items);
    if (items.length === 0) {
      setError("Agrega al menos un producto valido al pedido.");
      return;
    }
    if (orderForm.status === "REALIZADO" && !canDeductStock(items)) {
      setError("No hay stock suficiente para completar este pedido.");
      return;
    }
    if (orderForm.status === "REALIZADO") deductStock(items);
    setOrders((prev) => [{ id: prev.length + 1, clientId, date: orderForm.date, status: orderForm.status, items }, ...prev]);
    setOrderForm({ clientId: "", date: new Date().toISOString().slice(0, 10), status: "PENDIENTE", items: [] });
  };

  const markOrderAsRealized = (orderId: number) => {
    setError("");
    const order = orders.find((row) => row.id === orderId);
    if (!order || order.status === "REALIZADO") return;
    if (!canDeductStock(order.items)) {
      setError(`No se puede completar el pedido #${order.id}: stock insuficiente.`);
      return;
    }
    deductStock(order.items);
    setOrders((prev) => prev.map((row) => (row.id === orderId ? { ...row, status: "REALIZADO" } : row)));
  };

  const updateStock = (productId: number, newStock: number) => {
    if (Number.isNaN(newStock) || newStock < 0) return;
    setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, stock: newStock } : product)));
  };

  const toggleProductEnabled = (productId: number) => {
    setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, enabled: !product.enabled } : product)));
  };

  const clientStats = useMemo(() => clients.map((client) => {
    const clientOrders = orders.filter((order) => order.clientId === client.id);
    const totalSpent = clientOrders.filter((order) => order.status === "REALIZADO").reduce((acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity * item.unitSalePrice, 0), 0);
    const lastOrderDate = clientOrders.length ? [...clientOrders].sort((a, b) => (a.date < b.date ? 1 : -1))[0].date : "-";
    return { client, orders: clientOrders, totalSpent, lastOrderDate };
  }), [clients, orders]);

  const pendingOrders = useMemo(() => orders.filter((order) => order.status === "PENDIENTE"), [orders]);
  const completedOrders = useMemo(() => orders.filter((order) => order.status === "REALIZADO"), [orders]);

  const finance = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const investedThisMonth = products
      .filter((product) => {
        const created = new Date(product.createdAt);
        return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
      })
      .reduce((acc, product) => acc + product.purchasePrice * product.initialStock, 0);
    const totalInvestment = products.reduce((acc, product) => acc + product.purchasePrice * product.stock, 0);
    const totalAccessoriesPrice = products.reduce((acc, product) => acc + product.salePrice * product.stock, 0);
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailySales = Array.from({ length: lastDay }, (_, i) => ({ day: i + 1, total: 0 }));
    for (const order of completedOrders) {
      const date = new Date(order.date);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate();
        const orderTotal = order.items.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0);
        dailySales[day - 1].total += orderTotal;
      }
    }
    const maxSale = Math.max(...dailySales.map((row) => row.total), 1);
    return { investedThisMonth, totalInvestment, totalAccessoriesPrice, dailySales, maxSale };
  }, [products, completedOrders]);

  const orderTotal = (order: Order) => order.items.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0);

  const addToCart = (productId: number) => {
    setError("");
    const product = productMap.get(productId);
    if (!product || product.stock <= 0) {
      setError("No hay stock disponible para ese producto.");
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (!existing) return [...prev, { productId, quantity: 1 }];
      if (existing.quantity >= product.stock) {
        setError("No puedes agregar mas unidades que el stock disponible.");
        return prev;
      }
      return prev.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item));
    });
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }
    const product = productMap.get(productId);
    if (!product) return;
    const safeQuantity = Math.min(quantity, Math.max(0, product.stock));
    setCartItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity: safeQuantity } : item)));
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setCartItems([]);

  const updateFeaturedPanelText = (id: string, field: "title" | "cta", value: string) => {
    setFeaturedPanels((prev) => prev.map((panel) => (panel.id === id ? { ...panel, [field]: value } : panel)));
  };

  const updateFeaturedPanelImage = (id: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setFeaturedPanels((prev) => prev.map((panel) => (panel.id === id ? { ...panel, image: dataUrl } : panel)));
    };
    reader.readAsDataURL(file);
  };

  const addFeaturedPanel = () => {
    if (featuredPanels.length >= PANEL_SLOTS.length) return;
    const nextSlot = PANEL_SLOTS.find((slot) => !featuredPanels.some((panel) => panel.className === slot));
    if (!nextSlot) return;
    setFeaturedPanels((prev) => [
      ...prev,
      {
        id: `panel-${Date.now()}`,
        title: "Nuevo cartel",
        cta: "Mira mas",
        className: nextSlot,
        image: DEFAULT_HERO_BANNER.image,
      },
    ]);
  };

  const removeFeaturedPanel = (id: string) => {
    setFeaturedPanels((prev) => prev.filter((panel) => panel.id !== id));
  };

  const updateHeroText = (field: "tag" | "title" | "subtitle", value: string) => {
    setHeroBanner((prev) => ({ ...prev, [field]: value }));
  };

  const updateHeroImage = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setHeroBanner((prev) => ({ ...prev, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const updateProductImage = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setProductImageData(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const updateExistingProductImage = (productId: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, image: dataUrl } : product)));
    };
    reader.readAsDataURL(file);
  };

  const loginAdmin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError("");
    if (adminForm.user.trim() !== ADMIN_USER || adminForm.password !== ADMIN_PASS) {
      setAdminError("Credenciales admin invalidas.");
      return;
    }
    setIsAdminLogged(true);
    setAdminForm({ user: "", password: "" });
    setActiveTab("inicio_admin");
  };

  const logoutAdmin = () => {
    setIsAdminLogged(false);
    setActiveTab("catalogo");
  };

  return (
    <div className="app-shell">
      <StoreHeader
        activeTab={activeTab}
        isAdminLogged={isAdminLogged}
        adminForm={adminForm}
        adminError={adminError}
        cartItemsCount={cartItemsCount}
        cartTotal={cartTotal}
        onSetActiveTab={setActiveTab}
        onAdminFormChange={setAdminForm}
        onLoginAdmin={loginAdmin}
        onLogoutAdmin={logoutAdmin}
      />

      {error ? <div className="alert">{error}</div> : null}

      {activeTab === "catalogo" ? (
        <CatalogPanel
          products={catalogProducts}
          onAddToCart={addToCart}
          featuredPanels={featuredPanels}
          heroBanner={heroBanner}
        />
      ) : null}

      {activeTab === "inicio_admin" ? (
        <div className="admin-scope">
          <AdminHomePanel
            heroBanner={heroBanner}
            featuredPanels={featuredPanels}
            canAddMorePanels={featuredPanels.length < PANEL_SLOTS.length}
            onUpdateHeroText={updateHeroText}
            onUpdateHeroImage={updateHeroImage}
            onUpdateFeaturedPanelText={updateFeaturedPanelText}
            onUpdateFeaturedPanelImage={updateFeaturedPanelImage}
            onAddFeaturedPanel={addFeaturedPanel}
            onRemoveFeaturedPanel={removeFeaturedPanel}
          />
        </div>
      ) : null}

      {activeTab === "carrito" ? (
        <CartPanel
          cartRows={cartRows}
          cartItemsCount={cartItemsCount}
          cartTotal={cartTotal}
          onUpdateCartQuantity={updateCartQuantity}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
        />
      ) : null}

      {activeTab === "productos" ? (
        <div className="admin-scope">
          <ProductsPanel
            products={products}
            productForm={productForm}
            productImageData={productImageData}
            onProductFormChange={setProductForm}
            onProductImageChange={updateProductImage}
            onAddProduct={addProduct}
            onToggleProductEnabled={toggleProductEnabled}
            onUpdateExistingProductImage={updateExistingProductImage}
          />
        </div>
      ) : null}

      {activeTab === "clientes" ? (
        <div className="admin-scope">
          <ClientsPanel
            clientForm={clientForm}
            clientStats={clientStats}
            onClientFormChange={setClientForm}
            onAddClient={addClient}
          />
        </div>
      ) : null}

      {activeTab === "inventario" ? (
        <div className="admin-scope">
          <InventoryPanel
            products={products}
            lowStockProducts={lowStockProducts}
            onUpdateStock={updateStock}
          />
        </div>
      ) : null}

      {activeTab === "pedidos" ? (
        <div className="admin-scope">
          <OrdersPanel
            clients={clients}
            products={products}
            orders={orders}
            orderForm={orderForm}
            pendingOrdersCount={pendingOrders.length}
            completedOrdersCount={completedOrders.length}
            onOrderFormChange={setOrderForm}
            onAddOrder={addOrder}
            onAddProductToOrder={addProductToOrder}
            onRemoveOrderItemRow={removeOrderItemRow}
            onUpdateOrderItemRow={updateOrderItemRow}
            onMarkOrderAsRealized={markOrderAsRealized}
            getClientName={(clientId) => clientMap.get(clientId)?.name ?? "-"}
            getOrderTotal={orderTotal}
          />
        </div>
      ) : null}

      {activeTab === "finanzas" ? <div className="admin-scope"><FinancePanel finance={finance} /></div> : null}
    </div>
  );
}

export default App;
