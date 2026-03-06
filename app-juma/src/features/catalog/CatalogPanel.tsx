import type { FeaturedPanel, HeroBanner, Product } from "../../types";

type CatalogPanelProps = {
  products: Product[];
  onAddToCart: (productId: number) => void;
  featuredPanels: FeaturedPanel[];
  heroBanner: HeroBanner;
};

function CatalogPanel({
  products,
  onAddToCart,
  featuredPanels,
  heroBanner,
}: CatalogPanelProps) {
  return (
    <section className="panel">
      <div className="hero-banner" style={{ backgroundImage: `url(${heroBanner.image})` }}>
        <div className="hero-overlay">
          <p className="hero-tag">{heroBanner.tag}</p>
          <h2>{heroBanner.title}</h2>
          <p>{heroBanner.subtitle}</p>
        </div>
      </div>

      <div className="category-showcase">
        {featuredPanels.map((panel) => (
          <article
            key={panel.id}
            className={`category-card ${panel.className}`}
            style={{ backgroundImage: `url(${panel.image})` }}
          >
            <div className="category-overlay">
              <h3>{panel.title}</h3>
              <span>{panel.cta}</span>
            </div>
          </article>
        ))}
      </div>

      <h2>Catalogo online</h2>
      <div className="products-grid">
        {products.length === 0 ? (
          <article className="empty">No hay productos cargados.</article>
        ) : (
          products.map((product) => (
            <article key={product.id} className="product-card">
              {product.image ? (
                <img className="catalog-product-image" src={product.image} alt={product.name} />
              ) : (
                <div className="img-placeholder" />
              )}
              <div className="info">
                <h3>{product.name}</h3>
                <p>{product.category}</p>
                <p className="stock">Stock: {product.stock}</p>
                <p className="price">${product.salePrice.toLocaleString("es-AR")}</p>
                <button type="button" onClick={() => onAddToCart(product.id)} disabled={product.stock <= 0}>
                  {product.stock <= 0 ? "Sin stock" : "Agregar al carrito"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default CatalogPanel;
