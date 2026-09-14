import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const [snapshotFile, outputFile] = process.argv.slice(2);
if (!snapshotFile || !outputFile) throw new Error("Uso: node media-paths.mjs snapshot.json salida.sql");
const snapshot = JSON.parse((await readFile(snapshotFile, "utf8")).replace(/^\uFEFF/, ""));
const prefix = "https://ezpbabxossevlheftgcu.supabase.co/storage/v1/object/public/products/";
if (snapshot.sourceUrl !== "https://ezpbabxossevlheftgcu.supabase.co") throw new Error("Origen inválido.");
const inventory = snapshot.storage.filter((item) => item.bucket === "products").map((item) => item.name);
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const statements = [];
let mapped = 0;
const targets = [
  { table: "products", fields: ["image", "image_thumb", "image_card", "image_full"] },
  { table: "hero_banner", fields: ["image"] },
  { table: "featured_panels", fields: ["image"] },
];
for (const target of targets) for (const row of snapshot.tables[target.table]) {
  const updates = [];
  for (const field of target.fields) {
    const value = row[field];
    if (!value) continue;
    if (value.startsWith('/media/')) continue;
    const candidate = value.startsWith(prefix) ? decodeURIComponent(value.slice(prefix.length)) : value;
    const matches = inventory.filter((name) => name === candidate || name.endsWith(`/${candidate}`));
    if (matches.length !== 1) throw new Error(`No se pudo resolver ${target.table}.${field} del registro ${row.id}.`);
    updates.push(`${field}=${quote(`/media/products/${matches[0]}`)}`);
    mapped++;
  }
  if (updates.length) statements.push(`UPDATE ${target.table} SET ${updates.join(",")} WHERE id=${quote(row.id)};`);
}
await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, statements.join("\n") + "\n");
console.log(`Preparadas ${mapped} referencias de imagen para ${statements.length} registros.`);
