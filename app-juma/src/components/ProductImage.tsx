import { useEffect, useState } from "react";
import type { ImgHTMLAttributes } from "react";
import type { Product } from "../types";

type ProductImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  product: Pick<Product, "image" | "originalImage">;
};

function ProductImage({ product, alt, className, loading = "lazy", decoding = "async", ...props }: ProductImageProps) {
  const previewSrc = product.image?.trim() || "";
  const originalSrc = product.originalImage?.trim() || "";
  const hasPreview = Boolean(previewSrc);
  const hasOriginal = Boolean(originalSrc) && originalSrc !== previewSrc;
  const [isOriginalReady, setIsOriginalReady] = useState(!hasOriginal);

  useEffect(() => {
    if (!hasOriginal) {
      setIsOriginalReady(true);
      return;
    }

    setIsOriginalReady(false);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => setIsOriginalReady(true);
    image.onerror = () => setIsOriginalReady(true);
    image.src = originalSrc;
  }, [hasOriginal, originalSrc]);

  if (!hasPreview && !originalSrc) return null;

  if (!hasOriginal) {
    return <img src={previewSrc || originalSrc} alt={alt} className={className} loading={loading} decoding={decoding} {...props} />;
  }

  return (
    <span className="relative block h-full w-full">
      <img
        src={previewSrc}
        alt={alt}
        className={`${className ?? ""} transition-opacity duration-300 ${isOriginalReady ? "opacity-0" : "opacity-100"}`.trim()}
        loading={loading}
        decoding={decoding}
        {...props}
      />
      <img
        src={originalSrc}
        alt={alt}
        className={`${className ?? ""} absolute inset-0 transition-opacity duration-300 ${isOriginalReady ? "opacity-100" : "opacity-0"}`.trim()}
        loading={loading}
        decoding={decoding}
        {...props}
      />
    </span>
  );
}

export default ProductImage;
