import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFileService } from '../apps/files/src/file-service.mjs';

test('faz upload de PDF e recupera metadados/conteúdo', async () => {
  const root = mkdtempSync(join(tmpdir(), 'plataforma-files-'));
  const service = createFileService({ root, database: ':memory:' });
  const uploaded = await service.upload({ filename: 'apostila.pdf', mimeType: 'application/pdf', content: Buffer.from('conteudo') });
  const downloaded = await service.download(uploaded.id);

  assert.equal(uploaded.filename, 'apostila.pdf');
  assert.equal(downloaded.content.toString(), 'conteudo');
  rmSync(root, { recursive: true, force: true });
});

test('rejeita formato não permitido', async () => {
  const root = mkdtempSync(join(tmpdir(), 'plataforma-files-'));
  const service = createFileService({ root, database: ':memory:' });

  await assert.rejects(service.upload({ filename: 'script.exe', mimeType: 'application/octet-stream', content: Buffer.from('x') }), /formato não permitido/);
  rmSync(root, { recursive: true, force: true });
});

test('rejeita arquivo acima de 50 MB', async () => {
  const root = mkdtempSync(join(tmpdir(), 'plataforma-files-'));
  const service = createFileService({ root, database: ':memory:' });

  await assert.rejects(service.upload({ filename: 'grande.pdf', mimeType: 'application/pdf', content: Buffer.alloc(50 * 1024 * 1024 + 1) }), /tamanho máximo/);
  rmSync(root, { recursive: true, force: true });
});
