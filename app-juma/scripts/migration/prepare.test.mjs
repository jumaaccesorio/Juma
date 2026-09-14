import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { tables,schema,parseSnapshot,prepare,cents } from './prepare.mjs';

function fixture() {
 return {formatVersion:1,sourceUrl:'https://ezpbabxossevlheftgcu.supabase.co',storage:[],tables:Object.fromEntries(tables.map(t=>[t,[]]))};
}
test('accepts the JSON and single-cell CSV exports from SQL Editor',()=>{
 const data=fixture(); data.tables.categories=[{id:1,name:'Texto "con comillas", y\nsalto'}];
 const json=JSON.stringify(data);
 assert.deepEqual(parseSnapshot(json),data);
 assert.deepEqual(parseSnapshot(JSON.stringify([{snapshot:data}])),data);
 assert.deepEqual(parseSnapshot(`\uFEFFsnapshot\r\n"${json.replaceAll('"','""')}"\r\n`),data);
 assert.throws(()=>parseSnapshot('{"tables":{}}'),/incompleto/);
});
test('preserves identifiers, relationships, currency and text; hides costs from catalog',()=>{
 const data=fixture();
 data.tables.categories=[{id:2,name:'Hija',parent_id:1},{id:1,name:"D'oro",parent_id:null}];
 data.tables.products=[{id:7,name:"Aro'); DROP TABLE clients; --",category_id:2,purchase_price:'15.29',sale_price:'100.10',stock:5,enabled:true}];
 data.tables.clients=[{id:3,name:'Prueba',email:'test@example.invalid',is_active:false}];
 data.tables.orders=[{id:1,client_id:3,status:'PENDIENTE'}];
 data.tables.order_items=[{id:1,order_id:1,product_id:7,quantity:2,unit_sale_price:'100.10',unit_purchase_price:'15.29'}];
 const result=prepare(data);
 assert.equal(result.totals['products.sale_price_cents'],10010);
 assert.equal(result.totals['order_items.quantity'],2);
 const db=new DatabaseSync(':memory:');
 try {
  db.exec(schema); db.exec(`BEGIN;${result.sql}COMMIT;`);
  assert.equal(db.prepare('SELECT name FROM products').get().name,data.tables.products[0].name);
  assert.equal(db.prepare('SELECT sale_price FROM catalog_products').get().sale_price,100.1);
  assert.equal(db.prepare('SELECT * FROM catalog_products').get().purchase_price_cents,undefined);
  assert.equal(db.prepare('SELECT is_active FROM clients').get().is_active,0);
  db.exec("INSERT INTO products(name) VALUES ('Next')");
  assert.equal(db.prepare("SELECT id FROM products WHERE name='Next'").get().id,8);
 } finally {db.close();}
});
test('extracts and deduplicates embedded images instead of exceeding D1 statement limits',()=>{
 const data=fixture();
 const bytes=Buffer.alloc(120000,5);
 const image=`data:image/png;base64,${bytes.toString('base64')}`;
 data.tables.products=[{id:1,name:'Test',image,image_full:image}];
 const result=prepare(data);
 assert.equal(result.assets.length,1);
 assert.deepEqual(result.assets[0].bytes,bytes);
 assert.ok(result.sql.includes('/media/imports/'));
 assert.ok(result.sql.length<2000);
});

test('generates a non-destructive upsert for an existing D1 copy',()=>{
 const data=fixture();
 data.tables.categories=[{id:1,name:'Actualizada',parent_id:null}];
 const result=prepare(data);
 const db=new DatabaseSync(':memory:');
 try {
  db.exec(schema);
  db.exec("INSERT INTO categories(id,name) VALUES (1,'Anterior'),(99,'Solo D1')");
  db.exec(result.upsertSql);
  assert.equal(db.prepare('SELECT name FROM categories WHERE id=1').get().name,'Actualizada');
  assert.equal(db.prepare('SELECT name FROM categories WHERE id=99').get().name,'Solo D1');
 } finally { db.close(); }
});

test('upserts settings using their text primary key',()=>{
 const data=fixture();
 data.tables.app_settings=[{key:'catalog_sort_order',value:'precio_asc'}];
 const result=prepare(data);
 const db=new DatabaseSync(':memory:');
 try {
  db.exec(schema);
  db.exec("INSERT INTO app_settings(key,value) VALUES ('catalog_sort_order','recientes'),('only_d1','kept')");
  db.exec(result.upsertSql);
  assert.equal(db.prepare("SELECT value FROM app_settings WHERE key='catalog_sort_order'").get().value,'precio_asc');
  assert.equal(db.prepare("SELECT value FROM app_settings WHERE key='only_d1'").get().value,'kept');
 } finally { db.close(); }
});
test('fails closed on unknown columns, missing tables, duplicate IDs and orphaned relationships',()=>{
 const unknown=fixture(); unknown.tables.products=[{id:1,name:'Test',surprise:'value'}];
 assert.throws(()=>prepare(unknown),/Columna sin migrar/);
 const missing=fixture(); delete missing.tables.orders;
 assert.throws(()=>prepare(missing),/Falta la tabla/);
 const dup=fixture(); dup.tables.categories=[{id:1,name:'A'},{id:1,name:'B'}];
 assert.throws(()=>prepare(dup),/UNIQUE/);
 const orphan=fixture(); orphan.tables.products=[{id:1,name:'Test',category_id:55}];
 assert.throws(()=>prepare(orphan),/FOREIGN KEY/);
 const wrong=fixture(); wrong.sourceUrl='https://wrong.supabase.co';
 assert.throws(()=>prepare(wrong),/origen/);
});
test('never silently rounds amounts or unsafe numeric IDs',()=>{
 assert.equal(cents('0.29'),29); assert.equal(cents('-12.30'),-1230);
 assert.throws(()=>cents('0.001'),/decimales/);
 assert.throws(()=>cents('9007199254740991.99'),/rango/);
 const data=fixture();data.tables.categories=[{id:Number.MAX_SAFE_INTEGER+1,name:'Test'}];
 assert.throws(()=>prepare(data),/rango/);
});
