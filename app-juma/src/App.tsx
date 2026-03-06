import { useEffect, useMemo, useState } from "react";

type Tab = "clientes" | "productos" | "catalogo" | "inventario" | "pedidos" | "finanzas";
type OrderStatus = "PENDIENTE" | "REALIZADO";

type Client = {
  id: number;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  initialStock: number;
  sourceUrl: string;
  createdAt: string;
};

type OrderItem = {
  productId: number;
  quantity: number;
  unitSalePrice: number;
  unitPurchasePrice: number;
};

type Order = {
  id: number;
  clientId: number;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
};

type NewOrderItem = {
  productId: string;
  quantity: string;
};

const LS_KEY = "juma_dashboard_state_v1";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("catalogo");
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "" });
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    salePrice: "",
    stock: "",
    sourceUrl: "",
  });
  const [orderForm, setOrderForm] = useState({
    clientId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "PENDIENTE" as OrderStatus,
    items: [{ productId: "", quantity: "1" }] as NewOrderItem[],
  });

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { clients: Client[]; products: Product[]; orders: Order[] };
      setClients(parsed.clients ?? []);
      setProducts(parsed.products ?? []);
      setOrders(parsed.orders ?? []);
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ clients, products, orders }));
  }, [clients, products, orders]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const clientMap = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);

  const lowStockProducts = useMemo(() => products.filter((product) => product.stock <= 2), [products]);

  const addClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientForm.name.trim()) return;

    setClients((prev) => [
      {
        id: prev.length + 1,
        name: clientForm.name.trim(),
        phone: clientForm.phone.trim(),
        email: clientForm.email.trim(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    setClientForm({ name: "", phone: "", email: "" });
  };

  const addProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!productForm.name.trim() || !productForm.purchasePrice || !productForm.salePrice || !productForm.stock) {
      return;
    }

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
        sourceUrl: productForm.sourceUrl.trim(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    setProductForm({ name: "", category: "", purchasePrice: "", salePrice: "", stock: "", sourceUrl: "" });
    setActiveTab("catalogo");
  };

  const addOrderItemRow = () => {
    setOrderForm((prev) => ({ ...prev, items: [...prev.items, { productId: "", quantity: "1" }] }));
  };

  const removeOrderItemRow = (index: number) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateOrderItemRow = (index: number, key: keyof NewOrderItem, value: string) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
  };

  const buildOrderItems = (items: NewOrderItem[]) => {
    const normalized: OrderItem[] = [];
    for (const row of items) {
      const productId = Number(row.productId);
      const quantity = Number(row.quantity);
      const product = productMap.get(productId);
      if (!product || Number.isNaN(quantity) || quantity <= 0) continue;
      normalized.push({
        productId,
        quantity,
        unitSalePrice: product.salePrice,
        unitPurchasePrice: product.purchasePrice,
      });
    }
    return normalized;
  };

  const canDeductStock = (items: OrderItem[]) => {
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || product.stock < item.quantity) return false;
    }
    return true;
  };

  const deductStock = (items: OrderItem[]) => {
    setProducts((prev) =>
      prev.map((product) => {
        const row = items.find((item) => item.productId === product.id);
        if (!row) return product;
        return { ...product, stock: Math.max(0, product.stock - row.quantity) };
      }),
    );
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

    if (orderForm.status === "REALIZADO") {
      deductStock(items);
    }

    setOrders((prev) => [
      {
        id: prev.length + 1,
        clientId,
        date: orderForm.date,
        status: orderForm.status,
        items,
      },
      ...prev,
    ]);

    setOrderForm({
      clientId: "",
      date: new Date().toISOString().slice(0, 10),
      status: "PENDIENTE",
      items: [{ productId: "", quantity: "1" }],
    });
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

  const clientStats = useMemo(() => {
    return clients.map((client) => {
      const clientOrders = orders.filter((order) => order.clientId === client.id);
      const totalSpent = clientOrders
        .filter((order) => order.status === "REALIZADO")
        .reduce((acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity * item.unitSalePrice, 0), 0);
      const lastOrderDate = clientOrders.length
        ? [...clientOrders].sort((a, b) => (a.date < b.date ? 1 : -1))[0].date
        : "-";
      return {
        client,
        orders: clientOrders,
        totalSpent,
        lastOrderDate,
      };
    });
  }, [clients, orders]);

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

    return {
      investedThisMonth,
      totalInvestment,
      totalAccessoriesPrice,
      dailySales,
      maxSale,
    };
  }, [products, completedOrders]);

  const orderTotal = (order: Order) => order.items.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0);

  return (
    <div className="app-shell">
      <header className="header">
        <h1>Juma Accessory</h1>
        <p>Gestion integral de clientes, productos, inventario, pedidos y finanzas</p>
      </header>

      <nav className="tabs">
        <button className={`tab ${activeTab === "catalogo" ? "active" : ""}`} onClick={() => setActiveTab("catalogo")}>Catalogo</button>
        <button className={`tab ${activeTab === "productos" ? "active" : ""}`} onClick={() => setActiveTab("productos")}>Alta productos</button>
        <button className={`tab ${activeTab === "clientes" ? "active" : ""}`} onClick={() => setActiveTab("clientes")}>Clientes</button>
        <button className={`tab ${activeTab === "inventario" ? "active" : ""}`} onClick={() => setActiveTab("inventario")}>Inventario</button>
        <button className={`tab ${activeTab === "pedidos" ? "active" : ""}`} onClick={() => setActiveTab("pedidos")}>Pedidos</button>
        <button className={`tab ${activeTab === "finanzas" ? "active" : ""}`} onClick={() => setActiveTab("finanzas")}>Finanzas</button>
      </nav>

      {error ? <div className="alert">{error}</div> : null}

      {activeTab === "catalogo" ? (
        <section className="panel">
          <h2>Catalogo online</h2>
          <div className="products-grid">
            {products.length === 0 ? (
              <article className="empty">No hay productos cargados.</article>
            ) : (
              products.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="img-placeholder" />
                  <div className="info">
                    <h3>{product.name}</h3>
                    <p>{product.category}</p>
                    <p className="stock">Stock: {product.stock}</p>
                    <p className="price">${product.salePrice.toLocaleString("es-AR")}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "productos" ? (
        <section className="panel">
          <h2>Alta de productos</h2>
          <form className="form-grid" onSubmit={addProduct}>
            <input placeholder="Nombre" value={productForm.name} onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))} />
            <input placeholder="Categoria" value={productForm.category} onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))} />
            <input type="number" placeholder="Precio compra (interno)" value={productForm.purchasePrice} onChange={(e) => setProductForm((prev) => ({ ...prev, purchasePrice: e.target.value }))} />
            <input type="number" placeholder="Precio venta" value={productForm.salePrice} onChange={(e) => setProductForm((prev) => ({ ...prev, salePrice: e.target.value }))} />
            <input type="number" placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm((prev) => ({ ...prev, stock: e.target.value }))} />
            <input placeholder="URL proveedor (interno)" value={productForm.sourceUrl} onChange={(e) => setProductForm((prev) => ({ ...prev, sourceUrl: e.target.value }))} />
            <button type="submit">Guardar producto</button>
          </form>
        </section>
      ) : null}

      {activeTab === "clientes" ? (
        <section className="panel">
          <h2>Registro de clientes</h2>
          <form className="form-grid" onSubmit={addClient}>
            <input placeholder="Nombre" value={clientForm.name} onChange={(e) => setClientForm((prev) => ({ ...prev, name: e.target.value }))} />
            <input placeholder="Telefono" value={clientForm.phone} onChange={(e) => setClientForm((prev) => ({ ...prev, phone: e.target.value }))} />
            <input placeholder="Email" value={clientForm.email} onChange={(e) => setClientForm((prev) => ({ ...prev, email: e.target.value }))} />
            <button type="submit">Guardar cliente</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Pedidos</th>
                  <th>Ultima compra</th>
                  <th>Total comprado</th>
                </tr>
              </thead>
              <tbody>
                {clientStats.map((row) => (
                  <tr key={row.client.id}>
                    <td>{row.client.name}</td>
                    <td>{row.client.phone || "-"} {row.client.email ? `| ${row.client.email}` : ""}</td>
                    <td>{row.orders.length}</td>
                    <td>{row.lastOrderDate}</td>
                    <td>${row.totalSpent.toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "inventario" ? (
        <section className="panel">
          <h2>Control de inventario</h2>
          {lowStockProducts.length > 0 ? (
            <p className="warn">Productos en falta o stock bajo: {lowStockProducts.map((p) => p.name).join(", ")}</p>
          ) : (
            <p className="ok">No hay productos en falta.</p>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoria</th>
                  <th>Stock</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td className={product.stock <= 2 ? "danger" : ""}>{product.stock}</td>
                    <td>
                      <div className="stock-edit">
                        <button type="button" onClick={() => updateStock(product.id, product.stock - 1)}>-</button>
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => updateStock(product.id, Number(e.target.value))}
                        />
                        <button type="button" onClick={() => updateStock(product.id, product.stock + 1)}>+</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "pedidos" ? (
        <section className="panel">
          <h2>Gestion de pedidos</h2>

          <form className="order-form" onSubmit={addOrder}>
            <div className="order-head">
              <select value={orderForm.clientId} onChange={(e) => setOrderForm((prev) => ({ ...prev, clientId: e.target.value }))}>
                <option value="">Cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              <input type="date" value={orderForm.date} onChange={(e) => setOrderForm((prev) => ({ ...prev, date: e.target.value }))} />
              <select value={orderForm.status} onChange={(e) => setOrderForm((prev) => ({ ...prev, status: e.target.value as OrderStatus }))}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="REALIZADO">Realizado</option>
              </select>
            </div>

            {orderForm.items.map((row, index) => (
              <div className="order-row" key={`row-${index}`}>
                <select value={row.productId} onChange={(e) => updateOrderItemRow(index, "productId", e.target.value)}>
                  <option value="">Producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (stock: {product.stock})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => updateOrderItemRow(index, "quantity", e.target.value)}
                />
                <button type="button" className="ghost" onClick={() => removeOrderItemRow(index)} disabled={orderForm.items.length === 1}>Quitar</button>
              </div>
            ))}

            <div className="order-actions">
              <button type="button" className="ghost" onClick={addOrderItemRow}>+ Agregar item</button>
              <button type="submit">Guardar pedido</button>
            </div>
          </form>

          <div className="stats-grid">
            <div className="stat"><strong>{orders.length}</strong><span>Pedidos totales</span></div>
            <div className="stat"><strong>{pendingOrders.length}</strong><span>Pendientes</span></div>
            <div className="stat"><strong>{completedOrders.length}</strong><span>Realizados</span></div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{clientMap.get(order.clientId)?.name ?? "-"}</td>
                    <td>{order.date}</td>
                    <td>{order.status}</td>
                    <td>${orderTotal(order).toLocaleString("es-AR")}</td>
                    <td>
                      {order.status === "PENDIENTE" ? (
                        <button type="button" onClick={() => markOrderAsRealized(order.id)}>Marcar realizado</button>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "finanzas" ? (
        <section className="panel">
          <h2>Control financiero</h2>
          <div className="stats-grid">
            <div className="stat"><strong>${finance.investedThisMonth.toLocaleString("es-AR")}</strong><span>Invertido este mes (mayorista)</span></div>
            <div className="stat"><strong>${finance.totalInvestment.toLocaleString("es-AR")}</strong><span>Inversion total actual (mayorista)</span></div>
            <div className="stat"><strong>${finance.totalAccessoriesPrice.toLocaleString("es-AR")}</strong><span>Valor total accesorios (venta)</span></div>
          </div>

          <h3>Ventas por dia del mes</h3>
          <div className="chart">
            {finance.dailySales.map((row) => {
              const height = Math.max(4, Math.round((row.total / finance.maxSale) * 140));
              return (
                <div key={row.day} className="bar-col" title={`Dia ${row.day}: $${row.total.toLocaleString("es-AR")}`}>
                  <div className="bar" style={{ height: `${height}px` }} />
                  <span>{row.day}</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default App;
