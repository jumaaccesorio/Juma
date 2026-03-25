import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Category, Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";

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

type ProductDraft = {
  name: string;
  subName: string;
  categoryId: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
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
  onSaveProductEdits: (productId: number, updates: Partial<Product>) => void;
  onDeleteProduct: (productId: number) => void;
  onImportProducts: (file: File | null) => void;
};

function buildDraft(product: Product): ProductDraft {
  return {
    name: product.name ?? "",
    subName: product.subName ?? "",
    categoryId: product.categoryId ? String(product.categoryId) : "",
    purchasePrice: String(product.purchasePrice ?? 0),
    salePrice: String(product.salePrice ?? 0),
    stock: String(product.stock ?? 0),
    isFeatured: Boolean(product.isFeatured),
  };
}

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
  onSaveProductEdits,
  onDeleteProduct,
  onImportProducts,
}: ProductsPanelProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "VISIBLE" | "HIDDEN">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, ProductDraft>>({});

  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<number, ProductDraft> = {};
      for (const product of products) {
        next[product.id] = prev[product.id] ?? buildDraft(product);
      }
      return next;
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !normalized ||
        [product.name, product.subName, product.categoryName || ""].some((value) =>
          (value || "").toLowerCase().includes(normalized),
        );
      const matchesCategory = !categoryFilter || String(product.categoryId ?? "") === categoryFilter;
      const matchesVisibility =
        visibilityFilter === "ALL" ||
        (visibilityFilter === "VISIBLE" && product.enabled) ||
        (visibilityFilter === "HIDDEN" && !product.enabled);
      return matchesQuery && matchesCategory && matchesVisibility;
    });
  }, [products, query, categoryFilter, visibilityFilter]);

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

  const updateDraft = (productId: number, key: keyof ProductDraft, value: string | boolean) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? buildDraft(products.find((product) => product.id === productId)!)),
        [key]: value,
      },
    }));
  };

  const handleSaveDraft = (product: Product) => {
    const draft = drafts[product.id];
    if (!draft) return;
    const purchasePrice = Number(draft.purchasePrice);
    const salePrice = Number(draft.salePrice);
    const stock = Number(draft.stock);
    if (
      (!draft.name.trim() && !draft.subName.trim()) ||
      Number.isNaN(purchasePrice) ||
      Number.isNaN(salePrice) ||
      Number.isNaN(stock) ||
      stock < 0
    ) {
      return;
    }
    onSaveProductEdits(product.id, {
      name: draft.name.trim() || draft.subName.trim(),
      subName: draft.subName.trim(),
      categoryId: draft.categoryId ? Number(draft.categoryId) : null,
      purchasePrice,
      salePrice,
      stock,
      isFeatured: draft.isFeatured,
    });
  };

  const openEditor = (product: Product) => {
    setDrafts((prev) => ({
      ...prev,
      [product.id]: prev[product.id] ?? buildDraft(product),
    }));
    setEditingProductId(product.id);
  };

  const editingProduct = editingProductId ? products.find((product) => product.id === editingProductId) ?? null : null;
  const editingDraft = editingProduct ? drafts[editingProduct.id] ?? buildDraft(editingProduct) : null;

  return (
    <div className="min-h-screen flex-1 space-y-8 bg-secondary p-4 text-ink md:space-y-12 md:p-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Admin Productos</h2>
          <p className="mt-1 text-slate-600">Gestiona tu catálogo de joyería e inventario.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-xl">{showForm ? "close" : "add"}</span>
          {showForm ? "Cerrar Formulario" : "Nuevo Producto"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        <div className="bg-background p-6 rounded-xl border border-line flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-tertiary/18 text-[#4f6780] rounded-lg">
            <span className="material-symbols-outlined text-3xl">inventory</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Prod.</p>
            <p className="text-2xl font-black text-ink">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="bg-background p-6 rounded-xl border border-line flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-warning/22 text-[#9a6d48] rounded-lg">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Sin Stock</p>
            <p className="text-2xl font-black text-ink">{outOfStockCount}</p>
          </div>
        </div>
        <div className="bg-background p-6 rounded-xl border border-line flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-primary/12 text-primary rounded-lg">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Valor Stock</p>
            <p className="text-xl font-black text-ink">${stats.totalSaleStock.toLocaleString("es-AR")}</p>
          </div>
        </div>
        <div className="bg-background p-6 rounded-xl border border-line flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-success/25 text-[#647554] rounded-lg">
            <span className="material-symbols-outlined text-3xl">trending_up</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ganancia Proy.</p>
            <p className="text-xl font-black text-ink">${stats.projectedProfit.toLocaleString("es-AR")}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-background p-5 shadow-sm md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-ink">Importar productos</h3>
            <p className="text-sm text-slate-500 mt-1">CSV con columnas: `Nombre, subnombre, precio_compra, precio_venta, stock, categoria`.</p>
          </div>
          <label className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary hover:text-white text-primary px-4 py-2.5 rounded-lg font-bold text-sm transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-base">upload_file</span>
            Importar CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onImportProducts(e.target.files?.[0] ?? null)} />
          </label>
        </div>
      </div>

      {showForm && (
        <form
          className="animate-fade-in rounded-xl border border-line bg-background p-5 shadow-sm md:p-8"
          onSubmit={(event) => {
            onAddProduct(event);
            setShowForm(false);
          }}
        >
          <h3 className="text-lg font-bold text-ink mb-6">Agregar Nuevo Producto</h3>
          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nombre visible</label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Ej. Aurora"
                value={productForm.name}
                onChange={(e) => onProductFormChange({ ...productForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Subnombre de busqueda</label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Ej. Collar serpiente"
                value={productForm.subName}
                onChange={(e) => onProductFormChange({ ...productForm, subName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Categoria</label>
              <select
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={productForm.categoryId}
                onChange={(e) => onProductFormChange({ ...productForm, categoryId: e.target.value })}
              >
                <option value="" disabled>
                  Seleccionar Categoria
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Precio Compra ($)</label>
              <input
                required
                type="number"
                min="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Valor interno"
                value={productForm.purchasePrice}
                onChange={(e) => onProductFormChange({ ...productForm, purchasePrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Precio Venta ($)</label>
              <input
                required
                type="number"
                min="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Valor publico"
                value={productForm.salePrice}
                onChange={(e) => onProductFormChange({ ...productForm, salePrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Stock Inicial</label>
              <input
                required
                type="number"
                min="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Cantidad de unidades"
                value={productForm.stock}
                onChange={(e) => onProductFormChange({ ...productForm, stock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">URL Reposicion (Opcional)</label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Enlace al proveedor"
                value={productForm.sourceUrl}
                onChange={(e) => onProductFormChange({ ...productForm, sourceUrl: e.target.value })}
              />
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

          <div className="mb-8 flex flex-col gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-200">
              {productImageData ? (
                <img className="h-full w-full object-cover" src={productImageData} alt="Vista previa producto" />
              ) : (
                <span className="material-symbols-outlined text-slate-400 text-3xl">image</span>
              )}
            </div>
            <div className="flex-1">
              <label className="text-sm font-bold text-slate-700 block mb-2">Imagen del Producto</label>
              <input
                type="file"
                accept="image/*"
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                onChange={(e) => onProductImageChange(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all">
              Guardar Producto
            </button>
          </div>
        </form>
      )}

      <div className="bg-background rounded-xl border border-line overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex gap-4 overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setVisibilityFilter("ALL")}
              className={`px-4 py-2 text-sm whitespace-nowrap transition-colors border-b-2 ${
                visibilityFilter === "ALL"
                  ? "font-bold border-primary text-primary"
                  : "font-medium border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter("VISIBLE")}
              className={`px-4 py-2 text-sm whitespace-nowrap transition-colors border-b-2 ${
                visibilityFilter === "VISIBLE"
                  ? "font-bold border-primary text-primary"
                  : "font-medium border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Visibles ({stats.enabledCount})
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter("HIDDEN")}
              className={`px-4 py-2 text-sm whitespace-nowrap transition-colors border-b-2 ${
                visibilityFilter === "HIDDEN"
                  ? "font-bold border-primary text-primary"
                  : "font-medium border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Ocultos ({stats.disabledCount})
            </button>
          </div>
          <div className="flex w-full lg:w-auto gap-3">
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="w-full lg:w-56 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas las categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {filteredProducts.map((product) => {
            const displayName = getProductDisplayName(product);
            return (
              <div key={`mobile-${product.id}`} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {product.image ? (
                      <img className="h-full w-full object-cover" src={product.image} alt={displayName} />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400">image</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{displayName}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.categoryName || "Sin categoria"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-quaternary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                        ${product.salePrice.toLocaleString("es-AR")}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                          product.stock <= 2
                            ? "bg-warning/30 text-[#9a6d48]"
                            : product.stock <= 10
                              ? "bg-quaternary text-primary"
                              : "bg-tertiary/20 text-[#4f6780]"
                        }`}
                      >
                        {product.stock} units
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${product.enabled ? "bg-success/25 text-[#647554]" : "bg-slate-100 text-slate-500"}`}>
                        {product.enabled ? "Visible" : "Oculto"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditor(product)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-tertiary/14 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#4f6780]"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleProductEnabled(product.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-background px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted border border-line"
                  >
                    <span className="material-symbols-outlined text-sm">{product.enabled ? "visibility_off" : "visibility"}</span>
                    {product.enabled ? "Ocultar" : "Mostrar"}
                  </button>
                  <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-quaternary px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    <span className="material-symbols-outlined text-sm">add_a_photo</span>
                    Imagen
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onUpdateExistingProductImage(product.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              No se encontraron productos.
            </div>
          ) : null}
        </div>

        <div className="hidden px-2 pb-2 md:block">
          <table className="w-full table-fixed text-left border-collapse">
            <colgroup>
              <col className="w-[42%]" />
              <col className="w-[19%]" />
              <col className="w-[8.5%]" />
              <col className="w-[8.5%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[96px]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Producto</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Categoria</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Precio Compra</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Precio Venta</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Stock</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
                <th className="p-4 pr-8 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-soft dark:divide-slate-800">
              {filteredProducts.map((product) => {
                const displayName = getProductDisplayName(product);
                return (
                  <tr key={product.id} className="hover:bg-secondary/35 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.image ? (
                            <img className="h-full w-full object-cover" src={product.image} alt={displayName} />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400 text-xl">image</span>
                          )}
                        </div>
                        <div className="min-w-0 max-w-full">
                          <span className="block truncate font-bold text-sm text-ink leading-tight">{displayName}</span>
                          {product.subName && product.name.trim() && (
                            <span className="text-xs text-slate-400 block truncate">{product.subName}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        {product.categoryName ? (
                          <span className="truncate">{product.categoryName}</span>
                        ) : (
                          <span className="italic text-slate-400">Sin Categoria</span>
                        )}
                        {product.isFeatured && (
                          <span className="inline-flex items-center rounded-full bg-quaternary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary" title="Destacado en Inicio">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-500">${product.purchasePrice.toLocaleString("es-AR")}</td>
                    <td className="p-4 text-sm font-bold text-primary">${product.salePrice.toLocaleString("es-AR")}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                          product.stock <= 2
                            ? "bg-warning/30 text-[#9a6d48]"
                            : product.stock <= 10
                              ? "bg-quaternary text-primary"
                              : "bg-tertiary/20 text-[#4f6780]"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => onToggleProductEnabled(product.id)}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                          product.enabled ? "bg-success/25 text-[#647554]" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {product.enabled ? "Visible" : "Oculto"}
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditor(product)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-tertiary/14 text-[#4f6780] transition-colors hover:bg-tertiary hover:text-white"
                          title="Editar producto"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line bg-quaternary text-primary transition-colors hover:bg-primary hover:text-white">
                          <span className="material-symbols-outlined">add_a_photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onUpdateExistingProductImage(product.id, e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && editingDraft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2D2D2D]/35 p-0 backdrop-blur-[2px] md:items-center md:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-background shadow-[0_24px_80px_rgba(45,45,45,0.16)] md:max-w-3xl md:rounded-xl">
            <div className="flex items-start justify-between border-b border-line px-6 py-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">Editor de producto</p>
                <h3 className="mt-2 font-serif text-3xl text-ink">{getProductDisplayName(editingProduct)}</h3>
                <p className="mt-1 text-sm text-muted">Modifica el producto seleccionado sin salir del listado.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProductId(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted transition-colors hover:bg-secondary hover:text-ink"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-line bg-secondary">
                  <div className="flex aspect-square items-center justify-center">
                    {editingProduct.image ? (
                      <img className="h-full w-full object-cover" src={editingProduct.image} alt={getProductDisplayName(editingProduct)} />
                    ) : (
                      <span className="material-symbols-outlined text-5xl text-muted">image</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-tertiary/18 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4f6780]">
                    Stock {editingProduct.stock}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-quaternary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    Venta ${editingProduct.salePrice.toLocaleString("es-AR")}
                  </span>
                </div>
                <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white">
                  <span className="material-symbols-outlined text-base">add_a_photo</span>
                  Cambiar imagen
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onUpdateExistingProductImage(editingProduct.id, e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Nombre visible</label>
                  <input
                    className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                    value={editingDraft.name}
                    onChange={(e) => updateDraft(editingProduct.id, "name", e.target.value)}
                    placeholder="Nombre visible"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Subnombre</label>
                  <input
                    className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                    value={editingDraft.subName}
                    onChange={(e) => updateDraft(editingProduct.id, "subName", e.target.value)}
                    placeholder="Nombre de busqueda"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Categoria</label>
                  <select
                    className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                    value={editingDraft.categoryId}
                    onChange={(e) => updateDraft(editingProduct.id, "categoryId", e.target.value)}
                  >
                    <option value="">Sin categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Stock</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                    value={editingDraft.stock}
                    onChange={(e) => updateDraft(editingProduct.id, "stock", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Precio compra</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                    value={editingDraft.purchasePrice}
                    onChange={(e) => updateDraft(editingProduct.id, "purchasePrice", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Precio venta</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                    value={editingDraft.salePrice}
                    onChange={(e) => updateDraft(editingProduct.id, "salePrice", e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Inicio</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={editingDraft.isFeatured}
                      onChange={(e) => updateDraft(editingProduct.id, "isFeatured", e.target.checked)}
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-primary peer-checked:after:translate-x-full after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']" />
                    <span className="ms-3 text-sm font-bold text-slate-700">
                      Mostrar este producto en destacados del inicio
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  const confirmDelete = window.confirm(`¿Eliminar "${getProductDisplayName(editingProduct)}"? Esta accion no se puede deshacer.`);
                  if (!confirmDelete) return;
                  onDeleteProduct(editingProduct.id);
                  setEditingProductId(null);
                }}
                className="rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
              >
                Eliminar producto
              </button>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProductId(null)}
                  className="rounded-lg border border-line bg-white px-5 py-3 text-sm font-bold text-muted transition-colors hover:bg-secondary hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveDraft(editingProduct);
                    setEditingProductId(null);
                  }}
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPanel;
