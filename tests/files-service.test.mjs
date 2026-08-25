import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DIST = new URL('../apps/files/dist/files/files.service.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'files não compilado — rode pnpm build primeiro' }, fn);

t('faz upload de PDF e recupera metadados/conteúdo', async () => {
  const root = mkdtempSync(join(tmpdir(), 'plataforma-files-'));
  const { FilesService } = await import(DIST.href);
  const service = new FilesService(root, ':memory:');
  const uploaded = await service.upload({ filename: 'apostila.pdf', mimeType: 'application/pdf', content: Buffer.from('conteudo') });
  const downloaded = await service.download(uploaded.id);

  assert.equal(uploaded.filename, 'apostila.pdf');
  assert.equal(downloaded.content.toString(), 'conteudo');
  rmSync(root, { recursive: true, force: true });
});

t('rejeita formato não permitido', async () => {
  const root = mkdtempSync(join(tmpdir(), 'plataforma-files-'));
  const { FilesService } = await import(DIST.href);
  const service = new FilesService(root, ':memory:');

  await assert.rejects(service.upload({ filename: 'script.exe', mimeType: 'application/octet-stream', content: Buffer.from('x') }), /formato não permitido/);
  rmSync(root, { recursive: true, force: true });
});

t('rejeita arquivo acima de 50 MB', async () => {
  const root = mkdtempSync(join(tmpdir(), 'plataforma-files-'));
  const { FilesService } = await import(DIST.href);
  const service = new FilesService(root, ':memory:');

  await assert.rejects(service.upload({ filename: 'grande.pdf', mimeType: 'application/pdf', content: Buffer.alloc(50 * 1024 * 1024 + 1) }), /tamanho máximo/);
  rmSync(root, { recursive: true, force: true });
});
