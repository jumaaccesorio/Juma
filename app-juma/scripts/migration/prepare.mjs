import { DatabaseSync } from 'node:sqlite';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const schema = readFileSync(new URL('../../cloudflare/migrations/0001_application.sql',import.meta.url),'utf8');
export const tables = ['categories','clients','products','product_sizes','orders','order_items','favorites','restock_cart_items','finance_expenses','hero_banner','featured_panels','packaging_costs','community_subscribers'];
const money = new Set(['purchase_price','sale_price','unit_sale_price','unit_purchase_price','amount','unit_cost']);
const images = {products:['image','image_thumb','image_card','image_full'],hero_banner:['image'],featured_panels:['image']};
export const hash = value => createHash('sha256').update(value).digest('hex');

export function parseSnapshot(input) {
 let text = input.replace(/^\uFEFF/,'').trim();
 if (/^snapshot\r?\n/.test(text)) {
  text = text.slice(text.indexOf('\n')+1).trim();
  if (!text.startsWith('"') || !text.endsWith('"')) throw new Error('CSV inválido: se espera una sola celda snapshot.');
  text = text.slice(1,-1).replaceAll('""','"');
 }
 let parsed = JSON.parse(text);
 if (Array.isArray(parsed) && parsed.length===1) parsed=parsed[0].snapshot;
 if (parsed?.snapshot) parsed=parsed.snapshot;
 if (typeof parsed==='string') parsed=JSON.parse(parsed);
 if (parsed?.formatVersion!==1 || !parsed.tables || !Array.isArray(parsed.storage)) throw new Error('Snapshot incompleto. Usá export-supabase.sql.');
 return parsed;
}
export function cents(value) {
 const match=/^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
 if (!match) throw new Error('Importe inválido o con más de dos decimales.');
 const n=(BigInt(match[2])*100n+BigInt((match[3]??'').padEnd(2,'0')))*(match[1]?-1n:1n);
 const result=Number(n);
 if (!Number.isSafeInteger(result)) throw new Error('Importe fuera del rango seguro.');
 return result;
}
function literal(v) {
 if (v===null) return 'NULL';
 if (typeof v==='boolean') return v?'1':'0';
 if (typeof v==='number' && Number.isSafeInteger(v)) return String(v);
 if (typeof v==='string' && !v.includes('\0')) return `'${v.replaceAll("'","''")}'`;
 throw new Error('Tipo de dato no soportado o número fuera del rango seguro.');
}
export function prepare(snapshot) {
 if (snapshot.sourceUrl!=='https://ezpbabxossevlheftgcu.supabase.co') throw new Error('El proyecto de origen no coincide con la configuración de JUMA.');
 const db=new DatabaseSync(':memory:');
 const statements=['PRAGMA defer_foreign_keys = ON;'];
 const upsertStatements=['PRAGMA defer_foreign_keys = ON;'];
 const assets=new Map();
 const imageReferences=new Set();
 const counts={};
 const totals={};
 try {
  db.exec(schema);
  for (const table of tables) {
   const rows=snapshot.tables[table];
   if (!Array.isArray(rows)) throw new Error(`Falta la tabla ${table}.`);
   const columns=new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(c=>c.name));
   counts[table]=rows.length;
   for (const source of rows) {
    if (source.id===null || source.id===undefined) throw new Error(`Falta id en ${table}.`);
    const row={};
    for (let [name,value] of Object.entries(source)) {
     if (money.has(name)) { name+='_cents'; value=cents(value); }
     if (!columns.has(name)) throw new Error(`Columna sin migrar: ${table}.${name}.`);
     if (images[table]?.includes(name) && value) {
      if (typeof value!=='string') throw new Error('Referencia de imagen inválida.');
      if (value.startsWith('data:')) {
       const m=/^data:(image\/[\w.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(value);
       if (!m) throw new Error(`Imagen embebida no admitida: ${table}/${source.id}`);
       const bytes=Buffer.from(m[2],'base64');
       if (bytes.toString('base64').replace(/=+$/,'')!==m[2].replace(/\s/g,'').replace(/=+$/,'')) throw new Error('Imagen base64 dañada.');
       const sha=hash(bytes);
       assets.set(sha,{sha256:sha,bytes,contentType:m[1],r2Key:`imports/${sha}`});
       value=`/media/imports/${sha}`;
      } else imageReferences.add(value);
     }
     row[name]=value;
    }
    const names=Object.keys(row);
    const sql=`INSERT INTO ${table} (${names.join(',')}) VALUES (${names.map(n=>literal(row[n])).join(',')});`;
    if (Buffer.byteLength(sql)>90000) throw new Error(`Fila demasiado grande para D1: ${table}/${source.id}`);
    statements.push(sql);
    const updateNames=names.filter(name=>name!=='id');
    const upsert=`${sql.slice(0,-1)} ON CONFLICT(id) DO ${updateNames.length ? `UPDATE SET ${updateNames.map(name=>`${name}=excluded.${name}`).join(',')}` : 'NOTHING'};`;
    if (Buffer.byteLength(upsert)>90000) throw new Error(`Fila demasiado grande para sincronizar en D1: ${table}/${source.id}`);
    upsertStatements.push(upsert);
   }
  }
  db.exec(`BEGIN;\n${statements.join('\n')}\nCOMMIT;`);
  if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Relaciones rotas.');
  for (const table of tables) {
   if (db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n!==counts[table]) throw new Error(`Conteo incorrecto: ${table}`);
   for (const c of db.prepare(`PRAGMA table_info(${table})`).all()) {
    if (c.name.endsWith('_cents') || ['quantity','stock','initial_stock'].includes(c.name)) {
     totals[`${table}.${c.name}`]=db.prepare(`SELECT coalesce(sum(${c.name}),0) AS n FROM ${table}`).get().n;
    }
   }
  }
  return {
   sql:statements.join('\n')+'\n',
   upsertSql:upsertStatements.join('\n')+'\n',
   counts,totals,assets:[...assets.values()],imageReferences:[...imageReferences]
  };
 } finally { db.close(); }
}

async function main() {
 const input=process.argv[2];
 if (!input || process.argv.length!==3) throw new Error('Uso: npm run migration:prepare -- ruta/al/snapshot.csv');
 const text=await readFile(input,'utf8');
 const snapshot=parseSnapshot(text);
 const result=prepare(snapshot);
 const root=fileURLToPath(new URL('../../migration-data/',import.meta.url));
 const output=path.join(root,`prepared-${new Date().toISOString().replace(/[:.]/g,'-')}`);
 await mkdir(path.join(output,'assets'),{recursive:true});
 await writeFile(path.join(output,'snapshot.json'),JSON.stringify(snapshot,null,2));
 await writeFile(path.join(output,'import.sql'),result.sql);
 await writeFile(path.join(output,'upsert.sql'),result.upsertSql);
 for (const asset of result.assets) await writeFile(path.join(output,'assets',asset.sha256),asset.bytes);
 const report={
  sourceUrl:snapshot.sourceUrl,exportedAt:snapshot.exportedAt,
  sqlSha256:hash(result.sql),counts:result.counts,totals:result.totals,
  embeddedImages:result.assets.map(({bytes,...asset})=>({...asset,size:bytes.length})),
  imageReferences:result.imageReferences,storageInventory:snapshot.storage,
  authUserCount:snapshot.authUserCount,authMigrated:false,readyForProduction:false,
 };
 await writeFile(path.join(output,'validation.json'),JSON.stringify(report,null,2));
 console.log(`Copia validada localmente: ${output}`);
 console.log(`Tablas: ${tables.length}. Imágenes embebidas extraídas: ${result.assets.length}.`);
 console.log('Pendiente: copiar Storage a R2 y migrar autenticación. La tienda sigue usando Supabase.');
}
if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) await main();
