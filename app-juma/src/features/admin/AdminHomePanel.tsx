import { useState } from "react";
import type { Category, FeaturedPanel, FeaturedPeriod, CatalogSortOrder, HeroBanner, ProductReview } from "../../types";

type AdminHomePanelProps = {
  heroBanner: HeroBanner;
  featuredPanels: FeaturedPanel[];
  categories: Category[];
  canAddMorePanels: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  featuredPeriod: FeaturedPeriod;
  onChangeFeaturedPeriod: (period: FeaturedPeriod) => void;
  catalogSortOrder: CatalogSortOrder;
  onChangeCatalogSortOrder: (order: CatalogSortOrder) => void;
  allReviews: ProductReview[];
  onDeleteReview: (reviewId: number) => void;
  onUpdateHeroText: (field: "tag" | "title" | "subtitle", value: string) => void;
  onUpdateHeroImage: (file: File | null) => void;
  onUpdateFeaturedPanelText: (id: string, field: "title" | "cta", value: string) => void;
  onUpdateFeaturedPanelImage: (id: string, file: File | null) => void;
  onUpdateFeaturedPanelCategory: (id: string, categoryId: number | null, categoryName: string | null) => void;
  onAddFeaturedPanel: () => void;
  onRemoveFeaturedPanel: (id: string) => void;
  onSaveConfiguration: () => void;
};

function AdminHomePanel({
  heroBanner,
  featuredPanels,
  categories,
  canAddMorePanels,
  hasUnsavedChanges,
  isSaving,
  featuredPeriod,
  onChangeFeaturedPeriod,
  catalogSortOrder,
  onChangeCatalogSortOrder,
  allReviews,
  onDeleteReview,
  onUpdateHeroText,
  onUpdateHeroImage,
  onUpdateFeaturedPanelText,
  onUpdateFeaturedPanelImage,
  onAddFeaturedPanel,
  onRemoveFeaturedPanel,
  onUpdateFeaturedPanelCategory,
  onSaveConfiguration,
}: AdminHomePanelProps) {
  const [reviewSearch, setReviewSearch] = useState("");

  const filteredReviews = allReviews.filter((rev) => {
    if (!reviewSearch.trim()) return true;
    const q = reviewSearch.toLowerCase().trim();
    return (
      (rev.clientName ?? "").toLowerCase().includes(q) ||
      (rev.productName ?? "").toLowerCase().includes(q) ||
      (rev.comment ?? "").toLowerCase().includes(q)
    );
  });
  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 space-y-6 px-4 pb-12 pt-20 sm:px-6 lg:px-10 lg:pt-24">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-slate-900 lg:text-3xl">Configuración del Inicio</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Gestioná los banners principales y los carteles destacados de la tienda.</p>
        </div>

        <button
          type="button"
          onClick={onSaveConfiguration}
          disabled={!hasUnsavedChanges || isSaving}
          className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-95 ${
            !hasUnsavedChanges || isSaving
              ? "cursor-not-allowed bg-slate-300 opacity-60 shadow-none"
              : "bg-slate-900 hover:bg-slate-800"
          }`}
        >
          <span translate="no" className="material-symbols-outlined text-[18px]">{isSaving ? "progress_activity" : "save"}</span>
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {/* ── CATALOG SORTING & FEATURED PERIOD CONFIG ── */}
      <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <span translate="no" className="material-symbols-outlined text-lg">sort</span>
          </div>
          <div>
            <h2 className="font-headline text-lg font-bold text-slate-900">Ordenamiento de Productos y Destacados</h2>
            <p className="text-xs text-slate-400">Configurá cómo se muestran los productos en el catálogo principal y en el inicio.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Criterio de ordenamiento global */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Criterio de orden en el Catálogo / Menú
            </label>
            <div className="space-y-2">
              {[
                { id: "ventas", label: "Más vendidos", desc: "Prioriza los productos con mayores ventas registradas", icon: "trending_up" },
                { id: "recientes", label: "Más recientes", desc: "Muestra primero los últimos cargados a la tienda", icon: "new_releases" },
                { id: "precio_asc", label: "Menor a Mayor precio", desc: "Ordena de más económico a más costoso", icon: "arrow_upward" },
                { id: "precio_desc", label: "Mayor a Menor precio", desc: "Ordena de más costoso a más económico", icon: "arrow_downward" },
                { id: "nombre", label: "Alfabético (A - Z)", desc: "Ordena por nombre del producto", icon: "sort_by_alpha" },
              ].map((opt) => {
                const isActive = catalogSortOrder === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeCatalogSortOrder(opt.id as CatalogSortOrder)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? "border-primary bg-primary/5 text-slate-900 font-bold"
                        : "border-slate-100 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span translate="no" className={`material-symbols-outlined text-lg ${isActive ? "text-primary" : "text-slate-400"}`}>
                        {opt.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold">{opt.label}</p>
                        <p className="text-[11px] text-slate-400 font-normal">{opt.desc}</p>
                      </div>
                    </div>
                    <span translate="no" className={`material-symbols-outlined text-sm ${isActive ? "text-primary" : "text-slate-300"}`}>
                      {isActive ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Periodo de cálculo de ventas */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Periodo de cálculo de Más Vendidos
            </label>
            <div className="space-y-3">
              {(["1", "6", "12"] as const).map((p) => {
                const labels: Record<string, string> = { "1": "Último mes (30 días)", "6": "Últimos 6 meses", "12": "Último año (12 meses)" };
                const isActive = featuredPeriod === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onChangeFeaturedPeriod(p)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? "border-amber-500 bg-amber-50/50 text-slate-900 font-bold shadow-sm"
                        : "border-slate-100 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span translate="no" className={`material-symbols-outlined text-lg ${isActive ? "text-amber-600" : "text-slate-400"}`}>
                        calendar_today
                      </span>
                      <span className="text-xs font-bold">{labels[p]}</span>
                    </div>
                    <span translate="no" className={`material-symbols-outlined text-sm ${isActive ? "text-amber-600" : "text-slate-300"}`}>
                      {isActive ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
              Los datos se calculan automáticamente analizando los pedidos finalizados en el periodo seleccionado.
            </p>
          </div>
        </div>
      </div>

      {/* ── GESTIÓN DE RESEÑAS Y COMENTARIOS DE CLIENTES ── */}
      <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <span translate="no" className="material-symbols-outlined text-lg">star</span>
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-slate-900">Gestión de Reseñas y Comentarios</h2>
              <p className="text-xs text-slate-400">Moderá y revisá todas las valoraciones enviadas por los clientes.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
              <span translate="no" className="material-symbols-outlined text-sm">rate_review</span>
              {allReviews.length} reseña{allReviews.length === 1 ? "" : "s"} totales
            </span>
          </div>
        </div>

        {/* Buscador de reseñas */}
        <div className="relative">
          <span translate="no" className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
            placeholder="Buscar por cliente, producto o contenido del comentario..."
            value={reviewSearch}
            onChange={(e) => setReviewSearch(e.target.value)}
          />
        </div>

        {/* Lista de reseñas */}
        {filteredReviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-400">
            {reviewSearch ? "No se encontraron reseñas que coincidan con la búsqueda." : "Aún no hay reseñas cargadas por clientes."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredReviews.map((rev) => (
              <div key={rev.id} className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:shadow-xs transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rev.productName || `Producto #${rev.productId}`}</p>
                      <p className="text-[11px] font-medium text-slate-500">Por: {rev.clientName || `Cliente #${rev.clientId}`}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                      <span translate="no" className="material-symbols-outlined text-xs text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-xs font-extrabold text-amber-700">{rev.rating}</span>
                    </div>
                  </div>
                  {rev.comment.trim() && (
                    <p className="mt-2.5 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] text-slate-400">
                  <span>{new Date(rev.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("¿Seguro que deseas eliminar esta reseña?")) {
                        onDeleteReview(rev.id);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span translate="no" className="material-symbols-outlined text-xs">delete</span>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* ── HERO BANNER EDITOR ── */}
        <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <span translate="no" className="material-symbols-outlined text-lg">view_carousel</span>
              </div>
              <div>
                <h2 className="font-headline text-lg font-bold text-slate-900">Banner Principal (Hero)</h2>
                <p className="text-xs text-slate-400">Texto e imagen principal de la tienda online.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Etiqueta Superior (Tag)</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
                  placeholder="Ej. TIENDA ONLINE MINORISTA"
                  value={heroBanner.tag}
                  onChange={(e) => onUpdateHeroText("tag", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Título Principal</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
                  placeholder="Ej. 3 Cuotas Sin Interés"
                  value={heroBanner.title}
                  onChange={(e) => onUpdateHeroText("title", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Subtítulo Descriptivo</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs resize-none h-24"
                  placeholder="Ej. 20% off en efectivo / 10% off transferencia"
                  value={heroBanner.subtitle}
                  onChange={(e) => onUpdateHeroText("subtitle", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Imagen de Fondo</label>
              <div className="relative h-52 w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center group">
                {heroBanner.image ? (
                  <>
                    <img className="h-full w-full object-cover" src={heroBanner.image} alt="Banner Preview" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-bold text-xs flex items-center gap-2">
                        <span translate="no" className="material-symbols-outlined text-[18px]">edit</span>
                        Cambiar Imagen
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400">
                    <span translate="no" className="material-symbols-outlined text-3xl mb-1 block">add_photo_alternate</span>
                    <span className="text-xs font-semibold">Subir imagen de banner</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => onUpdateHeroImage(e.target.files?.[0] ?? null)} />
              </div>
              <p className="mt-2 text-[10px] text-slate-400 font-medium">Recomendado: 1920x1080px, JPG o WebP.</p>
            </div>
          </div>
        </div>

        {/* ── FEATURED PANELS EDITOR ── */}
        <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <span translate="no" className="material-symbols-outlined text-lg">grid_view</span>
              </div>
              <div>
                <h2 className="font-headline text-lg font-bold text-slate-900">Carteles Destacados de Categoría</h2>
                <p className="text-xs text-slate-400">Páneles promocionales en el inicio.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!canAddMorePanels && (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-bold text-amber-600">
                  Límite de 4 alcanzado
                </span>
              )}
              <button
                type="button"
                onClick={onAddFeaturedPanel}
                disabled={!canAddMorePanels}
                className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all disabled:opacity-40"
              >
                <span translate="no" className="material-symbols-outlined text-[16px]">add</span>
                Agregar Cartel
              </button>
            </div>
          </div>

          {featuredPanels.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs font-semibold text-slate-400">
              No hay carteles destacados configurados.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredPanels.map((panel, index) => (
                <div key={`editor-${panel.id}`} className="relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3 transition-all hover:border-slate-300">
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      type="button"
                      onClick={() => onRemoveFeaturedPanel(panel.id)}
                      className="flex size-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-2xs hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Eliminar cartel"
                    >
                      <span translate="no" className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>

                  <span className="absolute top-3 left-3 z-10 flex size-6 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-extrabold text-white shadow-2xs">
                    {index + 1}
                  </span>

                  <div className="relative h-32 w-full overflow-hidden rounded-xl bg-slate-200 border border-slate-200/60">
                    {panel.image ? (
                      <img className="h-full w-full object-cover" src={panel.image} alt={panel.title} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <span translate="no" className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => onUpdateFeaturedPanelImage(panel.id, e.target.files?.[0] ?? null)} />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Título</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-primary shadow-2xs"
                        value={panel.title}
                        onChange={(e) => onUpdateFeaturedPanelText(panel.id, "title", e.target.value)}
                        placeholder="Título (Ej. Acero Quirúrgico)"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Texto Botón (CTA)</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-primary shadow-2xs"
                        value={panel.cta}
                        onChange={(e) => onUpdateFeaturedPanelText(panel.id, "cta", e.target.value)}
                        placeholder="CTA (Ej. Mirá más)"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Categoría Vinculada</label>
                      <select
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-primary shadow-2xs"
                        value={panel.categoryId ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            onUpdateFeaturedPanelCategory(panel.id, null, null);
                          } else {
                            const cat = categories.find((c) => c.id === Number(val));
                            onUpdateFeaturedPanelCategory(panel.id, Number(val), cat?.name ?? null);
                          }
                        }}
                      >
                        <option value="">— Sin categoría —</option>
                        {categories.filter((c) => !c.parentId).map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminHomePanel;
