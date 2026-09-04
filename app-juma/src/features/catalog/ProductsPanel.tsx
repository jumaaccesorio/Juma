import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import type { Category, Product, ProductSize } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";
import ProductImage from "../../components/ProductImage";

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
  description: string;
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
  onAddProduct: (event: FormEvent<HTMLFormElement>, sizes: { size: string; stock: number }[]) => Promise<boolean>;
  onToggleProductEnabled: (productId: number) => void;
  onUpdateExistingProductImage: (productId: number, file: File | null) => void;
  onSaveProductEdits: (productId: number, updates: Partial<Product>) => Promise<void>;
  onSetProductSizes: (productId: number, sizes: { size: string; stock: number }[]) => Promise<void>;
  onDeleteProduct: (productId: number) => void;
  onImportProducts: (file: File | null) => void;
  onUpdateStock: (productId: number, newStock: number) => void;
  focusedProductId: number | null;
  onFocusedProductChange: (productId: number | null) => void;
  onAddCategory: (name: string, parentId?: number | null) => void;
  onUpdateCategory: (id: number, name: string) => void;
  onDeleteCategory: (id: number) => void;
};

function buildDraft(product: Product): ProductDraft {
  return {
    name: product.name ?? "",
    subName: product.subName ?? "",
    description: product.description ?? "",
    categoryId: product.categoryId ? String(product.categoryId) : "",
    purchasePrice: String(product.purchasePrice ?? 0),
    salePrice: String(product.salePrice ?? 0),
    stock: String(product.stock ?? 0),
    sourceUrl: product.sourceUrl ?? "",
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
  onSetProductSizes,
  onDeleteProduct,
  onImportProducts,
  onUpdateStock,
  focusedProductId,
  onFocusedProductChange,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: ProductsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"productos" | "categorias">("productos");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "VISIBLE" | "HIDDEN">("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "OUT" | "LOW" | "AVAILABLE">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [newProductSizes, setNewProductSizes] = useState<Array<{ size: string; stock: number }>>([]);
  const [newProductSizeInput, setNewProductSizeInput] = useState("");
  const [newProductSizeStock, setNewProductSizeStock] = useState("1");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, ProductDraft>>({});
  // Size manager state (keyed by productId)
  const [sizeDrafts, setSizeDrafts] = useState<Record<number, ProductSize[]>>({});
  const [newSizeInput, setNewSizeInput] = useState("");
  const [newSizeStock, setNewSizeStock] = useState("1");
  const [isSavingSizes, setIsSavingSizes] = useState(false);
  useBodyScrollLock(editingProductId !== null);

  useEffect(() => {
    setDrafts(() => {
      const next: Record<number, ProductDraft> = {};
      for (const product of products) {
        next[product.id] = buildDraft(product);
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
      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "OUT" && product.stock <= 0) ||
        (stockFilter === "LOW" && product.stock > 0 && product.stock <= 2) ||
        (stockFilter === "AVAILABLE" && product.stock > 0);
      return matchesQuery && matchesCategory && matchesVisibility && matchesStock;
    });
  }, [products, query, categoryFilter, visibilityFilter, stockFilter]);

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

  const addNewProductSize = () => {
    const size = newProductSizeInput.trim();
    if (!size) return;
    const stock = Math.max(0, Math.trunc(Number(newProductSizeStock) || 0));
    setNewProductSizes((current) => {
      const duplicate = current.some((item) => item.size.toLocaleLowerCase("es-AR") === size.toLocaleLowerCase("es-AR"));
      return duplicate ? current : [...current, { size, stock }];
    });
    setNewProductSizeInput("");
    setNewProductSizeStock("1");
  };

  const handleSaveDraft = async (product: Product) => {
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
    await onSaveProductEdits(product.id, {
      name: draft.name.trim() || draft.subName.trim(),
      subName: draft.subName.trim(),
      description: draft.description.trim(),
      categoryId: draft.categoryId ? Number(draft.categoryId) : null,
      purchasePrice,
      salePrice,
      stock,
      sourceUrl: draft.sourceUrl.trim(),
      isFeatured: draft.isFeatured,
    });
  };

  const openEditor = (product: Product) => {
    setDrafts((prev) => ({
      ...prev,
      [product.id]: prev[product.id] ?? buildDraft(product),
    }));
    // Init size drafts from existing product sizes
    setSizeDrafts((prev) => ({
      ...prev,
      [product.id]: prev[product.id] ?? (product.sizes ? [...product.sizes] : []),
    }));
    setNewSizeInput("");
    setNewSizeStock("1");
    setEditingProductId(product.id);
    onFocusedProductChange(product.id);
  };

  useEffect(() => {
    if (focusedProductId == null) return;
    const product = products.find((row) => row.id === focusedProductId);
    if (!product) return;
    setDrafts((prev) => ({
      ...prev,
      [product.id]: prev[product.id] ?? buildDraft(product),
    }));
    setSizeDrafts((prev) => ({
      ...prev,
      [product.id]: prev[product.id] ?? (product.sizes ? [...product.sizes] : []),
    }));
  }, [focusedProductId, products]);

  const addSizeToDraft = (productId: number) => {
    const trimmed = newSizeInput.trim();
    if (!trimmed) return;
    const stock = Math.max(0, Number(newSizeStock) || 0);
    setSizeDrafts((prev) => {
      const current = prev[productId] ?? [];
      if (current.some((s) => s.size.toLowerCase() === trimmed.toLowerCase())) return prev;
      return { ...prev, [productId]: [...current, { id: Date.now(), productId, size: trimmed, stock }] };
    });
    setNewSizeInput("");
    setNewSizeStock("1");
  };

  const removeSizeFromDraft = (productId: number, size: string) => {
    setSizeDrafts((prev) => ({
      ...prev,
      [productId]: (prev[productId] ?? []).filter((s) => s.size !== size),
    }));
  };

  const updateSizeStockInDraft = (productId: number, size: string, newStock: number) => {
    setSizeDrafts((prev) => ({
      ...prev,
      [productId]: (prev[productId] ?? []).map((s) => s.size === size ? { ...s, stock: Math.max(0, newStock) } : s),
    }));
  };

  const editingProduct = editingProductId ? products.find((product) => product.id === editingProductId) ?? null : null;
  const editingDraft = editingProduct ? drafts[editingProduct.id] ?? buildDraft(editingProduct) : null;

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 space-y-6 px-4 pb-12 pt-20 sm:px-6 lg:px-10 lg:pt-24">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-slate-900 lg:text-3xl">Gestión de Productos e Inventario</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Gestioná tu catálogo de joyería, variantes de talles, inventario y categorías.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveSubTab("productos")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeSubTab === "productos"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span translate="no" className="material-symbols-outlined text-[16px]">inventory_2</span>
              Productos
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("categorias")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeSubTab === "categorias"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span translate="no" className="material-symbols-outlined text-[16px]">category</span>
              Categorías
            </button>
          </div>

          {activeSubTab === "productos" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
            >
              <span translate="no" className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add"}</span>
              {showForm ? "Cerrar" : "Nuevo Producto"}
            </button>
          )}
        </div>
      </div>

      {activeSubTab === "productos" && (<>
      {/* ── METRICS CARDS (4 CARDS) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <span translate="no" className="material-symbols-outlined text-xl">inventory_2</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Productos</span>
            <p className="font-headline text-2xl font-extrabold text-slate-900 leading-none mt-1">{stats.totalProducts}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600 shrink-0">
            <span translate="no" className="material-symbols-outlined text-xl">warning</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Sin Stock</span>
            <p className="font-headline text-2xl font-extrabold text-red-600 leading-none mt-1">{outOfStockCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <span translate="no" className="material-symbols-outlined text-xl">payments</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Valor Venta Stock</span>
            <p className="font-headline text-xl font-extrabold text-emerald-600 leading-none mt-1">${stats.totalSaleStock.toLocaleString("es-AR")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <span translate="no" className="material-symbols-outlined text-xl">trending_up</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Ganancia Estimada</span>
            <p className="font-headline text-xl font-extrabold text-slate-900 leading-none mt-1">${stats.projectedProfit.toLocaleString("es-AR")}</p>
          </div>
        </div>
      </div>

      {/* ── IMPORT CSV CARD ── */}
      <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-headline text-base font-bold text-slate-900">Importar Productos masivamente</h3>
          <p className="text-xs text-slate-500 mt-0.5">Subí un archivo CSV con las columnas: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-700">Nombre, subnombre, precio_compra, precio_venta, stock, categoria</code>.</p>
        </div>
        <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer shrink-0">
          <span translate="no" className="material-symbols-outlined text-slate-500 text-lg">upload_file</span>
          Importar CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onImportProducts(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      {showForm && (
        <form
          className="animate-fade-in rounded-xl border border-line bg-background p-5 shadow-sm md:p-8"
          onSubmit={async (event) => {
            setIsCreatingProduct(true);
            const saved = await onAddProduct(event, newProductSizes);
            setIsCreatingProduct(false);
            if (saved) {
              setNewProductSizes([]);
              setNewProductSizeInput("");
              setNewProductSizeStock("1");
              setShowForm(false);
            }
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
              <label className="text-sm font-bold text-slate-700">Stock sin talles</label>
              <input
                required={newProductSizes.length === 0}
                type="number"
                min="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder={newProductSizes.length > 0 ? "Se calcula con los talles" : "Cantidad de unidades"}
                value={productForm.stock}
                disabled={newProductSizes.length > 0}
                onChange={(e) => onProductFormChange({ ...productForm, stock: e.target.value })}
              />
              <p className="text-xs text-slate-400">
                {newProductSizes.length > 0
                  ? `Stock total calculado: ${newProductSizes.reduce((total, item) => total + item.stock, 0)}`
                  : "Usalo solamente si el producto no tiene variantes."}
              </p>
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

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-slate-800">Talles y stock por variante <span className="font-normal text-slate-400">(Opcional)</span></p>
              <p className="text-xs text-slate-500">Agregá cada talle por separado. El stock total se calcula automáticamente.</p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end">
              <label className="space-y-1.5 text-xs font-bold text-slate-600">
                Talle
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-primary"
                  placeholder="Ej. 16, 17, M o Único"
                  value={newProductSizeInput}
                  onChange={(event) => setNewProductSizeInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addNewProductSize();
                    }
                  }}
                />
              </label>
              <label className="space-y-1.5 text-xs font-bold text-slate-600">
                Stock de ese talle
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-primary"
                  value={newProductSizeStock}
                  onChange={(event) => setNewProductSizeStock(event.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={addNewProductSize}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-700"
              >
                <span translate="no" className="material-symbols-outlined text-base">add</span>
                Agregar talle
              </button>
            </div>
            {newProductSizes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {newProductSizes.map((item) => (
                  <span key={item.size} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 py-1.5 pl-3 pr-1.5 text-xs font-bold text-primary">
                    {item.size} · {item.stock} u.
                    <button
                      type="button"
                      onClick={() => setNewProductSizes((current) => current.filter((row) => row.size !== item.size))}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-primary/60 hover:bg-primary/10 hover:text-primary"
                      aria-label={`Quitar talle ${item.size}`}
                    >
                      <span translate="no" className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mb-8 flex flex-col gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-200">
              {productImageData ? (
                <img className="h-full w-full object-cover" src={productImageData} alt="Vista previa producto" />
              ) : (
                <span translate="no" className="material-symbols-outlined text-slate-400 text-3xl">image</span>
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
            <button type="button" disabled={isCreatingProduct} onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isCreatingProduct} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all disabled:cursor-wait disabled:opacity-60">
              {isCreatingProduct ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </form>
      )}

      {/* ── PRODUCTS DIRECTORY CONTAINER ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setVisibilityFilter("ALL")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                visibilityFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter("VISIBLE")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                visibilityFilter === "VISIBLE"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Visibles ({stats.enabledCount})
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter("HIDDEN")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                visibilityFilter === "HIDDEN"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Ocultos ({stats.disabledCount})
            </button>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-60">
              <span translate="no" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-primary shadow-2xs"
                placeholder="Buscar producto..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-primary shadow-2xs"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-primary shadow-2xs"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as "ALL" | "OUT" | "LOW" | "AVAILABLE")}
            >
              <option value="ALL">Todo el stock</option>
              <option value="OUT">Sin stock</option>
              <option value="LOW">Stock bajo</option>
              <option value="AVAILABLE">Con stock</option>
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
                      <ProductImage product={product} className="h-full w-full object-cover" alt={displayName} />
                    ) : (
                      <span translate="no" className="material-symbols-outlined text-slate-400">image</span>
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
                    <span translate="no" className="material-symbols-outlined text-sm">edit</span>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleProductEnabled(product.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-background px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted border border-line"
                  >
                    <span translate="no" className="material-symbols-outlined text-sm">{product.enabled ? "visibility_off" : "visibility"}</span>
                    {product.enabled ? "Ocultar" : "Mostrar"}
                  </button>
                  <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-quaternary px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    <span translate="no" className="material-symbols-outlined text-sm">add_a_photo</span>
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
                            <ProductImage product={product} className="h-full w-full object-cover" alt={displayName} />
                          ) : (
                            <span translate="no" className="material-symbols-outlined text-slate-400 text-xl">image</span>
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
                      <div className="flex items-center gap-1">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onUpdateStock(product.id, Math.max(0, product.stock - 1)); }}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                          >
                            <span translate="no" className="material-symbols-outlined text-xs">remove</span>
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">{product.stock}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onUpdateStock(product.id, product.stock + 1); }}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                          >
                            <span translate="no" className="material-symbols-outlined text-xs">add</span>
                          </button>
                        </div>
                      </div>
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
                          <span translate="no" className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line bg-quaternary text-primary transition-colors hover:bg-primary hover:text-white">
                          <span translate="no" className="material-symbols-outlined">add_a_photo</span>
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
          <div className="mobile-modal w-full overflow-y-auto rounded-t-2xl border border-line bg-background shadow-[0_24px_80px_rgba(45,45,45,0.16)] md:max-w-3xl md:rounded-xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">Editor de producto</p>
                <h3 className="mt-2 font-serif text-2xl text-ink sm:text-3xl">{getProductDisplayName(editingProduct)}</h3>
                <p className="mt-1 text-sm text-muted">Modifica el producto seleccionado sin salir del listado.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(null);
                  onFocusedProductChange(null);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted transition-colors hover:bg-secondary hover:text-ink"
              >
                <span translate="no" className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-6 px-4 py-5 sm:px-6 sm:py-6 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-line bg-secondary">
                  <div className="flex aspect-square items-center justify-center">
                    {editingProduct.image ? (
                      <ProductImage
                        product={editingProduct}
                        className="h-full w-full object-cover"
                        alt={getProductDisplayName(editingProduct)}
                        fullResolution
                      />
                    ) : (
                      <span translate="no" className="material-symbols-outlined text-5xl text-muted">image</span>
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
                  <span translate="no" className="material-symbols-outlined text-base">add_a_photo</span>
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
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Descripción</label>
                  <textarea
                    className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={3}
                    value={editingDraft.description}
                    onChange={(e) => updateDraft(editingProduct.id, "description", e.target.value)}
                    placeholder="Descripción visible en el detalle del producto"
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
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted">URL reposicion</label>
                  <input
                    className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                    value={editingDraft.sourceUrl}
                    onChange={(e) => updateDraft(editingProduct.id, "sourceUrl", e.target.value)}
                    placeholder="Enlace al proveedor"
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

            {/* ── Gestor de Talles ────────────────────────── */}
            <div className="border-t border-line px-4 py-5 sm:px-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-muted">Talles disponibles</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {(sizeDrafts[editingProduct.id] ?? []).length === 0 ? (
                  <p className="text-sm text-muted italic">Sin talles cargados. El producto no tendrá selector de talle.</p>
                ) : (
                  (sizeDrafts[editingProduct.id] ?? []).map((s) => (
                    <div key={s.size} className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                      <span className="text-sm font-bold text-primary min-w-[1.5rem] text-center">{s.size}</span>
                      <span className="text-muted text-xs">·</span>
                      <input
                        type="number"
                        min="0"
                        className="w-12 rounded border border-line bg-white px-1 py-0.5 text-center text-xs outline-none focus:ring-1 focus:ring-primary/30"
                        value={s.stock}
                        onChange={(e) => updateSizeStockInDraft(editingProduct.id, s.size, Number(e.target.value))}
                        title={`Stock para talle ${s.size}`}
                      />
                      <span className="text-[10px] text-muted">u.</span>
                      <button
                        type="button"
                        onClick={() => removeSizeFromDraft(editingProduct.id, s.size)}
                        className="ml-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Eliminar talle"
                      >
                        <span translate="no" className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="w-24 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Talle"
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSizeToDraft(editingProduct.id); } }}
                />
                <input
                  type="number"
                  min="0"
                  className="w-20 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Stock"
                  value={newSizeStock}
                  onChange={(e) => setNewSizeStock(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSizeToDraft(editingProduct.id); } }}
                />
                <button
                  type="button"
                  onClick={() => addSizeToDraft(editingProduct.id)}
                  className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                >
                  <span translate="no" className="material-symbols-outlined text-base">add</span>
                  Agregar
                </button>
              </div>
              {(sizeDrafts[editingProduct.id] ?? []).length > 0 && (
                <p className="mt-2 text-[11px] text-muted">
                  Stock total: {(sizeDrafts[editingProduct.id] ?? []).reduce((a, s) => a + s.stock, 0)} unidades
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-line px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
                  onClick={() => {
                    setEditingProductId(null);
                    onFocusedProductChange(null);
                  }}
                  className="rounded-lg border border-line bg-white px-5 py-3 text-sm font-bold text-muted transition-colors hover:bg-secondary hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSavingSizes}
                  onClick={async () => {
                    await handleSaveDraft(editingProduct);
                    const currentSizes = sizeDrafts[editingProduct.id] ?? [];
                    const hadSizesBefore = Array.isArray(editingProduct.sizes) && editingProduct.sizes.length > 0;
                    if (currentSizes.length > 0 || hadSizesBefore) {
                      try {
                        setIsSavingSizes(true);
                        await onSetProductSizes(editingProduct.id, currentSizes.map((s) => ({ size: s.size, stock: s.stock })));
                      } finally {
                        setIsSavingSizes(false);
                      }
                    }
                    setEditingProductId(null);
                    onFocusedProductChange(null);
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
      </>)}

      {activeSubTab === "categorias" && (
        <CategoriesSubPanel
          categories={categories}
          products={products}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
        />
      )}
    </div>
  );
}

/* ── Inline Categories Manager ──────────────────────────────── */

type CategoriesSubPanelProps = {
  categories: Category[];
  products: Product[];
  onAddCategory: (name: string, parentId?: number | null) => void;
  onUpdateCategory: (id: number, name: string) => void;
  onDeleteCategory: (id: number) => void;
};

function CategoriesSubPanel({ categories, products, onAddCategory, onUpdateCategory, onDeleteCategory }: CategoriesSubPanelProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const rootCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => !!c.parentId);

  const productCountByCategory = useMemo(() => {
    const counts = new Map<number, number>();
    const collectDescendants = (categoryId: number) => {
      const visited = new Set<number>();
      const queue = [categoryId];
      while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId || visited.has(currentId)) continue;
        visited.add(currentId);
        categories.filter((c) => c.parentId === currentId).forEach((c) => queue.push(c.id));
      }
      return visited;
    };
    categories.forEach((c) => {
      const descendantIds = collectDescendants(c.id);
      counts.set(c.id, products.filter((p) => p.categoryId != null && descendantIds.has(p.categoryId)).length);
    });
    return counts;
  }, [categories, products]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onAddCategory(name.trim(), parentId ? Number(parentId) : null);
    setName("");
    setParentId("");
  };

  const startEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingName(category.name);
  };
  const cancelEdit = () => { setEditingCategoryId(null); setEditingName(""); };
  const saveEdit = (categoryId: number) => {
    if (!editingName.trim()) return;
    onUpdateCategory(categoryId, editingName.trim());
    cancelEdit();
  };

  const renderCategoryRow = (category: Category, isSubcategory = false) => {
    const isEditing = editingCategoryId === category.id;
    return (
      <div
        key={category.id}
        className={`flex flex-col gap-3 border-t border-neutral-soft/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
          isSubcategory ? "bg-slate-50/60 sm:pl-14" : "hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <span translate="no" className={`material-symbols-outlined ${isSubcategory ? "text-slate-400" : "text-primary"} text-xl`}>
            {isSubcategory ? "subdirectory_arrow_right" : "folder"}
          </span>
          {isEditing ? (
            <input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 sm:w-64"
            />
          ) : (
            <span className={`font-medium ${isSubcategory ? "text-slate-700" : "font-bold text-slate-800"}`}>{category.name}</span>
          )}
          <span className="rounded-full bg-quaternary px-2 py-0.5 text-xs font-bold text-primary">
            {productCountByCategory.get(category.id) ?? 0} productos
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <button type="button" onClick={() => saveEdit(category.id)} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Guardar</button>
              <button type="button" onClick={cancelEdit} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">Cancelar</button>
            </>
          ) : (
            <button type="button" onClick={() => startEdit(category)} className="rounded-lg bg-tertiary/18 p-2 text-[#4f6780] transition-colors hover:bg-tertiary hover:text-white" title="Editar categoria">
              <span translate="no" className="material-symbols-outlined text-lg">edit</span>
            </button>
          )}
          <button type="button" onClick={() => onDeleteCategory(category.id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500" title="Eliminar categoria">
            <span translate="no" className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="flex flex-col items-stretch gap-4 rounded-xl border border-neutral-soft bg-white p-5 shadow-sm sm:flex-row sm:items-end">
        <div className="w-full flex-1 space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre de la categoría</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Aros, Cadenas, Plata..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="w-full flex-1 space-y-2">
          <label className="text-sm font-bold text-slate-700">Subcategoría de (opcional)</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Categoría principal</option>
            {rootCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 sm:self-auto">
          <span translate="no" className="material-symbols-outlined">add</span>
          Agregar
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-neutral-soft bg-white shadow-sm">
        <div className="border-b border-neutral-soft p-4">
          <h3 className="font-bold text-slate-800">Categorías ({categories.length})</h3>
        </div>
        {categories.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span translate="no" className="material-symbols-outlined mb-3 block text-5xl">category</span>
            No hay categorías creadas todavía.
          </div>
        ) : (
          <div className="divide-y divide-neutral-soft">
            {rootCategories.map((category) => (
              <div key={`group-${category.id}`}>
                {renderCategoryRow(category)}
                {subCategories.filter((sub) => sub.parentId === category.id).map((sub) => renderCategoryRow(sub, true))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsPanel;
