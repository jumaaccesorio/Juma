import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductSize } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";
import ProductImage from "../../components/ProductImage";

type ProductDetailPanelProps = {
  product: Product;
  onBack: () => void;
  onAddToCart: (productId: number, quantity?: number, size?: string) => void;
};

function ProductDetailPanel({ product, onBack, onAddToCart }: ProductDetailPanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;

  const description = useMemo(() => {
    if (product.subName?.trim()) return product.subName.trim();
    if (product.categoryName?.trim()) return `Pieza perteneciente a la categoria ${product.categoryName}.`;
    return "Accesorio disponible en la tienda online de Juma Accessory.";
  }, [product.categoryName, product.subName]);

  // Reset size selection when product changes
  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
  }, [product.id]);

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

  const selectedSizeData: ProductSize | undefined = hasSizes
    ? product.sizes!.find((s) => s.size === selectedSize)
    : undefined;

  // Stock to show: if has sizes and one is selected, show that size's stock;
  // otherwise show total product stock
  const displayStock = selectedSizeData ? selectedSizeData.stock : product.stock;
  const canAddToCart = !hasSizes || selectedSize !== null;
  const isOutOfStock = displayStock <= 0;

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    onAddToCart(product.id, quantity, selectedSize ?? undefined);
  };

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
                fullResolution
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

          {/* ── Selector de talle ───────────────────────── */}
          {hasSizes && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted">Talle</p>
                {selectedSize && (
                  <span className="text-xs font-bold text-primary">Seleccionado: {selectedSize}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes!.map((sizeOpt) => {
                  const outOfStock = sizeOpt.stock <= 0;
                  const isSelected = selectedSize === sizeOpt.size;
                  return (
                    <button
                      key={sizeOpt.size}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => setSelectedSize(isSelected ? null : sizeOpt.size)}
                      title={outOfStock ? `Talle ${sizeOpt.size} sin stock` : `Talle ${sizeOpt.size}`}
                      className={`relative min-w-[3rem] rounded-lg border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                        outOfStock
                          ? "cursor-not-allowed border-line bg-secondary/40 text-muted line-through"
                          : isSelected
                            ? "border-primary bg-primary text-white shadow-lg shadow-primary/25"
                            : "border-line bg-white text-ink hover:border-primary hover:text-primary"
                      }`}
                    >
                      {sizeOpt.size}
                      {outOfStock && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white">×</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {!selectedSize && (
                <p className="mt-2 text-xs text-amber-600 font-medium">Seleccioná un talle para continuar.</p>
              )}
            </div>
          )}

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
              disabled={!canAddToCart}
              onClick={handleAddToCart}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded px-8 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition-all ${
                canAddToCart
                  ? "bg-primary hover:opacity-90"
                  : "cursor-not-allowed bg-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{isOutOfStock ? "inventory_2" : "add_shopping_cart"}</span>
              {!canAddToCart ? "Seleccioná un talle" : isOutOfStock ? "Pedir por encargo" : "Agregar al carrito"}
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
              {hasSizes
                ? selectedSize
                  ? `Talle ${selectedSize}: ${displayStock > 0 ? `${displayStock} disp.` : "Sin stock"}`
                  : `${product.sizes!.reduce((a, s) => a + s.stock, 0)} u. en total`
                : displayStock > 0 ? `${displayStock} disponibles` : "Disponible por encargo"}
            </span>
            {product.size?.trim() && !hasSizes ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                <span className="material-symbols-outlined text-sm">straighten</span>
                Talle {product.size}
              </span>
            ) : null}
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
