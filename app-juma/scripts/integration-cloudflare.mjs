import assert from "node:assert/strict";

const origin = process.env.JUMA_INTEGRATION_ORIGIN || "http://127.0.0.1:8788";
const adminCookieJar = { value: "" };
const customerCookie = "juma_customer_session=local-customer-session";

async function request(path, { cookieJar, cookie, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (typeof options.body === "object" && options.body !== null && !(options.body instanceof Uint8Array)) {
    headers.set("content-type", "application/json");
    options.body = JSON.stringify(options.body);
  }
  if (cookieJar?.value) headers.set("cookie", cookieJar.value);
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(`${origin}${path}`, { ...options, headers, redirect: "manual" });
  const setCookie = response.headers.get("set-cookie");
  if (cookieJar && setCookie) cookieJar.value = setCookie.split(";", 1)[0];
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path}: ${response.status} ${data?.error || ""}`);
  return data;
}

let category;
let client;
let product;
let finance;
let packaging;
let subscriber;
let review;
const orderIds = [];

try {
  const health = await request("/api/migration/health");
  assert.deepEqual(health, { ok: true, data: "d1", media: "r2" });
  const catalog = await request("/api/catalog/products");
  assert.equal(catalog.length, 222);
  assert.ok(catalog.every(item => Array.isArray(item.product_sizes)));
  assert.equal((await fetch(`${origin}/api/admin/catalog/products`)).status, 401);

  await request("/api/admin/login", { method: "POST", body: { user: "admin", password: "integration-only" }, cookieJar: adminCookieJar });
  assert.match(adminCookieJar.value, /^juma_admin_session=/);

  const marker = Date.now();
  category = await request("/api/admin/catalog/categories", { method: "POST", body: { name: `INTEGRATION ${marker}`, parentId: null }, cookieJar: adminCookieJar });
  client = await request("/api/admin/clients", { method: "POST", body: { name: "Cliente integración", email: `integration-${marker}@example.com`, phone: "3510000000" }, cookieJar: adminCookieJar });
  product = await request("/api/admin/catalog/products", { method: "POST", body: {
    name: "Producto integración", subName: "Prueba", size: "", categoryId: category.id,
    isFeatured: false, purchasePrice: 100, salePrice: 250, stock: 10, initialStock: 10,
    enabled: true, image: "/media/test.webp", imageThumb: "/media/test.webp",
    imageCard: "/media/test.webp", imageFull: "/media/test.webp", sourceUrl: "",
  }, cookieJar: adminCookieJar });
  await request(`/api/admin/catalog/products/${product.id}/sizes`, { method: "PUT", body: { sizes: [{ size: "S", stock: 4 }, { size: "M", stock: 6 }] }, cookieJar: adminCookieJar });

  const orderBody = { clientId: client.id, date: "2026-09-14", status: "PENDIENTE", items: [{ productId: product.id, quantity: 2, size: "M", unitSalePrice: 250, unitPurchasePrice: 100 }] };
  const order = await request("/api/admin/orders", { method: "POST", body: orderBody, cookieJar: adminCookieJar });
  orderIds.push(order.id);
  let savedProduct = (await request("/api/admin/catalog/products", { cookieJar: adminCookieJar })).find(item => item.id === product.id);
  assert.equal(savedProduct.stock, 10);
  await request(`/api/admin/orders/${order.id}`, { method: "PATCH", body: { status: "REALIZADO" }, cookieJar: adminCookieJar });
  savedProduct = (await request("/api/admin/catalog/products", { cookieJar: adminCookieJar })).find(item => item.id === product.id);
  assert.equal(savedProduct.stock, 8);
  assert.equal(savedProduct.sizes.find(item => item.size === "M").stock, 4);
  await request(`/api/admin/orders/${order.id}`, { method: "PATCH", body: { status: "PENDIENTE" }, cookieJar: adminCookieJar });
  savedProduct = (await request("/api/admin/catalog/products", { cookieJar: adminCookieJar })).find(item => item.id === product.id);
  assert.equal(savedProduct.stock, 10);
  assert.equal(savedProduct.sizes.find(item => item.size === "M").stock, 6);

  const customerOrder = await request("/api/orders", { method: "POST", body: { ...orderBody, clientId: 999999, status: "REALIZADO" }, cookie: customerCookie });
  orderIds.push(customerOrder.id);
  assert.equal(customerOrder.status, "PENDIENTE");

  await request(`/api/customer/favorites/${product.id}`, { method: "PUT", body: { favorite: true }, cookie: customerCookie });
  assert.ok((await request("/api/customer/favorites", { cookie: customerCookie })).some(item => item.productId === product.id));
  await request(`/api/customer/favorites/${product.id}`, { method: "PUT", body: { favorite: false }, cookie: customerCookie });

  review = await request("/api/customer/reviews", { method: "POST", body: { productId: product.id, rating: 5, comment: "Prueba local" }, cookie: customerCookie });
  assert.equal(review.rating, 5);
  assert.ok((await request(`/api/catalog/reviews?productId=${product.id}`)).some(item => item.id === review.id));

  finance = await request("/api/admin/finance", { method: "POST", body: { type: "EGRESO", description: "Prueba", detail: "Local", category: "Test", amount: 12.34, date: "2026-09-14" }, cookieJar: adminCookieJar });
  packaging = await request("/api/admin/packaging", { method: "POST", body: { name: "Caja prueba", unitCost: 3.5, quantity: 2 }, cookieJar: adminCookieJar });
  await request(`/api/admin/packaging/${packaging.id}`, { method: "PATCH", body: { quantity: 3 }, cookieJar: adminCookieJar });
  await request(`/api/admin/restock/${product.id}`, { method: "PUT", body: { requested: true, inCart: true, hidden: false, manual: true, quantity: 4 }, cookieJar: adminCookieJar });
  subscriber = await request("/api/community", { method: "POST", body: { email: `community-${marker}@example.com` } });

  const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
  const media = await request("/api/admin/media", { method: "POST", body: png, headers: { "content-type": "image/png", "x-juma-variant": "integration" }, cookieJar: adminCookieJar });
  assert.match(media.path, /^\/media\/products\/uploads\/integration\//);

  console.log(JSON.stringify({ ok: true, catalogProducts: catalog.length, atomicStock: true, customerSession: true, adminCrud: true, mediaUpload: true }));
} finally {
  for (const id of orderIds.reverse()) await request(`/api/admin/orders/${id}`, { method: "DELETE", cookieJar: adminCookieJar }).catch(() => {});
  if (review) await request(`/api/admin/reviews/${review.id}`, { method: "DELETE", cookieJar: adminCookieJar }).catch(() => {});
  if (subscriber) await request(`/api/admin/community/${subscriber.id}`, { method: "DELETE", cookieJar: adminCookieJar }).catch(() => {});
  if (finance) await request(`/api/admin/finance/${finance.id}`, { method: "DELETE", cookieJar: adminCookieJar }).catch(() => {});
  if (packaging) await request(`/api/admin/packaging/${packaging.id}`, { method: "DELETE", cookieJar: adminCookieJar }).catch(() => {});
  if (product) await request(`/api/admin/catalog/products/${product.id}`, { method: "DELETE", cookieJar: adminCookieJar }).catch(() => {});
  if (client) await request(`/api/admin/clients/${client.id}`, { method: "DELETE", cookieJar: adminCookieJar }).catch(() => {});
  if (category) await request(`/api/admin/catalog/categories/${category.id}`, { method: "DELETE", cookieJar: adminCookieJar }).catch(() => {});
}
