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

  return null;
}

function integer(value, field, { min = 0, nullable = false } = {}) {
  if (nullable && (value === null || value === undefined || value === "")) return null;
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < min) throw new Error(`${field} inválido.`);
  return result;
}

function textValue(value, field, { required = false, max = 5000 } = {}) {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new Error(`${field} es obligatorio.`);
  if (result.length > max) throw new Error(`${field} es demasiado largo.`);
  return result;
}

function centsValue(value, field) {
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0 || result > 100_000_000) throw new Error(`${field} inválido.`);
  return Math.round((result + Number.EPSILON) * 100);
}

async function requestBody(request) {
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().includes("application/json")) throw new Error("Se esperaba contenido JSON.");
  return request.json();
}

function productPayload(body, partial = false) {
  const fields = {};
  const assign = (input, column, transform) => {
    if (body[input] !== undefined) fields[column] = transform(body[input], input);
    else if (!partial) throw new Error(`${input} es obligatorio.`);
  };
  assign("name", "name", value => textValue(value, "Nombre", { required: true, max: 200 }));
  if (body.subName !== undefined || !partial) fields.sub_name = textValue(body.subName, "Subnombre", { max: 200 });
  if (body.size !== undefined || !partial) fields.size = textValue(body.size, "Talle", { max: 100 });
  if (body.categoryId !== undefined || !partial) fields.category_id = integer(body.categoryId, "Categoría", { nullable: true, min: 1 });
  if (body.isFeatured !== undefined || !partial) fields.is_featured = body.isFeatured ? 1 : 0;
  if (body.purchasePrice !== undefined || !partial) fields.purchase_price_cents = centsValue(body.purchasePrice ?? 0, "Precio de compra");
  if (body.salePrice !== undefined || !partial) fields.sale_price_cents = centsValue(body.salePrice ?? 0, "Precio de venta");
  if (body.stock !== undefined || !partial) fields.stock = integer(body.stock ?? 0, "Stock");
  if (body.initialStock !== undefined || !partial) fields.initial_stock = integer(body.initialStock ?? body.stock ?? 0, "Stock inicial");
  if (body.enabled !== undefined || !partial) fields.enabled = body.enabled === false ? 0 : 1;
  for (const [input, column] of [["image", "image"], ["imageThumb", "image_thumb"], ["imageCard", "image_card"], ["imageFull", "image_full"], ["sourceUrl", "source_url"]]) {
    if (body[input] !== undefined || !partial) fields[column] = textValue(body[input], input, { max: 10_000 });
  }
  if (!Object.keys(fields).length) throw new Error("No hay cambios para guardar.");
  return fields;
}

function productResult(row) {
  return {
    id: row.id,
    name: row.name,
    subName: row.sub_name,
    size: row.size,
    categoryId: row.category_id,
    categoryName: row.category_name ?? null,
    isFeatured: Boolean(row.is_featured),
    purchasePrice: row.purchase_price_cents / 100,
    salePrice: row.sale_price_cents / 100,
    stock: row.stock,
    initialStock: row.initial_stock,
    enabled: Boolean(row.enabled),
    image: row.image || "",
    imageThumb: row.image_thumb || "",
    imageCard: row.image_card || "",
    imageFull: row.image_full || "",
    sourceUrl: row.source_url || "",
    createdAt: row.created_at,
  };
}

async function readAdminProduct(env, id) {
  return env.DB.prepare(`SELECT p.*,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=?1`).bind(id).first();
}

async function adminCategories(request, env, pathname) {
  const base = "/api/admin/catalog/categories";
  if (pathname === base && request.method === "GET") {
    const rows = await env.DB.prepare("SELECT id,name,parent_id,created_at FROM categories ORDER BY name").all();
    return privateJson(rows.results.map(row => ({ id: row.id, name: row.name, parentId: row.parent_id, createdAt: row.created_at })));
  }
  if (pathname === base && request.method === "POST") {
    const body = await requestBody(request);
    const name = textValue(body.name, "Nombre", { required: true, max: 120 });
    const parentId = integer(body.parentId, "Categoría superior", { nullable: true, min: 1 });
    const result = await env.DB.prepare("INSERT INTO categories(name,parent_id) VALUES(?1,?2) RETURNING id,name,parent_id,created_at").bind(name, parentId).first();
    return privateJson({ id: result.id, name: result.name, parentId: result.parent_id, createdAt: result.created_at }, 201);
  }
  const match = pathname.match(/^\/api\/admin\/catalog\/categories\/(\d+)$/);
  if (!match) return null;
  const id = integer(match[1], "ID", { min: 1 });
  if (request.method === "PATCH") {
    const body = await requestBody(request);
    const name = textValue(body.name, "Nombre", { required: true, max: 120 });
    const result = await env.DB.prepare("UPDATE categories SET name=?1 WHERE id=?2 RETURNING id,name,parent_id,created_at").bind(name, id).first();
    return result ? privateJson({ id: result.id, name: result.name, parentId: result.parent_id, createdAt: result.created_at }) : privateJson({ error: "Categoría inexistente." }, 404);
  }
  if (request.method === "DELETE") {
    const result = await env.DB.prepare("DELETE FROM categories WHERE id=?1").bind(id).run();
    return result.meta.changes ? privateJson({ deleted: true }) : privateJson({ error: "Categoría inexistente." }, 404);
  }
  return null;
}

async function adminProducts(request, env, pathname) {
  const base = "/api/admin/catalog/products";
  if (pathname === base && request.method === "GET") {
    const [products, sizes] = await env.DB.batch([
      env.DB.prepare("SELECT p.*,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC"),
      env.DB.prepare("SELECT id,product_id,size,stock FROM product_sizes ORDER BY size"),
    ]);
    const byProduct = new Map();
    for (const size of sizes.results) {
      const list = byProduct.get(size.product_id) ?? [];
      list.push({ id: size.id, productId: size.product_id, size: size.size, stock: size.stock });
      byProduct.set(size.product_id, list);
    }
    return privateJson(products.results.map(row => ({ ...productResult(row), sizes: byProduct.get(row.id) ?? [] })));
  }
  if (pathname === base && request.method === "POST") {
    const fields = productPayload(await requestBody(request));
    const names = Object.keys(fields);
    const placeholders = names.map((_, index) => `?${index + 1}`);
    const inserted = await env.DB.prepare(`INSERT INTO products(${names.join(",")}) VALUES(${placeholders.join(",")}) RETURNING id`).bind(...names.map(name => fields[name])).first();
    const row = await readAdminProduct(env, inserted.id);
    return privateJson(productResult(row), 201);
  }
  const sizesMatch = pathname.match(/^\/api\/admin\/catalog\/products\/(\d+)\/sizes$/);
  if (sizesMatch && request.method === "PUT") {
    const productId = integer(sizesMatch[1], "ID", { min: 1 });
    const body = await requestBody(request);
    if (!Array.isArray(body.sizes) || body.sizes.length > 50) throw new Error("Lista de talles inválida.");
    const normalized = body.sizes.map(item => ({ size: textValue(item?.size, "Talle", { required: true, max: 100 }), stock: integer(item?.stock, "Stock") }));
    const names = normalized.map(item => item.size.toLocaleLowerCase("es-AR"));
    if (new Set(names).size !== names.length) throw new Error("No se puede repetir el mismo talle.");
    const statements = [env.DB.prepare("DELETE FROM product_sizes WHERE product_id=?1").bind(productId)];
    for (const item of normalized) statements.push(env.DB.prepare("INSERT INTO product_sizes(product_id,size,stock) VALUES(?1,?2,?3)").bind(productId, item.size, item.stock));
    statements.push(env.DB.prepare("UPDATE products SET stock=?1 WHERE id=?2").bind(normalized.reduce((sum, item) => sum + item.stock, 0), productId));
    await env.DB.batch(statements);
    const saved = await env.DB.prepare("SELECT id,product_id,size,stock FROM product_sizes WHERE product_id=?1 ORDER BY size").bind(productId).all();
    return privateJson(saved.results.map(row => ({ id: row.id, productId: row.product_id, size: row.size, stock: row.stock })));
  }
  const match = pathname.match(/^\/api\/admin\/catalog\/products\/(\d+)$/);
  if (!match) return null;
  const id = integer(match[1], "ID", { min: 1 });
  if (request.method === "PATCH") {
    const fields = productPayload(await requestBody(request), true);
    const names = Object.keys(fields);
    await env.DB.prepare(`UPDATE products SET ${names.map((name, index) => `${name}=?${index + 1}`).join(",")} WHERE id=?${names.length + 1}`).bind(...names.map(name => fields[name]), id).run();
    const row = await readAdminProduct(env, id);
    return row ? privateJson(productResult(row)) : privateJson({ error: "Producto inexistente." }, 404);
  }
  if (request.method === "DELETE") {
    const result = await env.DB.prepare("DELETE FROM products WHERE id=?1").bind(id).run();
    return result.meta.changes ? privateJson({ deleted: true }) : privateJson({ error: "Producto inexistente." }, 404);
  }
  return null;
}

async function adminMedia(request, env, pathname) {
  if (pathname !== "/api/admin/media" || request.method !== "POST") return null;
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!contentType.startsWith("image/")) return privateJson({ error: "El archivo debe ser una imagen." }, 400);
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > 12 * 1024 * 1024) return privateJson({ error: "La imagen supera 12 MB." }, 413);
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 12 * 1024 * 1024) return privateJson({ error: "Tamaño de imagen inválido." }, 400);
  const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
  const extension = extensions[contentType];
  if (!extension) return privateJson({ error: "Formato de imagen no admitido." }, 400);
  const variant = textValue(request.headers.get("x-juma-variant"), "Variante", { max: 40 }).replace(/[^a-z0-9_-]/gi, "") || "image";
  const key = `products/uploads/${variant}/${crypto.randomUUID()}.${extension}`;
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } });
  return privateJson({ path: `/media/${key}` }, 201);
}

async function adminData(request, env, pathname) {
  for (const handler of [adminCategories, adminProducts, adminMedia]) {
    const response = await handler(request, env, pathname);
    if (response) return response;
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
    if (url.pathname.startsWith("/api/admin/")) {
      try {
        const authResponse = await adminAuth(request, env, url.pathname);
        if (authResponse) return authResponse;
        if (!await hasValidAdminSession(request, env)) return privateJson({ error: "Sesión administrativa requerida." }, 401);
        return await adminData(request, env, url.pathname);
      } catch (error) {
        return privateJson({ error: error instanceof Error ? error.message : "Solicitud inválida." }, 400);
      }
    }
    if (request.method === "GET" && url.pathname.startsWith("/api/catalog/")) return catalog(env, url.pathname);
    if (request.method === "GET" && url.pathname === "/api/migration/health") return json({ ok: true, data: "d1", media: "r2" }, 200);
    if (url.pathname.startsWith("/api/")) return json({ error: "Not Found" }, 404);
    return env.ASSETS.fetch(request);
  },
};

export { mediaKey, productPayload };
