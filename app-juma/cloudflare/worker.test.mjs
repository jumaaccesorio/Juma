import test from "node:test";
import assert from "node:assert/strict";
import worker, { mediaKey } from "./worker.js";

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
