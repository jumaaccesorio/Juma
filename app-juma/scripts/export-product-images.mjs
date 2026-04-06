import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fxadhtmfpphpjjetdcxm.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_4vMfCs_m8EGcQPRSxHj3HA_JocryEFy";

const BUCKET = "products";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;
const SIGNED_PREFIX = `/storage/v1/object/sign/${BUCKET}/`;
const EXPORT_ROOT = path.resolve(process.cwd(), "exports");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function slugify(input, fallback) {
  return (
    String(input || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

function extractBucketPath(image) {
  if (!image || typeof image !== "string") return null;
  if (image.startsWith("data:image/")) return null;

  if (/^https?:\/\//i.test(image)) {
    const url = new URL(image);
    if (url.pathname.includes(PUBLIC_PREFIX)) {
      return decodeURIComponent(url.pathname.split(PUBLIC_PREFIX)[1] ?? "").trim() || null;
    }
    if (url.pathname.includes(SIGNED_PREFIX)) {
      return decodeURIComponent(url.pathname.split(SIGNED_PREFIX)[1] ?? "").trim() || null;
    }
    return null;
  }

  return image.trim() || null;
}

function inferExtension(image, mimeType) {
  if (mimeType?.includes("png")) return "png";
  if (mimeType?.includes("webp")) return "webp";
  if (mimeType?.includes("gif")) return "gif";
  if (mimeType?.includes("jpeg") || mimeType?.includes("jpg")) return "jpg";

  const bucketPath = extractBucketPath(image);
  if (bucketPath) {
    const ext = path.extname(bucketPath).replace(".", "").toLowerCase();
    if (ext) return ext;
  }

  if (/\.png($|\?)/i.test(image)) return "png";
  if (/\.webp($|\?)/i.test(image)) return "webp";
  if (/\.gif($|\?)/i.test(image)) return "gif";
  return "jpg";
}

async function downloadImageBuffer(image) {
  if (!image) throw new Error("Imagen vacia.");

  if (image.startsWith("data:image/")) {
    const match = /^data:(.*?);base64,(.*)$/.exec(image);
    if (!match) throw new Error("Data URL invalida.");
    return {
      buffer: Buffer.from(match[2], "base64"),
      mimeType: match[1],
      source: "data-url",
      bucketPath: null,
    };
  }

  const bucketPath = extractBucketPath(image);
  if (bucketPath) {
    const download = await supabase.storage.from(BUCKET).download(bucketPath);
    if (download.error) throw download.error;
    return {
      buffer: Buffer.from(await download.data.arrayBuffer()),
      mimeType: download.data.type || "",
      source: "storage",
      bucketPath,
    };
  }

  const response = await fetch(image);
  if (!response.ok) throw new Error(`No se pudo descargar ${image}: ${response.status}`);
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType: response.headers.get("content-type") || "",
    source: "remote-url",
    bucketPath: null,
  };
}

function pickBestImage(row) {
  return row.image_full || row.image || row.image_card || row.image_thumb || "";
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const exportDir = path.join(EXPORT_ROOT, `product-images-${timestamp}`);
  const imagesDir = path.join(exportDir, "images");

  await mkdir(imagesDir, { recursive: true });

  const query = await supabase
    .from("products")
    .select("id, name, sub_name, image, image_thumb, image_card, image_full")
    .order("id", { ascending: true });

  if (query.error) {
    if (String(query.error.message || "").toLowerCase().includes("image_thumb")) {
      const legacyQuery = await supabase
        .from("products")
        .select("id, name, sub_name, image")
        .order("id", { ascending: true });
      if (legacyQuery.error) throw legacyQuery.error;
      query.data = legacyQuery.data;
    } else {
      throw query.error;
    }
  }

  const manifest = [];
  let exported = 0;
  let skipped = 0;

  for (const row of query.data ?? []) {
    const displayName = String(row.name || row.sub_name || `producto-${row.id}`).trim();
    const selectedImage = pickBestImage(row);

    if (!selectedImage) {
      skipped += 1;
      manifest.push({
        productId: Number(row.id),
        name: displayName,
        exported: false,
        reason: "Producto sin imagen",
      });
      continue;
    }

    try {
      const { buffer, mimeType, source, bucketPath } = await downloadImageBuffer(selectedImage);
      const extension = inferExtension(selectedImage, mimeType);
      const fileName = `${String(row.id).padStart(4, "0")}-${slugify(displayName, `producto-${row.id}`)}.${extension}`;
      const relativeFile = path.join("images", fileName);
      const absoluteFile = path.join(exportDir, relativeFile);

      await writeFile(absoluteFile, buffer);

      manifest.push({
        productId: Number(row.id),
        name: displayName,
        subName: String(row.sub_name || "").trim(),
        exported: true,
        fileName,
        relativeFile,
        source,
        bucketPath,
        originalImage: row.image ?? "",
        originalImageThumb: row.image_thumb ?? "",
        originalImageCard: row.image_card ?? "",
        originalImageFull: row.image_full ?? "",
      });
      exported += 1;
      console.log(`Exportado ${row.id}: ${displayName}`);
    } catch (error) {
      skipped += 1;
      manifest.push({
        productId: Number(row.id),
        name: displayName,
        exported: false,
        reason: error instanceof Error ? error.message : String(error),
        originalImage: row.image ?? "",
        originalImageThumb: row.image_thumb ?? "",
        originalImageCard: row.image_card ?? "",
        originalImageFull: row.image_full ?? "",
      });
      console.error(`No se pudo exportar ${row.id}: ${displayName}`);
    }
  }

  await writeFile(
    path.join(exportDir, "manifest.json"),
    `${JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalProducts: (query.data ?? []).length,
        exported,
        skipped,
        items: manifest,
      },
      null,
      2,
    )}\n`,
  );

  await writeFile(
    path.join(exportDir, "LEEME.txt"),
    [
      "Estas imagenes corresponden a los productos actuales de Juma.",
      "Comprimilas manteniendo exactamente los mismos nombres de archivo.",
      "Cuando me devuelvas esta carpeta, voy a usar manifest.json para re-subirlas y actualizar la base.",
      "",
      `Productos exportados: ${exported}`,
      `Productos omitidos: ${skipped}`,
    ].join("\r\n"),
  );

  console.log("");
  console.log(`Carpeta creada: ${exportDir}`);
  console.log(`Productos exportados: ${exported}`);
  console.log(`Productos omitidos: ${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
