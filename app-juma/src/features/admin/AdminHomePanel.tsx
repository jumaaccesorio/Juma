import type { FeaturedPanel, HeroBanner } from "../../types";

type AdminHomePanelProps = {
  heroBanner: HeroBanner;
  featuredPanels: FeaturedPanel[];
  canAddMorePanels: boolean;
  onUpdateHeroText: (field: "tag" | "title" | "subtitle", value: string) => void;
  onUpdateHeroImage: (file: File | null) => void;
  onUpdateFeaturedPanelText: (id: string, field: "title" | "cta", value: string) => void;
  onUpdateFeaturedPanelImage: (id: string, file: File | null) => void;
  onAddFeaturedPanel: () => void;
  onRemoveFeaturedPanel: (id: string) => void;
};

function AdminHomePanel({
  heroBanner,
  featuredPanels,
  canAddMorePanels,
  onUpdateHeroText,
  onUpdateHeroImage,
  onUpdateFeaturedPanelText,
  onUpdateFeaturedPanelImage,
  onAddFeaturedPanel,
  onRemoveFeaturedPanel,
}: AdminHomePanelProps) {
  return (
    <section className="panel">
      <h2>Inicio Admin</h2>

      <div className="panel-editor">
        <h3>Editar banner principal</h3>
        <div className="editor-grid">
          <article className="editor-card">
            <label className="field-label">Texto superior</label>
            <input value={heroBanner.tag} onChange={(e) => onUpdateHeroText("tag", e.target.value)} />
            <label className="field-label">Titulo</label>
            <input value={heroBanner.title} onChange={(e) => onUpdateHeroText("title", e.target.value)} />
            <label className="field-label">Subtitulo</label>
            <input value={heroBanner.subtitle} onChange={(e) => onUpdateHeroText("subtitle", e.target.value)} />
            <label className="field-label">Imagen de banner</label>
            <input type="file" accept="image/*" onChange={(e) => onUpdateHeroImage(e.target.files?.[0] ?? null)} />
          </article>
        </div>
      </div>

      <div className="panel-editor">
        <h3>Editar carteles destacados</h3>
        <div className="editor-actions">
          <button type="button" onClick={onAddFeaturedPanel} disabled={!canAddMorePanels}>
            + Agregar cartel
          </button>
          {!canAddMorePanels ? <span>Maximo 4 carteles para este formato.</span> : null}
        </div>
        <div className="editor-grid">
          {featuredPanels.map((panel) => (
            <article key={`editor-${panel.id}`} className="editor-card">
              <label className="field-label">{panel.className}</label>
              <input
                value={panel.title}
                onChange={(e) => onUpdateFeaturedPanelText(panel.id, "title", e.target.value)}
                placeholder="Titulo"
              />
              <input
                value={panel.cta}
                onChange={(e) => onUpdateFeaturedPanelText(panel.id, "cta", e.target.value)}
                placeholder="Texto corto"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onUpdateFeaturedPanelImage(panel.id, e.target.files?.[0] ?? null)}
              />
              <button type="button" className="ghost" onClick={() => onRemoveFeaturedPanel(panel.id)}>
                Eliminar cartel
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AdminHomePanel;
