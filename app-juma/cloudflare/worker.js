const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60",
  "x-content-type-options": "nosniff",
};

const ADMIN_COOKIE = "juma_admin_session";
const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function privateJson(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

function bytesToBase64Url(bytes) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function signAdminSession(expiresAt, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(expiresAt)));
  return `${expiresAt}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

function readCookie(request, name) {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === name) return valueParts.join("=");
  }
  return null;
}

async function hasValidAdminSession(request, env) {
  if (!env.ADMIN_SESSION_SECRET) return false;
  const token = readCookie(request, ADMIN_COOKIE);
  if (!token) return false;
  const separator = token.indexOf(".");
  if (separator < 1) return false;
  const expiresAt = Number(token.slice(0, separator));
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;
  const expected = await signAdminSession(expiresAt, env.ADMIN_SESSION_SECRET);
  const actualBytes = new TextEncoder().encode(token);
  const expectedBytes = new TextEncoder().encode(expected);
  if (actualBytes.length !== expectedBytes.length) return false;
  let difference = 0;
  for (let index = 0; index < actualBytes.length; index += 1) difference |= actualBytes[index] ^ expectedBytes[index];
  return difference === 0;
}

async function adminAuth(request, env, pathname) {
  if (pathname === "/api/admin/session" && request.method === "GET") {
    return privateJson({ authenticated: await hasValidAdminSession(request, env) });
  }

  if (pathname === "/api/admin/login" && request.method === "POST") {
    if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
      return privateJson({ error: "El acceso administrativo no está configurado." }, 503);
    }
    let credentials;
    try {
      credentials = await request.json();
    } catch {
      return privateJson({ error: "Solicitud inválida." }, 400);
    }
    const expectedUser = env.ADMIN_USER || "admin";
    if (credentials?.user !== expectedUser || credentials?.password !== env.ADMIN_PASSWORD) {
      return privateJson({ error: "Credenciales admin inválidas." }, 401);
    }
    const expiresAt = Date.now() + ADMIN_SESSION_SECONDS * 1000;
    const token = await signAdminSession(expiresAt, env.ADMIN_SESSION_SECRET);
    return privateJson(
      { authenticated: true },
      200,
      { "set-cookie": `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ADMIN_SESSION_SECONDS}` },
    );
  }

  if (pathname === "/api/admin/logout" && request.method === "POST") {
    return privateJson(
      { authenticated: false },
      200,
      { "set-cookie": `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` },
    );
  }

  return privateJson({ error: "Not Found" }, 404);
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
    if (url.pathname.startsWith("/api/admin/")) return adminAuth(request, env, url.pathname);
    if (request.method === "GET" && url.pathname.startsWith("/api/catalog/")) return catalog(env, url.pathname);
    if (request.method === "GET" && url.pathname === "/api/migration/health") return json({ ok: true, data: "d1", media: "r2" }, 200);
    if (url.pathname.startsWith("/api/")) return json({ error: "Not Found" }, 404);
    return env.ASSETS.fetch(request);
  },
};

export { mediaKey };
