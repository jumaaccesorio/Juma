import { useState } from "react";
import type { Category } from "../../types";

type CategoriesPanelProps = {
  categories: Category[];
  onAddCategory: (name: string, parentId?: number | null) => void;
  onDeleteCategory: (id: number) => void;
};

function CategoriesPanel({ categories, onAddCategory, onDeleteCategory }: CategoriesPanelProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");

  const rootCategories = categories.filter(c => !c.parentId);
  const subCategories = categories.filter(c => !!c.parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddCategory(name.trim(), parentId ? Number(parentId) : null);
    setName("");
    setParentId("");
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-12 bg-secondary dark:bg-carbon min-h-screen">
      <div>
        <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Gestión de Categorías</h2>
        <p className="text-slate-500 mt-1">Crea las categorías y subcategorías para organizar tu catálogo.</p>
      </div>

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre de la Categoría</label>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej. Aros, Cadenas, Plata..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-bold text-slate-700">Subcategoría de (opcional)</label>
          <select
            value={parentId}
            onChange={e => setParentId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="">— Categoría principal —</option>
            {rootCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
        >
          <span className="material-symbols-outlined">add</span>
          Agregar
        </button>
      </form>

      {/* Category Tree */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-soft dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-soft dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">Categorías ({categories.length})</h3>
        </div>
        {categories.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl block mb-3">category</span>
            No hay categorías creadas todavía.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-soft dark:divide-slate-800">
            {rootCategories.map(cat => (
              <li key={cat.id}>
                <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">folder</span>
                    <span className="font-bold text-slate-800 dark:text-white">{cat.name}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {subCategories.filter(s => s.parentId === cat.id).length} subcategorías
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                    title="Eliminar categoría"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
                {/* Subcategories */}
                {subCategories.filter(s => s.parentId === cat.id).map(sub => (
                  <div key={sub.id} className="flex items-center justify-between px-5 py-3 pl-14 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 border-t border-neutral-soft/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-lg">subdirectory_arrow_right</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{sub.name}</span>
                    </div>
                    <button
                      onClick={() => onDeleteCategory(sub.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CategoriesPanel;
