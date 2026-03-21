import { useMemo, useState } from "react";
import type { Category, Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";

type InventoryPanelProps = {
  products: Product[];
  categories: Category[];
  lowStockProducts: Product[];
  onUpdateStock: (productId: number, newStock: number) => void;
  onSaveProductEdits: (productId: number, updates: Partial<Product>) => void;
};

function InventoryPanel({ products, categories, lowStockProducts, onUpdateStock, onSaveProductEdits }: InventoryPanelProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubName, setEditSubName] = useState("");

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !normalized ||
        [product.name, product.subName, product.categoryName || ""].some((value) =>
          (value || "").toLowerCase().includes(normalized),
        );
      const matchesCategory = !categoryFilter || String(product.categoryId ?? "") === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, categoryFilter]);

  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const startEdit = (product: Product) => {
    setEditingProductId(product.id);
    setEditName(product.name);
    setEditSubName(product.subName);
  };

  const saveEdit = (product: Product) => {
    const normalizedName = editName.trim();
    const normalizedSubName = editSubName.trim();
    if (!normalizedName && !normalizedSubName) return;
    onSaveProductEdits(product.id, {
      name: normalizedName || normalizedSubName,
      subName: normalizedSubName,
    });
    setEditingProductId(null);
  };

  return (
    <div className="min-h-screen flex-1 space-y-8 bg-secondary p-4 text-ink md:space-y-12 md:p-10">
      <div className="space-y-6 md:hidden">
        <div className="mb-8">
          <h2 className="font-headline text-4xl text-primary leading-tight">Curated Inventory</h2>
          <p className="mt-1 text-sm tracking-wide text-secondary">Refining the digital atelier&apos;s stock.</p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <span className="material-symbols-outlined text-lg text-outline">search</span>
          </div>
          <input
            className="w-full rounded-none border-none bg-surface-container-lowest py-4 pl-12 pr-4 text-sm outline outline-1 outline-outline-variant/15 transition-all focus:outline-primary"
            placeholder="Search archive..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
          />
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setCategoryFilter("")}
            className={`whitespace-nowrap rounded-full px-6 py-2 text-xs font-medium ${!categoryFilter ? "bg-primary text-on-primary" : "bg-surface-container-low text-secondary hover:bg-secondary-container"}`}
          >
            All
          </button>
          {rootCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryFilter(String(category.id))}
              className={`whitespace-nowrap rounded-full px-6 py-2 text-xs font-medium transition-colors ${
                categoryFilter === String(category.id)
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-secondary hover:bg-secondary-container"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {filteredProducts.map((product) => (
            <div key={`atelier-mobile-${product.id}`} className="flex items-center gap-4 bg-surface-container-lowest p-5 shadow-[0_12px_40px_rgba(45,45,45,0.04)]">
              <div className="h-24 w-24 shrink-0 overflow-hidden bg-surface-container-low">
                {product.image ? (
                  <img src={product.image} alt={getProductDisplayName(product)} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <span className="material-symbols-outlined">image</span>
                  </div>
                )}
              </div>
              <div className="flex h-24 flex-grow flex-col justify-between">
                <div>
                  <h3 className="font-headline text-lg italic text-on-surface">{getProductDisplayName(product)}</h3>
                  <p className="mt-0.5 text-[10px] uppercase tracking-widest text-secondary">{product.categoryName || "Sin categoria"}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateStock(product.id, Math.max(0, product.stock - 1))}
                      className="flex h-8 w-8 items-center justify-center border border-outline-variant/30 text-primary transition-all active:scale-95 hover:bg-secondary-container"
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="w-6 text-center font-headline text-lg italic">{String(product.stock).padStart(2, "0")}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateStock(product.id, product.stock + 1)}
                      className="flex h-8 w-8 items-center justify-center border border-outline-variant/30 text-primary transition-all active:scale-95 hover:bg-secondary-container"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                    product.stock <= 2 ? "bg-error-container/20 text-error" : "bg-tertiary-container/20 text-on-tertiary-container"
                  }`}>
                    {product.stock <= 2 ? "LOW STOCK" : "IN STOCK"}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 text-center text-sm text-secondary shadow-[0_12px_40px_rgba(45,45,45,0.04)]">
              No hay productos en el inventario.
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden md:block space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-ink">Control de Inventario</h2>
          <p className="text-slate-500 mt-1">Supervisa niveles criticos de stock y actualiza cantidades.</p>
        </div>
      </div>

      {lowStockProducts.length > 0 ? (
        <div className="flex items-start gap-3 rounded-r-lg border-l-4 border-warning bg-warning/18 p-4 shadow-sm">
          <span className="material-symbols-outlined mt-0.5 text-[#9a6d48]">warning</span>
          <div>
            <h4 className="text-sm font-bold text-[#8a6140]">Atencion: Productos con bajo stock</h4>
            <p className="mt-1 text-sm text-[#8a6140]">
              Los siguientes productos requieren reposicion inminente:{" "}
              <strong className="font-bold">{lowStockProducts.map((product) => getProductDisplayName(product)).join(", ")}</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-r-lg border-l-4 border-success bg-success/20 p-4 shadow-sm">
          <span className="material-symbols-outlined text-[#647554]">check_circle</span>
          <p className="text-sm font-bold text-[#647554]">El inventario se encuentra en niveles optimos. No hay productos en falta critica.</p>
        </div>
      )}

      <div className="bg-background rounded-xl border border-line overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h3 className="font-bold text-lg text-ink">Existencias</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative min-w-[220px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Buscar producto..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="min-w-[220px] bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
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
          {filteredProducts.map((product) => (
            <div key={`mobile-${product.id}`} className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                  {product.image ? (
                    <img src={product.image} alt={getProductDisplayName(product)} className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-300">image</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{getProductDisplayName(product)}</p>
                  <p className="mt-1 text-xs text-slate-500">{product.categoryName || "Sin categoria"}</p>
                  <span className={`mt-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${product.stock <= 2 ? "bg-warning/30 text-[#9a6d48]" : product.stock <= 10 ? "bg-quaternary text-primary" : "bg-tertiary/20 text-[#4f6780]"}`}>
                    {product.stock} units
                  </span>
                </div>
              </div>
              {editingProductId === product.id ? (
                <div className="mt-4 space-y-2">
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nombre visible"
                  />
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={editSubName}
                    onChange={(e) => setEditSubName(e.target.value)}
                    placeholder="Subnombre"
                  />
                </div>
              ) : null}
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-inner">
                  <button type="button" onClick={() => onUpdateStock(product.id, Math.max(0, product.stock - 1))} className="flex h-8 w-8 items-center justify-center rounded text-slate-500">
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={product.stock}
                    onChange={(e) => onUpdateStock(product.id, Number(e.target.value))}
                    className="w-14 border-none bg-transparent p-0 text-center text-sm font-bold text-slate-900 focus:ring-0"
                  />
                  <button type="button" onClick={() => onUpdateStock(product.id, product.stock + 1)} className="flex h-8 w-8 items-center justify-center rounded text-slate-500">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                {editingProductId === product.id ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveEdit(product)} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditingProductId(null)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => startEdit(product)} className="inline-flex items-center gap-1 rounded-lg bg-tertiary/18 px-3 py-2 text-xs font-bold text-[#4f6780]">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Editar
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-8 text-center text-sm text-slate-500 shadow-sm">No hay productos en el inventario.</div>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Producto</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Categoria</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Stock Actual</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Ajuste Manual</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-soft dark:divide-slate-800">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-secondary/35 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {product.image ? (
                          <img src={product.image} alt={getProductDisplayName(product)} className="h-full w-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-300">image</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-ink block">{getProductDisplayName(product)}</span>
                        {editingProductId === product.id ? (
                          <div className="mt-2 flex flex-col gap-2">
                            <input
                              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nombre visible"
                            />
                            <input
                              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                              value={editSubName}
                              onChange={(e) => setEditSubName(e.target.value)}
                              placeholder="Subnombre"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{product.categoryName || "Sin categoria"}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${product.stock <= 2 ? "bg-warning/30 text-[#9a6d48]" : product.stock <= 10 ? "bg-quaternary text-primary" : "bg-tertiary/20 text-[#4f6780]"}`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => onUpdateStock(product.id, Math.max(0, product.stock - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={product.stock}
                          onChange={(e) => onUpdateStock(product.id, Number(e.target.value))}
                          className="w-14 text-center text-sm font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateStock(product.id, product.stock + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {editingProductId === product.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(product)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90"
                        >
                          <span className="material-symbols-outlined text-sm">save</span>
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProductId(null)}
                          className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="inline-flex items-center gap-1 rounded-lg bg-tertiary/18 px-3 py-2 text-xs font-bold text-[#4f6780] transition-colors hover:bg-tertiary hover:text-white"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No hay productos en el inventario.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

export default InventoryPanel;
