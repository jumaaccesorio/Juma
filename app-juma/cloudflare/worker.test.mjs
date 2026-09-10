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
