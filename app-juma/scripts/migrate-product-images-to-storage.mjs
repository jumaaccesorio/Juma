import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fxadhtmfpphpjjetdcxm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_4vMfCs_m8EGcQPRSxHj3HA_JocryEFy";
const BUCKET = "products";
const PAGE_SIZE = 20;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function parseDataUrl(dataUrl) {
  const match = /^data:(.*?);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  const [, mime, payload] = match;
  return { mime, payload };
}

function extensionForMime(mime) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

async function main() {
  const idsQuery = await supabase.from("products").select("id").order("created_at", { ascending: false });
  if (idsQuery.error) throw idsQuery.error;

  const ids = (idsQuery.data ?? []).map((row) => Number(row.id));
  console.log(`Productos encontrados: ${ids.length}`);

  let migrated = 0;
  let skipped = 0;

  for (let index = 0; index < ids.length; index += PAGE_SIZE) {
    const pageIds = ids.slice(index, index + PAGE_SIZE);
    const pageQuery = await supabase.from("products").select("id, name, image").in("id", pageIds);
    if (pageQuery.error) throw pageQuery.error;

    for (const row of pageQuery.data ?? []) {
      const image = typeof row.image === "string" ? row.image : "";
      if (!image.startsWith("data:image/")) {
        skipped += 1;
        continue;
      }

      const parsed = parseDataUrl(image);
      if (!parsed) {
        skipped += 1;
        continue;
      }

      const bytes = Uint8Array.from(Buffer.from(parsed.payload, "base64"));
      const ext = extensionForMime(parsed.mime);
      const path = `product-${row.id}-${Date.now()}.${ext}`;

      const upload = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType: parsed.mime,
        upsert: false,
        cacheControl: "3600",
      });

      if (upload.error) {
        console.error(`No se pudo subir la imagen del producto ${row.id} (${row.name}): ${upload.error.message}`);
        continue;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const update = await supabase.from("products").update({ image: data.publicUrl }).eq("id", row.id);
      if (update.error) {
        console.error(`No se pudo actualizar el producto ${row.id}: ${update.error.message}`);
        continue;
      }

      migrated += 1;
      console.log(`Migrado producto ${row.id}: ${row.name}`);
    }
  }

  console.log(`Migrados: ${migrated}`);
  console.log(`Omitidos: ${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
