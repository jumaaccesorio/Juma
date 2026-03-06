import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Client, NewOrderItem, Order, OrderStatus, Product } from "../../types";

type OrderForm = {
  clientId: string;
  date: string;
  status: OrderStatus;
  items: NewOrderItem[];
};

type OrdersPanelProps = {
  clients: Client[];
  products: Product[];
  orders: Order[];
  orderForm: OrderForm;
  pendingOrdersCount: number;
  completedOrdersCount: number;
  onOrderFormChange: (next: OrderForm) => void;
  onAddOrder: (event: FormEvent<HTMLFormElement>) => void;
  onAddProductToOrder: (productId: number) => void;
  onRemoveOrderItemRow: (index: number) => void;
  onUpdateOrderItemRow: (index: number, key: keyof NewOrderItem, value: string) => void;
  onMarkOrderAsRealized: (orderId: number) => void;
  getClientName: (clientId: number) => string;
  getOrderTotal: (order: Order) => number;
};

function OrdersPanel({
  clients,
  products,
  orders,
  orderForm,
  pendingOrdersCount,
  completedOrdersCount,
  onOrderFormChange,
  onAddOrder,
  onAddProductToOrder,
  onRemoveOrderItemRow,
  onUpdateOrderItemRow,
  onMarkOrderAsRealized,
  getClientName,
  getOrderTotal,
}: OrdersPanelProps) {
  const [query, setQuery] = useState("");

  const enabledProducts = useMemo(() => products.filter((product) => product.enabled), [products]);
  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return enabledProducts;
    return enabledProducts.filter((product) =>
      [product.name, product.category].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [enabledProducts, query]);

  const selectedRows = useMemo(
    () =>
      orderForm.items
        .map((item, index) => {
          const product = products.find((row) => row.id === Number(item.productId));
          if (!product) return null;
          return { index, item, product };
        })
        .filter((row): row is { index: number; item: NewOrderItem; product: Product } => row !== null),
    [orderForm.items, products],
  );

  return (
    <section className="panel">
      <h2>Gestion de pedidos</h2>

      <form className="order-form" onSubmit={onAddOrder}>
        <div className="order-head">
          <select value={orderForm.clientId} onChange={(e) => onOrderFormChange({ ...orderForm, clientId: e.target.value })}>
            <option value="">Cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <input type="date" value={orderForm.date} onChange={(e) => onOrderFormChange({ ...orderForm, date: e.target.value })} />
          <select value={orderForm.status} onChange={(e) => onOrderFormChange({ ...orderForm, status: e.target.value as OrderStatus })}>
            <option value="PENDIENTE">Pendiente</option>
            <option value="REALIZADO">Realizado</option>
          </select>
        </div>

        <div className="products-search">
          <input
            placeholder="Filtrar productos para el pedido"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="order-product-grid">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className="order-product-card"
              onClick={() => onAddProductToOrder(product.id)}
              disabled={product.stock <= 0}
            >
              <span className="order-price">${product.salePrice.toLocaleString("es-AR")}</span>
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <div className="img-placeholder" />
              )}
              <strong>{product.name}</strong>
              <small>{product.stock > 0 ? `Stock ${product.stock}` : "Sin stock"}</small>
            </button>
          ))}
        </div>

        <h3>Productos seleccionados</h3>
        {selectedRows.length === 0 ? (
          <p className="field-label">Selecciona productos desde la grilla.</p>
        ) : (
          selectedRows.map((row) => (
            <div className="order-row" key={`row-${row.index}`}>
              <div className="selected-product-cell">
                {row.product.image ? <img src={row.product.image} alt={row.product.name} /> : <div className="img-placeholder" />}
                <span>{row.product.name}</span>
              </div>
              <input
                type="number"
                min={1}
                max={row.product.stock}
                value={row.item.quantity}
                onChange={(e) => onUpdateOrderItemRow(row.index, "quantity", e.target.value)}
              />
              <button type="button" className="ghost" onClick={() => onRemoveOrderItemRow(row.index)}>Quitar</button>
            </div>
          ))
        )}

        <div className="order-actions">
          <span className="field-label">Items: {selectedRows.length}</span>
          <button type="submit">Guardar pedido</button>
        </div>
      </form>

      <div className="stats-grid">
        <div className="stat"><strong>{orders.length}</strong><span>Pedidos totales</span></div>
        <div className="stat"><strong>{pendingOrdersCount}</strong><span>Pendientes</span></div>
        <div className="stat"><strong>{completedOrdersCount}</strong><span>Realizados</span></div>
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
                <td>{getClientName(order.clientId)}</td>
                <td>{order.date}</td>
                <td>{order.status}</td>
                <td>${getOrderTotal(order).toLocaleString("es-AR")}</td>
                <td>
                  {order.status === "PENDIENTE" ? (
                    <button type="button" onClick={() => onMarkOrderAsRealized(order.id)}>Marcar realizado</button>
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
  );
}

export default OrdersPanel;

