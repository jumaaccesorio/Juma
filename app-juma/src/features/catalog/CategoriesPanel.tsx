import { useMemo, useState } from "react";
import type { Category, Product } from "../../types";

type CategoriesPanelProps = {
  categories: Category[];
  products: Product[];
  onAddCategory: (name: string, parentId?: number | null) => void;
  onUpdateCategory: (id: number, name: string) => void;
  onDeleteCategory: (id: number) => void;
};

function CategoriesPanel({ categories, products, onAddCategory, onUpdateCategory, onDeleteCategory }: CategoriesPanelProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const rootCategories = categories.filter((category) => !category.parentId);
  const subCategories = categories.filter((category) => !!category.parentId);

  const productCountByCategory = useMemo(() => {
    const counts = new Map<number, number>();

    const collectDescendants = (categoryId: number) => {
      const visited = new Set<number>();
      const queue = [categoryId];

      while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId || visited.has(currentId)) continue;
        visited.add(currentId);
        categories.filter((category) => category.parentId === currentId).forEach((category) => queue.push(category.id));
      }

      return visited;
    };

    categories.forEach((category) => {
      const descendantIds = collectDescendants(category.id);
      const total = products.filter((product) => product.categoryId != null && descendantIds.has(product.categoryId)).length;
      counts.set(category.id, total);
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

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditingName("");
  };

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
          <span className={`material-symbols-outlined ${isSubcategory ? "text-slate-400" : "text-primary"} text-xl`}>
            {isSubcategory ? "subdirectory_arrow_right" : "folder"}
          </span>
          {isEditing ? (
            <input
              value={editingName}
              onChange={(event) => setEditingName(event.target.value)}
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
              <button type="button" onClick={() => saveEdit(category.id)} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                Guardar
              </button>
              <button type="button" onClick={cancelEdit} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => startEdit(category)}
              className="rounded-lg bg-tertiary/18 p-2 text-[#4f6780] transition-colors hover:bg-tertiary hover:text-white"
              title="Editar categoria"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteCategory(category.id)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Eliminar categoria"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-screen space-y-8 bg-secondary p-4 md:p-8">
      <div>
        <h2 className="font-serif text-3xl font-bold text-slate-900">Gestion de Categorias</h2>
        <p className="mt-1 text-slate-500">Crea, renombra y organiza las categorias y subcategorias de tu catalogo.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col items-end gap-4 rounded-xl border border-neutral-soft bg-white p-5 shadow-sm sm:flex-row">
        <div className="w-full flex-1 space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre de la categoria</label>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Aros, Cadenas, Plata..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="w-full flex-1 space-y-2">
          <label className="text-sm font-bold text-slate-700">Subcategoria de (opcional)</label>
          <select
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Categoria principal</option>
            {rootCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">add</span>
          Agregar
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-neutral-soft bg-white shadow-sm">
        <div className="border-b border-neutral-soft p-4">
          <h3 className="font-bold text-slate-800">Categorias ({categories.length})</h3>
        </div>

        {categories.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined mb-3 block text-5xl">category</span>
            No hay categorias creadas todavia.
          </div>
        ) : (
          <div className="divide-y divide-neutral-soft">
            {rootCategories.map((category) => (
              <div key={`group-${category.id}`}>
                {renderCategoryRow(category)}
                {subCategories.filter((subCategory) => subCategory.parentId === category.id).map((subCategory) => renderCategoryRow(subCategory, true))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoriesPanel;
