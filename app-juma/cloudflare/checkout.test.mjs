import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import worker from "./worker.js";
import { deliveryPayload } from "./checkout.js";
import { checkoutFixture } from "./checkout-fixture.mjs";

const delivery = { name: " Ana Prueba ", email: "ana@example.com", phone: "+54 351 0000000", street: "Calle de prueba", streetNumber: "123", apartment: "2 A", city: "Córdoba", province: "Córdoba", postalCode: "5000", notes: "Puerta de prueba" };
const body = () => ({ delivery, requestId: randomUUID(), date: "2026-10-04", status: "REALIZADO", clientId: 2, items: [{ productId: 1, quantity: 1, unitSalePrice: 1, unitPurchasePrice: 0 }] });
const post = (env, payload, cookie) => worker.fetch(new Request("https://juma.test/api/orders", { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(payload) }), env);

test("checkout exige dirección y contacto válidos sin escribir un pedido", async () => {
  const { env, sqlite } = checkoutFixture();
  for (const missing of ["phone", "street", "city", "province", "postalCode"]) {
    const response = await post(env, { ...body(), delivery: { ...delivery, [missing]: " " } });
    assert.equal(response.status, 400);
  }
  assert.throws(() => deliveryPayload({ ...delivery, email: "no-es-email" }), /correo/);
  assert.throws(() => deliveryPayload({ ...delivery, phone: "123" }), /teléfono/);
  assert.throws(() => deliveryPayload({ ...delivery, street: "x".repeat(161) }), /datos/);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM orders").get().n, 0);
  sqlite.close();
});

test("pedido invitado guarda entrega, precio real y estado pendiente; reintentos no duplican", async () => {
  const { env, sqlite } = checkoutFixture();
  const payload = body();
  const response = await post(env, payload);
  assert.equal(response.status, 201, await response.clone().text());
  const order = await response.json();
  assert.equal(order.status, "PENDIENTE");
  assert.equal(order.clientId, null);
  assert.equal(order.guestName, "Ana Prueba");
  assert.equal(order.items[0].unitSalePrice, 5500);
  assert.equal(order.items[0].unitPurchasePrice, undefined);
  assert.equal(JSON.parse(sqlite.prepare("SELECT delivery_json FROM orders WHERE id=?").get(order.id).delivery_json).city, "Córdoba");
  const retry = await post(env, payload);
  assert.equal((await retry.json()).id, order.id);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM orders").get().n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM order_items").get().n, 1);
  const conflict = await post(env, { ...payload, delivery: { ...delivery, streetNumber: "456" } });
  assert.equal(conflict.status, 409);
  assert.equal(sqlite.prepare("SELECT stock FROM products WHERE id=1").get().stock, 10);
  const login = await worker.fetch(new Request("https://juma.test/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user: "admin", password: env.ADMIN_PASSWORD }) }), env);
  const adminCookie = login.headers.get("set-cookie").split(";")[0];
  const adminList = await worker.fetch(new Request("https://juma.test/api/admin/orders", { headers: { cookie: adminCookie } }), env);
  const saved = (await adminList.json())[0];
  assert.equal(saved.delivery.phone, delivery.phone);
  assert.equal(saved.delivery.postalCode, "5000");
  sqlite.close();
});

test("envíos concurrentes del mismo pedido solo insertan una cabecera y sus artículos", async () => {
  const { env, sqlite } = checkoutFixture();
  const payload = body();
  const responses = await Promise.all(Array.from({ length: 5 }, () => post(env, payload)));
  const orders = await Promise.all(responses.map(response => response.json()));
  assert.ok(responses.every(response => response.ok), JSON.stringify(orders));
  assert.equal(new Set(orders.map(order => order.id)).size, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM orders").get().n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM order_items").get().n, 1);
  // A retry crossing midnight still returns the original order.
  const nextDay = await post(env, { ...payload, date: "2026-10-05" });
  assert.equal((await nextDay.json()).id, orders[0].id);
  sqlite.close();
});

test("un producto eliminado no deja un pedido parcialmente guardado", async () => {
  const { env, sqlite } = checkoutFixture();
  const response = await post(env, { ...body(), items: [{ productId: 999, quantity: 1, unitSalePrice: 1, unitPurchasePrice: 0 }] });
  assert.equal(response.status, 400);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM orders").get().n, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM order_items").get().n, 0);
  sqlite.close();
});

test("Mi cuenta solo devuelve pedidos de la sesión autenticada con dirección y sin costos", async () => {
  const { env, sqlite, cookie } = checkoutFixture();
  const response = await post(env, body(), cookie);
  assert.equal(response.status, 201, await response.clone().text());
  const order = await response.json();
  assert.equal(order.clientId, 1); // Ignore forged clientId=2.
  await post(env, body()); // Another buyer, never visible in this account.
  const history = await worker.fetch(new Request("https://juma.test/api/customer/orders", { headers: { cookie } }), env);
  const orders = await history.json();
  assert.equal(history.status, 200);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].delivery.streetNumber, "123");
  assert.equal(orders[0].items[0].unitPurchasePrice, undefined);
  assert.equal((await worker.fetch(new Request("https://juma.test/api/customer/orders"), env)).status, 401);
  sqlite.close();
});

test("pedidos por encargo se reciben pendientes sin restar stock", async () => {
  const { env, sqlite } = checkoutFixture();
  const response = await post(env, { ...body(), items: [{ productId: 2, quantity: 1, unitSalePrice: 7000, unitPurchasePrice: 0 }] });
  assert.equal(response.status, 201, await response.clone().text());
  assert.equal(sqlite.prepare("SELECT stock FROM products WHERE id=2").get().stock, 0);
  sqlite.close();
});
