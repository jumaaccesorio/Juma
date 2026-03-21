export function getProductDisplayName(product: { name?: string | null; subName?: string | null }) {
  const name = typeof product.name === "string" ? product.name.trim() : "";
  const subName = typeof product.subName === "string" ? product.subName.trim() : "";
  return name || subName || "Sin nombre";
}
