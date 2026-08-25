import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DIST = new URL('../apps/files/dist/app.module.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'files não compilado — rode pnpm build primeiro' }, fn);

async function startApp() {
  const root = mkdtempSync(join(tmpdir(), 'plataforma-files-http-'));
  process.env.FILE_STORAGE = root;
  process.env.FILES_DATABASE = ':memory:';
  const { createTestApp, listen } = await import('../apps/files/test-server.mjs');
  const app = await createTestApp();
  const url = await listen(app);
  return { app, url, root };
}

t('POST /files recebe conteúdo base64 e GET retorna arquivo', async () => {
  const { app, url, root } = await startApp();
  const upload = await fetch(`${url}/files`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ filename: 'material.pdf', mimeType: 'application/pdf', contentBase64: Buffer.from('arquivo').toString('base64') }) });
  const metadata = await upload.json();
  const download = await fetch(`${url}/files/${metadata.id}`);

  assert.equal(upload.status, 201);
  assert.equal(download.status, 200);
  assert.equal(await download.text(), 'arquivo');
  await app.close();
  rmSync(root, { recursive: true, force: true });
});

t('GET /files/:id retorna 404 para arquivo inexistente', async () => {
  const { app, url, root } = await startApp();
  const response = await fetch(`${url}/files/inexistente`);

  assert.equal(response.status, 404);
  await app.close();
  rmSync(root, { recursive: true, force: true });
});
