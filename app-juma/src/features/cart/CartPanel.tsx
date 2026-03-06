import type { Product } from "../../types";

type CartRow = { product: Product; quantity: number; subtotal: number };

type CartPanelProps = {
  cartRows: CartRow[];
  cartItemsCount: number;
  cartTotal: number;
  onUpdateCartQuantity: (productId: number, quantity: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onClearCart: () => void;
};

function CartPanel({
  cartRows,
  cartItemsCount,
  cartTotal,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
}: CartPanelProps) {
  return (
    <section className="panel">
      <h2>Carrito</h2>
      {cartRows.length === 0 ? (
        <article className="empty">No hay productos en el carrito.</article>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {cartRows.map((row) => (
                  <tr key={`cart-${row.product.id}`}>
                    <td>{row.product.name}</td>
                    <td>${row.product.salePrice.toLocaleString("es-AR")}</td>
                    <td>
                      <div className="stock-edit">
                        <button type="button" onClick={() => onUpdateCartQuantity(row.product.id, row.quantity - 1)}>-</button>
                        <input
                          type="number"
                          min={1}
                          max={row.product.stock}
                          value={row.quantity}
                          onChange={(e) => onUpdateCartQuantity(row.product.id, Number(e.target.value))}
                        />
                        <button type="button" onClick={() => onUpdateCartQuantity(row.product.id, row.quantity + 1)}>+</button>
                      </div>
                    </td>
                    <td>${row.subtotal.toLocaleString("es-AR")}</td>
                    <td>
                      <button type="button" className="ghost" onClick={() => onRemoveFromCart(row.product.id)}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="stats-grid">
            <div className="stat"><strong>{cartItemsCount}</strong><span>Productos en carrito</span></div>
            <div className="stat"><strong>${cartTotal.toLocaleString("es-AR")}</strong><span>Total carrito</span></div>
          </div>
          <button type="button" className="ghost" onClick={onClearCart}>Vaciar carrito</button>
        </>
      )}
    </section>
  );
}

export default CartPanel;

