import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import multer from "multer";
import bcrypt from "bcryptjs";
import { run, get, all, initDb } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const PUBLIC_APP_URL = (
  process.env.PUBLIC_APP_URL ??
  process.env.RENDER_EXTERNAL_URL ??
  `http://localhost:${PORT}`
).replace(/\/$/, "");
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const uploadsDir = path.resolve("uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
    const safeBase = base.slice(0, 50) || "file";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origen no permitido por CORS."));
  },
}));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// -- HEALTH --
app.get("/health", (_req, res) => res.json({ ok: true, service: "juma-server" }));
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "juma-server",
    health: "/health",
    api: "/api",
  });
});

// ============================================================
// AUTH
// ============================================================
app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Faltan campos requeridos." });
    const existing = await get("SELECT id FROM clients WHERE email = ?", [email]);
    if (existing) return res.status(409).json({ error: "El email ya estÃ¡ registrado." });
    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      "INSERT INTO clients (name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
      [name, email, phone || "", hash]
    );
    const client = await get("SELECT id, name, email, phone, created_at FROM clients WHERE id = ?", [result.lastID]);
    res.status(201).json({ client });
  } catch (e) { next(e); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const client = await get("SELECT * FROM clients WHERE email = ?", [email]);
    if (!client) return res.status(401).json({ error: "Email o contraseÃ±a incorrectos." });
    const valid = await bcrypt.compare(password, client.password_hash || "");
    if (!valid) return res.status(401).json({ error: "Email o contraseÃ±a incorrectos." });
    const { password_hash, ...safe } = client;
    res.json({ client: safe });
  } catch (e) { next(e); }
});

// ============================================================
// CATEGORIES
// ============================================================
app.get("/api/categories", async (_req, res, next) => {
  try {
    const rows = await all("SELECT * FROM categories ORDER BY name ASC");
    res.json(rows);
  } catch (e) { next(e); }
});

app.post("/api/categories", async (req, res, next) => {
  try {
    const { name, parentId } = req.body;
    const result = await run("INSERT INTO categories (name, parent_id) VALUES (?, ?)", [name, parentId ?? null]);
    const row = await get("SELECT * FROM categories WHERE id = ?", [result.lastID]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

app.delete("/api/categories/:id", async (req, res, next) => {
  try {
    await run("DELETE FROM categories WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================
// CLIENTS
// ============================================================
app.get("/api/clients", async (_req, res, next) => {
  try {
    const rows = await all("SELECT id, name, email, phone, created_at FROM clients ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { next(e); }
});

app.post("/api/clients", async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const result = await run("INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)", [name, email, phone || ""]);
    const row = await get("SELECT id, name, email, phone, created_at FROM clients WHERE id = ?", [result.lastID]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

app.patch("/api/clients/:id", async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const fields = [], vals = [];
    if (name !== undefined)  { fields.push("name = ?");  vals.push(name); }
    if (email !== undefined) { fields.push("email = ?"); vals.push(email); }
    if (phone !== undefined) { fields.push("phone = ?"); vals.push(phone); }
    if (!fields.length) return res.status(400).json({ error: "Nada que actualizar." });
    vals.push(req.params.id);
    await run(`UPDATE clients SET ${fields.join(", ")} WHERE id = ?`, vals);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.delete("/api/clients/:id", async (req, res, next) => {
  try {
    await run("DELETE FROM clients WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================
// PRODUCTS
// ============================================================
app.get("/api/products", async (_req, res, next) => {
  try {
    const rows = await all(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (e) { next(e); }
});

app.post("/api/products", async (req, res, next) => {
  try {
    const { name, categoryId, isFeatured, purchasePrice, salePrice, stock, initialStock, enabled, image, sourceUrl } = req.body;
    const result = await run(
      `INSERT INTO products (name, category_id, is_featured, purchase_price, sale_price, stock, initial_stock, enabled, image, source_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, categoryId ?? null, isFeatured ? 1 : 0, purchasePrice, salePrice, stock, initialStock ?? stock, enabled ? 1 : 0, image ?? "", sourceUrl ?? ""]
    );
    const row = await get("SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?", [result.lastID]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

app.patch("/api/products/:id", async (req, res, next) => {
  try {
    const fields = [];
    const vals = [];
    const allowed = { stock: "stock", enabled: "enabled", image: "image", is_featured: "isFeatured", category_id: "categoryId", name: "name", sale_price: "salePrice", purchase_price: "purchasePrice" };
    const body = req.body;
    if (body.stock !== undefined)        { fields.push("stock = ?");           vals.push(body.stock); }
    if (body.enabled !== undefined)      { fields.push("enabled = ?");         vals.push(body.enabled ? 1 : 0); }
    if (body.image !== undefined)        { fields.push("image = ?");           vals.push(body.image); }
    if (body.isFeatured !== undefined)   { fields.push("is_featured = ?");     vals.push(body.isFeatured ? 1 : 0); }
    if (body.categoryId !== undefined)   { fields.push("category_id = ?");     vals.push(body.categoryId); }
    if (body.name !== undefined)         { fields.push("name = ?");            vals.push(body.name); }
    if (body.salePrice !== undefined)    { fields.push("sale_price = ?");      vals.push(body.salePrice); }
    if (body.purchasePrice !== undefined){ fields.push("purchase_price = ?");  vals.push(body.purchasePrice); }
    if (!fields.length) return res.status(400).json({ error: "Nada que actualizar." });
    vals.push(req.params.id);
    await run(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, vals);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================
// ORDERS
// ============================================================
app.get("/api/orders", async (_req, res, next) => {
  try {
    const orders = await all("SELECT * FROM orders ORDER BY date DESC");
    for (const o of orders) {
      o.items = await all("SELECT * FROM order_items WHERE order_id = ?", [o.id]);
    }
    res.json(orders);
  } catch (e) { next(e); }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const { clientId, guestName, guestEmail, guestPhone, date, status, items } = req.body;
    const result = await run(
      "INSERT INTO orders (client_id, guest_name, guest_email, guest_phone, date, status) VALUES (?, ?, ?, ?, ?, ?)",
      [clientId ?? null, guestName ?? null, guestEmail ?? null, guestPhone ?? null, date, status || "PENDIENTE"]
    );
    const orderId = result.lastID;
    for (const item of items) {
      await run(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_sale_price, unit_purchase_price) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.productId, item.quantity, item.unitSalePrice, item.unitPurchasePrice]
      );
    }
    const order = await get("SELECT * FROM orders WHERE id = ?", [orderId]);
    order.items = await all("SELECT * FROM order_items WHERE order_id = ?", [orderId]);
    res.status(201).json(order);
  } catch (e) { next(e); }
});

app.patch("/api/orders/:id/status", async (req, res, next) => {
  try {
    await run("UPDATE orders SET status = ? WHERE id = ?", [req.body.status, req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================
// FAVORITES
// ============================================================
app.get("/api/favorites/:clientId", async (req, res, next) => {
  try {
    const rows = await all("SELECT * FROM favorites WHERE client_id = ?", [req.params.clientId]);
    res.json(rows);
  } catch (e) { next(e); }
});

app.post("/api/favorites", async (req, res, next) => {
  try {
    const { clientId, productId } = req.body;
    await run("INSERT OR IGNORE INTO favorites (client_id, product_id) VALUES (?, ?)", [clientId, productId]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.delete("/api/favorites", async (req, res, next) => {
  try {
    const { clientId, productId } = req.body;
    await run("DELETE FROM favorites WHERE client_id = ? AND product_id = ?", [clientId, productId]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================
// HERO BANNER
// ============================================================
app.get("/api/hero-banner", async (_req, res, next) => {
  try {
    const row = await get("SELECT * FROM hero_banner WHERE id = 1");
    res.json(row);
  } catch (e) { next(e); }
});

app.patch("/api/hero-banner", async (req, res, next) => {
  try {
    const { tag, title, subtitle, image } = req.body;
    await run("UPDATE hero_banner SET tag = COALESCE(?, tag), title = COALESCE(?, title), subtitle = COALESCE(?, subtitle), image = COALESCE(?, image) WHERE id = 1",
      [tag ?? null, title ?? null, subtitle ?? null, image ?? null]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================
// FEATURED PANELS
// ============================================================
app.get("/api/featured-panels", async (_req, res, next) => {
  try {
    const rows = await all("SELECT * FROM featured_panels");
    res.json(rows);
  } catch (e) { next(e); }
});

app.patch("/api/featured-panels/:id", async (req, res, next) => {
  try {
    const { title, cta, image, className, categoryId } = req.body;
    const fields = [], vals = [];
    if (title !== undefined)      { fields.push("title = ?");      vals.push(title); }
    if (cta !== undefined)        { fields.push("cta = ?");        vals.push(cta); }
    if (image !== undefined)      { fields.push("image = ?");      vals.push(image); }
    if (className !== undefined)  { fields.push("class_name = ?"); vals.push(className); }
    if (categoryId !== undefined) { fields.push("category_id = ?"); vals.push(categoryId); }
    if (!fields.length) return res.status(400).json({ error: "Nada que actualizar." });
    vals.push(req.params.id);
    await run(`UPDATE featured_panels SET ${fields.join(", ")} WHERE id = ?`, vals);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.post("/api/featured-panels", async (req, res, next) => {
  try {
    const { id, title, cta, image, className } = req.body;
    await run("INSERT INTO featured_panels (id, title, cta, image, class_name) VALUES (?, ?, ?, ?, ?)",
      [id, title, cta || "Mira mas", image || "", className]);
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

app.delete("/api/featured-panels/:id", async (req, res, next) => {
  try {
    await run("DELETE FROM featured_panels WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================
// FILE UPLOAD
// ============================================================
app.post("/api/files", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibiÃ³ archivo." });
    const url = `${PUBLIC_APP_URL}/uploads/${req.file.filename}`;
    res.status(201).json({ url, filename: req.file.filename });
  } catch (e) { next(e); }
});

// ============================================================
// ERROR HANDLER
// ============================================================
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.message === "Origen no permitido por CORS.") {
    res.status(403).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: "Error interno del servidor." });
});

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => console.log(`Juma Server corriendo en ${PUBLIC_APP_URL}`));
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error);
    process.exit(1);
  }
}

start();

