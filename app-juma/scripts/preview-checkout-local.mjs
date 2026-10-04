import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import worker from "../cloudflare/worker.js";
import { checkoutFixture } from "../cloudflare/checkout-fixture.mjs";

// Isolated manual QA: in-memory database, fake users, no external notifications.
const { env, cookie } = checkoutFixture();
const dist = path.resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
env.ASSETS = { async fetch(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  let asset = path.resolve(dist, `.${pathname}`);
  if (!asset.startsWith(dist + path.sep) || !path.extname(asset)) asset = path.join(dist, "index.html");
  try {
    const data = await readFile(asset);
    const type = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp" }[path.extname(asset)] || "application/octet-stream";
    return new Response(data, { headers: { "content-type": type, "cache-control": "no-store" } });
  } catch { return new Response("Not found", { status: 404 }); }
} };

createServer(async (incoming, outgoing) => {
  try {
    if (incoming.url === "/__test") {
      outgoing.setHeader("content-type", "text/html; charset=utf-8");
      outgoing.end('<h1>Prueba local de checkout</h1><p>Base de datos ficticia, sin pagos ni notificaciones.</p><a href="/__test/login">Usar cliente de prueba</a><br><a href="/__test/guest">Comprar como invitado</a>'); return;
    }
    if (["/__test/login", "/__test/guest"].includes(incoming.url)) {
      outgoing.writeHead(302, { location: "/", "set-cookie": incoming.url.endsWith("login") ? `${cookie}; Path=/; HttpOnly; SameSite=Lax` : "juma_customer_session=; Path=/; Max-Age=0" }); outgoing.end(); return;
    }
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const request = new Request(`http://127.0.0.1:3010${incoming.url}`, { method: incoming.method, headers: incoming.headers, ...(!["GET", "HEAD"].includes(incoming.method) ? { body: Buffer.concat(chunks) } : {}) });
    const response = await worker.fetch(request, env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { outgoing.writeHead(500); outgoing.end(String(error)); }
}).listen(3010, "127.0.0.1", () => console.log("Checkout local: http://127.0.0.1:3010/__test (datos ficticios en memoria)"));
