import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Product, Category } from "../../types";

type ProductForm = {
  name: string;
  categoryId: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
  sourceUrl: string;
  isFeatured: boolean;
};

type ProductsPanelProps = {
  products: Product[];
  categories: Category[];
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
  categories,
  productForm,
  productImageData,
  onProductFormChange,
  onProductImageChange,
  onAddProduct,
  onToggleProductEnabled,
  onUpdateExistingProductImage,
}: ProductsPanelProps) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [product.name, product.categoryName || ""].some((value) => value.toLowerCase().includes(normalized)),
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

  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  return (
    <div className="flex-1 p-6 md:p-10 space-y-20 bg-secondary dark:bg-carbon min-h-screen">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Admin Productos</h2>
          <p className="text-slate-500 mt-1">Gestiona tu catalogo de joyería e inventario.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cerrar Formulario' : 'Nuevo Producto'}
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
            <span className="material-symbols-outlined text-3xl">inventory</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Prod.</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Sin Stock</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{outOfStockCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Valor Stock</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">${stats.totalSaleStock.toLocaleString("es-AR")}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <span className="material-symbols-outlined text-3xl">trending_up</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ganancia Proy.</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">${stats.projectedProfit.toLocaleString("es-AR")}</p>
          </div>
        </div>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <form className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-neutral-soft dark:border-slate-800 shadow-sm animate-fade-in" onSubmit={(e) => { onAddProduct(e); setShowForm(false); }}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Agregar Nuevo Producto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nombre</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej. Collar Corazón Plata" value={productForm.name} onChange={(e) => onProductFormChange({ ...productForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Categoría</label>
              <select 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                value={productForm.categoryId} 
                onChange={(e) => onProductFormChange({ ...productForm, categoryId: e.target.value })}
              >
                <option value="" disabled>Seleccionar Categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Precio Compra ($)</label>
              <input required type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Valor interno" value={productForm.purchasePrice} onChange={(e) => onProductFormChange({ ...productForm, purchasePrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Precio Venta ($)</label>
              <input required type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Valor publico" value={productForm.salePrice} onChange={(e) => onProductFormChange({ ...productForm, salePrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Stock Inicial</label>
              <input required type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Cantidad de unidades" value={productForm.stock} onChange={(e) => onProductFormChange({ ...productForm, stock: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">URL Reposición (Opcional)</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Enlace al proveedor" value={productForm.sourceUrl} onChange={(e) => onProductFormChange({ ...productForm, sourceUrl: e.target.value })} />
            </div>
            <div className="space-y-2 flex flex-col justify-center pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={productForm.isFeatured} 
                  onChange={(e) => onProductFormChange({ ...productForm, isFeatured: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ms-3 text-sm font-bold text-slate-700">Destacar en Inicio</span>
              </label>
            </div>
          </div>
          
          <div className="mb-8 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center gap-6">
            <div className="h-24 w-24 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
              {productImageData ? <img className="h-full w-full object-cover" src={productImageData} alt="Vista previa producto" /> : <span className="material-symbols-outlined text-slate-400 text-3xl">image</span>}
            </div>
            <div className="flex-1">
              <label className="text-sm font-bold text-slate-700 block mb-2">Imagen del Producto</label>
              <input type="file" accept="image/*" className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" onChange={(e) => onProductImageChange(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all">Guardar Producto</button>
          </div>
        </form>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-soft dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-soft dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-4 overflow-x-auto w-full sm:w-auto">
            <button className="px-4 py-2 text-sm font-bold border-b-2 border-primary text-primary whitespace-nowrap">Todos</button>
            <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">Visibles ({stats.enabledCount})</button>
            <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">Ocultos ({stats.disabledCount})</button>
          </div>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              placeholder="Buscar..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Producto</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Categoría</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Precio Compra</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Precio Venta</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Stock</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Editar Imagen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-soft dark:divide-slate-800">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {product.image ? (
                          <img className="h-full w-full object-cover" src={product.image} alt={product.name} />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-xl">image</span>
                        )}
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                    {product.categoryName || <span className="text-slate-400 italic">Sin Categoría</span>}
                    {product.isFeatured && <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded" title="Destacado en Inicio">★</span>}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-500">${product.purchasePrice.toLocaleString("es-AR")}</td>
                  <td className="p-4 text-sm font-bold text-primary">${product.salePrice.toLocaleString("es-AR")}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${product.stock <= 2 ? 'text-red-600' : 'text-slate-700'}`}>{product.stock}</span>
                        {product.stock <= 2 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded">Low</span>}
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className={`h-full ${product.stock > 5 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(5, (product.stock / 20) * 100))}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={product.enabled} 
                        onChange={() => onToggleProductEnabled(product.id)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ms-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-12 text-center">{product.enabled ? 'Visible' : 'Oculto'}</span>
                    </label>
                  </td>
                  <td className="p-4 text-right">
                    <label className="text-slate-400 hover:text-primary transition-colors cursor-pointer p-2 inline-flex items-center justify-center rounded-lg hover:bg-primary/10">
                      <span className="material-symbols-outlined">add_a_photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => onUpdateExistingProductImage(product.id, e.target.files?.[0] ?? null)} 
                      />
                    </label>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No se encontraron productos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProductsPanel;
