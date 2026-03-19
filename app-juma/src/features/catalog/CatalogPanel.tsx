import { useState, useEffect } from "react";
import type { FeaturedPanel, HeroBanner, Product } from "../../types";

type CatalogPanelProps = {
  products: Product[];
  onAddToCart: (productId: number) => void;
  featuredPanels: FeaturedPanel[];
  heroBanner: HeroBanner;
  favoriteProductIds: Set<number>;
  onToggleFavorite: (productId: number) => void;
  initialCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  onPanelCategoryClick: (categoryName: string) => void;
};

function CatalogPanel({
  products,
  onAddToCart,
  featuredPanels,
  heroBanner,
  favoriteProductIds,
  onToggleFavorite,
  initialCategory,
  onCategoryChange,
  onPanelCategoryClick,
}: CatalogPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const handleCategoryChange = (cat: string | null) => {
    setSelectedCategory(cat);
    onCategoryChange(cat);
  };

  const heroTitleLines = heroBanner.title.split('\n');

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.categoryName?.toLowerCase() === selectedCategory.toLowerCase())
    : products;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[716px] min-h-[500px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105" 
          style={{ backgroundImage: `linear-gradient(to right, rgba(34, 21, 16, 0.6), transparent), url("${heroBanner.image}")` }}
        />
        <div className="relative h-full flex flex-col items-start justify-center px-6 md:px-40 gap-6">
          <div className="max-w-xl">
            <h1 className="font-serif text-white text-5xl md:text-7xl font-light leading-tight tracking-tight">
               {heroTitleLines.length > 1 ? (
                 <>
                   {heroTitleLines[0]} <br/><span className="font-black italic">{heroTitleLines[1]}</span>
                 </>
               ) : (
                 <span className="font-black italic">{heroBanner.title}</span>
               )}
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-light mt-4 max-w-md">
              {heroBanner.subtitle}
            </p>
          </div>
          <button className="group flex items-center gap-2 border border-primary text-primary bg-background/80 backdrop-blur px-5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-white transition-all transform group-hover:translate-x-1 shadow-xl shadow-primary/20">
            <span>{heroBanner.tag || "Ver Colección"}</span>
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="px-6 md:px-40 py-20">
        <div className="flex flex-col items-center mb-12 text-center">
          <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-2">Selección Exclusiva</span>
          <h2 className="font-serif text-slate-900 dark:text-slate-100 text-3xl font-light">Nuestras Categorías</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPanels.map((panel) => (
            <div key={panel.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-200">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                style={{ backgroundImage: `linear-gradient(0deg, rgba(34, 21, 16, 0.5) 0%, transparent 50%), url("${panel.image}")` }}
              />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="font-serif text-white text-xl font-bold tracking-tight">{panel.title}</h3>
                <button 
                  onClick={() => {
                    onPanelCategoryClick(panel.title);
                  }}
                  className="text-white/80 text-xs font-medium uppercase tracking-widest mt-2 flex items-center gap-2 group-hover:text-white pb-1"
                >
                  {panel.cta} <span className="material-symbols-outlined text-sm">trending_flat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-primary/[0.03] px-6 md:px-40 py-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="flex flex-col">
            <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-2">Catálogo Online</span>
            <h2 className="font-serif text-slate-900 dark:text-slate-100 text-3xl font-light">
              {selectedCategory ? `Categoría: ${selectedCategory}` : "Novedades"}
            </h2>
          </div>
          <button 
            onClick={() => handleCategoryChange(null)}
            className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 pb-1 transition-colors ${selectedCategory ? 'text-primary border-primary/20 hover:border-primary' : 'text-slate-400 border-transparent cursor-default'}`}
          >
            Ver todo el catálogo <span className="material-symbols-outlined text-sm">{selectedCategory ? 'close' : 'open_in_new'}</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-500">
              No hay productos cargados en el catálogo.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="flex flex-col group">
                <div className="relative aspect-square overflow-hidden rounded-xl mb-4 bg-slate-100 shadow-sm transition-shadow group-hover:shadow-xl flex items-center justify-center">
                  {product.image ? (
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={product.image} alt={product.name} />
                  ) : (
                    <span className="material-symbols-outlined text-6xl text-slate-300">image</span>
                  )}
                  <button 
                    className={`absolute top-3 right-3 backdrop-blur rounded-full p-2 transition-all ${
                      favoriteProductIds.has(product.id)
                        ? 'bg-red-100 text-red-500 hover:bg-red-200'
                        : 'bg-white/80 text-slate-400 hover:text-red-400'
                    }`}
                    onClick={() => onToggleFavorite(product.id)}
                    title={favoriteProductIds.has(product.id) ? "Quitar de favoritos" : "Guardar en favoritos"}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: favoriteProductIds.has(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                  </button>
                  {product.stock <= 0 && (
                    <span className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Sin Stock</span>
                  )}
                </div>
                <p className="text-primary/60 text-[10px] font-bold uppercase tracking-widest mb-1">{product.categoryName || "Categoría"}</p>
                <h4 className="text-slate-800 dark:text-slate-200 font-medium text-lg leading-tight">{product.name}</h4>
                <p className="text-slate-900 dark:text-slate-100 font-bold mt-1 text-xl">${product.salePrice.toLocaleString("es-AR")}</p>
                <button 
                  onClick={() => onAddToCart(product.id)} 
                  disabled={product.stock <= 0}
                  className={`mt-4 w-full py-3 rounded-md font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${product.stock <= 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
                >
                  <span className="material-symbols-outlined text-sm">{product.stock <= 0 ? 'remove_shopping_cart' : 'add_shopping_cart'}</span>
                  {product.stock <= 0 ? "Sin stock" : "Agregar al carrito"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-6 md:px-40 py-20 bg-background dark:bg-carbon">
        <div className="rounded-3xl bg-primary/5 border border-primary/10 p-8 md:p-16 flex flex-col items-center text-center gap-6">
          <span className="material-symbols-outlined text-5xl text-primary/40">mail</span>
          <h2 className="font-serif text-3xl font-light text-slate-900 dark:text-slate-100">Unite a nuestra comunidad</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg">Suscribite para recibir novedades, promociones exclusivas y un 10% OFF en tu primera compra.</p>
          <div className="flex flex-col sm:flex-row w-full max-w-md gap-3 mt-4">
            <input className="flex-1 rounded-full border-primary/20 bg-white dark:bg-slate-800 px-6 py-3 focus:border-primary focus:ring-primary focus:ring-2 outline-none text-sm transition-all" placeholder="Tu email aquí" type="email" />
            <button className="bg-primary text-white px-8 py-3 rounded-md font-bold uppercase tracking-wider text-xs hover:bg-primary/90 transition-colors">Suscribirme</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CatalogPanel;
