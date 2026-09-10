import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const expectedAccount = '6f7477f1ef18b1f3b1f8785d2ec7fe57';
const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
if (config.account_id !== expectedAccount || config.name !== 'juma-web') {
  throw new Error('El destino no coincide con la cuenta verificada de JUMA.');
}
if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_ACCOUNT_ID !== expectedAccount) {
  throw new Error('CLOUDFLARE_ACCOUNT_ID apunta a otra cuenta. No se realizó el despliegue.');
}
const extra = process.argv.slice(2);
if (extra.length && (extra.length !== 1 || extra[0] !== '--dry-run')) throw new Error('Solo se admite --dry-run.');

// npm's JS entry point avoids building a shell command on Windows.
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Ejecutá este script con npm run cf:deploy o npm run cf:check.');
const result = spawnSync(process.execPath, [
  npmCli, 'exec', '--yes', '--package=wrangler@4.129.0', '--',
  'wrangler', 'deploy', '--config', 'wrangler.jsonc', ...extra,
], {
  cwd: root, stdio: 'inherit', shell: false,
  env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: expectedAccount, WRANGLER_SEND_METRICS: 'false' },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
