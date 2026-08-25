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
  /* Todos os serviços migraram para NestJS: health é uma rota do controller */
  const controllers = {
    auth: 'apps/auth/src/auth/auth.controller.ts',
    admin: 'apps/admin/src/admin/admin.controller.ts',
    catalog: 'apps/catalog/src/catalog/catalog.controller.ts',
    progress: 'apps/progress/src/progress/progress.controller.ts',
    files: 'apps/files/src/files/files.controller.ts',
    gateway: 'apps/gateway/src/gateway.controller.ts',
  };
  for (const [service, file] of Object.entries(controllers)) {
    const content = readFileSync(file, 'utf8');
    assert.match(content, /@Get\('health'\)/, `${service} sem health`);
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
