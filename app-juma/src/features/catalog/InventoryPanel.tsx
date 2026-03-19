import type { Product } from "../../types";

type InventoryPanelProps = {
  products: Product[];
  lowStockProducts: Product[];
  onUpdateStock: (productId: number, newStock: number) => void;
};

function InventoryPanel({ products, lowStockProducts, onUpdateStock }: InventoryPanelProps) {
  return (
    <div className="flex-1 p-6 md:p-10 space-y-20 bg-secondary dark:bg-carbon min-h-screen">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Control de Inventario</h2>
          <p className="text-slate-500 mt-1">Supervisa niveles críticos de stock y actualiza cantidades.</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex gap-3 shadow-sm items-start">
          <span className="material-symbols-outlined text-red-500 mt-0.5">warning</span>
          <div>
            <h4 className="font-bold text-red-800 text-sm">Atención: Productos con bajo stock</h4>
            <p className="text-sm text-red-700 mt-1">
              Los siguientes productos requieren reposición inminente: <strong className="font-bold">{lowStockProducts.map(p => p.name).join(", ")}</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg flex gap-3 shadow-sm items-center">
          <span className="material-symbols-outlined text-green-500">check_circle</span>
          <p className="text-sm font-bold text-green-800">El inventario se encuentra en niveles óptimos. No hay productos en falta crítica.</p>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-soft dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-soft dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Existencias</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Producto</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Categoría</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Stock Actual</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Ajuste Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-soft dark:divide-slate-800">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-300">image</span>
                        )}
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{product.category}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-full text-xs ${product.stock <= 2 ? 'bg-red-100 text-red-700' : product.stock <= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>
                      {product.stock}
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
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No hay productos en el inventario.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InventoryPanel;

