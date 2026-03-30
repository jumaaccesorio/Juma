import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fxadhtmfpphpjjetdcxm.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_4vMfCs_m8EGcQPRSxHj3HA_JocryEFy";

const BUCKET = "products";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;
const SIGNED_PREFIX = `/storage/v1/object/sign/${BUCKET}/`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PRESETS = {
  product_thumb: { width: 240, quality: 72, folder: "products/thumbs" },
  product_card: { width: 520, quality: 76, folder: "products/cards" },
  product_full: { width: 1200, quality: 82, folder: "products/full" },
  panel: { width: 1100, quality: 82, folder: "optimized/home-panels" },
  hero: { width: 1400, quality: 82, folder: "optimized/hero" },
};

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

async function readSourceBuffer(image) {
  if (!image) throw new Error("Imagen vacia.");

  if (image.startsWith("data:image/")) {
    const match = /^data:(.*?);base64,(.*)$/.exec(image);
    if (!match) throw new Error("Data URL invalida.");
    return Buffer.from(match[2], "base64");
  }

  const bucketPath = extractBucketPath(image);
  if (bucketPath) {
    const download = await supabase.storage.from(BUCKET).download(bucketPath);
    if (download.error) throw download.error;
    return Buffer.from(await download.data.arrayBuffer());
  }

  const response = await fetch(image);
  if (!response.ok) throw new Error(`No se pudo descargar ${image}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function uploadOptimizedImage({ image, presetKey, nameSeed }) {
  const preset = PRESETS[presetKey];
  const sourceBuffer = await readSourceBuffer(image);

  const optimizedBuffer = await sharp(sourceBuffer)
    .rotate()
    .resize({ width: preset.width, withoutEnlargement: true })
    .webp({ quality: preset.quality })
    .toBuffer();

  const fileName = `${slugify(nameSeed, presetKey)}-${Date.now()}.webp`;
  const path = `${preset.folder}/${fileName}`;

  const upload = await supabase.storage.from(BUCKET).upload(path, optimizedBuffer, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });

  if (upload.error) throw upload.error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadProductVariants({ image, nameSeed }) {
  const sourceBuffer = await readSourceBuffer(image);

  const entries = await Promise.all(
    ["product_thumb", "product_card", "product_full"].map(async (presetKey) => {
      const preset = PRESETS[presetKey];
      const optimizedBuffer = await sharp(sourceBuffer)
        .rotate()
        .resize({ width: preset.width, withoutEnlargement: true })
        .webp({ quality: preset.quality })
        .toBuffer();

      const fileName = `${slugify(nameSeed, presetKey)}-${Date.now()}-${presetKey}.webp`;
      const path = `${preset.folder}/${fileName}`;

      const upload = await supabase.storage.from(BUCKET).upload(path, optimizedBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });

      if (upload.error) throw upload.error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return [presetKey, data.publicUrl];
    }),
  );

  return Object.fromEntries(entries);
}

async function optimizeHeroBanner() {
  const query = await supabase.from("hero_banner").select("id, title, image").eq("id", 1).maybeSingle();
  if (query.error) throw query.error;
  if (!query.data?.image) return { updated: 0 };

  const nextImage = await uploadOptimizedImage({
    image: query.data.image,
    presetKey: "hero",
    nameSeed: query.data.title || "hero-banner",
  });

  const update = await supabase.from("hero_banner").update({ image: nextImage }).eq("id", query.data.id);
  if (update.error) throw update.error;
  return { updated: 1 };
}

async function optimizeFeaturedPanels() {
  const query = await supabase.from("featured_panels").select("id, title, image");
  if (query.error) throw query.error;

  let updated = 0;
  for (const panel of query.data ?? []) {
    if (!panel.image) continue;
    const nextImage = await uploadOptimizedImage({
      image: panel.image,
      presetKey: "panel",
      nameSeed: `${panel.id}-${panel.title || "panel"}`,
    });
    const update = await supabase.from("featured_panels").update({ image: nextImage }).eq("id", panel.id);
    if (update.error) throw update.error;
    updated += 1;
    console.log(`Panel optimizado: ${panel.id}`);
  }

  return { updated };
}

async function optimizeProducts() {
  const query = await supabase
    .from("products")
    .select("id, name, image, image_thumb, image_card, image_full")
    .not("image", "is", null)
    .neq("image", "");
  if (query.error) throw query.error;

  let updated = 0;
  let skipped = 0;

  for (const product of query.data ?? []) {
    try {
      const variants = await uploadProductVariants({
        image: product.image,
        nameSeed: `${product.id}-${product.name || "producto"}`,
      });
      const update = await supabase
        .from("products")
        .update({
          image: variants.product_thumb,
          image_thumb: variants.product_thumb,
          image_card: variants.product_card,
          image_full: variants.product_full,
        })
        .eq("id", product.id);
      if (update.error) throw update.error;
      updated += 1;
      console.log(`Producto optimizado: ${product.id} - ${product.name}`);
    } catch (error) {
      skipped += 1;
      console.error(`No se pudo optimizar el producto ${product.id}:`, error.message);
    }
  }

  return { updated, skipped };
}

async function main() {
  const scope = process.argv[2] || "all";
  let hero = { updated: 0 };
  let panels = { updated: 0 };
  let products = { updated: 0, skipped: 0 };

  if (scope === "all" || scope === "hero") {
    console.log("Optimizando hero...");
    hero = await optimizeHeroBanner();
  }

  if (scope === "all" || scope === "panels") {
    console.log("Optimizando paneles destacados...");
    panels = await optimizeFeaturedPanels();
  }

  if (scope === "all" || scope === "products") {
    console.log("Optimizando productos...");
    products = await optimizeProducts();
  }

  console.log("");
  console.log(`Hero actualizado: ${hero.updated}`);
  console.log(`Paneles actualizados: ${panels.updated}`);
  console.log(`Productos actualizados: ${products.updated}`);
  console.log(`Productos omitidos con error: ${products.skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
