import type { Product } from "../types";

export type ProductImageVariant = "thumb" | "card" | "full";

export function getProductImage(product: Pick<Product, "image" | "imageThumb" | "imageCard" | "imageFull">, variant: ProductImageVariant) {
  if (variant === "full") {
    return product.imageFull || product.imageCard || product.imageThumb || product.image || "";
  }

  if (variant === "card") {
    return product.imageCard || product.imageThumb || product.imageFull || product.image || "";
  }

  return product.imageThumb || product.imageCard || product.imageFull || product.image || "";
}
