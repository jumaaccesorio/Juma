const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60",
  "x-content-type-options": "nosniff",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function mediaKey(pathname) {
  if (!pathname.startsWith("/media/")) return null;
  let key;
  try { key = decodeURIComponent(pathname.slice(7)); } catch { return null; }
  if (!key || key.startsWith("/") || key.includes("\\") || key.split("/").some((part) => part === "." || part === "..")) return null;
  return key;
}

async function serveMedia(request, env, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  const key = mediaKey(pathname);
  if (!key) return new Response("Not Found", { status: 404 });
  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not Found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata?.(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}

async function catalog(env, pathname) {
  if (pathname === "/api/catalog/categories") {
    const data = await env.DB.prepare("SELECT id,name,parent_id,created_at FROM categories ORDER BY name").all();
    return json(data.results);
  }
  if (pathname === "/api/catalog/products") {
    const data = await env.DB.prepare("SELECT id,name,sub_name,category_id,category_name,is_featured,sale_price,stock,enabled,image,image_thumb,image_card,image_full,created_at FROM catalog_products ORDER BY created_at DESC").all();
    return json(data.results);
  }
  if (pathname === "/api/catalog/home") {
    const [hero, panels] = await env.DB.batch([
      env.DB.prepare("SELECT id,tag,title,subtitle,image FROM hero_banner WHERE id=1"),
      env.DB.prepare("SELECT id,title,cta,image,class_name,category_id FROM featured_panels ORDER BY id"),
    ]);
    return json({ hero: hero.results[0] ?? null, panels: panels.results });
  }
  return json({ error: "Not Found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/media/")) return serveMedia(request, env, url.pathname);
    if (request.method === "GET" && url.pathname.startsWith("/api/catalog/")) return catalog(env, url.pathname);
    if (request.method === "GET" && url.pathname === "/api/migration/health") return json({ ok: true, data: "d1", media: "r2" }, 200);
    if (url.pathname.startsWith("/api/")) return json({ error: "Not Found" }, 404);
    return env.ASSETS.fetch(request);
  },
};

export { mediaKey };
