import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Product } from "../../types";

type ProductForm = {
  name: string;
  category: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
  sourceUrl: string;
};

type ProductsPanelProps = {
  products: Product[];
  productForm: ProductForm;
  productImageData: string;
  onProductFormChange: (next: ProductForm) => void;
  onProductImageChange: (file: File | null) => void;
  onAddProduct: (event: FormEvent<HTMLFormElement>) => void;
  onToggleProductEnabled: (productId: number) => void;
  onUpdateExistingProductImage: (productId: number, file: File | null) => void;
};

function ProductsPanel({
  products,
  productForm,
  productImageData,
  onProductFormChange,
  onProductImageChange,
  onAddProduct,
  onToggleProductEnabled,
  onUpdateExistingProductImage,
}: ProductsPanelProps) {
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [product.name, product.category].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [products, query]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStockUnits = products.reduce((acc, product) => acc + product.stock, 0);
    const totalSaleStock = products.reduce((acc, product) => acc + product.salePrice * product.stock, 0);
    const totalCostStock = products.reduce((acc, product) => acc + product.purchasePrice * product.stock, 0);
    const projectedProfit = totalSaleStock - totalCostStock;
    const enabledCount = products.filter((product) => product.enabled).length;
    const disabledCount = totalProducts - enabledCount;
    return {
      totalProducts,
      totalStockUnits,
      totalSaleStock,
      totalCostStock,
      projectedProfit,
      enabledCount,
      disabledCount,
    };
  }, [products]);

  return (
    <section className="panel products-dashboard">
      <h2>Productos</h2>

      <div className="products-search">
        <input
          placeholder="Buscar en todos los productos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="products-kpis">
        <article>
          <strong>{stats.totalProducts}</strong>
          <span>Total de productos</span>
        </article>
        <article>
          <strong>${stats.totalSaleStock.toLocaleString("es-AR")}</strong>
          <span>Valor total stock</span>
        </article>
        <article>
          <strong>${stats.totalCostStock.toLocaleString("es-AR")}</strong>
          <span>Costo inventario</span>
        </article>
        <article>
          <strong>${stats.projectedProfit.toLocaleString("es-AR")}</strong>
          <span>Beneficio proyectado</span>
        </article>
        <article>
          <strong>{stats.totalStockUnits}</strong>
          <span>Unidades en stock</span>
        </article>
        <article>
          <strong>{stats.enabledCount}</strong>
          <span>Visibles en catalogo</span>
        </article>
        <article>
          <strong>{stats.disabledCount}</strong>
          <span>Ocultos en catalogo</span>
        </article>
      </div>

      <h3>Nuevo producto</h3>
      <form className="form-grid" onSubmit={onAddProduct}>
        <input placeholder="Nombre" value={productForm.name} onChange={(e) => onProductFormChange({ ...productForm, name: e.target.value })} />
        <input placeholder="Categoria" value={productForm.category} onChange={(e) => onProductFormChange({ ...productForm, category: e.target.value })} />
        <input type="number" placeholder="Precio compra (interno)" value={productForm.purchasePrice} onChange={(e) => onProductFormChange({ ...productForm, purchasePrice: e.target.value })} />
        <input type="number" placeholder="Precio venta" value={productForm.salePrice} onChange={(e) => onProductFormChange({ ...productForm, salePrice: e.target.value })} />
        <input type="number" placeholder="Stock" value={productForm.stock} onChange={(e) => onProductFormChange({ ...productForm, stock: e.target.value })} />
        <input placeholder="URL proveedor (interno)" value={productForm.sourceUrl} onChange={(e) => onProductFormChange({ ...productForm, sourceUrl: e.target.value })} />
        <input type="file" accept="image/*" onChange={(e) => onProductImageChange(e.target.files?.[0] ?? null)} />
        {productImageData ? <img className="product-thumb" src={productImageData} alt="Vista previa producto" /> : <span className="field-label">Sin imagen</span>}
        <button type="submit">Guardar producto</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Categoria</th>
              <th>Inventario</th>
              <th>Fecha</th>
              <th>Precio</th>
              <th>Visible</th>
              <th>Imagen</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.image ? <img className="product-thumb small" src={product.image} alt={product.name} /> : <span className="field-label">-</span>}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.stock}</td>
                <td>{new Date(product.createdAt).toLocaleDateString("es-AR")}</td>
                <td>${product.salePrice.toLocaleString("es-AR")}</td>
                <td>
                  <button
                    type="button"
                    className={`switch-btn ${product.enabled ? "on" : "off"}`}
                    onClick={() => onToggleProductEnabled(product.id)}
                    title={product.enabled ? "Deshabilitar del catalogo" : "Habilitar en catalogo"}
                  >
                    <span />
                  </button>
                </td>
                <td>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onUpdateExistingProductImage(product.id, e.target.files?.[0] ?? null)}
                  />
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8}>No hay productos para mostrar.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ProductsPanel;
