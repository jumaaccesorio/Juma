import test from "node:test";
import assert from "node:assert/strict";
import { scheduleDiscordOrder } from "./discord.js";

const order = { guestName: "@everyone", date: "2026-10-01", status: "PENDIENTE", items: [{ productId: 8, quantity: 2, unitSalePriceCents: 150000, size: "M" }] };
const DB = {
  prepare(sql) {
    assert.match(sql, /SELECT id,name FROM products/);
    return { bind(...ids) {
      assert.deepEqual(ids, [8]);
      return { async all() { return { results: [{ id: 8, name: "Aros de plata" }] }; } };
    } };
  },
};

test("Discord se ejecuta en segundo plano y bloquea menciones", async t => {
  let payload;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url.searchParams.get("wait"), "true");
    assert.equal(options.redirect, "manual");
    payload = JSON.parse(options.body);
    return new Response('{"id":"test-message"}', { status: 200 });
  });
  let pending;
  await scheduleDiscordOrder({ DB, DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/123/test-token" }, { waitUntil(promise) { pending = promise; } }, 42, order);
  await pending;
  assert.deepEqual(payload.allowed_mentions, { parse: [] });
  assert.equal(payload.embeds[0].title, "Nuevo pedido #42");
  assert.match(payload.embeds[0].fields.find(field => field.name === "Total").value, /3\.000/);
  assert.equal(payload.embeds[0].fields.find(field => field.name === "Artículos").value, "2 × Aros de plata (M)");
});

test("sin secreto no envía; un error de Discord no rechaza el pedido", async t => {
  const mock = t.mock.method(globalThis, "fetch", async () => { throw new Error("network failure"); });
  t.mock.method(console, "error", () => {});
  await scheduleDiscordOrder({}, null, 42, order);
  assert.equal(mock.mock.callCount(), 0);
  await assert.doesNotReject(scheduleDiscordOrder({ DB, DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/123/test-token" }, null, 42, order));
  assert.equal(mock.mock.callCount(), 1);
});
