import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const [snapshotFile, outputFile] = process.argv.slice(2);
if (!snapshotFile || !outputFile) throw new Error("Uso: node media-paths.mjs snapshot.json salida.sql");
const snapshot = JSON.parse((await readFile(snapshotFile, "utf8")).replace(/^\uFEFF/, ""));
const prefix = "https://ezpbabxossevlheftgcu.supabase.co/storage/v1/object/public/products/";
if (snapshot.sourceUrl !== "https://ezpbabxossevlheftgcu.supabase.co") throw new Error("Origen inválido.");
const inventory = snapshot.storage.filter((item) => item.bucket === "products").map((item) => item.name);
const fields = ["image", "image_thumb", "image_card", "image_full"];
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const statements = [];
let mapped = 0;
for (const product of snapshot.tables.products) {
  const updates = [];
  for (const field of fields) {
    const value = product[field];
    if (!value) continue;
    const candidate = value.startsWith(prefix) ? decodeURIComponent(value.slice(prefix.length)) : value;
    const matches = inventory.filter((name) => name === candidate || name.endsWith(`/${candidate}`));
    if (matches.length !== 1) throw new Error(`No se pudo resolver products.${field} del producto ${product.id}.`);
    updates.push(`${field}=${quote(`/media/products/${matches[0]}`)}`);
    mapped++;
  }
  if (updates.length) statements.push(`UPDATE products SET ${updates.join(",")} WHERE id=${Number(product.id)};`);
}
await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, statements.join("\n") + "\n");
console.log(`Preparadas ${mapped} referencias de imagen para ${statements.length} productos.`);
