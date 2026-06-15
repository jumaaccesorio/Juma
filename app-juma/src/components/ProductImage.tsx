import { useEffect, useState, useRef } from "react";
import type { ImgHTMLAttributes } from "react";
import type { Product } from "../types";

type ProductImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  product: {
    image?: string;
    originalImage?: string;
    imageThumb?: string;
    imageCard?: string;
    imageFull?: string;
  };
  fullResolution?: boolean;
};

function ProductImage({
  product,
  alt,
  className,
  loading = "lazy",
  decoding = "async",
  fullResolution = false,
  ...props
}: ProductImageProps) {
  const thumbSrc = product.imageThumb?.trim() || product.image?.trim() || "";
  const targetSrc = fullResolution
    ? (product.imageFull?.trim() || product.originalImage?.trim() || product.image?.trim() || "")
    : (product.imageCard?.trim() || product.image?.trim() || "");

  const [isTargetLoaded, setIsTargetLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset loaded status if source changes
  useEffect(() => {
    setIsTargetLoaded(false);
  }, [targetSrc]);

  // Check if image is already cached/complete
  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsTargetLoaded(true);
    }
  }, [targetSrc]);

  if (!targetSrc && !thumbSrc) return null;

  if (!thumbSrc || thumbSrc === targetSrc) {
    return (
      <img
        src={targetSrc}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        {...props}
      />
    );
  }

  return (
    <span className="relative block h-full w-full overflow-hidden">
      {/* Thumbnail: blurred and loaded instantly */}
      <img
        src={thumbSrc}
        alt={alt}
        className={`${className ?? ""} filter blur-[6px] scale-[1.04] transition-opacity duration-300 ${isTargetLoaded ? "opacity-0" : "opacity-100"}`}
        loading={loading}
        decoding={decoding}
        {...props}
      />
      {/* Target Image: loaded in background/lazy, fades in all-at-once */}
      <img
        ref={imgRef}
        src={targetSrc}
        alt={alt}
        onLoad={() => setIsTargetLoaded(true)}
        className={`${className ?? ""} absolute inset-0 transition-opacity duration-300 ${isTargetLoaded ? "opacity-100" : "opacity-0"}`}
        loading={loading}
        decoding={decoding}
        {...props}
      />
    </span>
  );
}

export default ProductImage;
