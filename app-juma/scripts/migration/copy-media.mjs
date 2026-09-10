import {readFile,writeFile,mkdir,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// Uses the existing Wrangler session in memory. Never persists or prints its token.
const account='6f7477f1ef18b1f3b1f8785d2ec7fe57';
const bucket='juma-media';
const source='https://ezpbabxossevlheftgcu.supabase.co';
if(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_ACCOUNT_ID!==account) throw Error('Cuenta incorrecta.');
const [snapshotFile,wranglerCli]=process.argv.slice(2);
if(!snapshotFile||!wranglerCli) throw Error('Uso: node scripts/migration/copy-media.mjs snapshot.json ruta/wrangler/bin/wrangler.js');
const snapshot=JSON.parse((await readFile(snapshotFile,'utf8')).replace(/^\uFEFF/,''));
if(snapshot.sourceUrl!==source||!Array.isArray(snapshot.storage)) throw Error('Origen inválido.');
const auth=JSON.parse(execFileSync(process.execPath,[wranglerCli,'auth','token','--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
if(!auth.token) throw Error('No hay sesión Wrangler válida.');
const digest=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest('hex');
const root=fileURLToPath(new URL('../../migration-data/media/',import.meta.url));
await mkdir(path.join(root,'objects'),{recursive:true});
const journal=path.join(root,'verified.jsonl');
let previous=''; try{previous=await readFile(journal,'utf8')}catch(e){if(e.code!=='ENOENT')throw e}
const done=new Map(previous.trim().split('\n').filter(Boolean).map(l=>{const r=JSON.parse(l);return [r.key,r]}));
const failures=[]; let count=0; let nextRequest=0;
async function request(url,options={}){
 for(let attempt=0;attempt<4;attempt++){
  if(url.startsWith('https://api.cloudflare.com/')){
   const slot=Math.max(Date.now(),nextRequest); nextRequest=slot+300;
   await new Promise(r=>setTimeout(r,Math.max(0,slot-Date.now())));
  }
  const response=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(90000)});
  if((response.status===429||response.status>=500)&&attempt<3){await response.arrayBuffer();await new Promise(r=>setTimeout(r,3000*(attempt+1)));continue}
  return response;
 }
}
async function copy(item){
 if(item.bucket!=='products'||typeof item.name!=='string'||item.name.split('/').some(p=>p==='.'||p==='..')) throw Error('Ruta fuera del bucket autorizado.');
 const key=`products/${item.name}`;
 const old=done.get(key);
 if(old&&old.sourceEtag===item.metadata?.eTag&&old.size===item.metadata?.size){count++;return}
 const encoded=key.split('/').map(encodeURIComponent).join('/');
 const local=path.join(root,'objects',digest(key));
 let bytes; try{bytes=await readFile(local)}catch(e){if(e.code!=='ENOENT')throw e}
 if(!bytes){
  const res=await request(`${source}/storage/v1/object/public/${encoded}`);
  if(!res.ok) throw Error(`Origen HTTP ${res.status}`);
  bytes=Buffer.from(await res.arrayBuffer());
 }
 if(bytes.length!==Number(item.metadata?.size)) throw Error('Tamaño de origen cambió respecto del snapshot.');
 const md5=digest(bytes,'md5');
 const expected=(item.metadata?.eTag??'').replaceAll('"','');
 if(/^[a-f\d]{32}$/i.test(expected)&&md5!==expected.toLowerCase())throw Error('Hash de origen no coincide.');
 await writeFile(local,bytes);
 const endpoint=`https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}/objects/${encoded}`;
 const headers={Authorization:`Bearer ${auth.token}`};
 const put=await request(endpoint,{method:'PUT',headers:{...headers,'Content-Type':item.metadata?.mimetype||'application/octet-stream','Content-MD5':Buffer.from(md5,'hex').toString('base64'),'Cache-Control':item.metadata?.cacheControl||'public, max-age=3600'},body:bytes});
 if(!put.ok)throw Error(`R2 upload HTTP ${put.status}`);
 await put.arrayBuffer();
 const get=await request(endpoint,{headers});
 if(!get.ok)throw Error(`R2 verification HTTP ${get.status}`);
 const restored=Buffer.from(await get.arrayBuffer());
 const sha256=digest(bytes);
 if(restored.length!==bytes.length||digest(restored)!==sha256)throw Error('La copia R2 no coincide byte por byte.');
 await appendFile(journal,JSON.stringify({key,size:bytes.length,sha256,sourceEtag:item.metadata?.eTag,verifiedAt:new Date().toISOString()})+'\n');
 count++;
}
let index=0;
await Promise.all(Array.from({length:6},async()=>{
 while(index<snapshot.storage.length){const item=snapshot.storage[index++];try{await copy(item)}catch(e){failures.push({key:`${item.bucket}/${item.name}`,error:e.message})} if((count+failures.length)%50===0)console.log(`Verificados ${count}/${snapshot.storage.length}; errores ${failures.length}`)}
}));
await writeFile(path.join(root,'summary.json'),JSON.stringify({account,bucket,snapshotDate:snapshot.exportedAt,verified:count,total:snapshot.storage.length,failures,completedAt:new Date().toISOString()},null,2));
console.log(`Resultado: ${count}/${snapshot.storage.length} archivos verificados, ${failures.length} errores.`);
if(failures.length)process.exitCode=1;
