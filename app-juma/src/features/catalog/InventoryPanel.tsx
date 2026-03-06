import type { Product } from "../../types";

type InventoryPanelProps = {
  products: Product[];
  lowStockProducts: Product[];
  onUpdateStock: (productId: number, newStock: number) => void;
};

function InventoryPanel({ products, lowStockProducts, onUpdateStock }: InventoryPanelProps) {
  return (
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
                    <button type="button" onClick={() => onUpdateStock(product.id, product.stock - 1)}>-</button>
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => onUpdateStock(product.id, Number(e.target.value))}
                    />
                    <button type="button" onClick={() => onUpdateStock(product.id, product.stock + 1)}>+</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default InventoryPanel;

