import { useEffect, useMemo, useState } from "react";
import type { Category, FeaturedPanel, HeroBanner, Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";

type CatalogPanelProps = {
  products: Product[];
  categories: Category[];
  onAddToCart: (productId: number) => void;
  featuredPanels: FeaturedPanel[];
  heroBanner: HeroBanner;
  favoriteProductIds: Set<number>;
  onToggleFavorite: (productId: number) => void;
  initialCategory: number | null;
  onCategoryChange: (cat: number | null) => void;
  onPanelCategoryClick: (categoryId: number | null) => void;
};

function CatalogPanel({
  products,
  categories,
  onAddToCart,
  featuredPanels,
  heroBanner,
  favoriteProductIds,
  onToggleFavorite,
  initialCategory,
  onCategoryChange,
  onPanelCategoryClick,
}: CatalogPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(initialCategory);
  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const handleCategoryChange = (category: number | null) => {
    setSelectedCategory(category);
    onCategoryChange(category);
  };

  const heroTitleLines = heroBanner.title.split("\n");
  const selectedCategoryName = selectedCategory ? categories.find((category) => category.id === selectedCategory)?.name ?? null : null;
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;

    const includedCategoryIds = new Set<number>();
    const queue = [selectedCategory];

    while (queue.length > 0) {
      const currentCategoryId = queue.shift();
      if (!currentCategoryId || includedCategoryIds.has(currentCategoryId)) continue;
      includedCategoryIds.add(currentCategoryId);
      categories
        .filter((category) => category.parentId === currentCategoryId)
        .forEach((category) => queue.push(category.id));
    }

    return products.filter((product) => product.categoryId != null && includedCategoryIds.has(product.categoryId));
  }, [categories, products, selectedCategory]);

  return (
    <div className="flex flex-col">
      <section className="relative h-[716px] min-h-[500px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: `linear-gradient(to right, rgba(45, 45, 45, 0.58), transparent), url("${heroBanner.image}")` }}
        />
        <div className="relative h-full flex flex-col items-start justify-center px-6 md:px-40 gap-6">
          <div className="max-w-xl">
            <h1 className="font-headline text-white text-5xl md:text-7xl font-light leading-tight tracking-tight">
              {heroTitleLines.length > 1 ? (
                <>
                  {heroTitleLines[0]} <br />
                  <span className="font-semibold italic">{heroTitleLines[1]}</span>
                </>
              ) : (
                <span className="font-semibold italic">{heroBanner.title}</span>
              )}
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-light mt-4 max-w-md">{heroBanner.subtitle}</p>
          </div>
          <button className="group flex items-center gap-2 border border-primary text-primary bg-background/85 backdrop-blur px-5 py-2.5 rounded font-bold text-xs uppercase tracking-[0.18em] hover:bg-primary hover:text-white transition-all shadow-subtle">
            <span>{heroBanner.tag || "Ver Coleccion"}</span>
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
        </div>
      </section>

      <section className="px-6 md:px-40 py-20">
        <div className="flex flex-col items-center mb-12 text-center">
          <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-2">Seleccion Exclusiva</span>
          <h2 className="font-headline text-carbon text-3xl font-light">Nuestras Categorias</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPanels.map((panel) => (
            <div key={panel.id} className="group relative aspect-[4/5] overflow-hidden rounded bg-slate-200 shadow-subtle">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `linear-gradient(0deg, rgba(45, 45, 45, 0.45) 0%, transparent 50%), url("${panel.image}")` }}
              />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="font-headline text-white text-xl font-medium tracking-tight">{panel.title}</h3>
                <button
                  onClick={() => onPanelCategoryClick(panel.categoryId ?? null)}
                  className="text-white/80 text-xs font-medium uppercase tracking-[0.18em] mt-2 flex items-center gap-2 group-hover:text-white"
                >
                  {panel.cta} <span className="material-symbols-outlined text-sm">trending_flat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary/[0.03] px-6 md:px-40 py-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="flex flex-col">
            <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-2">Catalogo Online</span>
            <h2 className="font-headline text-carbon text-3xl font-light">
              {selectedCategoryName ? `Categoria: ${selectedCategoryName}` : "Novedades"}
            </h2>
          </div>
          <button
            onClick={() => handleCategoryChange(null)}
            className={`text-sm font-bold uppercase tracking-[0.18em] flex items-center gap-2 border-b pb-1 transition-colors ${selectedCategory ? "text-primary border-primary/30 hover:border-primary" : "text-muted border-transparent cursor-default"}`}
          >
            Ver todo el catalogo <span className="material-symbols-outlined text-sm">{selectedCategory ? "close" : "open_in_new"}</span>
          </button>
        </div>
        <div className="mb-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleCategoryChange(null)}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
              selectedCategory == null ? "border-primary bg-primary text-white" : "border-primary/20 bg-white text-primary hover:border-primary"
            }`}
          >
            Todas
          </button>
          {rootCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryChange(category.id)}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                selectedCategory === category.id ? "border-primary bg-primary text-white" : "border-primary/20 bg-white text-primary hover:border-primary"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted">No hay productos cargados en el catalogo.</div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="group bg-white rounded p-4 shadow-subtle transition-shadow hover:shadow-md">
                <div className="relative aspect-square overflow-hidden rounded mb-4 bg-secondary/60 flex items-center justify-center">
                  {product.image ? (
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={product.image} alt={getProductDisplayName(product)} />
                  ) : (
                    <span className="material-symbols-outlined text-6xl text-slate-300">image</span>
                  )}
                  <button
                    className={`absolute top-3 right-3 backdrop-blur rounded-full p-2 transition-all ${
                      favoriteProductIds.has(product.id) ? "bg-red-100 text-red-500 hover:bg-red-200" : "bg-white/85 text-muted hover:text-red-400"
                    }`}
                    onClick={() => onToggleFavorite(product.id)}
                    title={favoriteProductIds.has(product.id) ? "Quitar de favoritos" : "Guardar en favoritos"}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: favoriteProductIds.has(product.id) ? "'FILL' 1" : "'FILL' 0" }}>
                      favorite
                    </span>
                  </button>
                  {product.stock <= 0 && <span className="absolute top-3 left-3 bg-carbon text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Sin Stock</span>}
                </div>
                <p className="text-primary/70 text-[10px] font-bold uppercase tracking-[0.24em] mb-2 text-center">{product.categoryName || "Categoria"}</p>
                <h4 className="font-headline text-carbon text-center text-[1.35rem] leading-tight">{getProductDisplayName(product)}</h4>
                <p className="text-carbon font-semibold mt-2 text-lg text-center">${product.salePrice.toLocaleString("es-AR")}</p>
                <button
                  onClick={() => onAddToCart(product.id)}
                  disabled={product.stock <= 0}
                  className={`mt-5 w-full py-3 rounded font-bold text-sm uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2 ${product.stock <= 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-primary text-white hover:opacity-90"}`}
                >
                  <span className="material-symbols-outlined text-sm">{product.stock <= 0 ? "remove_shopping_cart" : "add_shopping_cart"}</span>
                  {product.stock <= 0 ? "Sin stock" : "Agregar al carrito"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="px-6 md:px-40 py-20 bg-background">
        <div className="rounded bg-secondary/45 border border-line p-8 md:p-16 flex flex-col items-center text-center gap-6 shadow-subtle">
          <span className="material-symbols-outlined text-5xl text-primary/50">mail</span>
          <h2 className="font-headline text-3xl font-light text-carbon">Unite a nuestra comunidad</h2>
          <p className="text-muted max-w-lg">Suscribite para recibir novedades, promociones exclusivas y un 10% OFF en tu primera compra.</p>
          <div className="flex flex-col sm:flex-row w-full max-w-md gap-3 mt-4">
            <input className="flex-1 rounded border-line bg-white px-6 py-3 focus:border-primary focus:ring-primary/20 focus:ring-2 outline-none text-sm transition-all" placeholder="Tu email aqui" type="email" />
            <button className="bg-primary text-white px-8 py-3 rounded font-bold uppercase tracking-[0.18em] text-xs hover:opacity-90 transition-colors">Suscribirme</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CatalogPanel;
