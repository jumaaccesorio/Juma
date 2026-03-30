import type { Category, FeaturedPanel, HeroBanner } from "../../types";

type AdminHomePanelProps = {
  heroBanner: HeroBanner;
  featuredPanels: FeaturedPanel[];
  categories: Category[];
  canAddMorePanels: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
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
  onUpdateHeroText,
  onUpdateHeroImage,
  onUpdateFeaturedPanelText,
  onUpdateFeaturedPanelImage,
  onAddFeaturedPanel,
  onRemoveFeaturedPanel,
  onUpdateFeaturedPanelCategory,
  onSaveConfiguration,
}: AdminHomePanelProps) {
  return (
    <div className="min-h-screen flex-1 space-y-8 bg-secondary/30 p-4 md:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl lg:text-3xl text-ink">Configuración del Inicio</h2>
          <p className="text-sm text-muted mt-1">Gestiona los banners y carteles destacados de la tienda.</p>
        </div>
        <button
          type="button"
          onClick={onSaveConfiguration}
          disabled={!hasUnsavedChanges || isSaving}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-all ${
            !hasUnsavedChanges || isSaving
              ? "cursor-not-allowed bg-secondary text-muted/50 border border-line/40"
              : "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          }`}
        >
          <span className="material-symbols-outlined text-lg">{isSaving ? "progress_activity" : "save"}</span>
          {isSaving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Hero Editor */}
        <div className="bg-white p-5 lg:p-7 rounded-xl border border-line/60 shadow-sm">
          <h3 className="text-base font-bold text-ink mb-5 pb-3 border-b border-line/40 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">view_carousel</span>
            Editar Banner Principal
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink/70">Etiqueta Sup. (Tag)</label>
                <input
                  className="w-full bg-secondary/50 border border-line/60 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                  placeholder="Ej. NUEVA COLECCIÓN"
                  value={heroBanner.tag}
                  onChange={(e) => onUpdateHeroText("tag", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink/70">Título Principal</label>
                <input
                  className="w-full bg-secondary/50 border border-line/60 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                  placeholder="Ej. Elegancia Atemporal"
                  value={heroBanner.title}
                  onChange={(e) => onUpdateHeroText("title", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink/70">Subtítulo Descriptivo</label>
                <textarea
                  className="w-full bg-secondary/50 border border-line/60 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none resize-none h-24 transition-all"
                  placeholder="Ej. Descubre piezas únicas..."
                  value={heroBanner.subtitle}
                  onChange={(e) => onUpdateHeroText("subtitle", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink/70">Imagen de Fondo (Banner)</label>
              <div className="h-48 w-full rounded-xl bg-secondary/40 flex items-center justify-center overflow-hidden border-2 border-dashed border-line relative group">
                {heroBanner.image ? (
                  <>
                    <img className="h-full w-full object-cover" src={heroBanner.image} alt="Banner" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-bold text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Cambiar Imagen
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted/50">
                    <span className="material-symbols-outlined text-3xl mb-2">add_photo_alternate</span>
                    <p className="text-xs font-medium">Subir imagen</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onUpdateHeroImage(e.target.files?.[0] ?? null)} />
              </div>
              <p className="text-[10px] text-muted mt-1.5">Recomendado: 1920x1080px, formato JPG o WebP.</p>
            </div>
          </div>
        </div>

        {/* Featured Panels Editor */}
        <div className="bg-white p-5 lg:p-7 rounded-xl border border-line/60 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-3 border-b border-line/40 gap-3">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">grid_view</span>
              Editar Carteles Destacados
            </h3>
            <div className="flex items-center gap-3">
              {!canAddMorePanels && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  Límite de 4 alcanzado
                </span>
              )}
              <button
                type="button"
                onClick={onAddFeaturedPanel}
                disabled={!canAddMorePanels}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                  canAddMorePanels
                    ? "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                    : "bg-secondary text-muted/40 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Agregar
              </button>
            </div>
          </div>

          {featuredPanels.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-line/50 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-muted/30 mb-2 block">hide_image</span>
              <p className="text-sm text-muted/60 font-medium">No hay carteles destacados configurados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredPanels.map((panel, index) => (
                <div key={`editor-${panel.id}`} className="p-3 border border-line/50 rounded-xl bg-secondary/30 relative group hover:border-primary/30 transition-colors">
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      type="button"
                      onClick={() => onRemoveFeaturedPanel(panel.id)}
                      className="h-7 w-7 rounded-full bg-red-100/80 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors backdrop-blur-sm"
                      title="Eliminar cartel"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>

                  <span className="absolute top-2 left-2 z-10 h-5 w-5 rounded-md bg-white/90 shadow text-[10px] font-black text-ink/70 flex items-center justify-center">
                    {index + 1}
                  </span>

                  <div className="h-28 w-full rounded-lg bg-secondary/60 mb-3 overflow-hidden border border-line/30 relative">
                    {panel.image ? (
                      <img className="h-full w-full object-cover" src={panel.image} alt={panel.title} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted/30">
                        <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onUpdateFeaturedPanelImage(panel.id, e.target.files?.[0] ?? null)} />
                  </div>

                  <div className="space-y-2">
                    <input
                      className="w-full bg-white border border-line/50 rounded-lg text-sm px-3 py-2 font-semibold text-ink focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={panel.title}
                      onChange={(e) => onUpdateFeaturedPanelText(panel.id, "title", e.target.value)}
                      placeholder="Título (Ej. Anillos)"
                    />
                    <input
                      className="w-full bg-white border border-line/50 rounded-lg text-xs px-3 py-2 text-muted focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={panel.cta}
                      onChange={(e) => onUpdateFeaturedPanelText(panel.id, "cta", e.target.value)}
                      placeholder="CTA (Ej. Ver 42 items)"
                    />
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted/60 uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">category</span>
                        Categoría vinculada
                      </label>
                      <select
                        className="w-full bg-white border border-line/50 rounded-lg text-xs px-3 py-2 text-ink/70 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={panel.categoryId ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            onUpdateFeaturedPanelCategory(panel.id, null, null);
                          } else {
                            const cat = categories.find(c => c.id === Number(val));
                            onUpdateFeaturedPanelCategory(panel.id, Number(val), cat?.name ?? null);
                          }
                        }}
                      >
                        <option value="">— Sin categoría —</option>
                        {categories.filter(c => !c.parentId).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      {panel.categoryId && (
                        <p className="text-[9px] text-emerald-600 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">link</span>
                          Al hacer clic → catálogo filtrado
                        </p>
                      )}
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
