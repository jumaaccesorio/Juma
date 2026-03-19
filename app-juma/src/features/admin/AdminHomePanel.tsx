import type { Category, FeaturedPanel, HeroBanner } from "../../types";

type AdminHomePanelProps = {
  heroBanner: HeroBanner;
  featuredPanels: FeaturedPanel[];
  categories: Category[];
  canAddMorePanels: boolean;
  onUpdateHeroText: (field: "tag" | "title" | "subtitle", value: string) => void;
  onUpdateHeroImage: (file: File | null) => void;
  onUpdateFeaturedPanelText: (id: string, field: "title" | "cta", value: string) => void;
  onUpdateFeaturedPanelImage: (id: string, file: File | null) => void;
  onUpdateFeaturedPanelCategory: (id: string, categoryId: number | null, categoryName: string | null) => void;
  onAddFeaturedPanel: () => void;
  onRemoveFeaturedPanel: (id: string) => void;
};

function AdminHomePanel({
  heroBanner,
  featuredPanels,
  categories,
  canAddMorePanels,
  onUpdateHeroText,
  onUpdateHeroImage,
  onUpdateFeaturedPanelText,
  onUpdateFeaturedPanelImage,
  onAddFeaturedPanel,
  onRemoveFeaturedPanel,
  onUpdateFeaturedPanelCategory,
}: AdminHomePanelProps) {
  return (
    <div className="flex-1 p-6 md:p-10 space-y-20 bg-secondary dark:bg-carbon min-h-screen">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Configuración del Inicio</h2>
          <p className="text-slate-500 mt-1">Gestiona los banners y carteles destacados de la tienda.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Hero Editor */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-neutral-soft dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-neutral-soft dark:border-slate-800 pb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">view_carousel</span>
            Editar Banner Principal
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Etiqueta Sup. (Tag)</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej. NUEVA COLECCIÓN" value={heroBanner.tag} onChange={(e) => onUpdateHeroText("tag", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Título Principal</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej. Elegancia Atemporal" value={heroBanner.title} onChange={(e) => onUpdateHeroText("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Subtítulo Descriptivo</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none h-24" placeholder="Ej. Descubre piezas únicas..." value={heroBanner.subtitle} onChange={(e) => onUpdateHeroText("subtitle", e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Imagen de Fondo (Banner)</label>
              <div className="h-48 w-full rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 relative group">
                {heroBanner.image ? (
                  <>
                    <img className="h-full w-full object-cover" src={heroBanner.image} alt="Banner" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-bold flex items-center gap-2"><span className="material-symbols-outlined">edit</span> Cambiar Imagen</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
                    <p className="text-sm font-medium">Subir imagen</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onUpdateHeroImage(e.target.files?.[0] ?? null)} />
              </div>
              <p className="text-xs text-slate-500 mt-2">Recomendado: 1920x1080px, formato JPG o WebP.</p>
            </div>
          </div>
        </div>

        {/* Featured Panels Editor */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-neutral-soft dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-neutral-soft dark:border-slate-800 pb-4 gap-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">grid_view</span>
              Editar Carteles Destacados
            </h3>
            <div className="flex items-center gap-4">
              {!canAddMorePanels && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Límite de 4 carteles alcanzado</span>}
              <button 
                type="button" 
                onClick={onAddFeaturedPanel} 
                disabled={!canAddMorePanels}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${canAddMorePanels ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                <span className="material-symbols-outlined text-lg">add</span> Agregar
              </button>
            </div>
          </div>

          {featuredPanels.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">hide_image</span>
              <p className="text-slate-500 font-medium">No hay carteles destacados configurados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredPanels.map((panel, index) => (
                <div key={`editor-${panel.id}`} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
                  <div className="absolute top-2 right-2 z-10">
                    <button 
                      type="button" 
                      onClick={() => onRemoveFeaturedPanel(panel.id)}
                      className="h-8 w-8 rounded-full bg-red-100/80 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors backdrop-blur-sm"
                      title="Eliminar cartel"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  
                  <span className="absolute top-2 left-2 z-10 h-6 w-6 rounded-md bg-white/90 shadow text-xs font-black text-slate-700 flex items-center justify-center">{index + 1}</span>

                  <div className="h-32 w-full rounded-lg bg-slate-200 mb-4 overflow-hidden border border-slate-300 relative">
                    {panel.image ? (
                      <img className="h-full w-full object-cover" src={panel.image} alt={panel.title} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onUpdateFeaturedPanelImage(panel.id, e.target.files?.[0] ?? null)} />
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      className="w-full bg-white border border-slate-200 rounded text-sm px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                      value={panel.title}
                      onChange={(e) => onUpdateFeaturedPanelText(panel.id, "title", e.target.value)}
                      placeholder="Título (Ej. Anillos)"
                    />
                    <input
                      className="w-full bg-white border border-slate-200 rounded text-xs px-3 py-2 text-slate-500 focus:ring-2 focus:ring-primary/20 outline-none"
                      value={panel.cta}
                      onChange={(e) => onUpdateFeaturedPanelText(panel.id, "cta", e.target.value)}
                      placeholder="CTA (Ej. Ver 42 items)"
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">category</span>
                        Categoría vinculada
                      </label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded text-xs px-3 py-2 text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none"
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
                        <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">link</span>
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
