import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectUrl = 'https://ezpbabxossevlheftgcu.supabase.co';
const tables = [
  'categories','clients','products','product_sizes','orders','order_items','favorites',
  'restock_cart_items','finance_expenses','hero_banner','featured_panels',
  'packaging_costs','community_subscribers'
  ,'product_reviews','app_settings'
];
const imageColumns = {
  products: ['image','image_thumb','image_card','image_full'],
  hero_banner: ['image'],
  featured_panels: ['image'],
};

function parseEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

async function request(url, options = {}) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(60_000) });
    if ((response.status === 429 || response.status >= 500) && attempt < 5) {
      await response.arrayBuffer();
      const retryAfter = Number(response.headers.get('retry-after'));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * (2 ** attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    return response;
  }
  throw new Error('No se pudo completar la solicitud.');
}

async function readTable(table, headers) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const orderColumn = table === 'app_settings' ? 'key' : 'id';
    const url = `${projectUrl}/rest/v1/${table}?select=*&order=${orderColumn}.asc&limit=1000&offset=${offset}`;
    const response = await request(url, { headers });
    if (!response.ok) throw new Error(`No se pudo leer ${table}: HTTP ${response.status}`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error(`Respuesta inválida para ${table}.`);
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

function storageName(value) {
  if (typeof value !== 'string' || !value) return null;
  const prefix = `${projectUrl}/storage/v1/object/public/products/`;
  if (!value.startsWith(prefix)) return null;
  try {
    const name = value.slice(prefix.length).split('/').map(decodeURIComponent).join('/');
    return !name || name.split('/').some(part => part === '.' || part === '..') ? null : name;
  } catch {
    return null;
  }
}

async function inspectObject(name) {
  const encoded = name.split('/').map(encodeURIComponent).join('/');
  const response = await request(`${projectUrl}/storage/v1/object/public/products/${encoded}`, { method: 'HEAD' });
  if (!response.ok) throw new Error(`No se pudo verificar products/${name}: HTTP ${response.status}`);
  return {
    bucket: 'products',
    name,
    metadata: {
      eTag: response.headers.get('etag'),
      size: Number(response.headers.get('content-length')),
      mimetype: response.headers.get('content-type') || 'application/octet-stream',
      cacheControl: response.headers.get('cache-control') || 'public, max-age=3600',
    },
  };
}

const root = fileURLToPath(new URL('../../', import.meta.url));
const envFiles = ['.env.local', '.env.production'];
let env = null;
for (const file of envFiles) {
  try {
    const candidate = parseEnv(await readFile(path.join(root, file), 'utf8'));
    if (candidate.VITE_SUPABASE_URL === projectUrl) {
      env = candidate;
      break;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
if (!env) throw new Error('No se encontró una configuración local para el proyecto Supabase de JUMA.');
if (!env.VITE_SUPABASE_PUBLISHABLE_KEY) throw new Error('Falta VITE_SUPABASE_PUBLISHABLE_KEY.');
const headers = { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}` };
const warnings = [];
const tableEntries = await Promise.all(tables.map(async table => {
  try {
    return [table, await readTable(table, headers)];
  } catch (error) {
    if (table === 'community_subscribers' && /HTTP (401|403)/.test(error.message)) {
      warnings.push(`${table}: sin permiso de lectura con la clave pública; no se sincroniza.`);
      return [table, []];
    }
    throw error;
  }
}));
const tableData = Object.fromEntries(tableEntries);
const names = new Set();
for (const [table, columns] of Object.entries(imageColumns)) {
  for (const row of tableData[table]) for (const column of columns) {
    const name = storageName(row[column]);
    if (name) names.add(name);
  }
}
const migrationRoot = path.join(root, 'migration-data');
const previousStorage = new Map();
try {
  const snapshotFiles = (await readdir(migrationRoot, { withFileTypes: true }))
    .filter(entry => entry.isFile() && /^snapshot-.*\.json$/.test(entry.name))
    .map(entry => entry.name)
    .sort()
    .reverse();
  const previous = snapshotFiles.length
    ? JSON.parse(await readFile(path.join(migrationRoot, snapshotFiles[0]), 'utf8'))
    : { storage: [] };
  for (const item of previous.storage ?? []) if (item.bucket === 'products') previousStorage.set(item.name, item);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const storage = [...previousStorage.values()];
const pendingNames = [...names].sort();
const unknownNames = [];
for (const name of pendingNames) {
  const previous = previousStorage.get(name);
  if (!previous) unknownNames.push(name);
}
let storageIndex = 0;
await Promise.all(Array.from({ length: 2 }, async () => {
  while (storageIndex < unknownNames.length) {
    const name = unknownNames[storageIndex];
    storageIndex += 1;
    storage.push(await inspectObject(name));
  }
}));
storage.sort((left, right) => left.name.localeCompare(right.name));
const snapshot = {
  formatVersion: 1,
  sourceUrl: projectUrl,
  exportedAt: new Date().toISOString(),
  authExported: false,
  authUserCount: null,
  tables: tableData,
  storage,
  warnings,
};
const outputDir = migrationRoot;
await mkdir(outputDir, { recursive: true });
const stamp = snapshot.exportedAt.replace(/[:.]/g, '-');
const output = path.join(outputDir, `snapshot-${stamp}.json`);
await writeFile(output, JSON.stringify(snapshot, null, 2));
console.log(JSON.stringify({ output, exportedAt: snapshot.exportedAt, counts: Object.fromEntries(tableEntries.map(([table, rows]) => [table, rows.length])), referencedStorageObjects: storage.length, newStorageObjects: unknownNames.length, warnings }, null, 2));
