const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60",
  "x-content-type-options": "nosniff",
};

const ADMIN_COOKIE = "juma_admin_session";
const ADMIN_SESSION_SECONDS = 60 * 60 * 8;
const CUSTOMER_COOKIE = "juma_customer_session";
const OAUTH_STATE_COOKIE = "juma_oauth_state";
const CUSTOMER_SESSION_SECONDS = 60 * 60 * 24 * 30;

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

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function tokenHash(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

function redirect(location, cookies = []) {
  const headers = new Headers({ location, "cache-control": "no-store", "x-content-type-options": "nosniff" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function customerCookie(token, maxAge = CUSTOMER_SESSION_SECONDS) {
  return `${CUSTOMER_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

async function currentCustomer(request, env) {
  const token = readCookie(request, CUSTOMER_COOKIE);
  if (!token) return null;
  const hash = await tokenHash(token);
  const row = await env.DB.prepare("SELECT u.id AS user_id,u.email,u.name,u.picture,c.id AS client_id,c.phone,c.is_active,c.created_at FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id JOIN clients c ON c.id=u.client_id WHERE s.token_hash=?1 AND s.expires_at>?2").bind(hash, new Date().toISOString()).first();
  if (!row || !row.is_active) return null;
  return { userId: row.user_id, client: { id: row.client_id, authId: row.user_id, name: row.name, email: row.email, phone: row.phone, isActive: true, createdAt: row.created_at }, picture: row.picture };
}

async function customerAuth(request, env, url) {
  const pathname = url.pathname;
  const publicOrigin = (env.PUBLIC_ORIGIN || url.origin).replace(/\/$/, "");
  const callbackUrl = `${publicOrigin}/api/auth/google/callback`;
  if (pathname === "/api/auth/google/start" && request.method === "GET") {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return privateJson({ error: "Google todavía no está configurado en Cloudflare." }, 503);
    const state = randomToken();
    const verifier = randomToken(48);
    const challenge = await tokenHash(verifier);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM oauth_states WHERE expires_at<=?1").bind(new Date().toISOString()),
      env.DB.prepare("INSERT INTO oauth_states(state_hash,code_verifier,expires_at) VALUES(?1,?2,?3)").bind(await tokenHash(state), verifier, expiresAt),
    ]);
    const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorize.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: callbackUrl, response_type: "code", scope: "openid email profile", state, code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account" }).toString();
    return redirect(authorize.toString(), [`${OAUTH_STATE_COOKIE}=${state}; Path=/api/auth/google/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`]);
  }
  if (pathname === "/api/auth/google/callback" && request.method === "GET") {
    const state = url.searchParams.get("state") || "";
    const code = url.searchParams.get("code") || "";
    const cookieState = readCookie(request, OAUTH_STATE_COOKIE) || "";
    const clearState = `${OAUTH_STATE_COOKIE}=; Path=/api/auth/google/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
    if (!state || !code || !cookieState || state !== cookieState) return redirect(`${publicOrigin}/?auth_error=state`, [clearState]);
    const stateHash = await tokenHash(state);
    const saved = await env.DB.prepare("DELETE FROM oauth_states WHERE state_hash=?1 AND expires_at>?2 RETURNING code_verifier").bind(stateHash, new Date().toISOString()).first();
    if (!saved) return redirect(`${publicOrigin}/?auth_error=expired`, [clearState]);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: callbackUrl, grant_type: "authorization_code", code_verifier: saved.code_verifier }) });
    if (!tokenResponse.ok) return redirect(`${publicOrigin}/?auth_error=token`, [clearState]);
    const tokens = await tokenResponse.json();
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tokens.access_token}` } });
    if (!profileResponse.ok) return redirect(`${publicOrigin}/?auth_error=profile`, [clearState]);
    const profile = await profileResponse.json();
    const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
    if (!profile.sub || !email || profile.email_verified !== true) return redirect(`${publicOrigin}/?auth_error=email`, [clearState]);
    let client = await env.DB.prepare("SELECT * FROM clients WHERE lower(email)=?1").bind(email).first();
    if (!client) client = await env.DB.prepare("INSERT INTO clients(auth_id,name,email,phone,is_active) VALUES(NULL,?1,?2,'',1) RETURNING *").bind(textValue(profile.name || email, "Nombre", { max: 160 }), email).first();
    if (!client.is_active) return redirect(`${publicOrigin}/?auth_error=inactive`, [clearState]);
    let user = await env.DB.prepare("SELECT * FROM auth_users WHERE provider_sub=?1 OR email=?2").bind(profile.sub, email).first();
    const userId = user?.id || crypto.randomUUID();
    await env.DB.prepare("INSERT INTO auth_users(id,provider_sub,email,name,picture,client_id,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7) ON CONFLICT(id) DO UPDATE SET provider_sub=excluded.provider_sub,email=excluded.email,name=excluded.name,picture=excluded.picture,client_id=excluded.client_id,updated_at=excluded.updated_at").bind(userId, profile.sub, email, textValue(profile.name || client.name || email, "Nombre", { max: 160 }), textValue(profile.picture, "Foto", { max: 2000 }), client.id, new Date().toISOString()).run();
    const sessionToken = randomToken(48);
    const expiresAt = new Date(Date.now() + CUSTOMER_SESSION_SECONDS * 1000).toISOString();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM auth_sessions WHERE expires_at<=?1").bind(new Date().toISOString()),
      env.DB.prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(?1,?2,?3)").bind(await tokenHash(sessionToken), userId, expiresAt),
    ]);
    return redirect(`${publicOrigin}/auth/confirm?provider=cloudflare`, [clearState, customerCookie(sessionToken)]);
  }
  if (pathname === "/api/auth/session" && request.method === "GET") {
    const current = await currentCustomer(request, env);
    return privateJson(current ? { authenticated: true, ...current } : { authenticated: false });
  }
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    const token = readCookie(request, CUSTOMER_COOKIE);
    if (token) await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash=?1").bind(await tokenHash(token)).run();
    return privateJson({ authenticated: false }, 200, { "set-cookie": customerCookie("", 0) });
  }
  return null;
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

function orderPayload(body) {
  const status = body?.status === "REALIZADO" ? "REALIZADO" : body?.status === "PENDIENTE" ? "PENDIENTE" : null;
  if (!status) throw new Error("Estado de pedido inválido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body?.date || "")) throw new Error("Fecha de pedido inválida.");
  if (!Array.isArray(body?.items) || body.items.length < 1 || body.items.length > 50) throw new Error("El pedido debe contener entre 1 y 50 artículos.");
  const clientId = integer(body.clientId, "Cliente", { nullable: true, min: 1 });
  const guestName = textValue(body.guestName, "Nombre", { max: 160 });
  const guestEmail = textValue(body.guestEmail, "Email", { max: 320 }).toLowerCase();
  const guestPhone = textValue(body.guestPhone, "Teléfono", { max: 80 });
  if (!clientId && !guestName) throw new Error("Seleccioná un cliente o indicá el nombre del comprador.");
  const items = body.items.map(item => ({
    productId: integer(item?.productId, "Producto", { min: 1 }),
    quantity: integer(item?.quantity, "Cantidad", { min: 1 }),
    size: textValue(item?.size, "Talle", { max: 100 }) || null,
    unitSalePriceCents: centsValue(item?.unitSalePrice, "Precio de venta"),
    unitPurchasePriceCents: centsValue(item?.unitPurchasePrice, "Precio de compra"),
  }));
  const unique = new Set(items.map(item => `${item.productId}:${item.size ?? ""}`));
  if (unique.size !== items.length) throw new Error("El pedido contiene artículos repetidos.");
  return { clientId, guestName, guestEmail, guestPhone, date: body.date, status, items };
}

function orderResult(row, items) {
  return {
    id: row.id,
    clientId: row.client_id ?? undefined,
    guestName: row.guest_name ?? undefined,
    guestEmail: row.guest_email ?? undefined,
    guestPhone: row.guest_phone ?? undefined,
    date: row.date,
    status: row.status,
    items: items.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      size: item.size ?? undefined,
      unitSalePrice: item.unit_sale_price_cents / 100,
      unitPurchasePrice: item.unit_purchase_price_cents / 100,
    })),
  };
}

async function changeOrderStock(env, items, direction) {
  const statements = [];
  for (const item of items) {
    statements.push(env.DB.prepare("UPDATE products SET stock=stock+?1 WHERE id=?2").bind(direction * item.quantity, item.product_id));
    if (item.size) statements.push(env.DB.prepare("UPDATE product_sizes SET stock=stock+?1 WHERE product_id=?2 AND size=?3").bind(direction * item.quantity, item.product_id, item.size));
  }
  return statements;
}

async function adminOrders(request, env, pathname) {
  const base = "/api/admin/orders";
  if (pathname === base && request.method === "GET") {
    const [orders, items] = await env.DB.batch([
      env.DB.prepare("SELECT id,client_id,guest_name,guest_email,guest_phone,date,status FROM orders ORDER BY date DESC,id DESC"),
      env.DB.prepare("SELECT order_id,product_id,quantity,size,unit_sale_price_cents,unit_purchase_price_cents FROM order_items ORDER BY id"),
    ]);
    const byOrder = new Map();
    for (const item of items.results) {
      const list = byOrder.get(item.order_id) ?? [];
      list.push(item);
      byOrder.set(item.order_id, list);
    }
    return privateJson(orders.results.map(row => orderResult(row, byOrder.get(row.id) ?? [])));
  }
  if (pathname === base && request.method === "POST") {
    const order = orderPayload(await requestBody(request));
    const orderId = Date.now() * 1000 + crypto.getRandomValues(new Uint32Array(1))[0] % 1000;
    const statements = [env.DB.prepare("INSERT INTO orders(id,client_id,guest_name,guest_email,guest_phone,date,status) VALUES(?1,?2,?3,?4,?5,?6,?7)").bind(orderId, order.clientId, order.guestName || null, order.guestEmail || null, order.guestPhone || null, order.date, order.status)];
    for (const item of order.items) statements.push(env.DB.prepare("INSERT INTO order_items(order_id,product_id,quantity,size,unit_sale_price_cents,unit_purchase_price_cents) VALUES(?1,?2,?3,?4,?5,?6)").bind(orderId, item.productId, item.quantity, item.size, item.unitSalePriceCents, item.unitPurchasePriceCents));
    if (order.status === "REALIZADO") statements.push(...await changeOrderStock(env, order.items.map(item => ({ ...item, product_id: item.productId })), -1));
    await env.DB.batch(statements);
    return privateJson({ id: orderId, ...order, items: order.items.map(item => ({ productId: item.productId, quantity: item.quantity, size: item.size ?? undefined, unitSalePrice: item.unitSalePriceCents / 100, unitPurchasePrice: item.unitPurchasePriceCents / 100 })) }, 201);
  }
  const match = pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
  if (!match) return null;
  const id = integer(match[1], "ID", { min: 1 });
  const current = await env.DB.prepare("SELECT id,status FROM orders WHERE id=?1").bind(id).first();
  if (!current) return privateJson({ error: "Pedido inexistente." }, 404);
  const items = (await env.DB.prepare("SELECT product_id,quantity,size FROM order_items WHERE order_id=?1").bind(id).all()).results;
  if (request.method === "PATCH") {
    const body = await requestBody(request);
    const status = body.status === "REALIZADO" ? "REALIZADO" : body.status === "PENDIENTE" ? "PENDIENTE" : null;
    if (!status) throw new Error("Estado de pedido inválido.");
    if (status === current.status) return privateJson({ updated: true });
    const direction = status === "REALIZADO" ? -1 : 1;
    await env.DB.batch([...await changeOrderStock(env, items, direction), env.DB.prepare("UPDATE orders SET status=?1 WHERE id=?2").bind(status, id)]);
    return privateJson({ updated: true });
  }
  if (request.method === "DELETE") {
    const statements = current.status === "REALIZADO" ? await changeOrderStock(env, items, 1) : [];
    statements.push(env.DB.prepare("DELETE FROM orders WHERE id=?1").bind(id));
    await env.DB.batch(statements);
    return privateJson({ deleted: true });
  }
  return null;
}

function clientResult(row) {
  return { id: row.id, authId: row.auth_id ?? undefined, name: row.name, email: row.email, phone: row.phone, isActive: Boolean(row.is_active), createdAt: row.created_at };
}

async function adminClients(request, env, pathname) {
  const base = "/api/admin/clients";
  if (pathname === base && request.method === "GET") {
    const rows = await env.DB.prepare("SELECT id,auth_id,name,email,phone,is_active,created_at FROM clients ORDER BY created_at DESC").all();
    return privateJson(rows.results.map(clientResult));
  }
  if (pathname === base && request.method === "POST") {
    const body = await requestBody(request);
    const name = textValue(body.name, "Nombre", { required: true, max: 160 });
    const email = textValue(body.email, "Email", { required: true, max: 320 }).toLowerCase();
    const phone = textValue(body.phone, "Teléfono", { max: 80 });
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email inválido.");
    const row = await env.DB.prepare("INSERT INTO clients(name,email,phone,is_active) VALUES(?1,?2,?3,1) RETURNING *").bind(name, email, phone).first();
    return privateJson(clientResult(row), 201);
  }
  const match = pathname.match(/^\/api\/admin\/clients\/(\d+)$/);
  if (!match) return null;
  const id = integer(match[1], "ID", { min: 1 });
  if (request.method === "PATCH") {
    const body = await requestBody(request);
    const allowed = {
      authId: ["auth_id", value => textValue(value, "Identidad", { max: 200 }) || null],
      name: ["name", value => textValue(value, "Nombre", { required: true, max: 160 })],
      email: ["email", value => {
        const email = textValue(value, "Email", { required: true, max: 320 }).toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email inválido.");
        return email;
      }],
      phone: ["phone", value => textValue(value, "Teléfono", { max: 80 })],
      isActive: ["is_active", value => value ? 1 : 0],
    };
    const updates = [];
    for (const [input, [column, transform]] of Object.entries(allowed)) if (body[input] !== undefined) updates.push([column, transform(body[input])]);
    if (!updates.length) throw new Error("No hay cambios para guardar.");
    const result = await env.DB.prepare(`UPDATE clients SET ${updates.map(([column], index) => `${column}=?${index + 1}`).join(",")} WHERE id=?${updates.length + 1}`).bind(...updates.map(([, value]) => value), id).run();
    return result.meta.changes ? privateJson({ updated: true }) : privateJson({ error: "Cliente inexistente." }, 404);
  }
  if (request.method === "DELETE") {
    const result = await env.DB.prepare("DELETE FROM clients WHERE id=?1").bind(id).run();
    return result.meta.changes ? privateJson({ deleted: true }) : privateJson({ error: "Cliente inexistente." }, 404);
  }
  return null;
}

async function adminFinance(request, env, pathname) {
  const base = "/api/admin/finance";
  if (pathname === base && request.method === "GET") {
    const rows = await env.DB.prepare("SELECT * FROM finance_expenses ORDER BY date DESC,id DESC").all();
    return privateJson(rows.results.map(row => ({ id: row.id, type: row.type, description: row.description, detail: row.detail, category: row.category, amount: row.amount_cents / 100, date: row.date, createdAt: row.created_at })));
  }
  if (pathname === base && request.method === "POST") {
    const body = await requestBody(request);
    const type = body.type === "INGRESO" ? "INGRESO" : body.type === "EGRESO" ? "EGRESO" : null;
    if (!type) throw new Error("Tipo de movimiento inválido.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date || "")) throw new Error("Fecha inválida.");
    const row = await env.DB.prepare("INSERT INTO finance_expenses(type,description,detail,category,amount_cents,date) VALUES(?1,?2,?3,?4,?5,?6) RETURNING *").bind(type, textValue(body.description, "Descripción", { required: true, max: 300 }), textValue(body.detail, "Detalle", { max: 2000 }), textValue(body.category, "Categoría", { required: true, max: 120 }), centsValue(body.amount, "Importe"), body.date).first();
    return privateJson({ id: row.id, type: row.type, description: row.description, detail: row.detail, category: row.category, amount: row.amount_cents / 100, date: row.date, createdAt: row.created_at }, 201);
  }
  const match = pathname.match(/^\/api\/admin\/finance\/(\d+)$/);
  if (match && request.method === "DELETE") {
    const result = await env.DB.prepare("DELETE FROM finance_expenses WHERE id=?1").bind(integer(match[1], "ID", { min: 1 })).run();
    return result.meta.changes ? privateJson({ deleted: true }) : privateJson({ error: "Movimiento inexistente." }, 404);
  }
  return null;
}

async function adminPackaging(request, env, pathname) {
  const base = "/api/admin/packaging";
  if (pathname === base && request.method === "GET") {
    const rows = await env.DB.prepare("SELECT * FROM packaging_costs ORDER BY created_at,id").all();
    return privateJson(rows.results.map(row => ({ id: row.id, name: row.name, unitCost: row.unit_cost_cents / 100, quantity: row.quantity, createdAt: row.created_at })));
  }
  if (pathname === base && request.method === "POST") {
    const body = await requestBody(request);
    const row = await env.DB.prepare("INSERT INTO packaging_costs(name,unit_cost_cents,quantity) VALUES(?1,?2,?3) RETURNING *").bind(textValue(body.name, "Nombre", { required: true, max: 160 }), centsValue(body.unitCost, "Costo"), integer(body.quantity, "Cantidad", { min: 1 })).first();
    return privateJson({ id: row.id, name: row.name, unitCost: row.unit_cost_cents / 100, quantity: row.quantity, createdAt: row.created_at }, 201);
  }
  const match = pathname.match(/^\/api\/admin\/packaging\/(\d+)$/);
  if (!match) return null;
  const id = integer(match[1], "ID", { min: 1 });
  if (request.method === "PATCH") {
    const body = await requestBody(request);
    const updates = [];
    if (body.name !== undefined) updates.push(["name", textValue(body.name, "Nombre", { required: true, max: 160 })]);
    if (body.unitCost !== undefined) updates.push(["unit_cost_cents", centsValue(body.unitCost, "Costo")]);
    if (body.quantity !== undefined) updates.push(["quantity", integer(body.quantity, "Cantidad", { min: 1 })]);
    if (!updates.length) throw new Error("No hay cambios para guardar.");
    const result = await env.DB.prepare(`UPDATE packaging_costs SET ${updates.map(([column], index) => `${column}=?${index + 1}`).join(",")} WHERE id=?${updates.length + 1}`).bind(...updates.map(([, value]) => value), id).run();
    return result.meta.changes ? privateJson({ updated: true }) : privateJson({ error: "Costo inexistente." }, 404);
  }
  if (request.method === "DELETE") {
    const result = await env.DB.prepare("DELETE FROM packaging_costs WHERE id=?1").bind(id).run();
    return result.meta.changes ? privateJson({ deleted: true }) : privateJson({ error: "Costo inexistente." }, 404);
  }
  return null;
}

async function adminRestock(request, env, pathname) {
  const base = "/api/admin/restock";
  if (pathname === base && request.method === "GET") {
    const rows = await env.DB.prepare("SELECT * FROM restock_cart_items ORDER BY updated_at DESC").all();
    return privateJson(rows.results.map(row => ({ productId: row.product_id, requested: Boolean(row.requested), inCart: Boolean(row.in_cart), hidden: Boolean(row.hidden), manual: Boolean(row.is_manual), quantity: row.manual_quantity, updatedAt: row.updated_at })));
  }
  const match = pathname.match(/^\/api\/admin\/restock\/(\d+)$/);
  if (match && request.method === "PUT") {
    const productId = integer(match[1], "Producto", { min: 1 });
    const body = await requestBody(request);
    const now = new Date().toISOString();
    const row = await env.DB.prepare("INSERT INTO restock_cart_items(product_id,requested,in_cart,hidden,is_manual,manual_quantity,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7) ON CONFLICT(product_id) DO UPDATE SET requested=excluded.requested,in_cart=excluded.in_cart,hidden=excluded.hidden,is_manual=excluded.is_manual,manual_quantity=excluded.manual_quantity,updated_at=excluded.updated_at RETURNING *").bind(productId, body.requested ? 1 : 0, body.inCart ? 1 : 0, body.hidden ? 1 : 0, body.manual ? 1 : 0, integer(body.quantity ?? 0, "Cantidad"), now).first();
    return privateJson({ productId: row.product_id, requested: Boolean(row.requested), inCart: Boolean(row.in_cart), hidden: Boolean(row.hidden), manual: Boolean(row.is_manual), quantity: row.manual_quantity, updatedAt: row.updated_at });
  }
  return null;
}

async function communityApi(request, env, pathname) {
  if (pathname !== "/api/community" || request.method !== "POST") return null;
  try {
    const body = await requestBody(request);
    const email = textValue(body.email, "Email", { required: true, max: 320 }).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email inválido.");
    const row = await env.DB.prepare("INSERT INTO community_subscribers(email) VALUES(?1) ON CONFLICT(email) DO NOTHING RETURNING id,email,created_at").bind(email).first();
    if (!row) return privateJson({ error: "Este email ya está suscripto." }, 409);
    return privateJson({ id: row.id, email: row.email, createdAt: row.created_at }, 201);
  } catch (error) {
    return privateJson({ error: error instanceof Error ? error.message : "Solicitud inválida." }, 400);
  }
}

async function customerData(request, env, url) {
  const current = await currentCustomer(request, env);
  if (!current) return privateJson({ error: "Iniciá sesión para continuar." }, 401);
  const pathname = url.pathname;

  if (pathname === "/api/customer/favorites" && request.method === "GET") {
    const rows = await env.DB.prepare("SELECT id,client_id,product_id,created_at FROM favorites WHERE client_id=?1 ORDER BY created_at DESC").bind(current.client.id).all();
    return privateJson(rows.results.map(row => ({ id: row.id, clientId: row.client_id, productId: row.product_id, createdAt: row.created_at })));
  }
  const favoriteMatch = pathname.match(/^\/api\/customer\/favorites\/(\d+)$/);
  if (favoriteMatch && request.method === "PUT") {
    const productId = integer(favoriteMatch[1], "Producto", { min: 1 });
    const body = await requestBody(request);
    if (body.favorite === true) {
      await env.DB.prepare("INSERT INTO favorites(client_id,product_id) VALUES(?1,?2) ON CONFLICT(client_id,product_id) DO NOTHING").bind(current.client.id, productId).run();
    } else if (body.favorite === false) {
      await env.DB.prepare("DELETE FROM favorites WHERE client_id=?1 AND product_id=?2").bind(current.client.id, productId).run();
    } else throw new Error("Estado de favorito inválido.");
    return privateJson({ favorite: body.favorite });
  }
  if (pathname === "/api/customer/reviews" && request.method === "POST") {
    const body = await requestBody(request);
    const productId = integer(body.productId, "Producto", { min: 1 });
    const rating = integer(body.rating, "Calificación", { min: 1 });
    if (rating > 5) throw new Error("Calificación inválida.");
    const comment = textValue(body.comment, "Comentario", { max: 2000 });
    const row = await env.DB.prepare("INSERT INTO product_reviews(product_id,client_id,rating,comment) VALUES(?1,?2,?3,?4) ON CONFLICT(product_id,client_id) DO UPDATE SET rating=excluded.rating,comment=excluded.comment,created_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') RETURNING id").bind(productId, current.client.id, rating, comment).first();
    const saved = await env.DB.prepare("SELECT r.*,c.name AS client_name,p.name AS product_name,p.sub_name AS product_sub_name FROM product_reviews r JOIN clients c ON c.id=r.client_id JOIN products p ON p.id=r.product_id WHERE r.id=?1").bind(row.id).first();
    return privateJson(reviewResult(saved));
  }
  return privateJson({ error: "Not Found" }, 404);
}

async function publicOrders(request, env, pathname) {
  if (pathname !== "/api/orders" || request.method !== "POST") return null;
  const body = await requestBody(request);
  const current = await currentCustomer(request, env);
  const order = orderPayload({ ...body, clientId: current?.client.id ?? null, status: "PENDIENTE" });
  const productRows = await env.DB.batch(order.items.map(item => env.DB.prepare("SELECT p.id,p.enabled,p.stock,p.purchase_price_cents,p.sale_price_cents,(SELECT COUNT(*) FROM product_sizes ps WHERE ps.product_id=p.id) AS size_count,(SELECT ps.stock FROM product_sizes ps WHERE ps.product_id=p.id AND ps.size=?2) AS selected_size_stock FROM products p WHERE p.id=?1").bind(item.productId, item.size)));
  order.items = order.items.map((item, index) => {
    const product = productRows[index].results[0];
    if (!product || !product.enabled) throw new Error("Uno de los productos ya no está disponible.");
    if (product.size_count > 0 && (!item.size || product.selected_size_stock === null || product.selected_size_stock === undefined)) throw new Error("Seleccioná un talle disponible.");
    const available = product.size_count > 0 ? product.selected_size_stock : product.stock;
    if (available < item.quantity) throw new Error("No hay stock suficiente para completar el pedido.");
    return { ...item, unitSalePriceCents: product.sale_price_cents, unitPurchasePriceCents: product.purchase_price_cents };
  });
  const orderId = Date.now() * 1000 + crypto.getRandomValues(new Uint32Array(1))[0] % 1000;
  const statements = [env.DB.prepare("INSERT INTO orders(id,client_id,guest_name,guest_email,guest_phone,date,status) VALUES(?1,?2,?3,?4,?5,?6,'PENDIENTE')").bind(orderId, order.clientId, order.guestName || null, order.guestEmail || null, order.guestPhone || null, order.date)];
  for (const item of order.items) statements.push(env.DB.prepare("INSERT INTO order_items(order_id,product_id,quantity,size,unit_sale_price_cents,unit_purchase_price_cents) VALUES(?1,?2,?3,?4,?5,?6)").bind(orderId, item.productId, item.quantity, item.size, item.unitSalePriceCents, item.unitPurchasePriceCents));
  await env.DB.batch(statements);
  return privateJson({ id: orderId, ...order, status: "PENDIENTE", items: order.items.map(item => ({ productId: item.productId, quantity: item.quantity, size: item.size ?? undefined, unitSalePrice: item.unitSalePriceCents / 100, unitPurchasePrice: item.unitPurchasePriceCents / 100 })) }, 201);
}

async function adminCommunity(request, env, pathname) {
  const base = "/api/admin/community";
  if (pathname === base && request.method === "GET") {
    const rows = await env.DB.prepare("SELECT id,email,created_at FROM community_subscribers ORDER BY created_at DESC").all();
    return privateJson(rows.results.map(row => ({ id: row.id, email: row.email, createdAt: row.created_at })));
  }
  const match = pathname.match(/^\/api\/admin\/community\/(\d+)$/);
  if (match && request.method === "DELETE") {
    const result = await env.DB.prepare("DELETE FROM community_subscribers WHERE id=?1").bind(integer(match[1], "ID", { min: 1 })).run();
    return result.meta.changes ? privateJson({ deleted: true }) : privateJson({ error: "Suscriptor inexistente." }, 404);
  }
  return null;
}

function reviewResult(row) {
  return { id: row.id, productId: row.product_id, clientId: row.client_id, clientName: row.client_name ?? undefined, productName: [row.product_name, row.product_sub_name].filter(Boolean).join(" ") || undefined, rating: row.rating, comment: row.comment, createdAt: row.created_at };
}

async function adminReviews(request, env, pathname) {
  const base = "/api/admin/reviews";
  if (pathname === base && request.method === "GET") {
    const rows = await env.DB.prepare("SELECT r.*,c.name AS client_name,p.name AS product_name,p.sub_name AS product_sub_name FROM product_reviews r JOIN clients c ON c.id=r.client_id JOIN products p ON p.id=r.product_id ORDER BY r.created_at DESC").all();
    return privateJson(rows.results.map(reviewResult));
  }
  const match = pathname.match(/^\/api\/admin\/reviews\/(\d+)$/);
  if (match && request.method === "DELETE") {
    const result = await env.DB.prepare("DELETE FROM product_reviews WHERE id=?1").bind(integer(match[1], "ID", { min: 1 })).run();
    return result.meta.changes ? privateJson({ deleted: true }) : privateJson({ error: "Reseña inexistente." }, 404);
  }
  return null;
}

async function adminContent(request, env, pathname) {
  if (pathname === "/api/admin/settings/catalog_sort_order" && request.method === "PUT") {
    const body = await requestBody(request);
    const allowed = new Set(["recientes", "nombre", "precio_asc", "precio_desc"]);
    if (!allowed.has(body.value)) throw new Error("Orden del catálogo inválido.");
    await env.DB.prepare("INSERT INTO app_settings(key,value) VALUES('catalog_sort_order',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(body.value).run();
    return privateJson({ updated: true });
  }
  if (pathname !== "/api/admin/content" || request.method !== "PUT") return null;
  const body = await requestBody(request);
  const hero = body.heroBanner;
  if (!hero || !Array.isArray(body.featuredPanels) || body.featuredPanels.length > 12) throw new Error("Configuración de inicio inválida.");
  const statements = [env.DB.prepare("INSERT INTO hero_banner(id,tag,title,subtitle,image) VALUES(1,?1,?2,?3,?4) ON CONFLICT(id) DO UPDATE SET tag=excluded.tag,title=excluded.title,subtitle=excluded.subtitle,image=excluded.image").bind(textValue(hero.tag, "Etiqueta", { max: 120 }), textValue(hero.title, "Título", { required: true, max: 200 }), textValue(hero.subtitle, "Subtítulo", { max: 500 }), textValue(hero.image, "Imagen", { required: true, max: 10_000 }))];
  const panels = body.featuredPanels.map(panel => {
    const className = new Set(["card-left", "card-top", "card-bottom-left", "card-bottom-right"]).has(panel.className) ? panel.className : null;
    if (!className) throw new Error("Posición de panel inválida.");
    return { id: textValue(panel.id, "ID de panel", { required: true, max: 80 }), title: textValue(panel.title, "Título de panel", { required: true, max: 200 }), cta: textValue(panel.cta, "Acción", { max: 120 }), image: textValue(panel.image, "Imagen de panel", { required: true, max: 10_000 }), className, categoryId: integer(panel.categoryId, "Categoría", { nullable: true, min: 1 }) };
  });
  if (new Set(panels.map(panel => panel.id)).size !== panels.length) throw new Error("Hay paneles repetidos.");
  if (panels.length) {
    statements.push(env.DB.prepare(`DELETE FROM featured_panels WHERE id NOT IN (${panels.map((_, index) => `?${index + 1}`).join(",")})`).bind(...panels.map(panel => panel.id)));
  } else statements.push(env.DB.prepare("DELETE FROM featured_panels"));
  for (const panel of panels) statements.push(env.DB.prepare("INSERT INTO featured_panels(id,title,cta,image,class_name,category_id) VALUES(?1,?2,?3,?4,?5,?6) ON CONFLICT(id) DO UPDATE SET title=excluded.title,cta=excluded.cta,image=excluded.image,class_name=excluded.class_name,category_id=excluded.category_id").bind(panel.id, panel.title, panel.cta, panel.image, panel.className, panel.categoryId));
  await env.DB.batch(statements);
  return privateJson({ heroBanner: { tag: hero.tag, title: hero.title, subtitle: hero.subtitle, image: hero.image }, featuredPanels: panels });
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
  for (const handler of [adminCategories, adminProducts, adminOrders, adminClients, adminFinance, adminPackaging, adminRestock, adminCommunity, adminReviews, adminContent, adminMedia]) {
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

async function catalog(env, pathname, url) {
  if (pathname === "/api/catalog/categories") {
    const data = await env.DB.prepare("SELECT id,name,parent_id,created_at FROM categories ORDER BY name").all();
    return json(data.results);
  }
  if (pathname === "/api/catalog/products") {
    const [products, sizes] = await env.DB.batch([
      env.DB.prepare("SELECT id,name,sub_name,category_id,category_name,is_featured,sale_price,stock,enabled,image,image_thumb,image_card,image_full,created_at FROM catalog_products ORDER BY created_at DESC"),
      env.DB.prepare("SELECT id,product_id,size,stock FROM product_sizes ORDER BY size"),
    ]);
    const byProduct = new Map();
    for (const size of sizes.results) {
      const list = byProduct.get(size.product_id) ?? [];
      list.push(size);
      byProduct.set(size.product_id, list);
    }
    return json(products.results.map(row => ({ ...row, product_sizes: byProduct.get(row.id) ?? [] })));
  }
  if (pathname === "/api/catalog/home") {
    const [hero, panels] = await env.DB.batch([
      env.DB.prepare("SELECT id,tag,title,subtitle,image FROM hero_banner WHERE id=1"),
      env.DB.prepare("SELECT id,title,cta,image,class_name,category_id FROM featured_panels ORDER BY id"),
    ]);
    return json({ hero: hero.results[0] ?? null, panels: panels.results });
  }
  if (pathname === "/api/catalog/settings/catalog_sort_order") {
    const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key='catalog_sort_order'").first();
    return json({ value: row?.value ?? null });
  }
  if (pathname === "/api/catalog/reviews") {
    const productId = Number(url.searchParams.get("productId"));
    if (!Number.isSafeInteger(productId) || productId < 1) return json({ error: "Producto inválido." }, 400);
    const rows = await env.DB.prepare("SELECT r.*,c.name AS client_name,p.name AS product_name,p.sub_name AS product_sub_name FROM product_reviews r JOIN clients c ON c.id=r.client_id JOIN products p ON p.id=r.product_id WHERE r.product_id=?1 ORDER BY r.created_at DESC").bind(productId).all();
    return json(rows.results.map(reviewResult));
  }
  return json({ error: "Not Found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/auth/")) {
      try {
        const authResponse = await customerAuth(request, env, url);
        if (authResponse) return authResponse;
      } catch {
        return privateJson({ error: "No se pudo completar el acceso." }, 400);
      }
      return privateJson({ error: "Not Found" }, 404);
    }
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
    if (url.pathname.startsWith("/api/customer/")) {
      try { return await customerData(request, env, url); }
      catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Solicitud inválida." }, 400); }
    }
    if (request.method === "GET" && url.pathname.startsWith("/api/catalog/")) return catalog(env, url.pathname, url);
    if (request.method === "GET" && url.pathname === "/api/migration/health") return json({ ok: true, data: "d1", media: "r2" }, 200);
    const communityResponse = await communityApi(request, env, url.pathname);
    if (communityResponse) return communityResponse;
    try {
      const orderResponse = await publicOrders(request, env, url.pathname);
      if (orderResponse) return orderResponse;
    } catch (error) {
      return privateJson({ error: error instanceof Error ? error.message : "Solicitud inválida." }, 400);
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "Not Found" }, 404);
    return env.ASSETS.fetch(request);
  },
};

export { mediaKey, productPayload, orderPayload };
