import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFilesHttpServer } from '../apps/files/src/files-http.mjs';

test('POST /files recebe conteúdo base64 e GET retorna arquivo', async () => {
  const root = mkdtempSync(join(tmpdir(), 'plataforma-files-http-'));
  const server = createFilesHttpServer({ root, database: ':memory:' });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const upload = await fetch(`${base}/files`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ filename: 'material.pdf', mimeType: 'application/pdf', contentBase64: Buffer.from('arquivo').toString('base64') }) });
  const metadata = await upload.json();
  const download = await fetch(`${base}/files/${metadata.id}`);

  assert.equal(upload.status, 201);
  assert.equal(download.status, 200);
  assert.equal(await download.text(), 'arquivo');
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
  rmSync(root, { recursive: true, force: true });
});
