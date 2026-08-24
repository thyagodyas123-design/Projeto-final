import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('workspace declara os oito aplicativos da plataforma', () => {
  const workspace = readFileSync('pnpm-workspace.yaml', 'utf8');
  for (const app of [
    'apps/auth',
    'apps/admin',
    'apps/catalog',
    'apps/progress',
    'apps/files',
    'apps/gateway',
    'apps/storefront',
    'apps/classroom',
  ]) assert.match(workspace, new RegExp(app.replace('/', '\\/')));
});

test('compose declara os serviços locais', () => {
  const compose = readFileSync('docker-compose.yml', 'utf8');
  for (const service of ['auth', 'admin', 'catalog', 'progress', 'files', 'gateway', 'storefront', 'classroom']) {
    assert.match(compose, new RegExp(`^  ${service}:`, 'm'));
  }
});

test('cada serviço possui endpoint de health implementado', () => {
  for (const service of ['auth', 'admin', 'catalog', 'progress', 'files', 'gateway']) {
    assert.equal(existsSync(`apps/${service}/src/health.mjs`), true, `${service} sem health`);
  }
});

test('compose executa código empacotado na imagem, não por bind mount', () => {
  const compose = readFileSync('docker-compose.yml', 'utf8');
  assert.match(compose, /build:/);
  assert.doesNotMatch(compose, /source:.*Projeto Final/);
});

test('Auth possui volume local para persistir o SQLite', () => {
  const compose = readFileSync('docker-compose.yml', 'utf8');
  assert.match(compose, /auth-data:\/workspace\/storage\/auth/);
  assert.match(compose, /auth-data:/);
});

test('Catálogo possui volume local para persistir o SQLite', () => {
  const compose = readFileSync('docker-compose.yml', 'utf8');
  assert.match(compose, /catalog-data:\/workspace\/storage\/catalog/);
  assert.match(compose, /catalog-data:/);
});
