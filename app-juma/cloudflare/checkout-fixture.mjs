import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

// Local-only D1 adapter: executes the real schema and SQL with atomic SQLite batches.
export function checkoutFixture() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys=ON");
  const migrations = new URL("./migrations/", import.meta.url);
  for (const name of readdirSync(migrations).filter(name => name.endsWith(".sql")).sort()) sqlite.exec(readFileSync(new URL(name, migrations), "utf8"));
  sqlite.exec(`INSERT INTO categories(id,name) VALUES(1,'Plata 925');
    INSERT INTO products(id,name,category_id,sale_price_cents,purchase_price_cents,stock,is_featured,enabled) VALUES(1,'Aros de prueba',1,550000,100000,10,1,1),(2,'Anillo por encargo',1,700000,100000,0,1,1);
    INSERT INTO clients(id,name,email,phone) VALUES(1,'Cliente de prueba','cliente@example.com','3510000000'),(2,'Otro cliente','otro@example.com','3510000001');
    INSERT INTO auth_users(id,provider_sub,email,name,client_id) VALUES('local-user','local-provider','cliente@example.com','Cliente de prueba',1);`);
  const token = "checkout-local-customer";
  sqlite.prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").run(createHash("sha256").update(token).digest("base64url"), "local-user", "2099-01-01T00:00:00.000Z");
  const prepare = sql => {
    let values = [];
    const execute = () => {
      const statement = sqlite.prepare(sql);
      // node:sqlite uses named parameters for D1's ?1 placeholders.
      const numbered = /\?\d+/.test(sql);
      const args = numbered ? [Object.fromEntries(values.map((value, i) => [String(i + 1), value]))] : values;
      const results = statement.columns().length ? statement.all(...args) : [];
      const changes = statement.columns().length ? 0 : statement.run(...args).changes;
      return { results, success: true, meta: { changes } };
    };
    return {
      bind(...params) { values = params; return this; },
      async first() { return execute().results[0] ?? null; },
      async all() { return execute(); },
      async run() { return execute(); },
      execute,
    };
  };
  const DB = { prepare, async batch(statements) {
    sqlite.exec("BEGIN");
    try { const result = statements.map(statement => statement.execute()); sqlite.exec("COMMIT"); return result; }
    catch (error) { sqlite.exec("ROLLBACK"); throw error; }
  } };
  return { sqlite, env: { DB, ADMIN_PASSWORD: "local-checkout-only", ADMIN_SESSION_SECRET: "local-checkout-test-secret-at-least-32-characters" }, cookie: `juma_customer_session=${token}` };
}
