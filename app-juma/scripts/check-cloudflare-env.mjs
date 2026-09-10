import { loadEnv } from 'vite';

// Same precedence as the existing production build; no fallback to old projects.
const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
const url = env.VITE_SUPABASE_URL?.trim();
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
if (!url || !key) throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY para compilar JUMA.');
if (new URL(url).protocol !== 'https:') throw new Error('La URL de Supabase debe usar HTTPS.');
if (!key.startsWith('sb_publishable_')) {
  let role;
  try { role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role; } catch { /* invalid key */ }
  if (role !== 'anon') throw new Error('El frontend solo puede usar una clave pública de Supabase. No publiques claves de servidor.');
}
// An admin password prefixed VITE_ becomes public in the JavaScript bundle.
if (env.VITE_ADMIN_PASS?.trim()) {
  throw new Error('VITE_ADMIN_PASS se publicaría en el navegador. Hay que migrar el acceso administrativo al servidor antes de desplegar con esa variable.');
}
console.log(`Frontend Cloudflare: conexión Supabase conservada (${new URL(url).hostname}).`);
