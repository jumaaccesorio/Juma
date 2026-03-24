import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, FeaturedPanel, HeroBanner, Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";

type CatalogPanelProps = {
  products: Product[];
  categories: Category[];
  onAddToCart: (productId: number) => void;
  featuredPanels: FeaturedPanel[];
  heroBanner: HeroBanner | null;
  isHomeContentLoaded: boolean;
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
  isHomeContentLoaded,
  favoriteProductIds,
  onToggleFavorite,
  initialCategory,
  onCategoryChange,
  onPanelCategoryClick,
}: CatalogPanelProps) {
  const PRODUCTS_PER_PAGE = 16;
  const [selectedCategory, setSelectedCategory] = useState<number | null>(initialCategory);
  const [page, setPage] = useState(1);
  const productsGridRef = useRef<HTMLElement | null>(null);
  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );
  const categoryChips = useMemo(
    () =>
      categories
        .map((category) => {
          const parent = category.parentId ? categories.find((row) => row.id === category.parentId) ?? null : null;
          return {
            id: category.id,
            label: parent ? `${parent.name} / ${category.name}` : category.name,
            isSubcategory: Boolean(parent),
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [categories],
  );

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const handleCategoryChange = (category: number | null) => {
    setSelectedCategory(category);
    setPage(1);
    onCategoryChange(category);
  };

  const heroTitleLines = heroBanner?.title.split("\n") ?? [];
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
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const visibleProducts = useMemo(
    () => filteredProducts.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE),
    [filteredProducts, page],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!productsGridRef.current) return;
    const top = productsGridRef.current.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [page]);

  return (
    <div className="flex flex-col">
      <section className="relative h-[716px] min-h-[500px] w-full overflow-hidden">
        {isHomeContentLoaded && heroBanner ? (
          <>
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
                <p className="mt-4 max-w-md text-lg font-light text-white/90 md:text-xl">{heroBanner.subtitle}</p>
              </div>
              <button className="group flex items-center gap-2 rounded border border-primary bg-background/85 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-primary shadow-subtle backdrop-blur transition-all hover:bg-primary hover:text-white">
                <span>{heroBanner.tag || "Ver Coleccion"}</span>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-secondary/55" />
        )}
      </section>

      {isHomeContentLoaded && featuredPanels.length > 0 ? (
        <section className="px-6 py-20 md:px-40">
          <div className="mb-12 flex flex-col items-center text-center">
            <span className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">Seleccion Exclusiva</span>
            <h2 className="font-headline text-3xl font-light text-carbon">Nuestras Categorias</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPanels.map((panel) => (
              <div key={panel.id} className="group relative aspect-[4/5] overflow-hidden rounded bg-slate-200 shadow-subtle">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `linear-gradient(0deg, rgba(45, 45, 45, 0.45) 0%, transparent 50%), url("${panel.image}")` }}
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="font-headline text-xl font-medium tracking-tight text-white">{panel.title}</h3>
                  <button
                    onClick={() => onPanelCategoryClick(panel.categoryId ?? null)}
                    className="mt-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/80 group-hover:text-white"
                  >
                    {panel.cta} <span className="material-symbols-outlined text-sm">trending_flat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section ref={productsGridRef} id="catalog-products-section" className="bg-primary/[0.03] px-6 md:px-40 py-20">
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
          {categoryChips.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryChange(category.id)}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                selectedCategory === category.id ? "border-primary bg-primary text-white" : "border-primary/20 bg-white text-primary hover:border-primary"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted">No hay productos cargados en el catalogo.</div>
          ) : (
            visibleProducts.map((product) => (
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
                  {product.stock <= 0 && <span className="absolute top-3 left-3 rounded bg-carbon px-2 py-1 text-[10px] font-bold uppercase text-white">Por encargo</span>}
                </div>
                <p className="text-primary/70 text-[10px] font-bold uppercase tracking-[0.24em] mb-2 text-center">{product.categoryName || "Categoria"}</p>
                <h4 className="font-headline text-carbon text-center text-[1.35rem] leading-tight">{getProductDisplayName(product)}</h4>
                <p className="text-carbon font-semibold mt-2 text-lg text-center">${product.salePrice.toLocaleString("es-AR")}</p>
                <p className="mt-2 text-center text-xs text-muted">
                  {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock inmediato. Se puede pedir por encargo."}
                </p>
                <button
                  onClick={() => onAddToCart(product.id)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded bg-primary py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition-all hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-sm">{product.stock <= 0 ? "inventory_2" : "add_shopping_cart"}</span>
                  {product.stock <= 0 ? "Pedir por encargo" : "Agregar al carrito"}
                </button>
              </div>
            ))
          )}
        </div>
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="rounded border border-primary/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Pagina {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="rounded border border-primary/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
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
