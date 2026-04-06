import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";
import ProductImage from "../../components/ProductImage";

type ProductDetailPanelProps = {
  product: Product;
  onBack: () => void;
  onAddToCart: (productId: number, quantity?: number) => void;
};

function ProductDetailPanel({ product, onBack, onAddToCart }: ProductDetailPanelProps) {
  const [quantity, setQuantity] = useState(1);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const description = useMemo(() => {
    if (product.subName?.trim()) return product.subName.trim();
    if (product.categoryName?.trim()) return `Pieza perteneciente a la categoria ${product.categoryName}.`;
    return "Accesorio disponible en la tienda online de Juma Accessory.";
  }, [product.categoryName, product.subName]);

  useEffect(() => {
    const node = detailRef.current;
    if (!node) return;

    window.requestAnimationFrame(() => {
      node.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    });
  }, [product.id]);

  return (
    <div ref={detailRef} className="mx-auto w-full max-w-7xl px-6 py-10 md:px-20">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-primary shadow-subtle transition-all hover:-translate-x-0.5 hover:border-primary/40 hover:bg-primary/5"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver al catalogo
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded bg-white p-4 shadow-subtle">
          <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded bg-white">
            <div className="aspect-[4/5] overflow-hidden rounded bg-white">
            {product.image ? (
              <ProductImage
                product={product}
                alt={getProductDisplayName(product)}
                className="h-full w-full object-cover object-center"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="material-symbols-outlined text-7xl text-slate-300">image</span>
              </div>
            )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/70">{product.categoryName || "Catalogo"}</p>
          <h1 className="mt-3 font-headline text-4xl leading-tight text-carbon md:text-5xl">{getProductDisplayName(product)}</h1>
          <p className="mt-5 text-3xl font-black text-primary">${product.salePrice.toLocaleString("es-AR")}</p>

          <div className="mt-6 rounded border border-line bg-white p-5 shadow-subtle">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted">Descripcion</p>
            <p className="mt-3 text-sm leading-7 text-ink">{description}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-lg border border-primary/15 bg-white p-1 shadow-subtle">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-lg">remove</span>
              </button>
              <span className="w-12 text-center text-lg font-bold text-ink">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onAddToCart(product.id, quantity)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-primary px-8 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition-all hover:opacity-90"
            >
              <span className="material-symbols-outlined text-sm">{product.stock <= 0 ? "inventory_2" : "add_shopping_cart"}</span>
              {product.stock <= 0 ? "Pedir por encargo" : "Agregar al carrito"}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-line bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-ink transition-all hover:border-primary/35 hover:text-primary"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Volver
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-full bg-quaternary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              {product.stock > 0 ? `${product.stock} disponibles` : "Disponible por encargo"}
            </span>
            {product.subName?.trim() ? (
              <span className="inline-flex items-center rounded-full bg-tertiary/16 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4f6780]">
                {product.subName}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPanel;
