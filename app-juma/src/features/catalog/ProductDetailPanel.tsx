import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductReview, ProductSize } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";
import ProductImage from "../../components/ProductImage";

type ProductDetailPanelProps = {
  product: Product;
  onBack: () => void;
  onAddToCart: (productId: number, quantity?: number, size?: string) => void;
  reviews: ProductReview[];
  averageRating: number;
  currentClientId: number | null;
  currentClientName: string | null;
  onSubmitReview: (productId: number, rating: number, comment: string) => void;
};

function StarRating({ rating, size = "text-lg", interactive = false, onChange }: {
  rating: number;
  size?: string;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = interactive ? star <= (hovered || rating) : star <= Math.round(rating);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          >
            <span
              translate="no"
              className={`material-symbols-outlined ${size} ${filled ? "text-amber-400" : "text-slate-300"}`}
              style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >star</span>
          </button>
        );
      })}
    </div>
  );
}

function ProductDetailPanel({ product, onBack, onAddToCart, reviews, averageRating, currentClientId, currentClientName, onSubmitReview }: ProductDetailPanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;

  // ── Review form state ──
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Check if current client already reviewed
  const existingReview = useMemo(() => {
    if (!currentClientId) return null;
    return reviews.find(r => r.clientId === currentClientId) ?? null;
  }, [reviews, currentClientId]);

  // Pre-fill form if editing existing review
  useEffect(() => {
    if (existingReview) {
      setReviewRating(existingReview.rating);
      setReviewComment(existingReview.comment);
    } else {
      setReviewRating(0);
      setReviewComment("");
    }
    setReviewSuccess(false);
  }, [existingReview, product.id]);

  const description = useMemo(() => {
    if (product.description?.trim()) return product.description.trim();
    if (product.categoryName?.trim()) return `Pieza perteneciente a la categoria ${product.categoryName}.`;
    return "Accesorio disponible en la tienda online de Juma Accessory.";
  }, [product.categoryName, product.description]);

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

  const displayStock = selectedSizeData ? selectedSizeData.stock : product.stock;
  const canAddToCart = !hasSizes || selectedSize !== null;
  const isOutOfStock = displayStock <= 0;

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    onAddToCart(product.id, quantity, selectedSize ?? undefined);
  };

  const handleSubmitReview = async () => {
    if (reviewRating < 1 || !currentClientId) return;
    setReviewSubmitting(true);
    try {
      onSubmitReview(product.id, reviewRating, reviewComment.trim());
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatReviewDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div ref={detailRef} className="mx-auto w-full max-w-7xl px-6 py-10 md:px-20">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-primary shadow-subtle transition-all hover:-translate-x-0.5 hover:border-primary/40 hover:bg-primary/5"
      >
        <span translate="no" className="material-symbols-outlined text-base">arrow_back</span>
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
                <span translate="no" className="material-symbols-outlined text-7xl text-slate-300">image</span>
              </div>
            )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/70">{product.categoryName || "Catalogo"}</p>
          <h1 className="mt-3 font-headline text-4xl leading-tight text-carbon md:text-5xl">{getProductDisplayName(product)}</h1>

          {/* ── Rating summary ── */}
          {reviews.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={averageRating} size="text-base" />
              <span className="text-sm font-bold text-carbon">{averageRating.toFixed(1)}</span>
              <span className="text-xs text-muted">({reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"})</span>
            </div>
          )}

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
                <span translate="no" className="material-symbols-outlined text-lg">remove</span>
              </button>
              <span className="w-12 text-center text-lg font-bold text-ink">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-primary/10"
              >
                <span translate="no" className="material-symbols-outlined text-lg">add</span>
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
              <span translate="no" className="material-symbols-outlined text-sm">{isOutOfStock ? "inventory_2" : "add_shopping_cart"}</span>
              {!canAddToCart ? "Seleccioná un talle" : isOutOfStock ? "Pedir por encargo" : "Agregar al carrito"}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-line bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-ink transition-all hover:border-primary/35 hover:text-primary"
            >
              <span translate="no" className="material-symbols-outlined text-sm">arrow_back</span>
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
                <span translate="no" className="material-symbols-outlined text-sm">straighten</span>
                Talle {product.size}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── REVIEWS SECTION ─────────────────────────── */}
      <div className="mt-16 border-t border-line pt-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">Opiniones de clientes</span>
          <h2 className="font-headline text-3xl font-light text-carbon">Reseñas</h2>
          {reviews.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-5xl font-black text-carbon">{averageRating.toFixed(1)}</span>
              <div className="flex flex-col items-start">
                <StarRating rating={averageRating} size="text-xl" />
                <span className="mt-1 text-xs text-muted">{reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Review form ── */}
        {currentClientId ? (
          <div className="mx-auto mb-10 max-w-2xl rounded-2xl border border-primary/10 bg-white p-6 shadow-subtle">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span translate="no" className="material-symbols-outlined text-base">rate_review</span>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-carbon">
                {existingReview ? "Actualizar tu reseña" : "Dejá tu opinión"}
              </h3>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Tu valoración</p>
              <StarRating rating={reviewRating} size="text-2xl" interactive onChange={setReviewRating} />
              {reviewRating === 0 && (
                <p className="mt-1 text-[11px] text-amber-600">Seleccioná al menos una estrella.</p>
              )}
            </div>

            <div className="mb-4">
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs resize-none"
                rows={3}
                placeholder="Contanos qué te pareció este producto... (opcional)"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>

            {reviewSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-700">
                <span translate="no" className="material-symbols-outlined text-sm">check_circle</span>
                ¡Gracias por tu reseña, {currentClientName || ""}!
              </div>
            )}

            <button
              type="button"
              disabled={reviewRating < 1 || reviewSubmitting}
              onClick={handleSubmitReview}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all ${
                reviewRating < 1 || reviewSubmitting
                  ? "cursor-not-allowed bg-slate-300 opacity-60"
                  : "bg-primary hover:opacity-90 shadow-md active:scale-95"
              }`}
            >
              <span translate="no" className="material-symbols-outlined text-sm">{reviewSubmitting ? "progress_activity" : "send"}</span>
              {existingReview ? "Actualizar reseña" : "Enviar reseña"}
            </button>
          </div>
        ) : (
          <div className="mx-auto mb-10 max-w-2xl rounded-2xl border border-dashed border-line bg-secondary/35 px-6 py-8 text-center">
            <span translate="no" className="material-symbols-outlined text-3xl text-slate-300 mb-2">lock</span>
            <p className="text-sm text-muted">Iniciá sesión para dejar tu opinión sobre este producto.</p>
          </div>
        )}

        {/* ── Review list ── */}
        {reviews.length === 0 ? (
          <div className="text-center rounded-2xl border border-dashed border-line bg-secondary/35 px-6 py-14 text-sm text-muted">
            Este producto todavía no tiene reseñas. ¡Sé el primero en opinar!
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm uppercase">
                      {(review.clientName ?? "?").charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-carbon">{review.clientName || "Cliente"}</p>
                      <p className="text-[11px] text-muted">{formatReviewDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="text-sm" />
                </div>
                {review.comment.trim() && (
                  <p className="mt-3 text-sm leading-relaxed text-ink">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPanel;
