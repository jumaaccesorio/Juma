import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_PASS,
  ADMIN_SESSION_KEY,
  ADMIN_USER,
  CART_ADMIN_KEY,
  CART_GUEST_KEY,
} from "./constants";
import AdminHomePanel from "./features/admin/AdminHomePanel";
import AdminDashboard from "./features/admin/AdminDashboard";
import AdminSidebar from "./features/admin/AdminSidebar";
import AdminTopNav from "./features/admin/AdminTopNav";
import QuickSalePanel from "./features/admin/QuickSalePanel";
import CartPanel from "./features/cart/CartPanel";
import CatalogPanel from "./features/catalog/CatalogPanel";
import CategoriesPanel from "./features/catalog/CategoriesPanel";
import InventoryPanel from "./features/catalog/InventoryPanel";
import ProductsPanel from "./features/catalog/ProductsPanel";
import FinancePanel from "./features/finance/FinancePanel";
import OrdersPanel from "./features/orders/OrdersPanel";
import ClientsPanel from "./features/users/ClientsPanel";
import StoreHeader from "./features/users/StoreHeader";
import ClientProfilePanel from "./features/users/ClientProfilePanel";
import CustomerAuthModal from "./features/users/CustomerAuthModal";
import type { CartItem, Client, Favorite, FeaturedPanel, HeroBanner, NewOrderItem, Order, OrderItem, Product, Tab, Category } from "./types";
import { api } from "./lib/api";
import { getProductDisplayName } from "./lib/productLabel";

const CLIENT_SESSION_KEY = "juma_client";

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

type ImportedProductRow = {
  name: string;
  subName: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  categoryName: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}

function splitCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseImportedProducts(csvText: string): ImportedProductRow[] {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = splitCsvLine(lines[0], delimiter).map((header) => header.trim().toLowerCase());
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const getValue = (values: string[], key: string) => {
    const index = headerIndex.get(key);
    return index === undefined ? "" : (values[index] ?? "").trim();
  };

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    const purchasePrice = Number(getValue(values, "precio_compra").replace(",", "."));
    const salePrice = Number(getValue(values, "precio_venta").replace(",", "."));
    const stock = Number(getValue(values, "stock").replace(",", "."));
    return {
      name: getValue(values, "nombre"),
      subName: getValue(values, "subnombre"),
      purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : 0,
      salePrice: Number.isFinite(salePrice) ? salePrice : 0,
      stock: Number.isFinite(stock) ? stock : 0,
      categoryName: getValue(values, "categoria"),
    };
  });
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("catalogo");
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<number | null>(null);
  const [featuredPanels, setFeaturedPanels] = useState<FeaturedPanel[]>(DEFAULT_FEATURED_PANELS);
  const [heroBanner, setHeroBanner] = useState<HeroBanner>(DEFAULT_HERO_BANNER);
  const [homeConfigDirty, setHomeConfigDirty] = useState(false);
  const [isSavingHomeConfig, setIsSavingHomeConfig] = useState(false);
  const [error, setError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ user: "", password: "" });
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "checkout">("login");
  const [lastOrderConfirmation, setLastOrderConfirmation] = useState<{ orderId: number; customerName?: string } | null>(null);

  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "" });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    subName: "",
    categoryId: "",
    purchasePrice: "",
    salePrice: "",
    stock: "",
    sourceUrl: "",
    isFeatured: false,
  });
  const [productImageData, setProductImageData] = useState("");
  const [orderForm, setOrderForm] = useState({
    clientId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "PENDIENTE" as "PENDIENTE" | "REALIZADO",
    items: [] as NewOrderItem[],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [c, cats, p, o, fp, hb] = await Promise.all([
          api.getClients(),
          api.getCategories(),
          api.getProducts(),
          api.getOrders(),
          api.getFeaturedPanels(),
          api.getHeroBanner()
        ]);
        setClients(c);
        setCategories(cats);
        setProducts(p.map((x) => ({ ...x, enabled: x.enabled ?? true, image: x.image ?? "" })));
        setOrders(o);
        if (fp.length > 0) setFeaturedPanels(fp);
        if (hb) setHeroBanner(hb);
        setHomeConfigDirty(false);
      } catch (err) {
        console.error("Failed to load initial data from Supabase", err);
      }
    }
    loadData();
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(CLIENT_SESSION_KEY);
    if (stored) {
      try {
        const client: Client = JSON.parse(stored);
        setCurrentClient(client);
        api.getFavorites(client.id).then(setFavorites).catch(() => {});
      } catch { /* ignore */ }
    }
  }, []);


  useEffect(() => {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    setIsAdminLogged(raw === "1");
  }, []);

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
      setActiveTab("carrito");
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

  const addCategory = async (name: string, parentId?: number | null) => {
    try {
      setError("");
      const cat = await api.addCategory(name, parentId);
      setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error(err);
      setError(`No se pudo guardar la categoria en Supabase. ${getErrorMessage(err, "Revisa que hayas ejecutado schema_complete.sql y las politicas RLS.")}`);
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      setError("");
      await api.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      setError(`No se pudo eliminar la categoria en Supabase. ${getErrorMessage(err, "Verifica permisos y politicas RLS.")}`);
    }
  };

  const toggleFavorite = async (productId: number) => {
    if (!currentClient) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      return;
    }
    const isFav = favorites.some(f => f.productId === productId);
    await api.toggleFavorite(currentClient.id, productId, isFav);
    if (isFav) {
      setFavorites(prev => prev.filter(f => f.productId !== productId));
    } else {
      setFavorites(prev => [...prev, { id: Date.now(), clientId: currentClient.id, productId, createdAt: new Date().toISOString() }]);
    }
  };

  const navigateToCategoryInCatalog = (categoryId: number | null) => {
    setCatalogCategoryFilter(categoryId);
    setActiveTab("catalogo");
  };

  const updateCategory = async (id: number, name: string) => {
    try {
      setError("");
      const updatedCategory = await api.updateCategory(id, name);
      setCategories((prev) => prev.map((category) => (category.id === id ? updatedCategory : category)).sort((a, b) => a.name.localeCompare(b.name)));
      setProducts((prev) => prev.map((product) => (product.categoryId === id ? { ...product, categoryName: updatedCategory.name } : product)));
      setFeaturedPanels((prev) => prev.map((panel) => (panel.categoryId === id ? { ...panel, title: updatedCategory.name } : panel)));
    } catch (err) {
      console.error(err);
      setError(`No se pudo actualizar la categoria en Supabase. ${getErrorMessage(err, "Verifica permisos y politicas RLS.")}`);
    }
  };

  const saveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientForm.name.trim()) return;
    try {
      if (editingUserId) {
        await api.updateClient(editingUserId, { 
          name: clientForm.name.trim(), 
          phone: clientForm.phone.trim(), 
          email: clientForm.email.trim() 
        });
        setClients(prev => prev.map(c => c.id === editingUserId ? { ...c, ...clientForm } : c));
        setEditingUserId(null);
      } else {
        const newClient = await api.addClient({ 
          name: clientForm.name.trim(), 
          phone: clientForm.phone.trim(), 
          email: clientForm.email.trim() 
        });
        setClients((prev) => [newClient, ...prev]);
      }
      setClientForm({ name: "", phone: "", email: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    try {
      await api.deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
      if (editingUserId === id) {
        setEditingUserId(null);
        setClientForm({ name: "", phone: "", email: "" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditingUser = (client: Client) => {
    setEditingUserId(client.id);
    setClientForm({ name: client.name, phone: client.phone, email: client.email });
    // Tab switching or scrolling is handled by the UI or implicitly by the switch
  };

  const addProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if ((!productForm.name.trim() && !productForm.subName.trim()) || !productForm.purchasePrice || !productForm.salePrice || !productForm.stock) return;
    const stock = Number(productForm.stock);
    if (Number.isNaN(stock) || stock < 0) return;
    
    try {
      const newProduct = await api.addProduct({
        name: productForm.name.trim() || productForm.subName.trim(),
        subName: productForm.subName.trim(),
        categoryId: Number(productForm.categoryId) || undefined,
        isFeatured: productForm.isFeatured,
        purchasePrice: Number(productForm.purchasePrice),
        salePrice: Number(productForm.salePrice),
        stock,
        initialStock: stock,
        enabled: true,
        image: productImageData,
        sourceUrl: productForm.sourceUrl.trim(),
      });
      setProducts((prev) => [newProduct, ...prev]);
      
      setProductForm({ name: "", subName: "", categoryId: "", purchasePrice: "", salePrice: "", stock: "", sourceUrl: "", isFeatured: false });
      setProductImageData("");
      setActiveTab("catalogo");
    } catch (err) {
      console.error(err);
      setError("Error al guardar producto");
    }
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

  const addOrder = async (event: React.FormEvent<HTMLFormElement>) => {
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
    
    try {
      const newOrder = await api.addOrder({
        clientId,
        date: orderForm.date,
        status: orderForm.status,
        items
      });
      
      if (orderForm.status === "REALIZADO") {
        for (const item of items) {
            const prod = productMap.get(item.productId);
            if(prod) await api.updateStock(prod.id, Math.max(0, prod.stock - item.quantity));
        }
        deductStock(items);
      }
      
      setOrders((prev) => [newOrder, ...prev]);
      setOrderForm({ clientId: "", date: new Date().toISOString().slice(0, 10), status: "PENDIENTE", items: [] });
    } catch (err) {
      console.error(err);
      setError("Hubo un error al guardar el pedido en base de datos.");
    }
  };

  const markOrderAsRealized = async (orderId: number) => {
    setError("");
    const order = orders.find((row) => row.id === orderId);
    if (!order || order.status === "REALIZADO") return;
    if (!canDeductStock(order.items)) {
      setError(`No se puede completar el pedido #${order.id}: stock insuficiente.`);
      return;
    }
    
    try {
      await api.updateOrderStatus(orderId, "REALIZADO");
      for (const item of order.items) {
          const prod = productMap.get(item.productId);
          if(prod) await api.updateStock(prod.id, Math.max(0, prod.stock - item.quantity));
      }
      deductStock(order.items);
      setOrders((prev) => prev.map((row) => (row.id === orderId ? { ...row, status: "REALIZADO" } : row)));
    } catch (err) {
      console.error(err);
      setError("Error al actualizar pedido en base de datos.");
    }
  };

  const updateStock = async (productId: number, newStock: number) => {
    if (Number.isNaN(newStock) || newStock < 0) return;
    try {
      await api.updateStock(productId, newStock);
      setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, stock: newStock } : product)));
    } catch (err) { console.error(err); }
  };

  const toggleProductEnabled = async (productId: number) => {
    const product = productMap.get(productId);
    if (!product) return;
    try {
      await api.updateProduct(productId, { enabled: !product.enabled });
      setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, enabled: !product.enabled } : product)));
    } catch (err) { console.error(err); }
  };

  const saveProductEdits = async (productId: number, updates: Partial<Product>) => {
    const normalizedName = updates.name?.trim() ?? "";
    const normalizedSubName = updates.subName?.trim() ?? "";
    const payload: Partial<Product> = {
      ...updates,
      name: normalizedName || normalizedSubName,
      subName: normalizedSubName,
    };
    try {
      await api.updateProduct(productId, payload);
      setProducts((prev) =>
        prev.map((product) => {
          if (product.id !== productId) return product;
          const next = { ...product, ...payload };
          return { ...next, name: getProductDisplayName(next) };
        }),
      );
    } catch (err) {
      console.error(err);
    }
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
    const totalInvestment = products.reduce((acc, product) => acc + product.purchasePrice * product.stock, 0);
    const totalAccessoriesPrice = products.reduce((acc, product) => acc + product.salePrice * product.stock, 0);

    const monthKeySet = new Set<string>();
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    monthKeySet.add(currentMonthKey);

    for (const order of completedOrders) {
      const date = new Date(order.date);
      if (Number.isNaN(date.getTime())) continue;
      monthKeySet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    }

    for (const product of products) {
      const date = new Date(product.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      monthKeySet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    }

    const months = Array.from(monthKeySet)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((key) => {
        const [year, month] = key.split("-").map(Number);
        const date = new Date(year, month - 1, 1);
        return {
          key,
          label: date.toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
        };
      });

    const monthlySummaries = months.map((month) => {
      const [year, monthIndexValue] = month.key.split("-").map(Number);
      const monthIndex = monthIndexValue - 1;
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      const dailyBreakdown = Array.from({ length: lastDay }, (_, index) => ({
        day: index + 1,
        label: `${index + 1}/${monthIndexValue}`,
        income: 0,
        expense: 0,
        salesCount: 0,
      }));

      const ordersInMonth = completedOrders.filter((order) => {
        const date = new Date(order.date);
        return !Number.isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === monthIndex;
      });

      let incomeMonth = 0;
      let salesCountMonth = 0;

      for (const order of ordersInMonth) {
        const date = new Date(order.date);
        const dayIndex = date.getDate() - 1;
        const orderIncome = order.items.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0);
        const orderExpense = order.items.reduce((acc, item) => acc + item.quantity * item.unitPurchasePrice, 0);
        incomeMonth += orderIncome;
        salesCountMonth += 1;
        if (dailyBreakdown[dayIndex]) {
          dailyBreakdown[dayIndex].income += orderIncome;
          dailyBreakdown[dayIndex].expense += orderExpense;
          dailyBreakdown[dayIndex].salesCount += 1;
        }
      }

      const expenseMonth = products
        .filter((product) => {
          const created = new Date(product.createdAt);
          return !Number.isNaN(created.getTime()) && created.getFullYear() === year && created.getMonth() === monthIndex;
        })
        .reduce((acc, product) => acc + product.purchasePrice * product.initialStock, 0);

      const balanceMonth = incomeMonth - expenseMonth;
      const averageTicket = salesCountMonth > 0 ? incomeMonth / salesCountMonth : 0;
      const bestDay = dailyBreakdown.reduce(
        (best, day) => (day.income > best.income ? day : best),
        dailyBreakdown[0] ?? { day: 1, label: "1", income: 0, expense: 0, salesCount: 0 },
      );
      const chartMax = Math.max(1, ...dailyBreakdown.flatMap((day) => [day.income, day.expense]));

      return {
        key: month.key,
        label: month.label,
        incomeMonth,
        expenseMonth,
        salesCountMonth,
        balanceMonth,
        averageTicket,
        bestDayLabel: bestDay.label,
        bestDayIncome: bestDay.income,
        dailyBreakdown,
        chartMax,
      };
    });

    return {
      months,
      selectedMonthKey: months[0]?.key ?? currentMonthKey,
      monthlySummaries,
      totalInvestment,
      totalAccessoriesPrice,
    };
  }, [products, completedOrders]);

  const orderTotal = (order: Order) => order.items.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0);

  const addToCart = (productId: number) => {
    setError("");
    setLastOrderConfirmation(null);
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
    setLastOrderConfirmation(null);
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
    setLastOrderConfirmation(null);
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setLastOrderConfirmation(null);
    setCartItems([]);
  };

  const updateFeaturedPanelText = (id: string, field: "title" | "cta", value: string) => {
    setHomeConfigDirty(true);
    setFeaturedPanels((prev) => prev.map((panel) => (panel.id === id ? { ...panel, [field]: value } : panel)));
  };

  const updateFeaturedPanelImage = (id: string, file: File | null) => {
    if (!file) return;
    setHomeConfigDirty(true);
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
    setHomeConfigDirty(true);
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
    setHomeConfigDirty(true);
    setFeaturedPanels((prev) => prev.filter((panel) => panel.id !== id));
  };

  const updateHeroText = (field: "tag" | "title" | "subtitle", value: string) => {
    setHomeConfigDirty(true);
    setHeroBanner((prev) => ({ ...prev, [field]: value }));
  };

  const updateHeroImage = (file: File | null) => {
    if (!file) return;
    setHomeConfigDirty(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setHeroBanner((prev) => ({ ...prev, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const saveHomeConfiguration = async () => {
    try {
      setError("");
      setIsSavingHomeConfig(true);
      await api.saveHomeConfiguration(heroBanner, featuredPanels);
      setHomeConfigDirty(false);
    } catch (err) {
      console.error(err);
      setError(`No se pudo guardar la configuracion del inicio. ${getErrorMessage(err, "Verifica permisos y conexion con Supabase.")}`);
    } finally {
      setIsSavingHomeConfig(false);
    }
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
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      try {
        await api.updateProduct(productId, { image: dataUrl });
        setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, image: dataUrl } : product)));
      } catch (err) {
        console.error("Error updating image", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const importProducts = async (file: File | null) => {
    if (!file) return;
    try {
      const csvText = await file.text();
      const rows = parseImportedProducts(csvText).filter(
        (row) =>
          (row.name.trim() || row.subName.trim()) &&
          row.purchasePrice >= 0 &&
          row.salePrice >= 0 &&
          row.stock >= 0,
      );

      if (rows.length === 0) {
        setError("El archivo no tiene productos validos para importar.");
        return;
      }

      const categoryMap = new Map(categories.map((category) => [category.name.trim().toLowerCase(), category]));
      const importedProducts: Product[] = [];
      const createdCategories: Category[] = [];

      for (const row of rows) {
        let categoryId: number | undefined;
        const normalizedCategory = row.categoryName.trim().toLowerCase();
        if (normalizedCategory) {
          let category = categoryMap.get(normalizedCategory);
          if (!category) {
            category = await api.addCategory(row.categoryName.trim());
            categoryMap.set(normalizedCategory, category);
            createdCategories.push(category);
          }
          categoryId = category.id;
        }

        const product = await api.addProduct({
          name: row.name.trim() || row.subName.trim(),
          subName: row.subName.trim(),
          categoryId,
          purchasePrice: row.purchasePrice,
          salePrice: row.salePrice,
          stock: row.stock,
          initialStock: row.stock,
          enabled: true,
          image: "",
          sourceUrl: "",
          isFeatured: false,
        });

        importedProducts.push(product);
      }

      if (createdCategories.length > 0) {
        setCategories((prev) => [...prev, ...createdCategories].sort((a, b) => a.name.localeCompare(b.name)));
      }
      if (importedProducts.length > 0) {
        setProducts((prev) => [...importedProducts, ...prev]);
      }
      setError("");
    } catch (err) {
      console.error(err);
      setError("No se pudo importar el archivo.");
    }
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
    setActiveTab("dashboard");
  };

  const logoutAdmin = () => {
    setIsAdminLogged(false);
    setIsAdminSidebarOpen(false);
    setActiveTab("catalogo");
  };

  const handleCustomerCheckout = async (guestData?: { name: string, email: string, phone: string }) => {
    try {
      if (cartItems.length === 0) return;
      
      const orderItems = buildOrderItems(cartItems.map(c => ({ productId: String(c.productId), quantity: String(c.quantity) })));
      const newOrder = await api.addOrder({
        clientId: currentClient?.id,
        guestName: guestData?.name,
        guestEmail: guestData?.email,
        guestPhone: guestData?.phone,
        date: new Date().toISOString().slice(0, 10),
        status: "PENDIENTE",
        items: orderItems,
      });
      
      setOrders(prev => [newOrder, ...prev]);
      setCartItems([]);
      setLastOrderConfirmation({
        orderId: newOrder.id,
        customerName: currentClient?.name || guestData?.name,
      });
      setActiveTab("catalogo");
    } catch(err) {
      console.error(err);
      setError("Error al procesar el pedido.");
    }
  };

  const isAdminTab = isAdminLogged && ["dashboard", "catalogo", "venta_rapida", "inicio_admin", "categorias", "productos", "clientes", "inventario", "pedidos", "finanzas"].includes(activeTab);

  if (isAdminTab) {
    return (
      <div className="flex min-h-screen bg-background font-body text-ink">
        <AdminSidebar
          activeTab={activeTab}
          onSetActiveTab={setActiveTab}
          isOpen={isAdminSidebarOpen}
          onClose={() => setIsAdminSidebarOpen(false)}
        />
        <main className="flex-1 min-h-screen flex flex-col md:ml-64">
          <AdminTopNav
            onOpenMenu={() => setIsAdminSidebarOpen(true)}
            onPreview={() => setActiveTab("catalogo")}
            onLogout={logoutAdmin}
          />
          
          <div className="flex-1">
            {error ? (
              <div className="px-4 pt-20 sm:px-6 lg:px-10">
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2 border border-red-100">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </div>
              </div>
            ) : null}

            {activeTab === "dashboard" && (
              <AdminDashboard 
                orders={orders} 
                products={products} 
                clients={clients} 
                lowStockProducts={lowStockProducts}
                onSetActiveTab={setActiveTab}
              />
            )}

            {activeTab === "catalogo" && (
              <div className="px-4 pb-6 pt-20 sm:px-6 lg:px-10 lg:pb-10">
                <CatalogPanel
                  products={catalogProducts}
                  categories={categories}
                  onAddToCart={addToCart}
                  featuredPanels={featuredPanels}
                  heroBanner={heroBanner}
                  favoriteProductIds={new Set(favorites.map(f => f.productId))}
                  onToggleFavorite={toggleFavorite}
                  initialCategory={catalogCategoryFilter}
                  onCategoryChange={setCatalogCategoryFilter}
                  onPanelCategoryClick={navigateToCategoryInCatalog}
                />
              </div>
            )}

            {activeTab === "venta_rapida" && (
              <div className="px-4 pb-6 pt-20 sm:px-6 lg:px-10 lg:pb-10">
                <QuickSalePanel
                  products={products}
                  categories={categories}
                  clients={clients}
                  onOrderPlaced={(order) => setOrders(prev => [order, ...prev])}
                  onUpdateStock={(productId, newStock) => setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p))}
                />
              </div>
            )}

            {activeTab === "inicio_admin" && (
              <div className="px-4 pb-6 pt-20 sm:px-6 lg:px-10 lg:pb-10">
                <AdminHomePanel
                  heroBanner={heroBanner}
                  featuredPanels={featuredPanels}
                  categories={categories}
                  canAddMorePanels={featuredPanels.length < PANEL_SLOTS.length}
                  hasUnsavedChanges={homeConfigDirty}
                  isSaving={isSavingHomeConfig}
                  onUpdateHeroText={updateHeroText}
                  onUpdateHeroImage={updateHeroImage}
                  onUpdateFeaturedPanelText={updateFeaturedPanelText}
                  onUpdateFeaturedPanelImage={updateFeaturedPanelImage}
                  onUpdateFeaturedPanelCategory={(id, categoryId, categoryName) => {
                    setHomeConfigDirty(true);
                    setFeaturedPanels(prev => prev.map(p => p.id === id ? { ...p, categoryId, title: categoryName ?? p.title } : p));
                  }}
                  onAddFeaturedPanel={addFeaturedPanel}
                  onRemoveFeaturedPanel={removeFeaturedPanel}
                  onSaveConfiguration={saveHomeConfiguration}
                />
              </div>
            )}

            {activeTab === "categorias" && (
              <div className="px-4 pb-6 pt-20 sm:px-6 lg:px-10 lg:pb-10">
                <CategoriesPanel
                  categories={categories}
                  products={products}
                  onAddCategory={addCategory}
                  onUpdateCategory={updateCategory}
                  onDeleteCategory={deleteCategory}
                />
              </div>
            )}

            {activeTab === "productos" && (
              <div className="px-4 pb-6 pt-20 sm:px-6 lg:px-10 lg:pb-10">
                <ProductsPanel
                  products={products}
                  categories={categories}
                  productForm={productForm}
                  productImageData={productImageData}
                  onProductFormChange={setProductForm}
                  onProductImageChange={updateProductImage}
                  onAddProduct={addProduct}
                  onToggleProductEnabled={toggleProductEnabled}
                  onUpdateExistingProductImage={updateExistingProductImage}
                  onSaveProductEdits={saveProductEdits}
                  onImportProducts={importProducts}
                />
              </div>
            )}

            {activeTab === "clientes" && (
              <div className="px-4 pb-6 pt-20 sm:px-6 lg:px-10 lg:pb-10">
                <ClientsPanel
                  clientForm={clientForm}
                  clientStats={clientStats}
                  onClientFormChange={setClientForm}
                  onAddClient={saveUser}
                  onEditClick={startEditingUser}
                  onDeleteClick={deleteUser}
                  editingClientId={editingUserId}
                  onCancelEdit={() => {
                    setEditingUserId(null);
                    setClientForm({ name: "", phone: "", email: "" });
                  }}
                />
              </div>
            )}

            {activeTab === "inventario" && (
              <div className="px-4 pb-6 pt-20 sm:px-6 lg:px-10 lg:pb-10">
                <InventoryPanel
                  products={products}
                  categories={categories}
                  lowStockProducts={lowStockProducts}
                  onUpdateStock={updateStock}
                  onSaveProductEdits={saveProductEdits}
                />
              </div>
            )}

            {activeTab === "pedidos" && (
              <div className="px-4 pb-6 pt-20 sm:px-6 lg:px-10 lg:pb-10">
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
            )}

            {activeTab === "finanzas" && (
              <div className="px-4 pb-6 pt-20 sm:px-6 lg:px-10 lg:pb-10">
                <FinancePanel finance={finance} />
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout-container flex min-h-screen flex-col">
      <StoreHeader
        activeTab={activeTab}
        isAdminLogged={isAdminLogged}
        adminForm={adminForm}
        adminError={adminError}
        cartItemsCount={cartItemsCount}
        cartTotal={cartTotal}
        currentClient={currentClient}
        onSetActiveTab={setActiveTab}
        onAdminFormChange={setAdminForm}
        onLoginAdmin={loginAdmin}
        onLogoutAdmin={logoutAdmin}
        onLoginClientClick={() => { setAuthModalMode("login"); setShowAuthModal(true); }}
      />

      {error ? (
        <div className="bg-red-50 text-red-500 p-4 text-center text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </div>
      ) : null}

      {showAuthModal && (
        <CustomerAuthModal
          allowGuest={authModalMode === "checkout"}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(client) => {
            localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(client));
            setCurrentClient(client);
            api.getFavorites(client.id).then(setFavorites).catch(() => {});
            setShowAuthModal(false);
            if (authModalMode === "checkout") {
              handleCustomerCheckout();
            } else {
              setActiveTab("perfil");
            }
          }}
          onGuestContinue={authModalMode === "checkout" ? (guestData) => {
            setShowAuthModal(false);
            handleCustomerCheckout(guestData);
          } : undefined}
        />
      )}

      <main className="flex flex-col grow">

      {activeTab === "catalogo" ? (
        <CatalogPanel
          products={catalogProducts}
          categories={categories}
          onAddToCart={addToCart}
          featuredPanels={featuredPanels}
          heroBanner={heroBanner}
          favoriteProductIds={new Set(favorites.map(f => f.productId))}
          onToggleFavorite={toggleFavorite}
          initialCategory={catalogCategoryFilter}
          onCategoryChange={setCatalogCategoryFilter}
          onPanelCategoryClick={navigateToCategoryInCatalog}
        />
      ) : null}

      {activeTab === "carrito" ? (
        <CartPanel
          cartRows={cartRows}
          cartItemsCount={cartItemsCount}
          cartTotal={cartTotal}
          orderConfirmation={lastOrderConfirmation}
          onUpdateCartQuantity={updateCartQuantity}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          onCheckoutClick={() => {
            if (currentClient) {
              handleCustomerCheckout();
            } else {
              setAuthModalMode("checkout");
              setShowAuthModal(true);
            }
          }}
          onBackToCatalog={() => {
            setLastOrderConfirmation(null);
            setActiveTab("catalogo");
          }}
        />
      ) : null}

      {activeTab === "perfil" && currentClient ? (
        <ClientProfilePanel
          clientName={currentClient.name}
          myOrders={orders.filter(o => o.clientId === currentClient.id)}
          myFavorites={products.filter(p => favorites.some(f => f.productId === p.id))}
          onLogout={() => {
            localStorage.removeItem(CLIENT_SESSION_KEY);
            setCurrentClient(null);
            setFavorites([]);
            setActiveTab("catalogo");
          }}
        />
      ) : null}
      
      </main>

      <footer className="bg-background-dark text-slate-400 px-6 md:px-20 py-16 mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-16">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-white text-xl font-black uppercase mb-4">Juma Accessory</h3>
            <p className="text-sm leading-relaxed mb-6">Tu destino premium para accesorios de plata 925 y joyería de diseño. Elegancia y calidad en cada pieza.</p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/juma.accessory/" target="_blank" rel="noreferrer" className="size-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">public</span>
              </a>
              <a href="#" className="size-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">alternate_email</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Tienda</h4>
            <ul className="space-y-4 text-sm">
              <li><button onClick={() => setActiveTab("catalogo")} className="hover:text-primary transition-colors uppercase font-medium tracking-wider text-[10px]">Catálogo</button></li>
              <li><button onClick={() => setActiveTab("carrito")} className="hover:text-primary transition-colors uppercase font-medium tracking-wider text-[10px]">Carrito</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Soporte</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors uppercase font-medium tracking-wider text-[10px]">Envíos y Entregas</a></li>
              <li><a href="#" className="hover:text-primary transition-colors uppercase font-medium tracking-wider text-[10px]">Políticas de Devolución</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Contacto</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                Buenos Aires, Argentina
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm">mail</span>
                hola@jumaaccessory.com
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-medium">
          <p>© 2024 Juma Accessory. Todos los derechos reservados.</p>
          <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            <span className="material-symbols-outlined">payments</span>
            <span className="material-symbols-outlined">credit_card</span>
            <span className="material-symbols-outlined">account_balance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
