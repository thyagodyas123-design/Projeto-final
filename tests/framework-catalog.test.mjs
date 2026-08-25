import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Catálogo usa NestJS em TypeScript', () => {
  const packageJson = JSON.parse(readFileSync('apps/catalog/package.json', 'utf8'));
  assert.ok(packageJson.dependencies?.['@nestjs/core']);
  assert.ok(packageJson.dependencies?.['@nestjs/common']);

  const main = readFileSync('apps/catalog/src/main.ts', 'utf8');
  assert.match(main, /NestFactory/);
  assert.match(main, /@nestjs\/core/);

  /* build deve compilar via tsc */
  assert.match(packageJson.scripts?.build ?? '', /tsc/);
});
