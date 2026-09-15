import test from "node:test";
import assert from "node:assert/strict";
import worker, { clientEmailForStorage, mediaKey, productPayload, orderPayload } from "./worker.js";

test("mediaKey acepta rutas válidas y bloquea traversal", () => {
  assert.equal(mediaKey("/media/products/products/thumbs/a.webp"), "products/products/thumbs/a.webp");
  assert.equal(mediaKey("/media/products/%2E%2E/secret"), null);
  assert.equal(mediaKey("/media/products\\secret"), null);
});

test("health responde sin consultar datos", async () => {
  const response = await worker.fetch(new Request("https://juma.test/api/migration/health"), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, data: "d1", media: "r2" });
});

test("admin inicia y valida una sesión firmada", async () => {
  const env = { ADMIN_PASSWORD: "clave-prueba", ADMIN_SESSION_SECRET: "secreto-de-prueba-suficientemente-largo" };
  const login = await worker.fetch(new Request("https://juma.test/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user: "admin", password: "clave-prueba" }),
  }), env);
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/);

  const session = await worker.fetch(new Request("https://juma.test/api/admin/session", {
    headers: { cookie: cookie.split(";")[0] },
  }), env);
  assert.deepEqual(await session.json(), { authenticated: true });
});

test("admin rechaza credenciales incorrectas", async () => {
  const response = await worker.fetch(new Request("https://juma.test/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user: "admin", password: "incorrecta" }),
  }), { ADMIN_PASSWORD: "clave-prueba", ADMIN_SESSION_SECRET: "secreto-de-prueba-suficientemente-largo" });
  assert.equal(response.status, 401);
});

test("la API de datos administrativos exige una sesión válida", async () => {
  const response = await worker.fetch(new Request("https://juma.test/api/admin/catalog/products"), {
    ADMIN_SESSION_SECRET: "secreto-de-prueba-suficientemente-largo",
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Sesión administrativa requerida." });
});

test("normaliza y valida productos antes de escribir en D1", () => {
  const payload = productPayload({
    name: "  Aro nuevo  ",
    subName: "Plata",
    categoryId: 3,
    isFeatured: true,
    purchasePrice: 123.45,
    salePrice: 250,
    stock: 4,
    enabled: true,
  });
  assert.equal(payload.name, "Aro nuevo");
  assert.equal(payload.purchase_price_cents, 12345);
  assert.equal(payload.sale_price_cents, 25000);
  assert.equal(payload.stock, 4);
  assert.equal(payload.is_featured, 1);
  assert.throws(() => productPayload({ name: "", salePrice: -1 }), /obligatorio|inválido/);
});

test("valida pedidos antes de ejecutar el lote atómico", () => {
  const order = orderPayload({
    clientId: 7,
    date: "2026-09-14",
    status: "REALIZADO",
    items: [{ productId: 10, quantity: 2, size: "M", unitSalePrice: 1500, unitPurchasePrice: 700 }],
  });
  assert.equal(order.items[0].unitSalePriceCents, 150000);
  assert.equal(order.status, "REALIZADO");
  assert.throws(() => orderPayload({ clientId: 7, date: "14/09/2026", status: "REALIZADO", items: [] }), /Fecha|artículo/);
  assert.throws(() => orderPayload({ clientId: 7, date: "2026-09-14", status: "REALIZADO", items: [
    { productId: 10, quantity: 1, unitSalePrice: 1, unitPurchasePrice: 1 },
    { productId: 10, quantity: 1, unitSalePrice: 1, unitPurchasePrice: 1 },
  ] }), /repetidos/);
  const walkInOrder = orderPayload({ date: "2026-09-14", status: "REALIZADO", items: [
    { productId: 10, quantity: 1, unitSalePrice: 1, unitPurchasePrice: 1 },
  ] }, { requireBuyer: false });
  assert.equal(walkInOrder.clientId, null);
  assert.throws(() => orderPayload({ date: "2026-09-14", status: "PENDIENTE", items: [
    { productId: 10, quantity: 1, unitSalePrice: 1, unitPurchasePrice: 1 },
  ] }), /cliente|comprador/i);
});

test("permite clientes administrativos sin email real", () => {
  assert.match(clientEmailForStorage(""), /^cliente-.+@sin-email\.juma\.invalid$/);
  assert.equal(clientEmailForStorage(" CLIENTE@EJEMPLO.COM "), "cliente@ejemplo.com");
  assert.throws(() => clientEmailForStorage("email-invalido"), /Email inválido/);
});

test("auth de Cloudflare falla de forma explícita hasta configurar Google", async () => {
  const start = await worker.fetch(new Request("https://juma.test/api/auth/google/start"), {});
  assert.equal(start.status, 503);
  assert.match((await start.json()).error, /Google/);
  const session = await worker.fetch(new Request("https://juma.test/api/auth/session"), {});
  assert.deepEqual(await session.json(), { authenticated: false });
});
