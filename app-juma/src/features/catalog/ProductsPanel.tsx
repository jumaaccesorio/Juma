import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Product, Category } from "../../types";

type ProductForm = {
  name: string;
  subName: string;
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
  onImportProducts: (file: File) => Promise<{ created: number; categories: number }>;
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
  onImportProducts,
  onProductFormChange,
  onProductImageChange,
  onAddProduct,
  onToggleProductEnabled,
  onUpdateExistingProductImage,
}: ProductsPanelProps) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [product.name, product.subName, product.categoryName || ""].some((value) => value.toLowerCase().includes(normalized)),
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

  const outOfStockCount = products.filter((product) => product.stock <= 0).length;

  const handleImportFile = async (file: File | null) => {
    if (!file) return;
    setImportMessage("");
    setIsImporting(true);

    try {
      const result = await onImportProducts(file);
      setImportMessage(`Importados ${result.created} productos. Categorias creadas: ${result.categories}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo importar el archivo.";
      setImportMessage(message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen space-y-20 bg-secondary p-6 dark:bg-carbon md:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Admin Productos</h2>
          <p className="mt-1 text-slate-500">Gestiona tu catalogo de joyeria e inventario.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-xl">{showForm ? "close" : "add"}</span>
          {showForm ? "Cerrar Formulario" : "Nuevo Producto"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20">
            <span className="material-symbols-outlined text-3xl">inventory</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Prod.</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-red-50 p-3 text-red-600 dark:bg-red-900/20">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Sin Stock</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{outOfStockCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Valor Stock</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">${stats.totalSaleStock.toLocaleString("es-AR")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-green-50 p-3 text-green-600">
            <span className="material-symbols-outlined text-3xl">trending_up</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ganancia Proy.</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">${stats.projectedProfit.toLocaleString("es-AR")}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Importar productos</h3>
            <p className="mt-1 text-sm text-slate-500">
              CSV desde Excel o Sheets con: Nombre, subnombre, precio_compra, precio_venta, stock, categoria.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
            <span className="material-symbols-outlined text-lg">upload_file</span>
            {isImporting ? "Importando..." : "Seleccionar CSV"}
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              disabled={isImporting}
              onChange={(e) => {
                void handleImportFile(e.target.files?.[0] ?? null);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-widest text-slate-400">
          Si el nombre viene vacio, la tienda mostrara el subnombre.
        </p>
        {importMessage ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            {importMessage}
          </div>
        ) : null}
      </div>

      {showForm && (
        <form className="animate-fade-in rounded-xl border border-neutral-soft bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900" onSubmit={(e) => { onAddProduct(e); setShowForm(false); }}>
          <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">Agregar Nuevo Producto</h3>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nombre</label>
              <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ej. Collar Corazon Plata" value={productForm.name} onChange={(e) => onProductFormChange({ ...productForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Subnombre de busqueda</label>
              <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ej. Collar serpiente" value={productForm.subName} onChange={(e) => onProductFormChange({ ...productForm, subName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Categoria</label>
              <select
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={productForm.categoryId}
                onChange={(e) => onProductFormChange({ ...productForm, categoryId: e.target.value })}
              >
                <option value="" disabled>Seleccionar Categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Precio Compra ($)</label>
              <input required type="number" min="0" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Valor interno" value={productForm.purchasePrice} onChange={(e) => onProductFormChange({ ...productForm, purchasePrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Precio Venta ($)</label>
              <input required type="number" min="0" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Valor publico" value={productForm.salePrice} onChange={(e) => onProductFormChange({ ...productForm, salePrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Stock Inicial</label>
              <input required type="number" min="0" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Cantidad de unidades" value={productForm.stock} onChange={(e) => onProductFormChange({ ...productForm, stock: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">URL Reposicion (Opcional)</label>
              <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Enlace al proveedor" value={productForm.sourceUrl} onChange={(e) => onProductFormChange({ ...productForm, sourceUrl: e.target.value })} />
            </div>
            <div className="flex flex-col justify-center space-y-2 pt-6">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={productForm.isFeatured}
                  onChange={(e) => onProductFormChange({ ...productForm, isFeatured: e.target.checked })}
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
                <span className="ms-3 text-sm font-bold text-slate-700">Destacar en Inicio</span>
              </label>
            </div>
          </div>

          <div className="mb-8 flex items-center gap-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-200">
              {productImageData ? <img className="h-full w-full object-cover" src={productImageData} alt="Vista previa producto" /> : <span className="material-symbols-outlined text-3xl text-slate-400">image</span>}
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-bold text-slate-700">Imagen del Producto</label>
              <input type="file" accept="image/*" className="text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20" onChange={(e) => onProductImageChange(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-6 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-100">Cancelar</button>
            <button type="submit" className="rounded-lg bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">Guardar Producto</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-neutral-soft p-4 dark:border-slate-800 sm:flex-row">
          <div className="flex w-full gap-4 overflow-x-auto sm:w-auto">
            <button className="whitespace-nowrap border-b-2 border-primary px-4 py-2 text-sm font-bold text-primary">Todos</button>
            <button className="whitespace-nowrap px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700">Visibles ({stats.enabledCount})</button>
            <button className="whitespace-nowrap px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700">Ocultos ({stats.disabledCount})</button>
          </div>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20" placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Producto</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Categoria</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Precio Compra</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Precio Venta</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Stock</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
                <th className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Editar Imagen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-soft dark:divide-slate-800">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        {product.image ? <img className="h-full w-full object-cover" src={product.image} alt={product.name} /> : <span className="material-symbols-outlined text-xl text-slate-400">image</span>}
                      </div>
                      <span className="text-sm font-bold leading-tight text-slate-900 dark:text-white">{product.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {product.categoryName || <span className="italic text-slate-400">Sin Categoria</span>}
                    {product.isFeatured && <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-yellow-700" title="Destacado en Inicio">★</span>}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-500">${product.purchasePrice.toLocaleString("es-AR")}</td>
                  <td className="p-4 text-sm font-bold text-primary">${product.salePrice.toLocaleString("es-AR")}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${product.stock <= 2 ? "text-red-600" : "text-slate-700"}`}>{product.stock}</span>
                        {product.stock <= 2 && <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase text-red-700">Low</span>}
                      </div>
                      <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full ${product.stock > 5 ? "bg-green-500" : product.stock > 0 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, Math.max(5, (product.stock / 20) * 100))}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="peer sr-only" checked={product.enabled} onChange={() => onToggleProductEnabled(product.id)} />
                      <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
                      <span className="ms-3 w-12 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">{product.enabled ? "Visible" : "Oculto"}</span>
                    </label>
                  </td>
                  <td className="p-4 text-right">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary">
                      <span className="material-symbols-outlined">add_a_photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpdateExistingProductImage(product.id, e.target.files?.[0] ?? null)} />
                    </label>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-medium text-slate-500">No se encontraron productos.</td>
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
